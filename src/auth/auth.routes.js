import { Router } from "express";
import { register, login, refreshToken, logout } from './auth.controller.js'
import { uploadProfilePicture } from "../../middlewares/file-uploader.js";
import { processFileUpload } from "../../middlewares/process-file-upload.js";
import { publicLimiter } from "../../middlewares/request-limit.js";
import { registerValidator, loginValidator } from "../../middlewares/auth-validator.js";

import { authLimiter } from "../../middlewares/rate-limit-auth.js";



const router = Router()

/**
 * RUTA: POST /register
 * Función: Registra un nuevo usuario en el sistema.
 * Destino: register (auth.controller.js)
 * Retorno: JSON con mensaje de éxito y detalles del usuario (incluyendo token JWT inicial).
 */
router.post('/register',
  publicLimiter,
  uploadProfilePicture.single('profilePicture'),
  processFileUpload,
  registerValidator,
  register
)

/**
 * RUTA: POST /login
 * Función: Autentica a un usuario y genera una sesión activa.
 * Destino: login (auth.controller.js)
 * Retorno: JSON con mensaje de éxito, detalles del usuario y token JWT. Configura cookie de sesión.
 */
router.post('/login', authLimiter, loginValidator, login)

/**
 * RUTA: POST /refresh-token
 * Función: Renueva el token JWT expirado usando la cookie de sesión.
 * Destino: refreshToken (auth.controller.js)
 * Retorno: JSON con el nuevo token JWT.
 */
router.post('/refresh-token', refreshToken)

/**
 * RUTA: POST /logout
 * Función: Cierra la sesión del usuario actual eliminando las cookies de autenticación.
 * Destino: logout (auth.controller.js)
 * Retorno: JSON con mensaje confirmando el cierre de sesión.
 */
router.post('/logout', logout)

export default router