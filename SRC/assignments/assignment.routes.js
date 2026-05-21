import { Router } from 'express'
import { getAssignments, getAssignmentById, getAssignmentsByGrade, createAssignment, updateAssignment, deleteAssignment } from './assignment.controller.js'
import { validateJWT } from '../../middlewares/jwt-verify.js'
import { isAdmin } from '../../middlewares/is-admin.js'
import { authenticatedLimiter } from '../../middlewares/request-limit.js'

const router = Router()

/**
 * RUTA: GET /
 * Obtiene tareas con filtros (grade, course, type, priority, upcoming) y paginación.
 */
router.get('/', validateJWT, authenticatedLimiter, getAssignments)

/**
 * RUTA: GET /grade/:gradeId
 * Obtiene todas las tareas de un grado específico.
 */
router.get('/grade/:gradeId', validateJWT, authenticatedLimiter, getAssignmentsByGrade)

/**
 * RUTA: GET /:id
 * Obtiene una tarea específica por su ID.
 */
router.get('/:id', validateJWT, authenticatedLimiter, getAssignmentById)

/**
 * RUTA: POST /
 * Crea una nueva tarea. Solo Admin.
 */
router.post('/', validateJWT, authenticatedLimiter, isAdmin, createAssignment)

/**
 * RUTA: PUT /:id
 * Actualiza una tarea existente. Solo Admin.
 */
router.put('/:id', validateJWT, authenticatedLimiter, isAdmin, updateAssignment)

/**
 * RUTA: DELETE /:id
 * Elimina una tarea. Solo Admin.
 */
router.delete('/:id', validateJWT, authenticatedLimiter, isAdmin, deleteAssignment)

export default router
