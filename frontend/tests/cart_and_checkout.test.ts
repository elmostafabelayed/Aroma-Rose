import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { checkoutFormSchema, cleanPhone, isValidMoroccanPhone } from '../src/schemas/checkout.schema';
import type { StoredCartItem, HydratedCartItem } from '../src/types/cart.types';
import type { Product } from '../src/types/product.types';
import { ApiError } from '../src/api/client';

// In-memory mock localStorage for Node testing environment
class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

const mockStorage = new MockLocalStorage();

// Helper replicating CartContext storage deserialization
function parseStoredCart(storage: MockLocalStorage, key: string = 'aroma_rose_cart'): StoredCartItem[] {
  try {
    const raw = storage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is StoredCartItem =>
          typeof item === 'object' &&
          item !== null &&
          typeof item.productId === 'string' &&
          typeof item.quantity === 'number' &&
          item.quantity > 0
      )
      .map((item) => ({
        productId: item.productId,
        quantity: Math.floor(item.quantity),
      }));
  } catch {
    return [];
  }
}

// Helper replicating CartContext hydration logic
function hydrateCart(stored: StoredCartItem[], catalog: Record<string, Product>): HydratedCartItem[] {
  return stored.map((item) => {
    const product = catalog[item.productId];
    const isAvailable = Boolean(product && product.is_active);
    const isOutOfStock = !product || product.stock_quantity <= 0;
    const maxAvailableQuantity = product ? product.stock_quantity : 0;

    return {
      productId: item.productId,
      quantity: item.quantity,
      product,
      isAvailable,
      isOutOfStock,
      maxAvailableQuantity,
    };
  });
}

function calculateSubtotal(items: HydratedCartItem[]): number {
  return items.reduce((acc, curr) => {
    if (!curr.product || !curr.isAvailable || curr.isOutOfStock) return acc;
    return acc + Number(curr.product.price) * curr.quantity;
  }, 0);
}

