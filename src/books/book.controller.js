import Book from './book.model.js';
import cloudinary from '../../configs/cloudinary.js';
import { fileTypeFromBuffer } from 'file-type';
import { logAdminAction } from '../audit/audit.logger.js';
import axios from 'axios';

const uploadBufferToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });

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
    const book = await Book.findById(req.params.id).populate('uploadedBy', 'name surname');
    if (!book) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }
    return res.status(200).json({ book });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener el libro', error: error.message });
  }
};

export const uploadBook = async (req, res) => {
  try {
    const { title, author, category, description } = req.body;
    const cleanTitle = (title || '').trim();
    const cleanAuthor = (author || '').trim();

    if (!cleanTitle || !cleanAuthor) {
      return res.status(400).json({ message: 'El título y el autor son obligatorios' });
    }

    const pdfFile = req.files?.pdf?.[0];
    const coverFile = req.files?.cover?.[0];

    if (!pdfFile) {
      return res.status(400).json({ message: 'El archivo PDF es obligatorio' });
    }

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

    const timestamp = Date.now();
    const safeName = cleanTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    const pdfResult = await uploadBufferToCloudinary(pdfFile.buffer, {
      folder: 'biblioteca/pdfs',
      resource_type: 'raw',
      public_id: `${safeName}_${timestamp}`,
      format: 'pdf',
      use_filename: true,
      unique_filename: true,
      type: 'upload',
      access_mode: 'public',
      overwrite: true,
      invalidate: true,
    });

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
      pdfUrl: pdfResult.secure_url,
      pdfPublicId: pdfResult.public_id,
      coverUrl,
      coverPublicId,
      uploadedBy: req.uid || req.user?._id,
    });

    await logAdminAction(
      req.uid || req.user?._id,
      'CREATE_BOOK',
      `Libro subido: ${cleanTitle} (${pdfResult.public_id})`,
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
    return res
      .status(500)
      .json({ message: 'Error interno al subir el libro', error: error.message });
  }
};

export const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }

    if (book.pdfPublicId) {
      try {
        await cloudinary.uploader.destroy(book.pdfPublicId, { resource_type: 'raw' });
      } catch (e) {
        console.log(`[Delete] Could not delete PDF from Cloudinary: ${e.message}`);
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
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }
    if (!book.pdfUrl) {
      return res.status(404).json({ message: 'Este libro no tiene PDF' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${book.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
    );
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const response = await axios.get(book.pdfUrl, {
      responseType: 'stream',
      timeout: 30000,
    });

    response.data.pipe(res);
    response.data.on('error', (error) => {
      console.error('[PDF Proxy Stream Error]', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error al transmitir el PDF', error: error.message });
      }
    });
  } catch (error) {
    console.error('[PDF Proxy Error]', error.message);
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ message: 'Timeout al conectar con Cloudinary' });
    }
    return res.status(500).json({ message: 'Error al obtener el PDF', error: error.message });
  }
};

export const getPdfSignedUrl = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Libro no encontrado' });
    }
    if (!book.pdfUrl) {
      return res.status(404).json({ message: 'Este libro no tiene PDF' });
    }
    return res.status(200).json({ signedUrl: book.pdfUrl });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener URL del PDF', error: error.message });
  }
};
