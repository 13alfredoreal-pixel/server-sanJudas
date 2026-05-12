import Book from './book.model.js'
import cloudinary from '../../configs/cloudinary.js'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join, basename } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { fileTypeFromBuffer } from 'file-type'
import { logAdminAction } from '../audit/audit.logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Directorio donde se guardan los PDFs localmente
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

        // Si limit es 0 (o falsey pero queremos todos, ej: stats), no paginamos.
        // Ojo: en la app se manda limit grande para stats
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
 * El PDF se guarda en el servidor local, la portada va a Cloudinary.
 */
export const uploadBook = async (req, res) => {
    try {
        const { title, author, category, description } = req.body

        // Limpieza y validación de campos obligatorios
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

        // VALIDACIÓN DE SEGURIDAD: Magic Numbers con file-type
        // Intentamos detectar el tipo, pero si falla y Multer dice que es PDF, permitimos bajo advertencia logueada
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
                // Si Multer dice que es imagen pero file-type no, somos estrictos con imágenes por seguridad (scripts ocultos)
                if (!coverFile.mimetype.startsWith('image/')) {
                    return res.status(400).json({ message: 'La imagen de portada es inválida o tiene un formato no permitido.' })
                }
            }
        }

        // GARANTIZAR DIRECTORIO: Asegura que la carpeta siempre exista
        await mkdir(PDF_DIR, { recursive: true })

        // Guardar PDF en disco local con nombre único
        const timestamp = Date.now()
        const safeName = cleanTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        const pdfFilename = `${safeName}_${timestamp}.pdf`
        const pdfPath = join(PDF_DIR, pdfFilename)

        await writeFile(pdfPath, pdfFile.buffer)

        // Guardar URL relativa para que el frontend la use a través del proxy de Vite
        const pdfUrl = `/api/pdfs/${pdfFilename}`

        let coverUrl = ''
        let coverPublicId = ''

        // La portada sí va a Cloudinary
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
            pdfPublicId: pdfFilename, // Guardamos el nombre del archivo local
            coverUrl,
            coverPublicId,
            uploadedBy: req.uid || req.user?._id // Robustez en el ID del admin
        })

        // Audit Log
        await logAdminAction(req.uid || req.user?._id, 'CREATE_BOOK', `Libro subido: ${cleanTitle} (${pdfFilename})`, req.ip);

        return res.status(201).json({ message: 'Libro subido correctamente', book })
    } catch (error) {
        console.error('[BOOK UPLOAD ERROR]', error);
        // Manejar errores de validación de Mongoose (campos muy largos, etc)
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Error de validación en los datos del libro', error: error.message })
        }
        return res.status(500).json({ message: 'Error interno al subir el libro', error: error.message })
    }
}

/**
 * Elimina un libro y sus archivos (PDF local + portada en Cloudinary).
 */
export const deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id)
        if (!book) {
            return res.status(404).json({ message: 'Libro no encontrado' })
        }

        // Eliminar PDF del disco local
        if (book.pdfPublicId) {
            try {
                const pdfPath = join(PDF_DIR, book.pdfPublicId)
                await unlink(pdfPath)
            } catch (e) {
                console.log(`[Delete] PDF file not found locally: ${book.pdfPublicId}`)
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

        // Audit log
        await logAdminAction(req.uid, 'DELETE_BOOK', `Libro eliminado: ${book.title}`, req.ip);

        return res.status(200).json({ message: 'Libro eliminado correctamente' })
    } catch (error) {
        return res.status(500).json({ message: 'Error al eliminar el libro', error: error.message })
    }
}
