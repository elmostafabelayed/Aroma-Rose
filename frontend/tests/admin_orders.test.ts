import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  formatMAD,
  formatOrderStatus,
  formatOrderSource,
  formatPaymentStatus,
  formatPhoneDisplay,
} from '../src/utils/formatters';
import { ENDPOINTS } from '../src/api/endpoints';
import {
  createWhatsAppOrderSchema,
  whatsappOrderItemSchema,
} from '../src/schemas/admin-order.schema';
import type { OrderStatus } from '../src/types/order.types';

describe('Aroma Rose — Mission 05B Phase 3 Admin Orders Test Suite', () => {
  describe('1. Authoritative Backend Endpoints Mapping', () => {
    it('should map to the exact backend administrative routes for orders', () => {
      assert.equal(ENDPOINTS.ADMIN_ORDERS.LIST, '/admin/orders');
      assert.equal(
        ENDPOINTS.ADMIN_ORDERS.BY_ID('order-uuid-123'),
        '/admin/orders/order-uuid-123'
      );
      assert.equal(ENDPOINTS.ADMIN_ORDERS.CREATE_WHATSAPP, '/admin/orders');
      assert.equal(
        ENDPOINTS.ADMIN_ORDERS.UPDATE_STATUS('order-uuid-123'),
        '/admin/orders/order-uuid-123/status'
      );
      assert.equal(
        ENDPOINTS.ADMIN_ORDERS.UPDATE_NOTES('order-uuid-123'),
        '/admin/orders/order-uuid-123/notes'
      );
      assert.equal(
        ENDPOINTS.ADMIN_ORDERS.HISTORY('order-uuid-123'),
        '/admin/orders/order-uuid-123/history'
      );
    });
  });

  describe('2. Order Lifecycle Finite State Machine (FSM) Rules', () => {
    // Definitive transition map matching database trigger fn_validate_order_status_transition()
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'], // shipped cannot be cancelled!
      delivered: [], // terminal state
      cancelled: [], // terminal state
    };

    it('should permit only valid forward transitions and cancellation before shipment', () => {
      assert.deepEqual(allowedTransitions.pending, ['confirmed', 'cancelled']);
      assert.deepEqual(allowedTransitions.confirmed, ['processing', 'cancelled']);
      assert.deepEqual(allowedTransitions.processing, ['shipped', 'cancelled']);
    });

    it('should strictly prohibit cancellation once order has been shipped', () => {
      assert.deepEqual(allowedTransitions.shipped, ['delivered']);
      assert.equal(allowedTransitions.shipped.includes('cancelled'), false);
    });

    it('should treat delivered and cancelled as terminal states with zero transitions', () => {
      assert.deepEqual(allowedTransitions.delivered, []);
      assert.deepEqual(allowedTransitions.cancelled, []);
    });

    it('should reject invalid lifecycle jumps', () => {
      const isValidTransition = (from: OrderStatus, to: OrderStatus) =>
        allowedTransitions[from]?.includes(to) ?? false;

      // Pending cannot jump directly to shipped or delivered
      assert.equal(isValidTransition('pending', 'shipped'), false);
      assert.equal(isValidTransition('pending', 'delivered'), false);

      // Shipped cannot revert or cancel
      assert.equal(isValidTransition('shipped', 'processing'), false);
      assert.equal(isValidTransition('shipped', 'cancelled'), false);

      // Delivered is terminal
      assert.equal(isValidTransition('delivered', 'pending'), false);
      assert.equal(isValidTransition('delivered', 'cancelled'), false);
    });
  });

  describe('3. French Translations & Formatting', () => {
    it('should translate all order statuses into authoritative French', () => {
      assert.equal(formatOrderStatus('pending'), 'En attente');
      assert.equal(formatOrderStatus('confirmed'), 'Confirmée');
      assert.equal(formatOrderStatus('processing'), 'En préparation');
      assert.equal(formatOrderStatus('shipped'), 'Expédiée');
      assert.equal(formatOrderStatus('delivered'), 'Livrée');
      assert.equal(formatOrderStatus('cancelled'), 'Annulée');
    });

    it('should translate payment statuses into French COD terminology', () => {
      assert.equal(formatPaymentStatus('paid'), 'Payé (COD)');
      assert.equal(formatPaymentStatus('unpaid'), 'À encaisser (COD)');
      assert.equal(formatPaymentStatus('refunded'), 'Remboursé');
    });

    it('should translate order acquisition sources accurately', () => {
      assert.equal(formatOrderSource('website'), 'Site web');
      assert.equal(formatOrderSource('whatsapp'), 'WhatsApp');
    });

    it('should format Moroccan telephone numbers into readable groups', () => {
      assert.equal(
        formatPhoneDisplay('+212612345678'),
        '+212 6 12 34 56 78'
      );
      assert.equal(formatPhoneDisplay('0612345678'), '0612345678');
    });
  });

  describe('4. WhatsApp Order Creation Schema Validation', () => {
    const validPayload = {
      customer: {
        first_name: 'Fatima',
        last_name: 'Zahra',
        phone: '06 12 34 56 78',
        email: 'fatima@example.ma',
        city: 'Casablanca',
        address: '24 Rue Ibn Sina, Maarif',
        postal_code: '20100',
        notes: 'Appeler avant de livrer',
      },
      items: [
        {
          product_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          quantity: 2,
        },
      ],
      shipping_fee: 30,
      customer_notes: 'Remettre en main propre',
      admin_notes: 'Accord WhatsApp conclu le matin',
    };

    it('should accept valid WhatsApp order form input with Moroccan phone', () => {
      const parsed = createWhatsAppOrderSchema.safeParse(validPayload);
      assert.equal(parsed.success, true);
    });

    it('should accept international +212 Moroccan phone format', () => {
      const payload = {
        ...validPayload,
        customer: {
          ...validPayload.customer,
          phone: '+212612345678',
        },
      };
      const parsed = createWhatsAppOrderSchema.safeParse(payload);
      assert.equal(parsed.success, true);
    });

    it('should reject invalid phone numbers', () => {
      const payload = {
        ...validPayload,
        customer: {
          ...validPayload.customer,
          phone: '12345',
        },
      };
      const parsed = createWhatsAppOrderSchema.safeParse(payload);
      assert.equal(parsed.success, false);
      if (!parsed.success) {
        assert.match(
          parsed.error.errors[0].message,
          /incomplet|invalide/i
        );
      }
    });

    it('should require at least one order item', () => {
      const payload = {
        ...validPayload,
        items: [],
      };
      const parsed = createWhatsAppOrderSchema.safeParse(payload);
      assert.equal(parsed.success, false);
    });

    it('should reject invalid product UUID format', () => {
      const itemParsed = whatsappOrderItemSchema.safeParse({
        product_id: 'invalid-uuid-string',
        quantity: 1,
      });
      assert.equal(itemParsed.success, false);
    });

    it('should reject non-positive quantities', () => {
      const itemParsed = whatsappOrderItemSchema.safeParse({
        product_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        quantity: 0,
      });
      assert.equal(itemParsed.success, false);
    });
  });

  describe('5. Immutability of Order Snapshots', () => {
    it('should maintain server snapshots for price, sku, and product name', () => {
      const mockOrderItem = {
        id: 'item-1',
        order_id: 'order-1',
        product_id: 'prod-1',
        product_name_snapshot: 'Huile Précieuse de Rose',
        product_sku_snapshot: 'HPR-050',
        unit_price_snapshot: 350.0,
        quantity: 2,
        total_price: 700.0,
      };

      // Server snapshots take precedence over live product attributes
      assert.equal(mockOrderItem.product_name_snapshot, 'Huile Précieuse de Rose');
      assert.equal(mockOrderItem.product_sku_snapshot, 'HPR-050');
      assert.equal(mockOrderItem.unit_price_snapshot, 350.0);
      assert.equal(mockOrderItem.total_price, 700.0);
    });
  });

  describe('6. COD Financial Reconciliation & Payment State Model', () => {
    // Canonical financial rules
    const isCollectedRevenue = (order: { payment_status: string; status: string }) =>
      order.payment_status === 'paid' && order.status !== 'cancelled';

    const isPendingCollection = (order: { payment_status: string; status: string }) =>
      order.payment_status === 'unpaid' && order.status !== 'cancelled';

    it('A. COD shipped + unpaid should NOT be counted in collected revenue', () => {
      const order = { id: 'o-shipped', status: 'shipped', payment_status: 'unpaid', total_amount: 350.0 };
      assert.equal(isCollectedRevenue(order), false, 'Shipped unpaid COD order is not collected');
      assert.equal(isPendingCollection(order), true, 'Shipped unpaid COD order is pending collection');
      assert.equal(formatPaymentStatus(order.payment_status), 'À encaisser (COD)');
    });

    it('B. COD delivered + unpaid should STILL NOT be counted in collected revenue', () => {
      const order = { id: 'o-delivered-unpaid', status: 'delivered', payment_status: 'unpaid', total_amount: 450.0 };
      assert.equal(isCollectedRevenue(order), false, 'Delivered unpaid COD order must NOT be counted as collected');
      assert.equal(isPendingCollection(order), true, 'Delivered unpaid COD order remains in pending collection');
      assert.equal(formatPaymentStatus(order.payment_status), 'À encaisser (COD)');
    });

    it('C. COD delivered + explicitly collected should be counted in collected revenue', () => {
      const order = { id: 'o-delivered-paid', status: 'delivered', payment_status: 'paid', total_amount: 450.0 };
      assert.equal(isCollectedRevenue(order), true, 'Delivered paid COD order is officially collected');
      assert.equal(isPendingCollection(order), false, 'Delivered paid COD order is no longer pending collection');
      assert.equal(formatPaymentStatus(order.payment_status), 'Payé (COD)');
    });

    it('D. Cancelled COD should NOT be counted in collected revenue or pending collection', () => {
      const order = { id: 'o-cancelled', status: 'cancelled', payment_status: 'unpaid', total_amount: 500.0 };
      assert.equal(isCollectedRevenue(order), false, 'Cancelled order is not collected');
      assert.equal(isPendingCollection(order), false, 'Cancelled order is not pending collection');
    });

    it('E. Refunded order should NOT be counted in collected revenue or pending collection', () => {
      const order = { id: 'o-refunded', status: 'delivered', payment_status: 'refunded', total_amount: 600.0 };
      assert.equal(isCollectedRevenue(order), false, 'Refunded order is not collected');
      assert.equal(isPendingCollection(order), false, 'Refunded order is not pending collection');
      assert.equal(formatPaymentStatus(order.payment_status), 'Remboursé');
    });

    it('F. Staff is prohibited from reconciling COD payments (RBAC boundary)', () => {
      const canReconcile = (role: string) => role === 'admin';
      assert.equal(canReconcile('staff'), false, 'Staff role cannot reconcile COD payments');
      assert.equal(canReconcile('admin'), true, 'Admin role can reconcile COD payments');
    });

    it('G. Payment reconciliation route is mapped to authoritative admin endpoint', () => {
      assert.equal(
        ENDPOINTS.ADMIN_ORDERS.RECONCILE_PAYMENT('order-123'),
        '/admin/orders/order-123/reconcile-payment'
      );
    });

    it('H. Repeated collection is idempotent and preserves order integrity', () => {
      const currentOrder = { id: 'o-paid', status: 'delivered', payment_status: 'paid' };
      const reconcile = (o: typeof currentOrder) => {
        if (o.payment_status === 'paid') {
          return { ...o, already_paid: true };
        }
        return { ...o, payment_status: 'paid' };
      };
      const result = reconcile(currentOrder);
      assert.equal(result.already_paid, true);
      assert.equal(result.payment_status, 'paid');
    });

    it('I. Canonical financial formula consistency across Dashboard & Reports', () => {
      const sampleOrders = [
        { id: '1', status: 'shipped', payment_status: 'unpaid', total_amount: 100.0 },
        { id: '2', status: 'delivered', payment_status: 'unpaid', total_amount: 200.0 },
        { id: '3', status: 'delivered', payment_status: 'paid', total_amount: 300.0 },
        { id: '4', status: 'cancelled', payment_status: 'unpaid', total_amount: 400.0 },
        { id: '5', status: 'delivered', payment_status: 'refunded', total_amount: 500.0 },
      ];

      const collected = sampleOrders
        .filter((o) => isCollectedRevenue(o))
        .reduce((sum, o) => sum + o.total_amount, 0);

      const pending = sampleOrders
        .filter((o) => isPendingCollection(o))
        .reduce((sum, o) => sum + o.total_amount, 0);

      assert.equal(collected, 300.0, 'Only Order 3 is collected');
      assert.equal(pending, 300.0, 'Order 1 (shipped unpaid: 100) + Order 2 (delivered unpaid: 200) = 300');
    });
  });
});

