import { Router } from 'express'
import { getSchedules, getScheduleByGrade, createSchedule, updateSchedule, deleteSchedule } from './schedule.controller.js'
import { validateJWT } from '../../middlewares/jwt-verify.js'
import { isAdmin } from '../../middlewares/is-admin.js'
import { authenticatedLimiter } from '../../middlewares/request-limit.js'

const router = Router()

/**
 * RUTA: GET /
 * Obtiene todos los horarios activos.
 */
router.get('/', validateJWT, authenticatedLimiter, getSchedules)

/**
 * RUTA: GET /grade/:gradeId
 * Obtiene el horario completo de un grado, organizado por día.
 */
router.get('/grade/:gradeId', validateJWT, authenticatedLimiter, getScheduleByGrade)

/**
 * RUTA: POST /
 * Crea un nuevo horario para un grado. Solo Admin.
 */
router.post('/', validateJWT, authenticatedLimiter, isAdmin, createSchedule)

/**
 * RUTA: PUT /grade/:gradeId
 * Actualiza el horario de un grado. Solo Admin.
 */
router.put('/grade/:gradeId', validateJWT, authenticatedLimiter, isAdmin, updateSchedule)

/**
 * RUTA: DELETE /grade/:gradeId
 * Elimina el horario de un grado. Solo Admin.
 */
router.delete('/grade/:gradeId', validateJWT, authenticatedLimiter, isAdmin, deleteSchedule)

export default router
