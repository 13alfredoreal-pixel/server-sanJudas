import User from '../SRC/users/user.model.js'

/**
 * Middleware isAdmin:
 * Verifica que el usuario autenticado tenga el rol de ADMIN_ROLE.
 * Debe usarse DESPUÉS de validateJWT.
 */
export const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.uid)
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' })
        }
        if (user.role !== 'ADMIN_ROLE') {
            return res.status(403).json({ message: 'Acceso denegado: se requiere rol de administrador' })
        }
        req.user = user
        next()
    } catch (error) {
        return res.status(500).json({ message: 'Error al verificar permisos', error: error.message })
    }
}
