import { Router } from 'express';
import { publicRouter } from './public.routes.js';
import { adminRouter } from './admin.routes.js';

export const apiRouter = Router();

// Mount public endpoints directly at /api/v1
apiRouter.use('/', publicRouter);

// Mount admin endpoints at /api/v1/admin
apiRouter.use('/admin', adminRouter);

