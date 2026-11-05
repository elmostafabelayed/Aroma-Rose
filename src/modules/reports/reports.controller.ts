import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service.js';
import { ReportDateRangeQuery, ReportExportQuery } from './reports.schema.js';

export class ReportsController {
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportsService.getSummary(req.query as unknown as ReportDateRangeQuery);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getSales(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportsService.getSalesTimeline(req.query as unknown as ReportDateRangeQuery);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportsService.getOrderAnalytics(req.query as unknown as ReportDateRangeQuery);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportsService.getProductPerformance(req.query as unknown as ReportDateRangeQuery);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportsService.getCategoryPerformance(req.query as unknown as ReportDateRangeQuery);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getCollections(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportsService.getCollectionAnalytics(req.query as unknown as ReportDateRangeQuery);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportsService.getCustomerAnalytics(req.query as unknown as ReportDateRangeQuery);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getDelivery(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReportsService.getDeliveryAnalytics(req.query as unknown as ReportDateRangeQuery);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const { filename, csv } = await ReportsService.exportCsv(req.query as unknown as ReportExportQuery);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }
}
