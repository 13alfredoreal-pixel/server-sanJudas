'use strict';

import cors from 'cors';

// Lista de orígenes permitidos
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://biblioteca-sjt.web.app',
];

// Configuración CORS con orígenes específicos (requerido cuando credentials: true)
export const corsMiddleware = cors({
    origin: (origin, callback) => {
        // Permitir solicitudes sin origin (como mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        console.warn(`CORS bloqueado para origen: ${origin}`);
        return callback(new Error(`CORS bloqueado para origen: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Is-Active']
});

export { allowedOrigins };