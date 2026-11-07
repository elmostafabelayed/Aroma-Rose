import { Router } from 'express';
import { AuthController } from '../modules/auth/auth.controller.js';
import { ProductsController } from '../modules/products/products.controller.js';
import { OrdersController } from '../modules/orders/orders.controller.js';
import { CustomersController } from '../modules/customers/customers.controller.js';
import { InventoryController } from '../modules/inventory/inventory.controller.js';
import { DashboardController } from '../modules/dashboard/dashboard.controller.js';
import { SettingsController } from '../modules/settings/settings.controller.js';
import { ReportsController } from '../modules/reports/reports.controller.js';

import { authenticate } from '../middleware/auth.js';
import { requireRole, requireAdmin } from '../middleware/rbac.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';

import { loginSchema } from '../modules/auth/auth.schema.js';
import { createProductSchema, updateProductSchema, productQuerySchema, uploadImageSchema, deleteImageSchema } from '../modules/products/products.schema.js';
import { adminWhatsAppOrderSchema, updateOrderStatusSchema, updateOrderNotesSchema, orderQuerySchema, reconcileCodPaymentSchema } from '../modules/orders/orders.schema.js';
import { inventoryAdjustmentSchema } from '../modules/inventory/inventory.schema.js';
import { customerQuerySchema } from '../modules/customers/customers.schema.js';
import { updateSettingsSchema } from '../modules/settings/settings.schema.js';
import { reportDateRangeQuerySchema, reportExportQuerySchema } from '../modules/reports/reports.schema.js';

export const adminRouter = Router();

// ==============================================================================
// 1. Authentication (Login is public, Logout & Me are protected)
// ==============================================================================
adminRouter.post('/auth/login', authLimiter, validateBody(loginSchema), AuthController.login);
adminRouter.post('/auth/logout', authenticate, AuthController.logout);
adminRouter.get('/auth/me', authenticate, AuthController.getMe);

// ==============================================================================
// 2. Products Management
// ==============================================================================
adminRouter.get('/products', authenticate, requireRole(['admin', 'staff']), validateQuery(productQuerySchema), ProductsController.getAdminProducts);
adminRouter.post('/products', authenticate, requireRole(['admin', 'staff']), validateBody(createProductSchema), ProductsController.createAdminProduct);
adminRouter.get('/products/:id', authenticate, requireRole(['admin', 'staff']), ProductsController.getAdminProductById);
adminRouter.patch('/products/:id', authenticate, requireRole(['admin', 'staff']), validateBody(updateProductSchema), ProductsController.updateAdminProduct);
adminRouter.post('/products/upload-image', authenticate, requireRole(['admin', 'staff']), validateBody(uploadImageSchema), ProductsController.uploadProductImage);
adminRouter.post('/products/delete-image', authenticate, requireRole(['admin', 'staff']), validateBody(deleteImageSchema), ProductsController.deleteProductImage);
adminRouter.delete('/products/:id', authenticate, requireAdmin, ProductsController.deleteAdminProduct);

// ==============================================================================
// 3. Orders Management
// ==============================================================================
adminRouter.get('/orders', authenticate, requireRole(['admin', 'staff']), validateQuery(orderQuerySchema), OrdersController.getAdminOrders);
adminRouter.get('/orders/:id', authenticate, requireRole(['admin', 'staff']), OrdersController.getAdminOrderById);
adminRouter.post('/orders', authenticate, requireRole(['admin', 'staff']), validateBody(adminWhatsAppOrderSchema), OrdersController.createAdminWhatsAppOrder);
adminRouter.patch('/orders/:id/status', authenticate, requireRole(['admin', 'staff']), validateBody(updateOrderStatusSchema), OrdersController.updateOrderStatus);
adminRouter.post('/orders/:id/reconcile-payment', authenticate, requireAdmin, validateBody(reconcileCodPaymentSchema), OrdersController.reconcileCodPayment);
adminRouter.patch('/orders/:id/notes', authenticate, requireRole(['admin', 'staff']), validateBody(updateOrderNotesSchema), OrdersController.updateOrderNotes);
adminRouter.get('/orders/:id/history', authenticate, requireRole(['admin', 'staff']), OrdersController.getOrderStatusHistory);

// ==============================================================================
// 4. Customers Management
// ==============================================================================
adminRouter.get('/customers', authenticate, requireRole(['admin', 'staff']), validateQuery(customerQuerySchema), CustomersController.getAdminCustomers);
adminRouter.get('/customers/:id', authenticate, requireRole(['admin', 'staff']), CustomersController.getAdminCustomerById);
adminRouter.get('/customers/:id/orders', authenticate, requireRole(['admin', 'staff']), CustomersController.getAdminCustomerOrders);

// ==============================================================================
// 5. Inventory Management
// ==============================================================================
adminRouter.get('/inventory', authenticate, requireRole(['admin', 'staff']), InventoryController.getInventoryOverview);
adminRouter.get('/inventory/movements', authenticate, requireRole(['admin', 'staff']), InventoryController.getInventoryMovements);
adminRouter.post('/inventory/adjustments', authenticate, requireAdmin, validateBody(inventoryAdjustmentSchema), InventoryController.makeManualAdjustment);

// ==============================================================================
// 6. Executive Dashboard
// ==============================================================================
adminRouter.get('/dashboard/summary', authenticate, requireRole(['admin', 'staff']), DashboardController.getSummary);
adminRouter.get('/dashboard/sales', authenticate, requireAdmin, DashboardController.getSales);
adminRouter.get('/dashboard/orders', authenticate, requireRole(['admin', 'staff']), DashboardController.getOrders);
adminRouter.get('/dashboard/inventory', authenticate, requireRole(['admin', 'staff']), DashboardController.getInventory);

// ==============================================================================
// 7. Store Settings & Configuration
// ==============================================================================
adminRouter.get('/settings', authenticate, requireRole(['admin', 'staff']), SettingsController.getAdminSettings);
adminRouter.put('/settings', authenticate, requireAdmin, validateBody(updateSettingsSchema), SettingsController.updateAdminSettings);

// ==============================================================================
// 8. Business Intelligence Reports & Analytics (Admin Only)
// ==============================================================================
adminRouter.get('/reports/summary', authenticate, requireAdmin, validateQuery(reportDateRangeQuerySchema), ReportsController.getSummary);
adminRouter.get('/reports/sales', authenticate, requireAdmin, validateQuery(reportDateRangeQuerySchema), ReportsController.getSales);
adminRouter.get('/reports/orders', authenticate, requireAdmin, validateQuery(reportDateRangeQuerySchema), ReportsController.getOrders);
adminRouter.get('/reports/products', authenticate, requireAdmin, validateQuery(reportDateRangeQuerySchema), ReportsController.getProducts);
adminRouter.get('/reports/categories', authenticate, requireAdmin, validateQuery(reportDateRangeQuerySchema), ReportsController.getCategories);
adminRouter.get('/reports/collections', authenticate, requireAdmin, validateQuery(reportDateRangeQuerySchema), ReportsController.getCollections);
adminRouter.get('/reports/customers', authenticate, requireAdmin, validateQuery(reportDateRangeQuerySchema), ReportsController.getCustomers);
adminRouter.get('/reports/delivery', authenticate, requireAdmin, validateQuery(reportDateRangeQuerySchema), ReportsController.getDelivery);
adminRouter.get('/reports/export', authenticate, requireAdmin, validateQuery(reportExportQuerySchema), ReportsController.exportCsv);