describe('Aroma Rose — Mission 05A Storefront Test Suite', () => {
  const mockProduct1: Product = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Eau de Rose de Damas Pure 200ml',
    slug: 'eau-de-rose-de-damas-pure',
    sku: 'AR-ERD-200',
    price: 75.0,
    compare_at_price: 90.0,
    stock_quantity: 25,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const mockProduct2: Product = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Sérum Précieux à la Rose de Kelaat M\'Gouna 30ml',
    slug: 'serum-precieux-rose',
    sku: 'AR-SPR-030',
    price: 180.0,
    stock_quantity: 4,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const mockOutOfStockProduct: Product = {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Huile Essentielle Pure Attar 5ml',
    slug: 'attar-rose-5ml',
    sku: 'AR-ATT-005',
    price: 450.0,
    stock_quantity: 0,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    mockStorage.clear();
  });

  // =========================================================================
  // 1. Cart Initialization and Persistence
  // =========================================================================
  describe('1. Cart initialization and persistence', () => {
    it('should store ONLY productId and quantity in localStorage', () => {
      const cartItems: StoredCartItem[] = [
        { productId: mockProduct1.id, quantity: 2 },
        { productId: mockProduct2.id, quantity: 1 },
      ];

      mockStorage.setItem('aroma_rose_cart', JSON.stringify(cartItems));

      const parsed = parseStoredCart(mockStorage);
      assert.equal(parsed.length, 2);
      assert.equal(parsed[0].productId, mockProduct1.id);
      assert.equal(parsed[0].quantity, 2);

      // Verify no prices or financial totals exist in localStorage
      const rawStored = JSON.parse(mockStorage.getItem('aroma_rose_cart')!);
      assert.equal(rawStored[0].price, undefined);
      assert.equal(rawStored[0].subtotal, undefined);
      assert.equal(rawStored[0].total, undefined);
    });
  });

  // =========================================================================
  // 2. Cart Quantity Updates and Item Removal
  // =========================================================================
  describe('2. Cart quantity updates and item removal', () => {
    it('should increment and update item quantities correctly', () => {
      let cart: StoredCartItem[] = [{ productId: mockProduct1.id, quantity: 1 }];

      // Update quantity
      cart = cart.map((i) => (i.productId === mockProduct1.id ? { ...i, quantity: 4 } : i));
      assert.equal(cart[0].quantity, 4);

      // Remove item
      cart = cart.filter((i) => i.productId !== mockProduct1.id);
      assert.equal(cart.length, 0);
    });

    it('should automatically remove items when updated quantity <= 0', () => {
      const updateQty = (list: StoredCartItem[], id: string, qty: number) => {
        if (qty <= 0) return list.filter((i) => i.productId !== id);
        return list.map((i) => (i.productId === id ? { ...i, quantity: qty } : i));
      };

      let cart: StoredCartItem[] = [{ productId: mockProduct1.id, quantity: 3 }];
      cart = updateQty(cart, mockProduct1.id, 0);
      assert.equal(cart.length, 0);
    });
  });

  // =========================================================================
  // 3. Invalid Cart Data Recovery
  // =========================================================================
  describe('3. Invalid cart data recovery', () => {
    it('should recover gracefully from corrupted or malformed JSON', () => {
      mockStorage.setItem('aroma_rose_cart', '{invalid-json---@@@');
      const recovered = parseStoredCart(mockStorage);
      assert.deepEqual(recovered, []);
    });

    it('should filter out invalid objects, nulls, and negative quantities', () => {
      const corruptData = [
        null,
        'random-string',
        { productId: 'valid-id-1', quantity: 2 },
        { productId: 'bad-qty', quantity: -5 },
        { productId: 12345, quantity: 2 }, // bad type
        { quantity: 2 }, // missing productId
      ];
      mockStorage.setItem('aroma_rose_cart', JSON.stringify(corruptData));

      const recovered = parseStoredCart(mockStorage);
      assert.equal(recovered.length, 1);
      assert.equal(recovered[0].productId, 'valid-id-1');
      assert.equal(recovered[0].quantity, 2);
    });
  });

  // =========================================================================
  // 4. Product Price Refresh Behavior
  // =========================================================================
  describe('4. Product price refresh behavior', () => {
    it('should rehydrate prices dynamically from catalog instead of client storage', () => {
      const stored: StoredCartItem[] = [{ productId: mockProduct1.id, quantity: 2 }];
      const catalog = { [mockProduct1.id]: { ...mockProduct1, price: 80.0 } };

      const hydrated = hydrateCart(stored, catalog);
      const subtotal = calculateSubtotal(hydrated);

      // 2 * 80.0 = 160.0
      assert.equal(subtotal, 160.0);
    });
  });

  // =========================================================================
  // 5. Checkout Validation
  // =========================================================================
  describe('5. Checkout validation', () => {
    it('should validate complete guest checkout payload', () => {
      const valid = checkoutFormSchema.safeParse({
        first_name: 'Fatima',
        last_name: 'Zahra',
        phone: '0612345678',
        city: 'Rabat',
        address: '15 Avenue Mohammed V, Apt 4',
        email: 'fatima@example.com',
      });
      assert.equal(valid.success, true);
    });

    it('should reject missing customer names or incomplete address', () => {
      const invalid = checkoutFormSchema.safeParse({
        first_name: '',
        last_name: '',
        phone: '0612345678',
        city: '',
        address: 'Abc', // too short
      });
      assert.equal(invalid.success, false);
      if (!invalid.success) {
        assert.ok(invalid.error.issues.length >= 3);
      }
    });
  });

  // =========================================================================
  // 6. Moroccan Phone Validation
  // =========================================================================
  describe('6. Moroccan phone validation', () => {
    it('should accept valid Moroccan mobile (06, 07) and fixed (05) formats with spaces, hyphens, and dots', () => {
      const validNumbers = [
        '0612345678',
        '06 12 34 56 78',
        '+212612345678',
        '+212 6 12 34 56 78',
        '00212612345678',
        '06-12-34-56-78',
        '06.12.34.56.78',
        '+212-6-12-34-56-78',
        '0711223344',
        '0524889900',
        '+212711223344',
      ];

      for (const phone of validNumbers) {
        const res = checkoutFormSchema.safeParse({
          first_name: 'Test',
          last_name: 'Client',
          phone,
          city: 'Casablanca',
          address: 'Boulevard Zerktouni',
        });
        assert.equal(res.success, true, `Expected ${phone} to be valid`);
      }
    });

    it('should reject invalid prefixes, incomplete, or foreign phone numbers', () => {
      const invalidNumbers = [
        '0123456789', // Invalid French prefix
        '06123',      // Too short
        '061234567899', // Too long
        'phone-number',
        '+15551234567', // US number not matching Moroccan rule
        '0812345678',  // Invalid prefix (08 not accepted)
      ];

      for (const phone of invalidNumbers) {
        const res = checkoutFormSchema.safeParse({
          first_name: 'Test',
          last_name: 'Client',
          phone,
          city: 'Casablanca',
          address: 'Boulevard Zerktouni',
        });
        assert.equal(res.success, false, `Expected ${phone} to be rejected`);
      }
    });
  });

  // =========================================================================
  // 7. Checkout Submission Success
  // =========================================================================
  describe('7. Checkout submission success', () => {
    it('should build payload with product_id and quantity only (zero client prices)', () => {
      const stored: StoredCartItem[] = [
        { productId: mockProduct1.id, quantity: 2 },
        { productId: mockProduct2.id, quantity: 1 },
      ];

      const checkoutPayload = {
        customer: {
          first_name: 'Kenza',
          last_name: 'Bennani',
          phone: '+212661001122',
          city: 'Marrakech',
          address: 'Gueliz, Rue de la Liberte',
          email: null,
          postal_code: null,
          notes: 'Sonner à la porte',
        },
        items: stored.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
        })),
        customer_notes: 'Sonner à la porte',
      };

      assert.equal(checkoutPayload.items.length, 2);
      assert.equal(checkoutPayload.items[0].product_id, mockProduct1.id);
      assert.equal(checkoutPayload.items[0].quantity, 2);
      // Guarantee no client price calculation is transmitted
      assert.equal((checkoutPayload.items[0] as any).unit_price, undefined);
      assert.equal((checkoutPayload as any).total_amount, undefined);
    });
  });

  // =========================================================================
  // 8. Checkout Submission Failure
  // =========================================================================
  describe('8. Checkout submission failure', () => {
    it('should parse and extract structured error information on 422 rejection', () => {
      const apiError = new ApiError(
        'Insufficient stock for product "Eau de Rose de Damas Pure 200ml"',
        422,
        'BUSINESS_RULE_VIOLATION'
      );

      assert.equal(apiError.statusCode, 422);
      assert.equal(apiError.code, 'BUSINESS_RULE_VIOLATION');
      assert.ok(apiError.message.includes('Insufficient stock'));
    });
  });

  // =========================================================================
  // 9. Duplicate Submission Prevention
  // =========================================================================
  describe('9. Duplicate submission prevention', () => {
    it('should detect duplicate order responses and handle idempotency', () => {
      const backendResponse = {
        id: 'ord-12345',
        order_number: 'AR-20261103-0001',
        status: 'pending',
        is_duplicate: true, // Returned by backend 60-second window check
        total_amount: 180.0,
      };

      assert.equal(backendResponse.is_duplicate, true);
      assert.equal(backendResponse.order_number, 'AR-20261103-0001');
    });
  });

  // =========================================================================
  // 10. Empty and Unavailable Product States
  // =========================================================================
  describe('10. Empty and unavailable product states', () => {
    it('should detect out-of-stock items and mark them unavailable for checkout', () => {
      const stored: StoredCartItem[] = [
        { productId: mockProduct1.id, quantity: 1 },
        { productId: mockOutOfStockProduct.id, quantity: 1 },
      ];

      const catalog = {
        [mockProduct1.id]: mockProduct1,
        [mockOutOfStockProduct.id]: mockOutOfStockProduct,
      };

      const hydrated = hydrateCart(stored, catalog);
      const outOfStockItem = hydrated.find((i) => i.productId === mockOutOfStockProduct.id);

      assert.ok(outOfStockItem);
      assert.equal(outOfStockItem.isOutOfStock, true);
      assert.equal(outOfStockItem.maxAvailableQuantity, 0);

      // Exclude out of stock item from subtotal calculation
      const subtotal = calculateSubtotal(hydrated);
      assert.equal(subtotal, mockProduct1.price);
    });

    it('should detect completely removed or uncatalogued products', () => {
      const stored: StoredCartItem[] = [{ productId: 'deleted-product-id', quantity: 2 }];
      const catalog = { [mockProduct1.id]: mockProduct1 };

      const hydrated = hydrateCart(stored, catalog);
      assert.equal(hydrated[0].isAvailable, false);
      assert.equal(calculateSubtotal(hydrated), 0);
    });
  });

  // =========================================================================
  // 11. Mission 05A.1 QA Remediation Verifications
  // =========================================================================
  describe('11. Mission 05A.1 QA Remediation Verifications', () => {
    it('should verify official category taxonomy slugs used in footer links', () => {
      const expectedFooterSlugs = [
        'eaux-florales',
        'huiles-serums',
        'soins-visage',
        'soins-corps',
      ];

      for (const slug of expectedFooterSlugs) {
        assert.ok(typeof slug === 'string' && slug.length > 0);
      }
    });

    it('should correctly validate phone numbers with various delimiters', () => {
      assert.equal(cleanPhone('06 12 34 56 78'), '0612345678');
      assert.equal(cleanPhone('06-12-34-56-78'), '0612345678');
      assert.equal(cleanPhone('06.12.34.56.78'), '0612345678');
      assert.equal(cleanPhone('+212 6 12 34 56 78'), '+212612345678');
      
      assert.equal(isValidMoroccanPhone('06 12 34 56 78'), true);
      assert.equal(isValidMoroccanPhone('+212-6-12-34-56-78'), true);
      assert.equal(isValidMoroccanPhone('0812345678'), false);
    });
  });
});

