import User from './user.model.js';
import { hash, verify } from 'argon2';
import cloudinary from '../../configs/cloudinary.js';
import { logAdminAction } from '../audit/audit.logger.js';

/**
 * Actualiza los datos del perfil del usuario.
 * Maneja la subida de imágenes a Cloudinary y la eliminación de la foto anterior.
 */
export const updateProfile = async (req, res) => {
    try {
        const uid = req.uid;
        const data = { ...req.body };

        console.log(`[UpdateProfile] Iniciando actualización para UID: ${uid}`);
        console.log(`[UpdateProfile] Datos recibidos:`, JSON.stringify(data));

        // Si hay una nueva imagen guardada en Cloudinary por el middleware anterior
        if (req.fileRelativePath) {
            console.log(`[UpdateProfile] Nueva imagen detectada: ${req.fileRelativePath}`);
            const currentUser = await User.findById(uid);

            if (currentUser && currentUser.profilePicturePublicId) {
                try {
                    console.log(`[UpdateProfile] Intentando eliminar imagen antigua: ${currentUser.profilePicturePublicId}`);
                    await cloudinary.uploader.destroy(currentUser.profilePicturePublicId);
                } catch (trashError) {
                    console.error(`[UpdateProfile] Error no crítico al borrar imagen antigua:`, trashError.message);
                }
            }
            data.profilePicture = req.fileRelativePath;
            data.profilePicturePublicId = req.filePublicId;
        }

        // Limpieza de campos sensibles y validaciones de formato
        if (data.phone === "" || data.phone === "undefined" || data.phone === null || data.phone === "null") {
            delete data.phone;
        }

        // Eliminar campos que NO deben actualizarse por esta vía (Seguridad SJT)
        const protectedFields = ['password', 'email', 'role', '_id', 'uid', 'createdAt', 'updatedAt', 'status'];
        protectedFields.forEach(field => delete data[field]);

        console.log(`[UpdateProfile] Datos a guardar tras limpieza:`, JSON.stringify(data));

        // Actualización en base de datos
        const user = await User.findByIdAndUpdate(uid, data, {
            new: true,
            runValidators: true
        }).select('-password -__v -status');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado en la base de datos'
            });
        }

        console.log(`[UpdateProfile] ÉXITO: Perfil actualizado para ${user.username}`);

        return res.status(200).json({
            success: true,
            message: 'Perfil actualizado correctamente',
            user // Ya viene filtrado por el .select()
        });

    } catch (error) {
        console.error('[UpdateProfile FATAL ERROR]:', error);

        // Manejo específico de errores de duplicados (ej: username)
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de usuario ya está ocupado por otra persona'
            });
        }

        // Manejo de errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validación en los datos',
                error: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error interno al procesar la actualización',
            error: error.message
        });
    }
}

/**
 * Cambia la contraseña del usuario.
 * Verifica que la contraseña actual sea correcta antes de aplicar el hash a la nueva.
 */
export const updatePassword = async (req, res) => {
    try {
        const uid = req.uid;
        const { oldPassword, newPassword } = req.body;

        const user = await User.findById(uid);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const validPassword = await verify(user.password, oldPassword);
        if (!validPassword) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña actual es incorrecta'
            });
        }

        user.password = await hash(newPassword);
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar la contraseña',
            error: error.message
        });
    }
}

/**
 * Obtiene la lista de usuarios activos para que otros puedan encontrarlos en el chat.
 * Excluye al usuario que hace la petición.
 */
export const getUsers = async (req, res) => {
    try {
        const uid = req.uid;
        const users = await User.find({
            _id: { $ne: uid },
            status: true
        }).select('name surname username profilePicture');

        return res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios',
            error: error.message
        });
    }
}

/**
 * Promueve a un usuario al rol de administrador.
 * Esta función es fundamental para la gestión de permisos en la biblioteca.
 * Solo puede ser ejecutada por un administrador existente (verificado por middleware isAdmin).
 */
export const promoteToAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscamos y actualizamos el rol del usuario a 'ADMIN_ROLE'
        const user = await User.findByIdAndUpdate(
            id,
            { role: 'ADMIN_ROLE' },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Audit Log
        if (req.uid) {
            await logAdminAction(req.uid, 'PROMOTE_USER', `Otorgado rol de administrador a: ${user.username}`, req.ip);
        }

        // Devolvemos una respuesta exitosa confirmando el cambio
        return res.status(200).json({
            success: true,
            message: `El usuario ${user.username} ahora es administrador con permisos completos`,
            user
        });
    } catch (error) {
        // En caso de error, devolvemos un mensaje descriptivo
        return res.status(500).json({
            success: false,
            message: 'Error al promover usuario a administrador',
            error: error.message
        });
    }
}

