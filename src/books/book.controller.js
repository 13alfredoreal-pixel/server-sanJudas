import Book from './book.model.js';
import cloudinary from '../../configs/cloudinary.js';
import { fileTypeFromBuffer } from 'file-type';
import { logAdminAction } from '../audit/audit.logger.js';
import axios from 'axios';
import { Readable } from 'node:stream';
import {
  uploadPdfBuffer,
  removePdfObject,
  createPdfSignedUrl,
  createPdfSignedUploadUrl,
  buildPdfObjectPath,
  pdfObjectExists,
  PDF_OBJECT_PATH_RE,
  downloadPdfObject,
  resolvePdfSource,
  inspectPdfStorage,
  storageFailureHint,
} from '../../helpers/pdf-storage.js';
import { isMongoObjectId } from '../../helpers/mongo-id.js';

const uploadBufferToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });

const bookHasPdf = (book) => resolvePdfSource(book).kind !== 'none';

const invalidIdResponse = (res) =>
  res.status(400).json({ message: 'Identificador de libro inválido' });

export const getBooks = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (category && category !== 'Todos') {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const query = Book.find(filter).populate('uploadedBy', 'name surname').sort({ createdAt: -1 });

    if (limitNumber > 0) {
      query.skip(skip).limit(limitNumber);
    }

    const books = await query;
    const totalBooks = await Book.countDocuments(filter);

    return res.status(200).json({
      books,
      pagination: {
        totalBooks,
        currentPage: pageNumber,
        totalPages: limitNumber > 0 ? Math.ceil(totalBooks / limitNumber) : 1,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener los libros', error: error.message });
  }
};

export const getBookById = async (req, res) => {
  try {
    if (!isMongoObjectId(req.params.id)) {
      return invalidIdResponse(res);
    }
    const book = await Book.findById(req.params.id).populate('uploadedBy', 'name surname');
    if (!book) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }
    return res.status(200).json({ book });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener el libro', error: error.message });
  }
};

export const getPdfStorageHealth = async (_req, res) => {
  try {
    const report = await inspectPdfStorage();
    return res.status(report.ok ? 200 : 502).json(report);
  } catch (error) {
    return res.status(502).json({
      ok: false,
      message: 'No se pudo diagnosticar Storage',
      error: error.message,
      hint: storageFailureHint(error.message),
    });
  }
};

/**
 * Genera URL firmada para subir el PDF directo a Supabase (evita el tope ~4.5 MB de Vercel).
 * Body JSON: `{ title?: string }`
 */
export const createPdfUploadUrl = async (req, res) => {
  try {
    const title = (req.body?.title || '').trim() || 'libro';
    const path = buildPdfObjectPath(title);
    const upload = await createPdfSignedUploadUrl(path);
    return res.status(200).json(upload);
  } catch (error) {
    console.error('[BOOK UPLOAD-URL ERROR]', error);
    const status = error.status === 503 || error.status === 502 ? error.status : 502;
    return res.status(status).json({
      message: 'No se pudo generar la URL de subida del PDF (Supabase)',
      error: error.message,
      hint: storageFailureHint(error.message),
    });
  }
};

export const uploadBook = async (req, res) => {
  try {
    const { title, author, category, description } = req.body;
    const cleanTitle = (title || '').trim();
    const cleanAuthor = (author || '').trim();
    const pdfPublicIdFromBody = (req.body?.pdfPublicId || '').trim();

    if (!cleanTitle || !cleanAuthor) {
      return res.status(400).json({ message: 'El título y el autor son obligatorios' });
    }

    const pdfFile = req.files?.pdf?.[0];
    const coverFile = req.files?.cover?.[0];

    if (!pdfFile && !pdfPublicIdFromBody) {
      return res.status(400).json({
        message:
          'Debes enviar el PDF (multipart) o pdfPublicId tras subirlo con POST /books/upload-url',
      });
    }

    if (coverFile) {
      const coverType = await fileTypeFromBuffer(coverFile.buffer);
      if (
        (!coverType || !coverType.mime.startsWith('image/')) &&
        !coverFile.mimetype.startsWith('image/')
      ) {
        return res
          .status(400)
          .json({ message: 'La imagen de portada es inválida o tiene un formato no permitido.' });
      }
    }

    if (pdfFile && process.env.VERCEL && pdfFile.size > 3.5 * 1024 * 1024) {
      return res.status(413).json({
        message:
          'El PDF es demasiado grande para subirlo por el API (Vercel ~4.5 MB). Usa la subida directa a Storage (panel actualizado) o un archivo más pequeño.',
      });
    }

    let storedPdfPath;

    if (pdfPublicIdFromBody) {
      if (!PDF_OBJECT_PATH_RE.test(pdfPublicIdFromBody)) {
        return res.status(400).json({ message: 'pdfPublicId inválido' });
      }
      const exists = await pdfObjectExists(pdfPublicIdFromBody);
      if (!exists) {
        return res.status(400).json({
          message: 'El PDF no existe en Storage. Súbelo primero con la URL firmada.',
        });
      }
      storedPdfPath = pdfPublicIdFromBody;
    } else {
      const pdfType = await fileTypeFromBuffer(pdfFile.buffer);
      const isActuallyPdf = pdfType && pdfType.mime === 'application/pdf';
      const isReportedAsPdf = pdfFile.mimetype === 'application/pdf';

      if (!isActuallyPdf && !isReportedAsPdf) {
        return res.status(400).json({
          message: 'El archivo proporcionado no es un PDF válido.',
          details: pdfType
            ? `Detectado como: ${pdfType.mime}`
            : 'No se pudo verificar la firma digital del archivo',
        });
      }

      const pdfPath = buildPdfObjectPath(cleanTitle);
      const uploaded = await uploadPdfBuffer(
        pdfFile.buffer,
        pdfPath,
        pdfFile.mimetype || 'application/pdf',
      );
      storedPdfPath = uploaded.path;
    }

    let coverUrl = '';
    let coverPublicId = '';

    if (coverFile) {
      const coverResult = await uploadBufferToCloudinary(coverFile.buffer, {
        folder: 'biblioteca/portadas',
        resource_type: 'image',
        transformation: [{ width: 400, height: 600, crop: 'fill' }],
      });
      coverUrl = coverResult.secure_url;
      coverPublicId = coverResult.public_id;
    }

    const book = await Book.create({
      title: cleanTitle,
      author: cleanAuthor,
      category: category && category.trim() !== '' ? category : 'Otros',
      description: description || '',
      pdfUrl: '',
      pdfPublicId: storedPdfPath,
      coverUrl,
      coverPublicId,
      uploadedBy: req.uid || req.user?._id,
    });

    await logAdminAction(
      req.uid || req.user?._id,
      'CREATE_BOOK',
      `Libro subido: ${cleanTitle} (${storedPdfPath})`,
      req.ip,
    );

    return res.status(201).json({ message: 'Libro subido correctamente', book });
  } catch (error) {
    console.error('[BOOK UPLOAD ERROR]', error);
    if (error.name === 'ValidationError') {
      return res
        .status(400)
        .json({ message: 'Error de validación en los datos del libro', error: error.message });
    }
    if (error.status === 503 || error.status === 502 || error.name === 'PdfStorageError') {
      return res.status(error.status || 502).json({
        message: 'No se pudo guardar el PDF en Storage',
        error: error.message,
        hint: storageFailureHint(error.message),
      });
    }
    return res
      .status(500)
      .json({ message: 'Error interno al subir el libro', error: error.message });
  }
};

export const deleteBook = async (req, res) => {
  try {
    if (!isMongoObjectId(req.params.id)) {
      return invalidIdResponse(res);
    }
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    const source = resolvePdfSource(book);
    if (source.kind === 'supabase') {
      await removePdfObject(source.path);
    } else if (source.kind === 'http' && book.pdfPublicId) {
      // Legacy Cloudinary raw PDF
      try {
        await cloudinary.uploader.destroy(book.pdfPublicId, { resource_type: 'raw' });
      } catch (e) {
        console.log(`[Delete] Could not delete legacy PDF from Cloudinary: ${e.message}`);
      }
    }

    if (book.coverPublicId) {
      try {
        await cloudinary.uploader.destroy(book.coverPublicId, { resource_type: 'image' });
      } catch (e) {
        console.log(`[Delete] Could not delete cover from Cloudinary: ${e.message}`);
      }
    }

    await Book.findByIdAndDelete(req.params.id);
    await logAdminAction(req.uid, 'DELETE_BOOK', `Libro eliminado: ${book.title}`, req.ip);

    return res.status(200).json({ message: 'Libro eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar el libro', error: error.message });
  }
};

export const servePdf = async (req, res) => {
  try {
    if (!isMongoObjectId(req.params.id)) {
      return invalidIdResponse(res);
    }
    const book = await Book.findById(req.params.id);
    if (!book || !bookHasPdf(book)) {
      return res
        .status(404)
        .json({ message: book ? 'Este libro no tiene PDF' : 'Libro no encontrado' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${book.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
    );
    res.setHeader('Cache-Control', 'private, max-age=300');

    const source = resolvePdfSource(book);

    if (source.kind === 'http') {
      const response = await axios.get(source.url, {
        responseType: 'stream',
        timeout: 60000,
      });
      response.data.pipe(res);
      response.data.on('error', (error) => {
        console.error('[PDF Proxy Stream Error]', error);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error al transmitir el PDF', error: error.message });
        }
      });
      return;
    }

    if (source.kind === 'supabase') {
      const blob = await downloadPdfObject(source.path);
      const buffer = Buffer.from(await blob.arrayBuffer());
      const stream = Readable.from(buffer);
      stream.pipe(res);
      return;
    }

    return res.status(404).json({ message: 'Este libro no tiene PDF' });
  } catch (error) {
    console.error('[PDF Proxy Error]', error.message);
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ message: 'Timeout al obtener el PDF' });
    }
    return res.status(500).json({ message: 'Error al obtener el PDF', error: error.message });
  }
};

