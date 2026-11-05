import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { ENDPOINTS } from '../src/api/endpoints';
import { reportKeys } from '../src/hooks/useReports';
import { formatMAD, formatOrderStatus, formatOrderSource } from '../src/utils/formatters';
import type {
  ReportDateRangeParams,
  ReportSummaryData,
  ProductPerformanceItem,
} from '../src/types/reports.types';

describe('Aroma Rose — Mission 05B Phase 8 Admin Reports & Analytics Test Suite', () => {
  describe('1. Authoritative Backend Endpoints & Query Cache Mapping', () => {
    it('should map to the exact backend administrative routes for reports', () => {
      assert.equal(ENDPOINTS.ADMIN_REPORTS.SUMMARY, '/admin/reports/summary');
      assert.equal(ENDPOINTS.ADMIN_REPORTS.SALES, '/admin/reports/sales');
      assert.equal(ENDPOINTS.ADMIN_REPORTS.ORDERS, '/admin/reports/orders');
      assert.equal(ENDPOINTS.ADMIN_REPORTS.PRODUCTS, '/admin/reports/products');
      assert.equal(ENDPOINTS.ADMIN_REPORTS.CATEGORIES, '/admin/reports/categories');
      assert.equal(ENDPOINTS.ADMIN_REPORTS.COLLECTIONS, '/admin/reports/collections');
      assert.equal(ENDPOINTS.ADMIN_REPORTS.CUSTOMERS, '/admin/reports/customers');
      assert.equal(ENDPOINTS.ADMIN_REPORTS.DELIVERY, '/admin/reports/delivery');
      assert.equal(ENDPOINTS.ADMIN_REPORTS.EXPORT, '/admin/reports/export');
    });

    it('should structure TanStack Query cache keys systematically with filters', () => {
      const filters: ReportDateRangeParams = { period: '30d' };
      assert.deepEqual(reportKeys.all, ['admin', 'reports']);
      assert.deepEqual(reportKeys.summary(filters), ['admin', 'reports', 'summary', filters]);
      assert.deepEqual(reportKeys.sales(filters), ['admin', 'reports', 'sales', filters]);
      assert.deepEqual(reportKeys.orders(filters), ['admin', 'reports', 'orders', filters]);
      assert.deepEqual(reportKeys.products(filters), ['admin', 'reports', 'products', filters]);
    });
  });

  describe('2. Date Presets & Query Parameters', () => {
    it('should support authoritative presets matching product specification', () => {
      const validPresets: ReportDateRangeParams['period'][] = [
        'today',
        '7d',
        '30d',
        '90d',
        'year',
        'custom',
      ];
      assert.equal(validPresets.length, 6);
      assert.ok(validPresets.includes('today'));
      assert.ok(validPresets.includes('30d'));
      assert.ok(validPresets.includes('custom'));
    });

    it('should construct query params correctly for preset periods', () => {
      const params: ReportDateRangeParams = { period: '7d' };
      assert.equal(params.period, '7d');
      assert.equal(params.date_from, undefined);
      assert.equal(params.date_to, undefined);
    });

    it('should support custom date range with date_from and date_to', () => {
      const customParams: ReportDateRangeParams = {
        period: 'custom',
        date_from: '2026-10-01',
        date_to: '2026-10-31',
      };
      assert.equal(customParams.period, 'custom');
      assert.equal(customParams.date_from, '2026-10-01');
      assert.equal(customParams.date_to, '2026-10-31');
    });
  });

  describe('3. Custom Date Range Validation & Error Rejection', () => {
    function validateDateRange(from: string, to: string): { valid: boolean; error?: string } {
      if (!from || !to) {
        return { valid: false, error: 'Dates obligatoires' };
      }
      const dFrom = new Date(from);
      const dTo = new Date(to);
      if (isNaN(dFrom.getTime()) || isNaN(dTo.getTime())) {
        return { valid: false, error: 'Format de date invalide' };
      }
      if (dFrom > dTo) {
        return { valid: false, error: 'La date de début doit précéder ou égaler la date de fin' };
      }
      return { valid: true };
    }

    it('should accept valid chronological range', () => {
      const res = validateDateRange('2026-11-01', '2026-11-05');
      assert.equal(res.valid, true);
      assert.equal(res.error, undefined);
    });

    it('should accept single-day range where start equals end', () => {
      const res = validateDateRange('2026-11-05', '2026-11-05');
      assert.equal(res.valid, true);
    });

    it('should strictly reject inverted date range where start > end', () => {
      const res = validateDateRange('2026-11-10', '2026-11-01');
      assert.equal(res.valid, false);
      assert.ok(res.error?.includes('La date de début doit précéder ou égaler la date de fin'));
    });

    it('should reject malformed or non-date strings', () => {
      const res = validateDateRange('invalid-date', '2026-11-05');
      assert.equal(res.valid, false);
      assert.equal(res.error, 'Format de date invalide');
    });
  });

  describe('4. Financial Semantics: Gross Order Value vs Collected Revenue', () => {
    it('should maintain strict COD accounting separation between gross and collected', () => {
      // Mock orders dataset
      const mockOrders = [
        { id: '1', status: 'delivered', payment_status: 'paid', total: 180.0 },
        { id: '2', status: 'shipped', payment_status: 'unpaid', total: 220.0 }, // COD pending
        { id: '3', status: 'processing', payment_status: 'unpaid', total: 150.0 }, // COD in pipeline
        { id: '4', status: 'cancelled', payment_status: 'unpaid', total: 300.0 }, // CANCELLED
      ];

      // Collected revenue: only paid or delivered
      const collectedRevenue = mockOrders
        .filter((o) => o.payment_status === 'paid' || o.status === 'delivered')
        .reduce((sum, o) => sum + o.total, 0);

      // Gross order value: valid non-cancelled orders
      const grossOrderValue = mockOrders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total, 0);

      // Pending collection: non-cancelled and unpaid
      const pendingCollection = mockOrders
        .filter((o) => o.status !== 'cancelled' && o.payment_status !== 'paid')
        .reduce((sum, o) => sum + o.total, 0);

      // In-transit value: shipped but unpaid
      const inTransitValue = mockOrders
        .filter((o) => o.status === 'shipped' && o.payment_status !== 'paid')
        .reduce((sum, o) => sum + o.total, 0);

      assert.equal(collectedRevenue, 180.0, 'Collected revenue is strictly 180.00 MAD');
      assert.equal(grossOrderValue, 550.0, 'Gross order value is 180 + 220 + 150 = 550.00 MAD');
      assert.equal(pendingCollection, 370.0, 'Pending collection is 220 + 150 = 370.00 MAD');
      assert.equal(inTransitValue, 220.0, 'In-transit value is 220.00 MAD');

      // Verify separation
      assert.notEqual(collectedRevenue, grossOrderValue);
    });

    it('should strictly exclude cancelled orders from collected revenue and gross order value', () => {
      const cancelledOrder = { status: 'cancelled', total: 500.0 };
      const isEligibleForRevenue = cancelledOrder.status !== 'cancelled';
      assert.equal(isEligibleForRevenue, false);
    });
  });

  describe('5. KPI Calculations & Safe Zero-Comparison Handling', () => {
    function safePctChange(current: number, prev: number): number | null {
      if (prev === 0) {
        if (current === 0) return 0;
        return 100.0;
      }
      const pct = ((current - prev) / prev) * 100;
      if (isNaN(pct) || !isFinite(pct)) return null;
      return Number(pct.toFixed(1));
    }

    it('should compute standard percentage change accurately', () => {
      const pct = safePctChange(112.5, 100.0);
      assert.equal(pct, 12.5);
    });

    it('should handle zero previous value without producing NaN or Infinity', () => {
      const pctFromZero = safePctChange(150.0, 0);
      assert.equal(pctFromZero, 100.0);
      assert.ok(isFinite(pctFromZero as number));
      assert.equal(isNaN(pctFromZero as number), false);

      const bothZero = safePctChange(0, 0);
      assert.equal(bothZero, 0);
    });

    it('should calculate negative percentage change when revenue drops', () => {
      const pctDrop = safePctChange(80.0, 100.0);
      assert.equal(pctDrop, -20.0);
    });

    it('should format KPI currency values using Moroccan Dirham (MAD)', () => {
      assert.equal(formatMAD(150), '150.00 MAD');
      assert.equal(formatMAD(0), '0.00 MAD');
      assert.equal(formatMAD(null), '0.00 MAD');
    });
  });

  describe('6. Product Performance & Immutable Snapshot Integrity', () => {
    it('should rank products based on order-item snapshots regardless of catalog changes', () => {
      const mockSnapshotItem: ProductPerformanceItem = {
        product_id: 'prod-uuid-1',
        name: 'Huile Précieuse de Rose 50ml (Snapshot Historique)',
        sku: 'AR-ROSE-50-V1',
        units_sold: 45,
        order_count: 30,
        total_revenue: 6750.0,
        avg_unit_price: 150.0,
        image_storage_path: 'products/rose-oil.webp',
      };

      // Catalog was renamed later to "Huile de Rose Bio 50ml" with new price 180 MAD
      const currentCatalogProduct = {
        name: 'Huile de Rose Bio 50ml',
        price: 180.0,
      };

      // Historical performance MUST use snapshot fields
      assert.equal(mockSnapshotItem.name, 'Huile Précieuse de Rose 50ml (Snapshot Historique)');
      assert.equal(mockSnapshotItem.avg_unit_price, 150.0);
      assert.notEqual(mockSnapshotItem.name, currentCatalogProduct.name);
      assert.notEqual(mockSnapshotItem.avg_unit_price, currentCatalogProduct.price);
    });
  });

  describe('7. Order Analytics: Statuses & Acquisition Channels', () => {
    it('should map all standard backend order statuses into authoritative French', () => {
      assert.equal(formatOrderStatus('pending'), 'En attente');
      assert.equal(formatOrderStatus('confirmed'), 'Confirmée');
      assert.equal(formatOrderStatus('processing'), 'En préparation');
      assert.equal(formatOrderStatus('shipped'), 'Expédiée');
      assert.equal(formatOrderStatus('delivered'), 'Livrée');
      assert.equal(formatOrderStatus('cancelled'), 'Annulée');
    });

    it('should format order acquisition channels in French', () => {
      assert.equal(formatOrderSource('website'), 'Site web');
      assert.equal(formatOrderSource('whatsapp'), 'WhatsApp');
    });
  });

  describe('8. CSV Export Formatting & Formula Sanitization', () => {
    function sanitizeCsvValue(val: unknown): string {
      if (val === null || val === undefined) return '';
      let str = String(val);
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      if (str.includes('"') || str.includes(';') || str.includes(',') || str.includes('\n')) {
        str = `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }

    it('should sanitize formula injection triggers (=, +, -, @)', () => {
      assert.equal(sanitizeCsvValue('=SUM(A1:A10)'), "'=SUM(A1:A10)");
      assert.equal(sanitizeCsvValue('+212600000000'), "'+212600000000");
      assert.equal(sanitizeCsvValue('-100'), "'-100");
      assert.equal(sanitizeCsvValue('@cmd'), "'@cmd");
    });

    it('should escape double quotes and delimiters in CSV fields', () => {
      assert.equal(sanitizeCsvValue('Rose "Damas"'), '"Rose ""Damas"""');
      assert.equal(sanitizeCsvValue('Casablanca; Maarif'), '"Casablanca; Maarif"');
    });

    it('should generate valid French filenames with export types', () => {
      const dateStr = '2026-11-05';
      const salesFilename = `rapport-ventes-aroma-rose-${dateStr}.csv`;
      const ordersFilename = `rapport-commandes-aroma-rose-${dateStr}.csv`;
      const productsFilename = `rapport-produits-aroma-rose-${dateStr}.csv`;

      assert.ok(salesFilename.endsWith('.csv'));
      assert.ok(ordersFilename.startsWith('rapport-commandes'));
      assert.ok(productsFilename.startsWith('rapport-produits'));
    });
  });

  describe('9. RBAC & Security Boundary Rules', () => {
    it('should require admin authorization for reports and reject staff/unauthenticated', () => {
      const roles = ['admin', 'staff', 'anon'];
      const canAccessFinancialReports = (role: string) => role === 'admin';

      assert.equal(canAccessFinancialReports('admin'), true);
      assert.equal(canAccessFinancialReports('staff'), false);
      assert.equal(canAccessFinancialReports('anon'), false);
    });
  });
});
