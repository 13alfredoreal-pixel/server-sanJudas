import jwt from 'jsonwebtoken'

/**
 * Middleware para validar el token JWT en rutas protegidas.
 * Extrae el token de los headers, query o body y verifica su integridad.
 */
export const validateJWT = async (req, res, next) => {
    try {
        let token = req.headers['authorization'] || req.query.token || (req.body && req.body.token);

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No se proporcionó un token de acceso.'
            });
        }

        // Limpiar el prefijo Bearer si existe
        token = token.replace(/^Bearer\s+/, "");
        
        // Verificar el token con la clave secreta
        const decoded = jwt.verify(token, process.env.TOKEN_KEY);
        
        // Adjuntar el UID del usuario a la petición para uso en controladores y limitadores
        req.uid = decoded.uid;
        
        return next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado.',
            error: error.message
        });
    }
}
