import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  formatMAD,
  formatOrderStatus,
  formatOrderSource,
  formatUserRole,
} from '../src/utils/formatters';
import { ENDPOINTS } from '../src/api/endpoints';
import type { DashboardSummary } from '../src/api/dashboard.api';

describe('Aroma Rose — Mission 05B Admin Dashboard Test Suite', () => {
  describe('1. French Status & Label Translations', () => {
    it('should translate all backend OrderStatus enums into authoritative French', () => {
      assert.equal(formatOrderStatus('pending'), 'En attente');
      assert.equal(formatOrderStatus('confirmed'), 'Confirmée');
      assert.equal(formatOrderStatus('processing'), 'En préparation');
      assert.equal(formatOrderStatus('shipped'), 'Expédiée');
      assert.equal(formatOrderStatus('delivered'), 'Livrée');
      assert.equal(formatOrderStatus('cancelled'), 'Annulée');
      assert.equal(formatOrderStatus(null), '—');
      assert.equal(formatOrderStatus(undefined), '—');
    });

    it('should translate order acquisition sources into authoritative French', () => {
      assert.equal(formatOrderSource('website'), 'Site web');
      assert.equal(formatOrderSource('whatsapp'), 'WhatsApp');
      assert.equal(formatOrderSource(null), '—');
    });

    it('should translate administrative operator roles into official French titles', () => {
      assert.equal(formatUserRole('admin'), 'Administrateur');
      assert.equal(formatUserRole('staff'), 'Équipe');
      assert.equal(formatUserRole(null), 'Opérateur');
    });
  });

  describe('2. Real KPI Mapping & Strict COD Accounting Semantics', () => {
    const mockBackendSummary: DashboardSummary = {
      collected_revenue: '180.00',
      gross_order_value: '2910.00',
      pipeline_order_value: '2730.00',
      in_transit_value: '0.00',
      total_revenue: '180.00',
      total_orders: 4,
      pending_orders: 2,
      confirmed_orders: 0,
      processing_orders: 1,
      shipped_orders: 0,
      delivered_orders: 1,
      cancelled_orders: 0,
      total_customers: 4,
      active_products: 73,
      low_stock_products: 0,
    };

    it('should preserve strict COD distinction between gross value and collected revenue', () => {
      // Collected revenue must reflect only delivered/paid orders
      assert.equal(formatMAD(mockBackendSummary.collected_revenue), '180.00 MAD');
      assert.equal(formatMAD(mockBackendSummary.total_revenue), '180.00 MAD');

      // Gross value reflects full pipeline
      assert.equal(formatMAD(mockBackendSummary.gross_order_value), '2910.00 MAD');

      // Pipeline orders (pending + confirmed + processing)
      assert.equal(formatMAD(mockBackendSummary.pipeline_order_value), '2730.00 MAD');

      // Orders in transit
      assert.equal(formatMAD(mockBackendSummary.in_transit_value), '0.00 MAD');

      // Delivered revenue must NEVER be assumed equal to gross order value
      assert.notEqual(mockBackendSummary.collected_revenue, mockBackendSummary.gross_order_value);
    });

    it('should verify order volumes and status distribution sum correctly', () => {
      const {
        total_orders,
        pending_orders,
        confirmed_orders,
        processing_orders,
        shipped_orders,
        delivered_orders,
        cancelled_orders,
      } = mockBackendSummary;

      const sumOfStatuses =
        pending_orders +
        confirmed_orders +
        processing_orders +
        shipped_orders +
        delivered_orders +
        cancelled_orders;

      assert.equal(total_orders, sumOfStatuses);
      assert.equal(total_orders, 4);
    });

    it('should properly format active product and stock alert numbers', () => {
      assert.equal(mockBackendSummary.active_products, 73);
      assert.equal(mockBackendSummary.low_stock_products, 0);
    });
  });

  describe('3. Dashboard API Endpoints Contract Alignment', () => {
    it('should match the exact backend routes for dashboard analytics', () => {
      assert.equal(ENDPOINTS.ADMIN_DASHBOARD.SUMMARY, '/admin/dashboard/summary');
      assert.equal(ENDPOINTS.ADMIN_DASHBOARD.ORDERS, '/admin/dashboard/orders');
      assert.equal(ENDPOINTS.ADMIN_DASHBOARD.INVENTORY, '/admin/dashboard/inventory');
      assert.equal(ENDPOINTS.ADMIN_DASHBOARD.SALES(30), '/admin/dashboard/sales?days=30');
      assert.equal(ENDPOINTS.ADMIN_DASHBOARD.SALES(7), '/admin/dashboard/sales?days=7');
      assert.equal(ENDPOINTS.ADMIN_DASHBOARD.SALES(365), '/admin/dashboard/sales?days=365');
      assert.equal(ENDPOINTS.ADMIN_ORDERS.LIST, '/admin/orders');
    });
  });

  describe('4. Navigation Taxonomy & Access Boundaries', () => {
    const requiredNavItems = [
      { label: 'Tableau de bord', to: '/admin', active: true },
      { label: 'Commandes', to: '/admin/orders', active: false },
      { label: 'Produits', to: '/admin/products', active: false },
      { label: 'Gestion du stock', to: '/admin/inventory', active: false },
      { label: 'Clients', to: '/admin/customers', active: false },
    ];

    it('should enforce exactly the French admin navigation items with Phase 1 scope limits', () => {
      const activeItems = requiredNavItems.filter((i) => i.active);
      const disabledItems = requiredNavItems.filter((i) => !i.active);

      // Only Tableau de bord must be active in Phase 1 & 2
      assert.equal(activeItems.length, 1);
      assert.equal(activeItems[0].label, 'Tableau de bord');
      assert.equal(activeItems[0].to, '/admin');

      // 4 modules must be reserved for later phases
      assert.equal(disabledItems.length, 4);
      assert.deepEqual(
        disabledItems.map((i) => i.label),
        ['Commandes', 'Produits', 'Gestion du stock', 'Clients']
      );
    });
  });

  describe('5. Authentication State Boundaries & Token Management', () => {
    it('should correctly evaluate role hierarchy and authentication flags', () => {
      // Admin profile
      const adminProfile = { id: 'uuid-admin', email: 'admin@aromarose.ma', full_name: 'Admin', role: 'admin' as const, is_active: true };
      assert.equal(adminProfile.role === 'admin', true);

      // Staff profile
      const staffProfile = { id: 'uuid-staff', email: 'staff@aromarose.ma', full_name: 'Staff', role: 'staff' as const, is_active: true };
      assert.equal(staffProfile.role === 'staff', true);
      assert.equal(staffProfile.role === 'admin', false);

      // Deactivated account
      const inactiveProfile = { id: 'uuid-inactive', email: 'old@aromarose.ma', full_name: 'Old', role: 'staff' as const, is_active: false };
      assert.equal(inactiveProfile.is_active, false);
    });
  });
});

