import { check } from 'express-validator'
import { validarCampos } from './validate-values.js'
import { validateJWT } from './jwt-verify.js'
import { authenticatedLimiter, publicLimiter } from './request-limit.js'
import { existePost } from '../helpers/db-validators.js'

export const createPostValidator = [
  validateJWT,
  authenticatedLimiter,
  check('title')
    .trim()
    .notEmpty().withMessage('El título es obligatorio')
    .isLength({ max: 100 }).withMessage('El título no debe de exceder los 100 caracteres')
    .escape(),
  check('content')
    .trim()
    .notEmpty().withMessage('El contenido es obligatorio')
    .escape(),
  validarCampos,
];

export const getPostValidator = [
  publicLimiter,
  validateJWT,
  check("id")
    .trim()
    .notEmpty().withMessage("El ID del post es obligatorio")
    .isMongoId().withMessage("El ID debe ser un ObjectId válido")
    .custom(existePost),
  validarCampos,
];
