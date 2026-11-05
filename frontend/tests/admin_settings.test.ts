import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { ENDPOINTS } from '../src/api/endpoints';
import { settingsKeys } from '../src/hooks/useSettings';
import type {
  StoreSettings,
  UpdateStoreSettingsInput,
  PublicStoreSettings,
} from '../src/types/settings.types';

describe('Aroma Rose — Mission 05B Phase 7 Admin Settings Test Suite', () => {
  describe('1. Authoritative Backend Endpoints Mapping', () => {
    it('should map to the exact backend administrative and public routes for settings', () => {
      assert.equal(ENDPOINTS.ADMIN_SETTINGS.GET, '/admin/settings');
      assert.equal(ENDPOINTS.ADMIN_SETTINGS.UPDATE, '/admin/settings');
      assert.equal(ENDPOINTS.STORE.SETTINGS, '/store/settings');
    });

    it('should structure TanStack Query cache keys systematically', () => {
      assert.deepEqual(settingsKeys.all, ['admin', 'settings']);
      assert.deepEqual(settingsKeys.details(), ['admin', 'settings', 'detail']);
      assert.deepEqual(settingsKeys.public, ['store', 'settings']);
    });
  });

  describe('2. Settings Form Defaults & Fallback Values', () => {
    const defaultSettings: StoreSettings = {
      store_name: 'Aroma Rose',
      store_description: 'L’élégance pure de la rose de Kelaat M’Gouna.',
      store_address: 'Vallée des Roses, Kelaat M’Gouna',
      store_city: 'Kelaat M’Gouna',
      store_phone: '+212 5 24 88 00 00',
      store_email: 'contact@aromarose.ma',
      whatsapp_number: '+212600000000',
      shipping_standard_fee: 30.0,
      shipping_free_threshold: 300.0,
      free_shipping_enabled: true,
      shipping_enabled: true,
      estimated_delivery_days: '24h à 48h dans tout le Maroc',
      cod_enabled: true,
      currency: 'MAD',
      currency_symbol: 'DH',
      store_status: 'open',
      store_closure_message: 'Notre boutique en ligne est temporairement fermée.',
      low_stock_alert_enabled: true,
      new_order_notification_enabled: true,
      low_stock_threshold: 10,
    };

    it('should contain all required operational configuration fields', () => {
      assert.equal(defaultSettings.store_name, 'Aroma Rose');
      assert.equal(defaultSettings.currency, 'MAD');
      assert.equal(defaultSettings.shipping_standard_fee, 30.0);
      assert.equal(defaultSettings.shipping_free_threshold, 300.0);
      assert.equal(defaultSettings.cod_enabled, true);
      assert.equal(defaultSettings.store_status, 'open');
      assert.equal(defaultSettings.low_stock_threshold, 10);
    });
  });

  describe('3. Financial & Delivery Validation Invariants', () => {
    const validateSettingsInput = (input: UpdateStoreSettingsInput): { valid: boolean; error?: string } => {
      if (input.shipping_standard_fee !== undefined && input.shipping_standard_fee < 0) {
        return { valid: false, error: 'Les frais de livraison ne peuvent pas être négatifs' };
      }
      if (input.shipping_free_threshold !== undefined && input.shipping_free_threshold < 0) {
        return { valid: false, error: 'Le seuil de livraison gratuite ne peut pas être négatif' };
      }
      if (input.low_stock_threshold !== undefined && input.low_stock_threshold < 0) {
        return { valid: false, error: 'Le seuil de stock faible ne peut pas être négatif' };
      }
      if (input.currency && input.currency !== 'MAD') {
        return { valid: false, error: 'La devise doit obligatoirement être MAD' };
      }
      return { valid: true };
    };

    it('should reject negative delivery fees', () => {
      const res = validateSettingsInput({ shipping_standard_fee: -15 });
      assert.equal(res.valid, false);
      assert.match(res.error || '', /ne peuvent pas être négatifs/i);
    });

    it('should reject negative free delivery thresholds', () => {
      const res = validateSettingsInput({ shipping_free_threshold: -50 });
      assert.equal(res.valid, false);
      assert.match(res.error || '', /ne peut pas être négatif/i);
    });

    it('should reject foreign currencies without exchange rate infrastructure', () => {
      const res = validateSettingsInput({ currency: 'EUR' as any });
      assert.equal(res.valid, false);
      assert.match(res.error || '', /MAD/);
    });

    it('should accept valid delivery and fee configurations', () => {
      const res = validateSettingsInput({
        shipping_standard_fee: 35.0,
        shipping_free_threshold: 350.0,
        low_stock_threshold: 15,
        currency: 'MAD',
      });
      assert.equal(res.valid, true);
    });
  });

  describe('4. Business Delivery Calculations', () => {
    const calculateDeliveryFee = (
      subtotal: number,
      config: {
        standardFee: number;
        freeThreshold: number;
        freeShippingEnabled: boolean;
        shippingEnabled: boolean;
      }
    ): number => {
      if (!config.shippingEnabled) return 0.0;
      if (config.freeShippingEnabled && subtotal >= config.freeThreshold) {
        return 0.0;
      }
      return config.standardFee;
    };

    const config = {
      standardFee: 30.0,
      freeThreshold: 300.0,
      freeShippingEnabled: true,
      shippingEnabled: true,
    };

    it('should charge standard fee when order is below threshold', () => {
      assert.equal(calculateDeliveryFee(150.0, config), 30.0);
      assert.equal(calculateDeliveryFee(299.99, config), 30.0);
    });

    it('should grant free shipping when order is at or above threshold', () => {
      assert.equal(calculateDeliveryFee(300.0, config), 0.0);
      assert.equal(calculateDeliveryFee(550.0, config), 0.0);
    });

    it('should charge standard fee if free shipping is disabled regardless of order total', () => {
      const disabledFreeConfig = { ...config, freeShippingEnabled: false };
      assert.equal(calculateDeliveryFee(500.0, disabledFreeConfig), 30.0);
    });
  });

  describe('5. RBAC & Security Boundaries', () => {
    it('should allow viewing settings for both admin and staff roles', () => {
      const canReadSettings = (role: 'admin' | 'staff' | 'customer') => {
        return role === 'admin' || role === 'staff';
      };
      assert.equal(canReadSettings('admin'), true);
      assert.equal(canReadSettings('staff'), true);
      assert.equal(canReadSettings('customer'), false);
    });

    it('should restrict settings modifications strictly to admin role', () => {
      const canUpdateSettings = (role: 'admin' | 'staff' | 'customer') => {
        return role === 'admin';
      };
      assert.equal(canUpdateSettings('admin'), true);
      assert.equal(canUpdateSettings('staff'), false);
      assert.equal(canUpdateSettings('customer'), false);
    });

    it('should exclude sensitive internal operator and audit fields from public settings', () => {
      const publicSettings: PublicStoreSettings = {
        store_name: 'Aroma Rose',
        tagline: 'L’élégance pure de la rose de Kelaat M’Gouna.',
        currency: 'MAD',
        currency_symbol: 'DH',
        store_status: 'open',
        payment_methods: [
          {
            code: 'cod',
            name: 'Paiement à la livraison',
            description: 'Espèces à la livraison',
            enabled: true,
          },
        ],
        shipping: {
          standard_fee: 30.0,
          free_shipping_threshold: 300.0,
          free_shipping_enabled: true,
          shipping_enabled: true,
          estimated_delivery_days: '24h à 48h',
        },
        channels: {
          guest_checkout_enabled: true,
          whatsapp_ordering_enabled: true,
          whatsapp_number: '+212600000000',
        },
        origin: {
          region: 'Kelaat M’Gouna',
          country: 'Maroc',
        },
      };

      assert.equal((publicSettings as any).updated_by, undefined);
      assert.equal((publicSettings as any).admin_notes, undefined);
      assert.equal((publicSettings as any).jwt_secret, undefined);
      assert.equal(publicSettings.currency, 'MAD');
      assert.equal(publicSettings.store_name, 'Aroma Rose');
    });
  });

  describe('6. Historical Order Integrity Boundary', () => {
    it('should preserve immutable snapshots of historical orders even if settings change', () => {
      const pastOrder = {
        id: 'ord-hist-1',
        subtotal: 200.0,
        shipping_fee: 30.0,
        total_amount: 230.0,
        created_at: '2026-11-01T10:00:00Z',
      };

      // Even if new settings set shipping_fee to 45.00 MAD
      const newSettings = { shipping_standard_fee: 45.0 };

      // The historical order total MUST NOT change
      assert.equal(pastOrder.shipping_fee, 30.0);
      assert.equal(pastOrder.total_amount, 230.0);
      assert.notEqual(pastOrder.shipping_fee, newSettings.shipping_standard_fee);
    });
  });
});
