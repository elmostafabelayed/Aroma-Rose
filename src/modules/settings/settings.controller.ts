import { Request, Response, NextFunction } from 'express';
import { SettingsService } from './settings.service.js';
import { sendSuccess } from '../../utils/response.js';

export class SettingsController {
  /**
   * Admin & Staff: Fetch full operational configuration
   */
  static async getAdminSettings(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const settings = await SettingsService.getAllSettings();
      sendSuccess(res, settings);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin only: Update store settings atomically with audit trail
   */
  static async updateAdminSettings(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const adminId = (req as any).user?.id || 'a0000000-0000-0000-0000-000000000001';
      const settings = await SettingsService.updateSettings(req.body, adminId);
      sendSuccess(res, settings);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Public storefront: Fetch sanitized public settings
   */
  static async getPublicSettings(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const settings = await SettingsService.getPublicSettings();
      sendSuccess(res, settings);
    } catch (error) {
      next(error);
    }
  }
}
