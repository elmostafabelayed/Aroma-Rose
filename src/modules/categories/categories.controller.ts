import { Request, Response, NextFunction } from 'express';
import { CategoriesService } from './categories.service.js';
import { sendSuccess } from '../../utils/response.js';

export class CategoriesController {
  static async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await CategoriesService.getActiveCategories();
      sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  }
}
