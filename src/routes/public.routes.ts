import { Router } from 'express';
import { ProductsController } from '../modules/products/products.controller.js';
import { CategoriesController } from '../modules/categories/categories.controller.js';
import { OrdersController } from '../modules/orders/orders.controller.js';
import { StoreController } from '../modules/store/store.controller.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { productQuerySchema } from '../modules/products/products.schema.js';
import { guestCheckoutSchema } from '../modules/orders/orders.schema.js';
import { checkoutLimiter } from '../middleware/rateLimiter.js';

export const publicRouter = Router();

// Products
publicRouter.get('/products', validateQuery(productQuerySchema), ProductsController.getPublicProducts);
publicRouter.get('/products/:slug', ProductsController.getPublicProductBySlug);

// Categories
publicRouter.get('/categories', CategoriesController.getCategories);

// Guest Checkout Order Creation
publicRouter.post('/orders', checkoutLimiter, validateBody(guestCheckoutSchema), OrdersController.createGuestOrder);

// Store Settings
publicRouter.get('/store/settings', StoreController.getSettings);

