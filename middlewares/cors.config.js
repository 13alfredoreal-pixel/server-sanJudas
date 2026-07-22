'use strict';

import cors from 'cors';

// Lista de orígenes permitidos
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://biblioteca-sjt.web.app',
];

// Configuración
const corsOptions = {
    origin: (origin, callback) => {
        // Permitir solicitudes sin origin (como mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Temporalmente permitir cualquier origen para debugging
        console.warn(`CORS warning: Origin ${origin} not in allowed list, but allowing for debugging`);
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Is-Active']
};

export const corsMiddleware = cors(corsOptions);

export { allowedOrigins };