import Book from './book.model.js'
import cloudinary from '../../configs/cloudinary.js'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join, basename } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { fileTypeFromBuffer } from 'file-type'
import { logAdminAction } from '../audit/audit.logger.js'
import axios from 'axios'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Directorio donde se guardaban los PDFs localmente (migrado a Cloudinary)
const PDF_DIR = join(__dirname, '../../uploads/pdfs')

/**
 * Obtiene todos los libros (accesible a lectores y admins autenticados)
 * ADICIÓN: Soporte para paginación mediante page y limit.
 */
export const getBooks = async (req, res) => {
    try {
        const { category, search, page = 1, limit = 20 } = req.query
        let filter = {}

        if (category && category !== 'Todos') {
            filter.category = category
        }
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { author: { $regex: search, $options: 'i' } }
            ]
        }

        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const skip = (pageNumber - 1) * limitNumber;

        const query = Book.find(filter)
            .populate('uploadedBy', 'name surname')
            .sort({ createdAt: -1 });

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
            }
        })
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener los libros', error: error.message })
    }
}

/**
 * Obtiene un libro por ID (para el visor de PDF)
 */
export const getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id).populate('uploadedBy', 'name surname')
        if (!book) {
            return res.status(404).json({ message: 'Libro no encontrado' })
        }
        return res.status(200).json({ book })
    } catch (error) {
        return res.status(500).json({ message: 'Error al obtener el libro', error: error.message })
    }
}

/**
 * Sube un nuevo libro PDF (solo ADMIN_ROLE).
 * El PDF se sube a Cloudinary, la portada también va a Cloudinary.
 */
export const uploadBook = async (req, res) => {
    try {
        const { title, author, category, description } = req.body

        const cleanTitle = (title || "").trim()
        const cleanAuthor = (author || "").trim()

        if (!cleanTitle || !cleanAuthor) {
            return res.status(400).json({ message: 'El título y el autor son obligatorios' })
        }

        const pdfFile = req.files?.pdf?.[0]
        const coverFile = req.files?.cover?.[0]

        if (!pdfFile) {
            return res.status(400).json({ message: 'El archivo PDF es obligatorio' })
        }

        const pdfType = await fileTypeFromBuffer(pdfFile.buffer)
        const isActuallyPdf = pdfType && pdfType.mime === 'application/pdf'
        const isReportedAsPdf = pdfFile.mimetype === 'application/pdf'

        if (!isActuallyPdf && !isReportedAsPdf) {
            console.error('[Upload Error] Invalid PDF detection:', pdfType, 'Mime:', pdfFile.mimetype);
            return res.status(400).json({ 
                message: 'El archivo proporcionado no es un PDF válido.',
                details: pdfType ? `Detectado como: ${pdfType.mime}` : 'No se pudo verificar la firma digital del archivo'
            })
        }

        if (coverFile) {
            const coverType = await fileTypeFromBuffer(coverFile.buffer)
            if (!coverType || !coverType.mime.startsWith('image/')) {
                if (!coverFile.mimetype.startsWith('image/')) {
                    return res.status(400).json({ message: 'La imagen de portada es inválida o tiene un formato no permitido.' })
                }
            }
        }

        // Subir PDF a Cloudinary
        const timestamp = Date.now()
        const safeName = cleanTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        const pdfFilename = `${safeName}_${timestamp}.pdf`

        const pdfResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'biblioteca/pdfs',
                    resource_type: 'raw',
                    public_id: pdfFilename,
                    format: 'pdf',
                    type: 'upload',
                    access_mode: 'public'
                },
                (err, result) => err ? reject(err) : resolve(result)
            )
            stream.end(pdfFile.buffer)
        })

        const pdfUrl = pdfResult.secure_url

        let coverUrl = ''
        let coverPublicId = ''

        if (coverFile) {
            const coverResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'biblioteca/portadas',
                        resource_type: 'image',
                        transformation: [{ width: 400, height: 600, crop: 'fill' }]
                    },
                    (err, result) => err ? reject(err) : resolve(result)
                )
                stream.end(coverFile.buffer)
            })
            coverUrl = coverResult.secure_url
            coverPublicId = coverResult.public_id
        }

        const book = await Book.create({
            title: cleanTitle,
            author: cleanAuthor,
            category: (category && category.trim() !== '') ? category : 'Otros',
            description: description || '',
            pdfUrl,
            pdfPublicId: pdfResult.public_id,
            coverUrl,
            coverPublicId,
            uploadedBy: req.uid || req.user?._id
        })

        await logAdminAction(req.uid || req.user?._id, 'CREATE_BOOK', `Libro subido: ${cleanTitle} (${pdfFilename})`, req.ip);

        return res.status(201).json({ message: 'Libro subido correctamente', book })
    } catch (error) {
        console.error('[BOOK UPLOAD ERROR]', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Error de validación en los datos del libro', error: error.message })
        }
        return res.status(500).json({ message: 'Error interno al subir el libro', error: error.message })
    }
}

