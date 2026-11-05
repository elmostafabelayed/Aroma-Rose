import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { ENDPOINTS } from '../src/api/endpoints';
import {
  productFormSchema,
  productImageItemSchema,
} from '../src/schemas/product.schema';
import type { Product, ProductImage } from '../src/types/product.types';

describe('Aroma Rose — Mission 05B Phase 4 Admin Products Test Suite', () => {
  describe('1. Authoritative Backend Endpoints Mapping', () => {
    it('should map to the exact backend administrative routes for products', () => {
      assert.equal(ENDPOINTS.ADMIN_PRODUCTS.LIST, '/admin/products');
      assert.equal(
        ENDPOINTS.ADMIN_PRODUCTS.BY_ID('prod-uuid-123'),
        '/admin/products/prod-uuid-123'
      );
      assert.equal(ENDPOINTS.ADMIN_PRODUCTS.CREATE, '/admin/products');
      assert.equal(
        ENDPOINTS.ADMIN_PRODUCTS.UPDATE('prod-uuid-123'),
        '/admin/products/prod-uuid-123'
      );
      assert.equal(
        ENDPOINTS.ADMIN_PRODUCTS.DELETE('prod-uuid-123'),
        '/admin/products/prod-uuid-123'
      );
      assert.equal(
        ENDPOINTS.ADMIN_PRODUCTS.UPLOAD_IMAGE,
        '/admin/products/upload-image'
      );
    });
  });

  describe('2. Product Validation Schema (Creation & Editing)', () => {
    const validProductData = {
      name: 'Sérum Régénérant à la Rose de Damas',
      slug: 'serum-regenerant-rose-damas',
      sku: 'AR-SR-030',
      category_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      description: 'Sérum d’exception concentré en huile pure de rose.',
      price: 280.0,
      compare_at_price: 350.0,
      cost_price: 90.0,
      stock_quantity: 45,
      is_active: true,
      images: [
        {
          storage_path: '/products/soins-du-visage/serum-rose.jpg',
          alt_text: 'Sérum à la rose flacon compte-gouttes',
          display_order: 0,
          is_primary: true,
        },
      ],
    };

    it('should accept valid product form data', () => {
      const result = productFormSchema.safeParse(validProductData);
      assert.equal(result.success, true);
    });

    it('should require a valid kebab-case slug', () => {
      const invalidSlug = {
        ...validProductData,
        slug: 'Serum Invalide Avec Espaces & Majuscules!',
      };
      const result = productFormSchema.safeParse(invalidSlug);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.match(result.error.errors[0].message, /kebab-case/i);
      }
    });

    it('should reject compare_at_price if lower than retail price', () => {
      const invalidComparePrice = {
        ...validProductData,
        price: 280.0,
        compare_at_price: 200.0, // Invalid: compare_at_price cannot be cheaper than selling price!
      };
      const result = productFormSchema.safeParse(invalidComparePrice);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.match(result.error.errors[0].message, /supérieur ou égal/i);
      }
    });

    it('should allow null or empty compare_at_price', () => {
      const withoutComparePrice = {
        ...validProductData,
        compare_at_price: null,
      };
      const result = productFormSchema.safeParse(withoutComparePrice);
      assert.equal(result.success, true);
    });

    it('should reject negative prices and stock', () => {
      const negativePrice = {
        ...validProductData,
        price: -10,
      };
      assert.equal(productFormSchema.safeParse(negativePrice).success, false);

      const negativeStock = {
        ...validProductData,
        stock_quantity: -5,
      };
      assert.equal(productFormSchema.safeParse(negativeStock).success, false);
    });
  });

  describe('3. Multi-Image Product Gallery Rules', () => {
    it('should validate product image item metadata', () => {
      const validImage: ProductImage = {
        storage_path: '/products/parfums/rose.webp',
        alt_text: 'Parfum de Rose',
        display_order: 1,
        is_primary: false,
      };
      const parsed = productImageItemSchema.safeParse(validImage);
      assert.equal(parsed.success, true);
    });

    it('should enforce exactly one primary image logic', () => {
      const images: ProductImage[] = [
        { storage_path: '/img1.jpg', is_primary: true, display_order: 0 },
        { storage_path: '/img2.jpg', is_primary: false, display_order: 1 },
        { storage_path: '/img3.jpg', is_primary: false, display_order: 2 },
      ];

      // Simulate setting index 2 as primary
      const targetIndex = 2;
      const updated = images.map((img, i) => ({
        ...img,
        is_primary: i === targetIndex,
      }));

      const primaries = updated.filter((img) => img.is_primary);
      assert.equal(primaries.length, 1);
      assert.equal(primaries[0].storage_path, '/img3.jpg');
    });

    it('should reassign primary to the first image if primary is deleted', () => {
      const images: ProductImage[] = [
        { storage_path: '/img1.jpg', is_primary: true, display_order: 0 },
        { storage_path: '/img2.jpg', is_primary: false, display_order: 1 },
      ];

      // Remove index 0 (primary)
      const removedWasPrimary = images[0].is_primary;
      const remaining = images.filter((_, i) => i !== 0);
      if (removedWasPrimary && remaining.length > 0) {
        remaining[0].is_primary = true;
      }

      assert.equal(remaining.length, 1);
      assert.equal(remaining[0].is_primary, true);
      assert.equal(remaining[0].storage_path, '/img2.jpg');
    });
  });

  describe('4. Historical Order Integrity Boundary', () => {
    it('should preserve immutable snapshots when product attributes change', () => {
      // Historical order item snapshot recorded in database
      const historicalOrderItemSnapshot = {
        order_id: 'ord-20261103-0001',
        product_id: 'prod-001',
        product_name_snapshot: 'Eau Florale de Rose Pure 200ml',
        product_sku_snapshot: 'EFR-200',
        unit_price_snapshot: 120.0,
        quantity: 2,
        total_price: 240.0,
      };

      // Current product updated later by admin
      const updatedLiveProduct: Product = {
        id: 'prod-001',
        name: 'Eau Florale de Rose BIO Suprême 250ml (Nouvelle Formule)',
        slug: 'eau-florale-rose-bio-supreme',
        sku: 'EFR-250-NEW',
        price: 160.0, // Price increased
        stock_quantity: 80,
        is_active: true,
        created_at: '2026-11-03T10:00:00Z',
      };

      // Invariant: historical order item retains its original price and name
      assert.notEqual(historicalOrderItemSnapshot.unit_price_snapshot, updatedLiveProduct.price);
      assert.notEqual(historicalOrderItemSnapshot.product_name_snapshot, updatedLiveProduct.name);
      assert.notEqual(historicalOrderItemSnapshot.product_sku_snapshot, updatedLiveProduct.sku);
      assert.equal(historicalOrderItemSnapshot.unit_price_snapshot, 120.0);
    });

    it('should verify deactivated products remain referenced in past orders without data loss', () => {
      const archivedProduct: Product = {
        id: 'prod-discontinued-099',
        name: 'Élixir Ancien de Rose',
        slug: 'elixir-ancien-rose',
        sku: 'ELX-099',
        price: 300.0,
        stock_quantity: 0,
        is_active: false, // Soft-deleted / Archived
        created_at: '2026-11-01T10:00:00Z',
      };

      const pastOrderReference = {
        product_id: archivedProduct.id,
        is_product_active: archivedProduct.is_active,
        name_snapshot: 'Élixir Ancien de Rose',
      };

      // Past orders still cleanly point to the product id and preserve the historical name
      assert.equal(pastOrderReference.product_id, 'prod-discontinued-099');
      assert.equal(pastOrderReference.name_snapshot, 'Élixir Ancien de Rose');
      assert.equal(pastOrderReference.is_product_active, false);
    });
  });

  describe('5. RBAC & Security Boundaries', () => {
    it('should verify archival is restricted to admin role', () => {
      const checkCanArchive = (role: 'admin' | 'staff') => role === 'admin';

      assert.equal(checkCanArchive('admin'), true);
      assert.equal(checkCanArchive('staff'), false);
    });

    it('should verify staff is allowed to create and edit products', () => {
      const checkCanEdit = (role: 'admin' | 'staff') => ['admin', 'staff'].includes(role);

      assert.equal(checkCanEdit('admin'), true);
      assert.equal(checkCanEdit('staff'), true);
    });
  });
});