export const getPdfSignedUrl = async (req, res) => {
  try {
    if (!isMongoObjectId(req.params.id)) {
      return invalidIdResponse(res);
    }
    const book = await Book.findById(req.params.id);
    if (!book || !bookHasPdf(book)) {
      return res
        .status(404)
        .json({ message: book ? 'Este libro no tiene PDF' : 'Libro no encontrado' });
    }

    const source = resolvePdfSource(book);

    if (source.kind === 'http') {
      return res.status(200).json({ signedUrl: source.url, provider: 'legacy' });
    }

    if (source.kind === 'supabase') {
      const signedUrl = await createPdfSignedUrl(source.path, 3600);
      return res.status(200).json({ signedUrl, provider: 'supabase', expiresIn: 3600 });
    }

    return res.status(404).json({ message: 'Este libro no tiene PDF' });
  } catch (error) {
    console.error('[PDF SIGNED URL]', error.message);
    const status = error.status === 404 || error.status === 502 ? error.status : 500;
    const message =
      status === 404
        ? 'El PDF no está en Storage. Vuelve a subirlo.'
        : status === 502
          ? 'No se pudo firmar el PDF en Storage'
          : 'Error al obtener URL del PDF';
    return res.status(status).json({
      message,
      error: error.message,
      hint: status === 404 ? undefined : storageFailureHint(error.message),
    });
  }
};
