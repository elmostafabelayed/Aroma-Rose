import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from './utils/errors.js';

export const createApp = (): Express => {
  const app = express();

  // 1. Security Headers via Helmet
  app.use(helmet());

  // 2. CORS Allowlist
  const allowedOrigins = env.CORS_ORIGIN === '*'
    ? '*'
    : env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

  app.use(
    cors({
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400, // 24 hours
    })
  );

  // 3. Body Parsers with strict size limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 4. Rate Limiting on API endpoints
  app.use('/api', apiLimiter);

  // 5. Health Check
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'aroma-rose-api',
      version: '1.0.0',
    });
  });

  // 6. Mount REST API under /api/v1
  app.use('/api/v1', apiRouter);

  // 7. Unmatched Route Handler (404)
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found.`));
  });

  // 8. Centralized Error Handler
  app.use(errorHandler);

  return app;
};

export const app = createApp();
