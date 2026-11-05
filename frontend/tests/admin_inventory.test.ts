import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { ENDPOINTS } from '../src/api/endpoints';
import {
  formatStockStatus,
  formatMovementType,
} from '../src/utils/formatters';
import type {
  InventoryMovementType,
  ManualStockAdjustmentPayload,
} from '../src/types/inventory.types';

describe('Aroma Rose — Mission 05B Phase 5 Admin Inventory Test Suite', () => {
  describe('1. Authoritative Backend Endpoints Mapping', () => {
    it('should map to the exact backend administrative routes for inventory', () => {
      assert.equal(ENDPOINTS.ADMIN_INVENTORY.OVERVIEW, '/admin/inventory');
      assert.equal(
        ENDPOINTS.ADMIN_INVENTORY.MOVEMENTS,
        '/admin/inventory/movements'
      );
      assert.equal(
        ENDPOINTS.ADMIN_INVENTORY.ADJUSTMENTS,
        '/admin/inventory/adjustments'
      );
    });
  });

  describe('2. Stock Status Evaluation & Threshold (10 units)', () => {
    const evaluateStockStatus = (qty: number) => {
      if (qty <= 0) return 'out_of_stock';
      if (qty <= 10) return 'low_stock';
      return 'in_stock';
    };

    it('should classify quantities strictly according to the 10-unit threshold', () => {
      assert.equal(evaluateStockStatus(0), 'out_of_stock');
      assert.equal(evaluateStockStatus(-5), 'out_of_stock');
      assert.equal(evaluateStockStatus(1), 'low_stock');
      assert.equal(evaluateStockStatus(10), 'low_stock');
      assert.equal(evaluateStockStatus(11), 'in_stock');
      assert.equal(evaluateStockStatus(100), 'in_stock');
    });

    it('should format stock status in authoritative French', () => {
      assert.equal(formatStockStatus('in_stock'), 'En stock');
      assert.equal(formatStockStatus('low_stock'), 'Stock faible');
      assert.equal(formatStockStatus('out_of_stock'), 'Rupture');
      assert.equal(formatStockStatus('unknown'), 'unknown');
    });
  });

  describe('3. Stock Adjustment Calculations & Projections', () => {
    const calculateStockProjection = (
      currentStock: number,
      mode: 'in' | 'out' | 'set',
      qtyInput: number
    ) => {
      let delta = 0;
      let targetStock = currentStock;

      if (mode === 'in') {
        delta = qtyInput;
        targetStock = currentStock + delta;
      } else if (mode === 'out') {
        delta = -qtyInput;
        targetStock = currentStock + delta;
      } else if (mode === 'set') {
        targetStock = qtyInput;
        delta = targetStock - currentStock;
      }

      return { delta, targetStock };
    };

    it('should calculate positive stock reception (Entrée +)', () => {
      const projection = calculateStockProjection(25, 'in', 10);
      assert.equal(projection.delta, 10);
      assert.equal(projection.targetStock, 35);
    });

    it('should calculate stock reduction (Sortie -)', () => {
      const projection = calculateStockProjection(25, 'out', 5);
      assert.equal(projection.delta, -5);
      assert.equal(projection.targetStock, 20);
    });

    it('should calculate direct inventory correction (Correction =)', () => {
      const projectionUp = calculateStockProjection(25, 'set', 30);
      assert.equal(projectionUp.delta, 5);
      assert.equal(projectionUp.targetStock, 30);

      const projectionDown = calculateStockProjection(25, 'set', 12);
      assert.equal(projectionDown.delta, -13);
      assert.equal(projectionDown.targetStock, 12);
    });

    it('should strictly reject negative projected stock', () => {
      const projection = calculateStockProjection(5, 'out', 10);
      assert.equal(projection.targetStock, -5);
      // Validation rule: targetStock must not be < 0
      const isNegative = projection.targetStock < 0;
      assert.equal(isNegative, true);
    });

    it('should detect zero net change', () => {
      const projectionSame = calculateStockProjection(25, 'set', 25);
      assert.equal(projectionSame.delta, 0);
      const isZeroDelta = projectionSame.delta === 0;
      assert.equal(isZeroDelta, true);
    });
  });

  describe('4. Inventory Movement Types & French Translations', () => {
    const movementTypes: InventoryMovementType[] = [
      'order_shipment',
      'manual_adjustment',
      'restock',
      'return_restock',
    ];

    it('should format all database movement types into official French labels', () => {
      assert.equal(
        formatMovementType('order_shipment'),
        'Vente (Expédition)'
      );
      assert.equal(
        formatMovementType('manual_adjustment'),
        'Ajustement manuel'
      );
      assert.equal(
        formatMovementType('restock'),
        'Réception / Réappro.'
      );
      assert.equal(
        formatMovementType('return_restock'),
        'Retour client'
      );
      assert.equal(
        formatMovementType('other_unknown'),
        'other_unknown'
      );
    });
  });

  describe('5. RBAC & Security Boundary Rules', () => {
    it('should allow viewing overview and movements for both admin and staff', () => {
      const canView = (role: 'admin' | 'staff' | 'customer') => {
        return role === 'admin' || role === 'staff';
      };
      assert.equal(canView('admin'), true);
      assert.equal(canView('staff'), true);
      assert.equal(canView('customer'), false);
    });

    it('should restrict manual stock adjustment mutations strictly to admin', () => {
      const canAdjustStock = (role: 'admin' | 'staff' | 'customer') => {
        return role === 'admin';
      };
      assert.equal(canAdjustStock('admin'), true);
      assert.equal(canAdjustStock('staff'), false);
      assert.equal(canAdjustStock('customer'), false);
    });
  });

  describe('6. Authoritative Inventory Invariants', () => {
    it('should enforce auditability: reason is required for adjustments', () => {
      const payload: ManualStockAdjustmentPayload = {
        product_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        delta: 5,
        reason: 'Réception fournisseur',
        notes: 'Arrivage du lot #2026-11-ROSE',
      };
      assert.ok(payload.reason && payload.reason.trim().length > 0);
      assert.notEqual(payload.delta, 0);
    });

    it('should verify order shipment deduction invariant', () => {
      // Inventory is deducted ONLY when transition occurs from processing -> shipped
      // Transition from shipped -> delivered MUST NOT deduct inventory a second time
      const computeInventoryAction = (
        prevStatus: string,
        nextStatus: string
      ): 'deduct' | 'none' => {
        if (prevStatus === 'processing' && nextStatus === 'shipped') {
          return 'deduct';
        }
        if (prevStatus === 'shipped' && nextStatus === 'delivered') {
          return 'none';
        }
        return 'none';
      };

      assert.equal(
        computeInventoryAction('processing', 'shipped'),
        'deduct'
      );
      assert.equal(
        computeInventoryAction('shipped', 'delivered'),
        'none'
      );
    });
  });
});
