import { Router } from 'express';
import { getCategories, createCategory, deleteCategory } from './category.controller.js';
import { validateJWT } from '../../middlewares/jwt-verify.js';
import { isAdmin } from '../../middlewares/is-admin.js';
import { authenticatedLimiter } from '../../middlewares/request-limit.js';

const router = Router();

/**
 * RUTA: GET /
 * Función: Lista todas las categorías de libros disponibles.
 * Destino: getCategories (category.controller.js)
 * Retorno: JSON con éxito y array de categorías ordenadas.
 */
router.get('/', validateJWT, authenticatedLimiter, getCategories);

/**
 * RUTA: POST /
 * Función: Crea una nueva categoría de libros.
 * Destino: createCategory (category.controller.js) - Solo Admin
 * Retorno: JSON con éxito, mensaje y la categoría creada.
 */
router.post(
    '/',
    validateJWT,
    authenticatedLimiter,
    isAdmin,
    createCategory
);

/**
 * RUTA: DELETE /:id
 * Función: Elimina una categoría existente del sistema.
 * Destino: deleteCategory (category.controller.js) - Solo Admin
 * Retorno: JSON con mensaje de éxito de eliminación.
 */
router.delete(
    '/:id',
    validateJWT,
    authenticatedLimiter,
    isAdmin,
    deleteCategory
);

export default router;
