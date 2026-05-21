import { Router } from 'express'
import { getCourses, getCourseById, getCoursesByGrade, createCourse, updateCourse, deleteCourse } from './course.controller.js'
import { validateJWT } from '../../middlewares/jwt-verify.js'
import { isAdmin } from '../../middlewares/is-admin.js'
import { authenticatedLimiter } from '../../middlewares/request-limit.js'

const router = Router()

/**
 * RUTA: GET /
 * Obtiene todos los cursos con filtros opcionales (grade, active, search).
 */
router.get('/', validateJWT, authenticatedLimiter, getCourses)

/**
 * RUTA: GET /grade/:gradeId
 * Obtiene todos los cursos de un grado específico.
 */
router.get('/grade/:gradeId', validateJWT, authenticatedLimiter, getCoursesByGrade)

/**
 * RUTA: GET /:id
 * Obtiene un curso específico por su ID.
 */
router.get('/:id', validateJWT, authenticatedLimiter, getCourseById)

/**
 * RUTA: POST /
 * Crea un nuevo curso. Solo Admin.
 */
router.post('/', validateJWT, authenticatedLimiter, isAdmin, createCourse)

/**
 * RUTA: PUT /:id
 * Actualiza un curso existente. Solo Admin.
 */
router.put('/:id', validateJWT, authenticatedLimiter, isAdmin, updateCourse)

/**
 * RUTA: DELETE /:id
 * Elimina un curso. Solo Admin.
 */
router.delete('/:id', validateJWT, authenticatedLimiter, isAdmin, deleteCourse)

export default router
