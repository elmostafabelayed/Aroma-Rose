import { Request, Response, NextFunction } from 'express';
import { ProductsService } from './products.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';

export class ProductsController {
  static async getPublicProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProductsService.getPublicProducts(req.query as any);
      sendSuccess(res, result.products, 200, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit) || 1,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPublicProductBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductsService.getPublicProductBySlug(req.params.slug as string);
      sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  }

  static async getAdminProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProductsService.getAdminProducts(req.query as any);
      sendSuccess(res, result.products, 200, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit) || 1,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAdminProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductsService.getAdminProductById(req.params.id as string);
      sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  }

  static async createAdminProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductsService.createAdminProduct(req.body);
      sendCreated(res, product);
    } catch (error) {
      next(error);
    }
  }

  static async updateAdminProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await ProductsService.updateAdminProduct(req.params.id as string, req.body);
      sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  }

  static async deleteAdminProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ProductsService.deleteAdminProduct(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