/**
 * Elimina un libro y sus archivos (PDF y portada de Cloudinary).
 */
export const deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id)
        if (!book) {
            return res.status(404).json({ message: 'Libro no encontrado' })
        }

        // Eliminar PDF de Cloudinary
        if (book.pdfPublicId) {
            try {
                await cloudinary.uploader.destroy(book.pdfPublicId, { resource_type: 'raw' })
            } catch (e) {
                console.log(`[Delete] Could not delete PDF from Cloudinary: ${e.message}`)
            }
        }

        // Eliminar portada de Cloudinary
        if (book.coverPublicId) {
            try {
                await cloudinary.uploader.destroy(book.coverPublicId, { resource_type: 'image' })
            } catch (e) {
                console.log(`[Delete] Could not delete cover from Cloudinary: ${e.message}`)
            }
        }

        await Book.findByIdAndDelete(req.params.id)

        await logAdminAction(req.uid, 'DELETE_BOOK', `Libro eliminado: ${book.title}`, req.ip);

        return res.status(200).json({ message: 'Libro eliminado correctamente' })
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar el libro', error: error.message })
    }
}
/**
 * Sirve un PDF como proxy desde Cloudinary
 * Esta función descarga el PDF de Cloudinary usando las credenciales del servidor
 * y lo sirve al cliente, evitando el error 401 de Cloudinary
 */
export const servePdf = async (req, res) => {
    try {
        console.log('[PDF Proxy] Serving PDF for book ID:', req.params.id)
        
        const book = await Book.findById(req.params.id)
        if (!book) {
            console.log('[PDF Proxy] Book not found:', req.params.id)
            return res.status(404).json({ message: 'Libro no encontrado' })
        }

        if (!book.pdfUrl) {
            console.log('[PDF Proxy] Book has no PDF URL:', req.params.id)
            return res.status(404).json({ message: 'Este libro no tiene PDF' })
        }

        console.log('[PDF Proxy] Downloading PDF from Cloudinary:', book.pdfUrl)

        // Descargar el PDF de Cloudinary usando axios
        const response = await axios.get(book.pdfUrl, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
                'Accept': 'application/pdf'
            }
        })

        console.log('[PDF Proxy] PDF downloaded successfully, size:', response.data.length)

        // Configurar headers para servir el PDF
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `inline; filename="${book.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`)
        res.setHeader('Cache-Control', 'public, max-age=3600')

        // Enviar el PDF al cliente
        res.send(response.data)
    } catch (error) {
        console.error('[PDF Proxy Error]', error.message)
        console.error('[PDF Proxy Error Details]', error.response?.data || error)
        
        if (error.code === 'ECONNABORTED') {
            return res.status(504).json({ message: 'Timeout al descargar el PDF de Cloudinary' })
        }
        
        if (error.response?.status === 401) {
            return res.status(500).json({ message: 'Error de autenticación con Cloudinary (401)' })
        }
        
        return res.status(500).json({ message: 'Error al obtener el PDF', error: error.message })
    }
}