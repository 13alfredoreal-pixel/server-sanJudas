import { Router } from 'express'
import { getGrades, getGradeById, createGrade, updateGrade, deleteGrade, getGradesByLevel } from './grade.controller.js'
import { validateJWT } from '../../middlewares/jwt-verify.js'
import { isAdmin } from '../../middlewares/is-admin.js'
import { authenticatedLimiter } from '../../middlewares/request-limit.js'

const router = Router()

/**
 * RUTA: GET /
 * Obtiene todos los grados con filtros opcionales (level, active).
 */
router.get('/', validateJWT, authenticatedLimiter, getGrades)

/**
 * RUTA: GET /level/:level
 * Obtiene grados filtrados por nivel educativo (BASICO o BACHILLERATO).
 */
router.get('/level/:level', validateJWT, authenticatedLimiter, getGradesByLevel)

/**
 * RUTA: GET /:id
 * Obtiene un grado específico por su ID.
 */
router.get('/:id', validateJWT, authenticatedLimiter, getGradeById)

/**
 * RUTA: POST /
 * Crea un nuevo grado. Solo Admin.
 */
router.post('/', validateJWT, authenticatedLimiter, isAdmin, createGrade)

/**
 * RUTA: PUT /:id
 * Actualiza un grado existente. Solo Admin.
 */
router.put('/:id', validateJWT, authenticatedLimiter, isAdmin, updateGrade)

/**
 * RUTA: DELETE /:id
 * Elimina un grado. Solo Admin.
 */
router.delete('/:id', validateJWT, authenticatedLimiter, isAdmin, deleteGrade)

export default router
