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

const applyMiddlewares = (app) => {
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
  }));
  app.use(morgan('dev'));
  app.use(corsMiddleware);
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: false, limit: '100mb' }));
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
};

const applyRoutes = (app) => {
  app.use('/api/users', userRoutes);
  app.use('/api/books', bookRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/analytics', analyticsRoutes);
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

    app.listen(process.env.PORT, () => {
      console.log(`Server running on port: ${process.env.PORT}`);
    });
  } catch (error) {
    console.error(`CRÍTICO | No se pudo iniciar el servidor: ${error.message}`);
  }
};
