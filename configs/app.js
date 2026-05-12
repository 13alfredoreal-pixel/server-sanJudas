'use strict';

import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { dbConnection } from './db.js';
import authRoutes from '../SRC/auth/auth.routes.js';
import userRoutes from '../SRC/users/user.routes.js';
import bookRoutes from '../SRC/books/book.routes.js';
import categoryRoutes from '../SRC/categories/category.routes.js';
import reviewRoutes from '../SRC/reviews/review.routes.js';
import analyticsRoutes from '../SRC/analytics/analytics.routes.js';
import { publicLimiter } from '../middlewares/request-limit.js';
import { setupAdmin } from '../SRC/users/user.seed.js';
import { handleErrors } from '../middlewares/handle-errors.js';
import { validateJWT } from '../middlewares/jwt-verify.js';
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { corsMiddleware } from '../middlewares/cors.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const middlewares = (app) => {
    app.use(helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        crossOriginEmbedderPolicy: false
    }));
    app.use(morgan('dev'));
    app.use(corsMiddleware);

    app.use(express.json({ limit: '100mb' }));
    app.use(express.urlencoded({ extended: false, limit: '100mb' }));
    app.use(cookieParser());
    // app.use(mongoSanitize()); // Comentado temporalmente por incompatibilidad con Express 5 (req.query read-only)

    // Directorios estáticos (PDFs protegidos internamente por el router si se desea, 
    // pero aquí los protegemos con validateJWT para acceso directo a archivos)
    app.use('/api/pdfs', validateJWT, express.static(join(__dirname, '../uploads/pdfs')));
    app.use('/api/uploads', express.static(join(__dirname, '../assets/img')));

    // Prefijo para rutas de autenticación
    app.use('/api/auth', authRoutes);
}

const routes = (app) => {
    app.use('/api/users', userRoutes);
    app.use('/api/books', bookRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/reviews', reviewRoutes);
    app.use('/api/analytics', analyticsRoutes);
}

const conectarDB = async () => {
    try {
        await dbConnection();
        await setupAdmin();
    } catch (error) {
        console.error(`ERROR | Fallo crítico en la base de datos: ${error.message}`)
        throw error;
    }
}

export const initServer = async () => {
    const app = express();

    try {
        await conectarDB()
        middlewares(app)
        routes(app)
        app.use(handleErrors)

        app.listen(process.env.PORT, () => {
            console.log(`Server running on port: ${process.env.PORT}`)
        })
    } catch (error) {
        console.error(`CRÍTICO | No se pudo iniciar el servidor: ${error.message}`);
    }
}