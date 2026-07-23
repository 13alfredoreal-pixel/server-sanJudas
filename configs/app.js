'use strict';

import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { dbConnection } from './db.js';
import authRoutes from '../src/auth/auth.routes.js';
import userRoutes from '../src/users/user.routes.js';
import bookRoutes from '../src/books/book.routes.js';
import categoryRoutes from '../src/categories/category.routes.js';
import reviewRoutes from '../src/reviews/review.routes.js';
import analyticsRoutes from '../src/analytics/analytics.routes.js';
import { setupAdmin } from '../src/users/user.seed.js';
import { handleErrors } from '../middlewares/handle-errors.js';
import { corsMiddleware } from '../middlewares/cors.config.js';

/** Versión canónica del API. */
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

const markDeprecatedAlias = (_req, res, next) => {
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', 'Sat, 01 Aug 2026 00:00:00 GMT');
  res.setHeader('Link', `<${API_PREFIX}>; rel="successor-version"`);
  next();
};

const mountApi = (app, prefix, { deprecated = false } = {}) => {
  const stack = deprecated ? [markDeprecatedAlias] : [];

  app.use(`${prefix}/auth`, ...stack, authRoutes);
  app.use(`${prefix}/users`, ...stack, userRoutes);
  app.use(`${prefix}/books`, ...stack, bookRoutes);
  app.use(`${prefix}/categories`, ...stack, categoryRoutes);
  app.use(`${prefix}/reviews`, ...stack, reviewRoutes);
  app.use(`${prefix}/analytics`, ...stack, analyticsRoutes);
};

const applyMiddlewares = (app) => {
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(morgan('dev'));
  app.use(corsMiddleware);
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: false, limit: '100mb' }));
  app.use(cookieParser());
};

const applyRoutes = (app) => {
  mountApi(app, API_PREFIX);

  // Alias sin versión — transición; preferir /api/v1
  mountApi(app, '/api', { deprecated: true });

  app.get(['/api', API_PREFIX], (_req, res) => {
    res.status(200).json({
      message: 'Biblioteca Virtual SJT API',
      version: API_VERSION,
      basePath: API_PREFIX,
      deprecatedAlias: '/api/<resource> (usar /api/v1/<resource>)',
    });
  });
};

const connectDatabase = async () => {
  await dbConnection();
  await setupAdmin();
};

export const initServer = async () => {
  const app = express();

  try {
    await connectDatabase();
    applyMiddlewares(app);
    applyRoutes(app);
    app.use(handleErrors);

    const port = process.env.PORT;
    const server = app.listen(port, () => {
      console.log(`Server running on port: ${port} (${API_PREFIX})`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(
          `CRÍTICO | El puerto ${port} ya está en uso. Mata el proceso anterior (ej. fuser -k ${port}/tcp) y vuelve a correr pnpm dev.`,
        );
      } else {
        console.error(`CRÍTICO | Error del servidor HTTP: ${err.message}`);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error(`CRÍTICO | No se pudo iniciar el servidor: ${error.message}`);
    process.exit(1);
  }
};
