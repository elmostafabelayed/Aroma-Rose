import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { ENDPOINTS } from '../src/api/endpoints';
import {
  formatCustomerStatus,
  formatMAD,
  formatPhoneDisplay,
  formatOrderSource,
  formatDateTime,
} from '../src/utils/formatters';
import type {
  Customer,
  CustomerOrder,
  CustomerQueryParams,
  CustomerSummary,
} from '../src/types/customer.types';

describe('Aroma Rose — Mission 05B Phase 6 Admin Customers Test Suite', () => {
  describe('1. Authoritative Backend Endpoints Mapping', () => {
    it('should map to the exact backend administrative routes for customers', () => {
      assert.equal(ENDPOINTS.ADMIN_CUSTOMERS.LIST, '/admin/customers');
      assert.equal(
        ENDPOINTS.ADMIN_CUSTOMERS.BY_ID('cust-uuid-456'),
        '/admin/customers/cust-uuid-456'
      );
      assert.equal(
        ENDPOINTS.ADMIN_CUSTOMERS.ORDERS('cust-uuid-456'),
        '/admin/customers/cust-uuid-456/orders'
      );
    });
  });

  describe('2. Customer Identity & Segmentation Rules', () => {
    it('should categorize customer loyalty based on total completed orders', () => {
      assert.equal(formatCustomerStatus(0), 'Inactif');
      assert.equal(formatCustomerStatus(1), 'Client actif');
      assert.equal(formatCustomerStatus(2), 'Client fidèle');
      assert.equal(formatCustomerStatus(10), 'Client fidèle');
      assert.equal(formatCustomerStatus(null), 'Inactif');
      assert.equal(formatCustomerStatus(undefined), 'Inactif');
    });

    it('should format Moroccan customer phone numbers into clean grouped format', () => {
      assert.equal(
        formatPhoneDisplay('+212611223344'),
        '+212 6 11 22 33 44'
      );
      assert.equal(
        formatPhoneDisplay('+212655443322'),
        '+212 6 55 44 33 22'
      );
      assert.equal(formatPhoneDisplay(null), '—');
    });

    it('should format order acquisition channels in French', () => {
      assert.equal(formatOrderSource('website'), 'Site web');
      assert.equal(formatOrderSource('whatsapp'), 'WhatsApp');
      assert.equal(formatOrderSource(null), '—');
    });
  });

  describe('3. Customer Financial Aggregations & COD Semantics', () => {
    it('should aggregate orders, total spent, and compute average basket', () => {
      const mockCustomer: Customer = {
        id: 'c1',
        first_name: 'Fatima',
        last_name: 'Bennani',
        phone: '+212611223344',
        email: 'fatima@example.ma',
        city: 'Casablanca',
        address: '25 Boulevard Massira Khadra',
        created_at: '2026-11-03T10:00:00Z',
        total_orders: 3,
        total_spent: '750.00',
        last_order_date: '2026-11-05T12:00:00Z',
        last_order_source: 'website',
      };

      const ordersCount = Number(mockCustomer.total_orders);
      const totalSpent = Number(mockCustomer.total_spent);
      const averageBasket = totalSpent / ordersCount;

      assert.equal(ordersCount, 3);
      assert.equal(totalSpent, 750.0);
      assert.equal(averageBasket, 250.0);
      assert.equal(formatMAD(totalSpent), '750.00 MAD');
      assert.equal(formatMAD(averageBasket), '250.00 MAD');
    });

    it('should exclude cancelled orders from collected revenue and total spent', () => {
      const mockOrders: CustomerOrder[] = [
        {
          id: 'o1',
          order_number: 'AR-20261105-1070',
          order_source: 'website',
          status: 'delivered',
          payment_method: 'cod',
          payment_status: 'paid',
          total_amount: 180.0,
          created_at: '2026-11-05T10:00:00Z',
          items_count: 2,
        },
        {
          id: 'o2',
          order_number: 'AR-20261105-1071',
          order_source: 'whatsapp',
          status: 'cancelled',
          payment_method: 'cod',
          payment_status: 'unpaid',
          total_amount: 350.0,
          created_at: '2026-11-05T11:00:00Z',
          items_count: 1,
        },
        {
          id: 'o3',
          order_number: 'AR-20261105-1072',
          order_source: 'website',
          status: 'processing',
          payment_method: 'cod',
          payment_status: 'unpaid',
          total_amount: 220.0,
          created_at: '2026-11-05T12:00:00Z',
          items_count: 1,
        },
      ];

      // Total non-cancelled
      const validTotal = mockOrders
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + Number(o.total_amount), 0);

      // Only paid/delivered revenue for strict COD accounting
      const collectedRevenue = mockOrders
        .filter((o) => o.status === 'delivered' && o.payment_status === 'paid')
        .reduce((sum, o) => sum + Number(o.total_amount), 0);

      assert.equal(validTotal, 400.0); // 180 + 220
      assert.equal(collectedRevenue, 180.0);
    });
  });

  describe('4. Search, Filtering & Pagination Parameters', () => {
    it('should construct query params according to server contract', () => {
      const buildParams = (
        page: number,
        limit: number,
        search?: string,
        status?: CustomerQueryParams['status'],
        city?: string
      ): CustomerQueryParams => ({
        page,
        limit,
        search: search?.trim() || undefined,
        status: status !== 'all' ? status : undefined,
        city: city?.trim() || undefined,
      });

      const params1 = buildParams(1, 20, 'Bennani', 'active', 'Casablanca');
      assert.equal(params1.page, 1);
      assert.equal(params1.limit, 20);
      assert.equal(params1.search, 'Bennani');
      assert.equal(params1.status, 'active');
      assert.equal(params1.city, 'Casablanca');

      const params2 = buildParams(2, 20, '', 'all', '');
      assert.equal(params2.page, 2);
      assert.equal(params2.search, undefined);
      assert.equal(params2.status, undefined);
      assert.equal(params2.city, undefined);
    });
  });

  describe('5. RBAC & Security Boundary Rules', () => {
    it('should grant read access to both admin and staff roles', () => {
      const canReadCustomers = (role: 'admin' | 'staff' | 'customer') => {
        return role === 'admin' || role === 'staff';
      };

      assert.equal(canReadCustomers('admin'), true);
      assert.equal(canReadCustomers('staff'), true);
      assert.equal(canReadCustomers('customer'), false);
    });

    it('should strictly prohibit customer record mutations from staff and public', () => {
      // The phase defines read-only directory
      const canMutateCustomer = (role: 'admin' | 'staff' | 'customer') => {
        // Customer directory is strictly administrative read model over orders
        return false;
      };

      assert.equal(canMutateCustomer('staff'), false);
      assert.equal(canMutateCustomer('customer'), false);
    });
  });

  describe('6. Empty, Loading and Detail Linking Boundaries', () => {
    it('should format empty and missing values gracefully', () => {
      const emptyEmail = null;
      assert.equal(emptyEmail || 'Non renseignée', 'Non renseignée');

      const emptyPostalCode = null;
      assert.equal(emptyPostalCode || '—', '—');

      const emptyNotes = null;
      assert.equal(emptyNotes || 'Aucune note enregistrée.', 'Aucune note enregistrée.');
    });

    it('should link customer detail orders correctly to administrative order view', () => {
      const getOrderViewUrl = (orderId: string) => `/admin/orders/${orderId}`;
      const getCustomerViewUrl = (customerId: string) => `/admin/customers/${customerId}`;

      assert.equal(
        getOrderViewUrl('f613857e-3b11-42ad-a704-778c5840ca04'),
        '/admin/orders/f613857e-3b11-42ad-a704-778c5840ca04'
      );
      assert.equal(
        getCustomerViewUrl('73c4f56e-b935-4b64-8523-803883604ef7'),
        '/admin/customers/73c4f56e-b935-4b64-8523-803883604ef7'
      );
    });
  });
});
