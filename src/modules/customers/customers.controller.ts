import { Request, Response, NextFunction } from 'express';
import { CustomersService } from './customers.service.js';
import { sendSuccess } from '../../utils/response.js';

export class CustomersController {
  static async getAdminCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await CustomersService.getAdminCustomers(req.query);
      sendSuccess(res, result.customers, 200, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit) || 1,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAdminCustomerById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await CustomersService.getAdminCustomerById(req.params.id as string);
      sendSuccess(res, customer);
    } catch (error) {
      next(error);
    }
  }

  static async getAdminCustomerOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await CustomersService.getAdminCustomerOrders(req.params.id as string);
      sendSuccess(res, orders);
    } catch (error) {
      next(error);
    }
  }
}
