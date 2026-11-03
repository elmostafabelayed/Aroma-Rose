import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

export class InventoryController {
  static async getInventoryOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await InventoryService.getInventoryOverview(req.query);
      sendSuccess(res, {
        summary: result.summary,
        inventory: result.inventory,
      }, 200, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit) || 1,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getInventoryMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await InventoryService.getInventoryMovements(req.query);
      sendSuccess(res, result.movements, 200, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit) || 1,
      });
    } catch (error) {
      next(error);
    }
  }

  static async makeManualAdjustment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminProfileId = req.user!.id;
      const result = await InventoryService.makeManualAdjustment(req.body, adminProfileId);
      sendCreated(res, result);
    } catch (error) {
      next(error);
    }
  }
}

