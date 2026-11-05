import { Request, Response, NextFunction } from 'express';
import { SettingsService } from '../settings/settings.service.js';
import { sendSuccess } from '../../utils/response.js';

export class StoreController {
  static async getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await SettingsService.getPublicSettings();
      sendSuccess(res, settings);
    } catch (error) {
      next(error);
    }
  }
}

