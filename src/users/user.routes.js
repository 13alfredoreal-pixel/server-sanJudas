import { Router } from "express";
import { updateProfile, updatePassword, getUsers, promoteToAdmin, toggleFavorite, getFavorites, deleteUser, updateReadingProgress, getProfile } from "./user.controller.js";
import { validateJWT } from "../../middlewares/jwt-verify.js";
import { uploadProfilePicture } from "../../middlewares/file-uploader.js";
import { processFileUpload } from "../../middlewares/process-file-upload.js";
import { isAdmin } from "../../middlewares/is-admin.js";
import { authenticatedLimiter } from "../../middlewares/request-limit.js";

const router = Router();

/**
 * RUTA: GET /
 * Función: Obtiene una lista de todos los usuarios activos (excluyendo al solicitante).
 * Destino: getUsers (user.controller.js)
 * Retorno: JSON con éxito y array de usuarios básicos (nombre, foto).
 */
router.get("/", authenticatedLimiter, validateJWT, getUsers);

/**
 * RUTA: GET /me
 * Función: Obtiene el perfil del usuario actualmente autenticado (usado tras el login seguro).
 * Destino: getProfile (user.controller.js)
 * Retorno: JSON con los datos públicos del usuario.
 */
router.get("/me", authenticatedLimiter, validateJWT, getProfile);

/**
 * RUTA: PUT /update
 * Función: Actualiza los datos del perfil del usuario (incluyendo foto).
 * Destino: updateProfile (user.controller.js)
 * Retorno: JSON con éxito, mensaje y los datos del usuario actualizados.
 */
router.put(
    "/update",
    authenticatedLimiter,
    validateJWT,
    uploadProfilePicture.single("profilePicture"),
    processFileUpload,
    updateProfile
);

/**
 * RUTA: PATCH /update-password
 * Función: Cambia la contraseña del usuario tras verificar la anterior.
 * Destino: updatePassword (user.controller.js)
 * Retorno: JSON con mensaje de éxito.
 */
router.patch(
    "/update-password",
    authenticatedLimiter,
    validateJWT,
    updatePassword
);

/**
 * RUTA: PATCH /promote/:id
 * Función: Otorga el rol de ADMIN_ROLE a un usuario específico.
 * Destino: promoteToAdmin (user.controller.js) - Solo Admin
 * Retorno: JSON con éxito y datos del usuario promovido.
 */
router.patch(
    "/promote/:id",
    authenticatedLimiter,
    validateJWT,
    isAdmin,
    promoteToAdmin
);

/**
 * RUTA: DELETE /delete/:id
 * Función: Elimina permanentemente la cuenta de un usuario.
 * Destino: deleteUser (user.controller.js) - Propietario o Admin
 * Retorno: JSON con mensaje de éxito.
 */
router.delete(
    "/delete/:id",
    authenticatedLimiter,
    validateJWT,
    deleteUser
);

/**
 * RUTA: POST /toggle-favorite/:bookId
 * Función: Agrega o quita un libro de la lista de favoritos del usuario.
 * Destino: toggleFavorite (user.controller.js)
 * Retorno: JSON con éxito y la lista actualizada de IDs favoritos.
 */
router.post("/toggle-favorite/:bookId", authenticatedLimiter, validateJWT, toggleFavorite);

/**
 * RUTA: GET /favorites
 * Función: Obtiene los libros guardados como favoritos por el usuario actual.
 * Destino: getFavorites (user.controller.js)
 * Retorno: JSON con el array de libros favoritos (populados).
 */
router.get("/favorites", authenticatedLimiter, validateJWT, getFavorites);

/**
 * RUTA: PATCH /reading-progress
 * Función: Guarda la página actual de lectura para un libro específico.
 * Destino: updateReadingProgress (user.controller.js)
 * Retorno: JSON con mensaje confirmando el guardado del progreso.
 */
router.patch("/reading-progress", authenticatedLimiter, validateJWT, updateReadingProgress);

export default router;
