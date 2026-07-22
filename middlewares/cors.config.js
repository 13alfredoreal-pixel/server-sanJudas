'use strict';

import cors from 'cors';

// Configuración CORS simple y permisiva para debugging
export const corsMiddleware = cors({
    origin: '*', // Permitir cualquier origen temporalmente
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Is-Active']
});

export const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://biblioteca-sjt.web.app',
];