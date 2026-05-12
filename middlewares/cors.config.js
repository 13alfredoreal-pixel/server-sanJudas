'use strict';

import cors from 'cors';

// Lista de orígenes permitidos
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

// Configuración
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`CORS bloqueado para origen: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Is-Active']
};

export const corsMiddleware = cors(corsOptions);

export { allowedOrigins };