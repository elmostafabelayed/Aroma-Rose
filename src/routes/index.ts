import { Router } from 'express';
import { publicRouter } from './public.routes.js';
import { adminRouter } from './admin.routes.js';

export const apiRouter = Router();

// Liveness & Readiness Health Endpoint under /api/v1/health
apiRouter.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'aroma-rose-api',
    version: '1.0.0',
  });
});

// Mount public endpoints directly at /api/v1
apiRouter.use('/', publicRouter);

// Mount admin endpoints at /api/v1/admin
apiRouter.use('/admin', adminRouter);

