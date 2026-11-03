import { Request, Response, NextFunction } from 'express';
import { OrdersService } from './orders.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

export class OrdersController {
  static async createGuestOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await OrdersService.createGuestOrder(req.body);
      sendCreated(res, order);
    } catch (error) {
      next(error);
    }
  }

  static async createAdminWhatsAppOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminProfileId = req.user!.id;
      const order = await OrdersService.createAdminWhatsAppOrder(req.body, adminProfileId);
      sendCreated(res, order);
    } catch (error) {
      next(error);
    }
  }

  static async getAdminOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await OrdersService.getAdminOrders(req.query as any);
      sendSuccess(res, result.orders, 200, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit) || 1,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAdminOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await OrdersService.getAdminOrderById(req.params.id as string);
      sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminProfileId = req.user!.id;
      const updatedOrder = await OrdersService.updateOrderStatus(req.params.id as string, req.body, adminProfileId);
      sendSuccess(res, updatedOrder);
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updatedOrder = await OrdersService.updateOrderNotes(req.params.id as string, req.body.admin_notes);
      sendSuccess(res, updatedOrder);
    } catch (error) {
      next(error);
    }
  }

  static async getOrderStatusHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const history = await OrdersService.getOrderStatusHistory(req.params.id as string);
      sendSuccess(res, history);
    } catch (error) {
      next(error);
    }
  }
}
