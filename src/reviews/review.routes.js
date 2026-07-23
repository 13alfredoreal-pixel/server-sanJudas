import { Router } from 'express'
import { validateJWT } from '../../middlewares/jwt-verify.js'
import { addReview, getReviewsByBook, deleteReview } from './review.controller.js'
import { authenticatedLimiter } from '../../middlewares/request-limit.js'

const router = Router()

// Todas las rutas de reseñas requieren estar logueado

/**
 * RUTA: POST /
 * Función: Agrega una nueva reseña y calificación a un libro.
 * Destino: addReview (review.controller.js)
 * Retorno: JSON con éxito, mensaje y los datos de la reseña guardada.
 */
router.post('/', validateJWT, authenticatedLimiter, addReview)

/**
 * RUTA: GET /book/:bookId
 * Función: Obtiene todas las reseñas de un libro y calcula el promedio de calificación.
 * Destino: getReviewsByBook (review.controller.js)
 * Retorno: JSON con array de reseñas, promedio y total.
 */
router.get('/book/:bookId', validateJWT, authenticatedLimiter, getReviewsByBook)

/**
 * RUTA: DELETE /:id
 * Función: Elimina una reseña (solo permitido al autor o administradores).
 * Destino: deleteReview (review.controller.js)
 * Retorno: JSON con mensaje de éxito confirmando la eliminación.
 */
router.delete('/:id', validateJWT, authenticatedLimiter, deleteReview)

export default router
