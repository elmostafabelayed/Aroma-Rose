import { z } from 'zod';

export const reportPeriodEnum = z.enum(['today', '7d', '30d', '90d', 'year', 'custom']);
export type ReportPeriod = z.infer<typeof reportPeriodEnum>;

export const reportDateRangeQuerySchema = z
  .object({
    period: reportPeriodEnum.optional().default('30d'),
    date_from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD attendu)')
      .optional(),
    date_to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD attendu)')
      .optional(),
  })
  .refine(
    (data) => {
      if (data.period === 'custom') {
        if (!data.date_from || !data.date_to) {
          return false;
        }
      }
      if (data.date_from && data.date_to) {
        const from = new Date(`${data.date_from}T00:00:00.000Z`);
        const to = new Date(`${data.date_to}T23:59:59.999Z`);
        if (isNaN(from.getTime()) || isNaN(to.getTime())) return false;
        return from <= to;
      }
      return true;
    },
    {
      message: 'La date de début doit être antérieure ou égale à la date de fin, et les deux dates sont requises pour une période personnalisée.',
      path: ['date_from'],
    }
  );

export type ReportDateRangeQuery = z.infer<typeof reportDateRangeQuerySchema>;

export const reportExportQuerySchema = z
  .object({
    period: reportPeriodEnum.optional().default('30d'),
    date_from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD attendu)')
      .optional(),
    date_to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD attendu)')
      .optional(),
    type: z.enum(['sales', 'orders', 'products']).optional().default('sales'),
  })
  .refine(
    (data) => {
      if (data.period === 'custom') {
        if (!data.date_from || !data.date_to) {
          return false;
        }
      }
      if (data.date_from && data.date_to) {
        const from = new Date(`${data.date_from}T00:00:00.000Z`);
        const to = new Date(`${data.date_to}T23:59:59.999Z`);
        if (isNaN(from.getTime()) || isNaN(to.getTime())) return false;
        return from <= to;
      }
      return true;
    },
    {
      message: 'La date de début doit être antérieure ou égale à la date de fin.',
      path: ['date_from'],
    }
  );

export type ReportExportQuery = z.infer<typeof reportExportQuerySchema>;
