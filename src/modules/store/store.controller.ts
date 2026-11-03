import { Request, Response, NextFunction } from 'express';
import { StoreService } from './store.service.js';
import { sendSuccess } from '../../utils/response.js';

export class StoreController {
  static getSettings(_req: Request, res: Response, next: NextFunction): void {
    try {
      const settings = StoreService.getStoreSettings();
      sendSuccess(res, settings);
    } catch (error) {
      next(error);
    }
  }
}

