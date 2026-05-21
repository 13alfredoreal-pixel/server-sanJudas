import { Router } from 'express';
import { getGeneralStats, getAcademicStats } from './analytics.controller.js';
import { validateJWT } from '../../middlewares/jwt-verify.js';
import { isAdmin } from '../../middlewares/is-admin.js';

const router = Router();

/**
 * RUTA: GET /
 * Obtiene un resumen global de estadísticas del sistema completo.
 * Solo Admin.
 */
router.get('/', [validateJWT, isAdmin], getGeneralStats);

/**
 * RUTA: GET /academic/:level
 * Obtiene estadísticas detalladas por nivel educativo (BASICO o BACHILLERATO).
 * Solo Admin.
 */
router.get('/academic/:level', [validateJWT, isAdmin], getAcademicStats);

export default router;
