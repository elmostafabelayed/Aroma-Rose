import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { NotFoundError } from './utils/errors.js';

export const createApp = (): Express => {
  const app = express();

  // 1. Security Headers via Helmet (with cross-origin resource sharing for static media)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // 2. Request Correlation ID Tracking (Observability & Auditability)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const incomingId = req.headers['x-request-id'];
    const correlationId =
      typeof incomingId === 'string' && incomingId.trim() !== ''
        ? incomingId.trim()
        : crypto.randomUUID();
    (req as any).requestId = correlationId;
    res.setHeader('X-Request-Id', correlationId);
    next();
  });

  // 3. CORS Allowlist
  const allowedOrigins =
    env.CORS_ORIGIN === '*'
      ? true
      : env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

  app.use(
    cors({
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
      credentials: true,
      maxAge: 86400, // 24 hours
    })
  );

  // 4. Body Parsers (allow up to 10mb for admin image upload base64 payloads)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

  // 6. Static Products Asset Serving
  app.use('/products', express.static(path.join(process.cwd(), 'public', 'products')));

  // 7. Mount REST API under /api/v1
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

