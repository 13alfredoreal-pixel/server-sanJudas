import { Router } from 'express'
import { validateJWT } from '../../middlewares/jwt-verify.js'
import { isAdmin } from '../../middlewares/is-admin.js'
import { getBooks, getBookById, uploadBook, deleteBook } from './book.controller.js'
import { authenticatedLimiter } from '../../middlewares/request-limit.js'
import { uploadBookFiles } from '../../middlewares/book-multer.js'

const router = Router()

// RUTAS PROTEGIDAS (Solo usuarios logueados pueden ver los libros)

/**
 * RUTA: GET /
 * Función: Obtiene un listado de libros con soporte para filtros (categoría, búsqueda) y paginación.
 * Destino: getBooks (book.controller.js)
 * Retorno: JSON con array de libros y objeto de paginación.
 */
router.get('/', validateJWT, authenticatedLimiter, getBooks)

/**
 * RUTA: GET /:id
 * Función: Obtiene los detalles de un libro específico por su ID.
 * Destino: getBookById (book.controller.js)
 * Retorno: JSON con los datos del libro seleccionado.
 */
router.get('/:id', validateJWT, authenticatedLimiter, getBookById)

// RUTAS DE ADMINISTRADOR (Escritura/Privadas)

/**
 * RUTA: POST /
 * Función: Sube un nuevo libro al sistema (PDF local y portada en Cloudinary).
 * Destino: uploadBook (book.controller.js) - Solo Admin
 * Retorno: JSON con mensaje de éxito y los datos del libro creado.
 */
router.post(
    '/',
    validateJWT,
    authenticatedLimiter,
    isAdmin,
    uploadBookFiles.fields([{ name: 'pdf', maxCount: 1 }, { name: 'cover', maxCount: 1 }]),
    uploadBook
)

/**
 * RUTA: DELETE /:id
 * Función: Elimina un libro del sistema junto con sus archivos asociados.
 * Destino: deleteBook (book.controller.js) - Solo Admin
 * Retorno: JSON con mensaje de éxito confirmando la eliminación.
 */
router.delete(
    '/:id',
    validateJWT,
    authenticatedLimiter,
    isAdmin,
    deleteBook
)

export default router
