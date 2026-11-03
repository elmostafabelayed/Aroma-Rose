import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { BRAND_COLORS, TYPOGRAPHY, LAYOUT } from '../src/styles/tokens';
import { formatMAD, formatPhoneDisplay } from '../src/utils/formatters';
import { loginFormSchema } from '../src/schemas/auth.schema';
import { checkoutFormSchema } from '../src/schemas/checkout.schema';
import { ENDPOINTS } from '../src/api/endpoints';

describe('Aroma Rose Frontend Foundation — Mission 04 Test Suite', () => {
  describe('1. Brand Design System Tokens', () => {
    it('should match the exact authoritative brand color palette', () => {
      assert.equal(BRAND_COLORS.primaryBurgundy, '#6B1838');
      assert.equal(BRAND_COLORS.petalRose, '#D98CA5');
      assert.equal(BRAND_COLORS.moroccanSand, '#E9DDCA');
      assert.equal(BRAND_COLORS.deepCharcoalMauve, '#292329');
      assert.equal(BRAND_COLORS.deepBurgundy, '#3B1025');
      assert.equal(BRAND_COLORS.warmCanvas, '#FAF7F2');
      assert.equal(BRAND_COLORS.softRose, '#F5E7EC');
      assert.equal(BRAND_COLORS.sandBorder, '#E2D3BE');
      assert.equal(BRAND_COLORS.white, '#FFFFFF');
    });

    it('should enforce editorial typography and letter spacing', () => {
      assert.ok(TYPOGRAPHY.fonts.editorialSerif.includes('Playfair Display'));
      assert.ok(TYPOGRAPHY.fonts.sansInterface.includes('Plus Jakarta Sans'));
      assert.equal(TYPOGRAPHY.letterSpacing.editorialLabel, '0.14em');
      assert.equal(TYPOGRAPHY.letterSpacing.editorialWidest, '0.20em');
    });

    it('should define the responsive grid layouts according to specification', () => {
      assert.equal(LAYOUT.maxWidth, '1440px');
      assert.equal(LAYOUT.borderRadius, '4px');
      assert.equal(LAYOUT.grid.desktop.columns, 12);
      assert.equal(LAYOUT.grid.desktop.gutters, '24px');
      assert.equal(LAYOUT.grid.desktop.margin, '64px');
      assert.equal(LAYOUT.grid.tablet.columns, 8);
      assert.equal(LAYOUT.grid.tablet.gutters, '20px');
      assert.equal(LAYOUT.grid.tablet.margin, '32px');
      assert.equal(LAYOUT.grid.mobile.columns, 4);
      assert.equal(LAYOUT.grid.mobile.gutters, '16px');
      assert.equal(LAYOUT.grid.mobile.margin, '20px');
    });
  });

  describe('2. Luxury Formatters', () => {
    it('should format Moroccan Dirhams (MAD) with 2 decimals', () => {
      assert.equal(formatMAD(150), '150.00 MAD');
      assert.equal(formatMAD('75.5'), '75.50 MAD');
      assert.equal(formatMAD(0), '0.00 MAD');
      assert.equal(formatMAD(null), '0.00 MAD');
    });

    it('should format Moroccan phone numbers for clean editorial display', () => {
      assert.equal(formatPhoneDisplay('+212612345678'), '+212 6 12 34 56 78');
      assert.equal(formatPhoneDisplay('0612345678'), '0612345678');
    });
  });

  describe('3. Form Validation Schemas', () => {
    it('should validate valid admin login credentials', () => {
      const valid = loginFormSchema.safeParse({
        email: 'admin@aromarose.ma',
        password: 'Password123!',
      });
      assert.equal(valid.success, true);
    });

    it('should reject invalid login credentials', () => {
      const invalidEmail = loginFormSchema.safeParse({
        email: 'invalid-email',
        password: '123',
      });
      assert.equal(invalidEmail.success, false);
      if (!invalidEmail.success) {
        assert.ok(invalidEmail.error.issues.length >= 2);
      }
    });

    it('should validate Moroccan phone formats in guest checkout schema', () => {
      const validCheckout = checkoutFormSchema.safeParse({
        first_name: 'Fatima',
        last_name: 'Zahra',
        phone: '0612345678',
        city: 'Marrakech',
        address: '14 Rue de la Koutoubia',
      });
      assert.equal(validCheckout.success, true);

      const validWithPlus = checkoutFormSchema.safeParse({
        first_name: 'Amine',
        last_name: 'El Mansouri',
        phone: '+212699887766',
        city: 'Casablanca',
        address: 'Bld d Anfa',
      });
      assert.equal(validWithPlus.success, true);
    });

    it('should reject invalid phone numbers in guest checkout schema', () => {
      const invalidPhone = checkoutFormSchema.safeParse({
        first_name: 'Fatima',
        last_name: 'Zahra',
        phone: '12345',
        city: 'Marrakech',
        address: '14 Rue de la Koutoubia',
      });
      assert.equal(invalidPhone.success, false);
    });
  });

  describe('4. API Endpoints Alignment with Backend', () => {
    it('should accurately match backend route paths', () => {
      assert.equal(ENDPOINTS.STORE.SETTINGS, '/store/settings');
      assert.equal(ENDPOINTS.PUBLIC_PRODUCTS.LIST, '/products');
      assert.equal(ENDPOINTS.PUBLIC_PRODUCTS.BY_SLUG('eau-de-rose'), '/products/eau-de-rose');
      assert.equal(ENDPOINTS.PUBLIC_CATEGORIES.LIST, '/categories');
      assert.equal(ENDPOINTS.PUBLIC_ORDERS.GUEST_CHECKOUT, '/orders');
      assert.equal(ENDPOINTS.AUTH.LOGIN, '/admin/auth/login');
      assert.equal(ENDPOINTS.AUTH.LOGOUT, '/admin/auth/logout');
      assert.equal(ENDPOINTS.AUTH.ME, '/admin/auth/me');
      assert.equal(ENDPOINTS.ADMIN_DASHBOARD.SUMMARY, '/admin/dashboard/summary');
    });
  });
});
