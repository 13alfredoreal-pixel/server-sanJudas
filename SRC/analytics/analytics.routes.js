import { Router } from 'express';
import { getGeneralStats } from './analytics.controller.js';
import { validateJWT } from '../../middlewares/jwt-verify.js';
import { isAdmin } from '../../middlewares/is-admin.js';

const router = Router();

// Solo los administradores pueden ver analíticas

/**
 * RUTA: GET /
 * Función: Obtiene un resumen global de estadísticas (usuarios, libros, reseñas y logs de auditoría).
 * Destino: getGeneralStats (analytics.controller.js) - Solo Admin
 * Retorno: JSON con conteos totales, libros populares, usuarios recientes y últimos logs.
 */
router.get('/', [validateJWT, isAdmin], getGeneralStats);

export default router;
