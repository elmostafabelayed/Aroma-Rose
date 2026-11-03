import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service.js';
import { sendSuccess } from '../../utils/response.js';

export class DashboardController {
  static async getSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await DashboardService.getSummary();
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  }

  static async getSales(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = parseInt(String(req.query.days), 10) || 30;
      const sales = await DashboardService.getSalesAnalytics(days);
      sendSuccess(res, sales);
    } catch (error) {
      next(error);
    }
  }

  static async getOrders(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await DashboardService.getOrdersBreakdown();
      sendSuccess(res, orders);
    } catch (error) {
      next(error);
    }
  }

  static async getInventory(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const inventory = await DashboardService.getInventoryHealth();
      sendSuccess(res, inventory);
    } catch (error) {
      next(error);
    }
  }
}