/**
 * Alterna un libro en la lista de favoritos del usuario.
 * Si ya existe, lo quita; si no, lo agrega.
 */
export const toggleFavorite = async (req, res) => {
    try {
        const uid = req.uid;
        const { bookId } = req.params;

        const user = await User.findById(uid);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        const isFavorite = user.favorites.includes(bookId);
        if (isFavorite) {
            user.favorites = user.favorites.filter(fav => fav.toString() !== bookId);
        } else {
            user.favorites.push(bookId);
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: isFavorite ? 'Eliminado de favoritos' : 'Agregado a favoritos',
            favorites: user.favorites
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al procesar favoritos',
            error: error.message
        });
    }
}

/**
 * Obtiene la lista de libros favoritos del usuario actual con detalles.
 */
export const getFavorites = async (req, res) => {
    try {
        const uid = req.uid;
        const user = await User.findById(uid).populate('favorites');

        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        return res.status(200).json({
            success: true,
            favorites: user.favorites
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener favoritos',
            error: error.message
        });
    }
}
/**
 * Elimina un usuario.
 * Puede ser ejecutado por:
 * 1. El propio usuario (eliminar su cuenta).
 * 2. Un administrador (eliminar a cualquier usuario).
 */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params; // ID del usuario a eliminar
        const requesterId = req.uid; // ID del usuario que hace la petición (desde JWT)

        // Buscamos al solicitante para verificar su rol
        const requester = await User.findById(requesterId);
        if (!requester) {
            return res.status(404).json({ success: false, message: 'Usuario solicitante no encontrado' });
        }

        // Verificación de permisos:
        // Solo permitido si es Admin O si es el mismo usuario eliminándose
        if (requester.role !== 'ADMIN_ROLE' && requesterId !== id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para realizar esta acción'
            });
        }

        // Buscamos al usuario a eliminar para limpiar imagen de Cloudinary si existe
        const userToDelete = await User.findById(id);
        if (!userToDelete) {
            return res.status(404).json({ success: false, message: 'Usuario a eliminar no encontrado' });
        }

        // Eliminamos imagen de Cloudinary si tiene una
        if (userToDelete.profilePicturePublicId) {
            try {
                await cloudinary.uploader.destroy(userToDelete.profilePicturePublicId);
            } catch (err) {
                console.error('Error al eliminar imagen de Cloudinary:', err);
                // No detenemos el proceso si falla esto
            }
        }

        // Eliminamos de la base de datos
        await User.findByIdAndDelete(id);

        if (requester.role === 'ADMIN_ROLE' && requesterId !== id) {
            await logAdminAction(requesterId, 'DELETE_USER', `Usuario eliminado: ${userToDelete.username}`, req.ip);
        }

        return res.status(200).json({
            success: true,
            message: 'Cuenta eliminada correctamente'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar el usuario',
            error: error.message
        });
    }
}

/**
 * updateReadingProgress: Actualiza la página actual de lectura de un libro.
 */
export const updateReadingProgress = async (req, res) => {
    try {
        const { bookId, page } = req.body;
        const userId = req.uid; // Corregido: validateJWT usa req.uid

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        // Buscar si ya existe progreso para este libro
        const progressIndex = user.readingProgress.findIndex(p => p.book.toString() === bookId);

        if (progressIndex > -1) {
            user.readingProgress[progressIndex].lastPage = page;
            user.readingProgress[progressIndex].updatedAt = Date.now();
        } else {
            user.readingProgress.push({ book: bookId, lastPage: page });
        }

        await user.save();

        return res.status(200).json({ success: true, message: 'Progreso guardado' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error al guardar progreso', error: error.message });
    }
};

/**
 * getProfile: Obtiene los datos del usuario actualmente autenticado (basado en el token).
 * Esto permite que el login sea ultra seguro y no devuelva datos aparte del UID y el Token.
 */
export const getProfile = async (req, res) => {
    try {
        const uid = req.uid; // Extraído del middleware validateJWT
        const user = await User.findById(uid).select('-password -__v -status');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Perfil no encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al obtener el perfil',
            error: error.message
        });
    }
};
