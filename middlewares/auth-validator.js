import { check } from 'express-validator'
import { validarCampos } from './validate-values.js'
import { emailExists } from '../helpers/db-validators.js'

export const registerValidator = [
    check("name", "El nombre es obligatorio").trim().escape().not().isEmpty(),
    check("surname", "El apellido es obligatorio").trim().escape().not().isEmpty(),
    check("username", "El nombre de usuario es obligatorio").trim().not().isEmpty(),
    check("email", "No es un email válido").trim().isEmail(),
    check("email").custom(emailExists),
    check("password", "La contraseña debe de tener al menos 8 caracteres").isLength({
        min: 8
    }),
    check("confirmPassword").custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Las contraseñas no coinciden');
        }
        return true;
    }),
    validarCampos
]

export const loginValidator = [
    check("email", "No es un email válido").optional().trim().isEmail(),
    check("username", "El nombres de usuario no es válido").optional().trim(),
    check("password", "La contraseña debe de tener al menos 6 caracteres").isLength({
        min: 6
    }),
    validarCampos,
]
