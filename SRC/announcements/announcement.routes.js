import { Router } from 'express'
import { getAnnouncements, getAnnouncementById, getAnnouncementsByGrade, createAnnouncement, updateAnnouncement, deleteAnnouncement } from './announcement.controller.js'
import { validateJWT } from '../../middlewares/jwt-verify.js'
import { isAdmin } from '../../middlewares/is-admin.js'
import { authenticatedLimiter } from '../../middlewares/request-limit.js'

const router = Router()

/**
 * RUTA: GET /
 * Obtiene anuncios con filtros (type, audience, grade, pinned) y paginación.
 */
router.get('/', validateJWT, authenticatedLimiter, getAnnouncements)

/**
 * RUTA: GET /grade/:gradeId
 * Obtiene anuncios relevantes para un grado (específicos + generales).
 */
router.get('/grade/:gradeId', validateJWT, authenticatedLimiter, getAnnouncementsByGrade)

/**
 * RUTA: GET /:id
 * Obtiene un anuncio específico por su ID.
 */
router.get('/:id', validateJWT, authenticatedLimiter, getAnnouncementById)

/**
 * RUTA: POST /
 * Crea un nuevo anuncio. Solo Admin.
 */
router.post('/', validateJWT, authenticatedLimiter, isAdmin, createAnnouncement)

/**
 * RUTA: PUT /:id
 * Actualiza un anuncio existente. Solo Admin.
 */
router.put('/:id', validateJWT, authenticatedLimiter, isAdmin, updateAnnouncement)

/**
 * RUTA: DELETE /:id
 * Elimina un anuncio. Solo Admin.
 */
router.delete('/:id', validateJWT, authenticatedLimiter, isAdmin, deleteAnnouncement)

export default router
