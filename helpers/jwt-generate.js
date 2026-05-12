import jwt from 'jsonwebtoken'

export const generarJWT = (uid = '', email = '') =>{
    return new Promise ((resolve, reject) => {
        const payload = { uid, email}; 
        jwt.sign (
            payload,
            process.env.TOKEN_KEY,
            {
                expiresIn: '15m', // Tiempo de vida corto para seguridad
            },
            (err,token) => {
                if (err) {
                    console.error(err);
                    reject('Error al generar token: ' + err.message);
                } else {
                    resolve(token);
                }
            }
        );
    });
};

export const generarRefreshJWT = (uid = '') => {
    return new Promise((resolve, reject) => {
        const payload = { uid };
        jwt.sign(
            payload,
            process.env.REFRESH_TOKEN_KEY || process.env.TOKEN_KEY, // Idealmente una clave secreta separada
            {
                expiresIn: '7d', // Refresh token dura 7 días
            },
            (err, token) => {
                if (err) {
                    console.error(err);
                    reject('Error al generar refresh token');
                } else {
                    resolve(token);
                }
            }
        );
    });
};