import type { Product } from './product.types';

/**
 * Strict localStorage Cart Item representation:
 * NEVER store or trust prices, discounts, shipping fees, or totals in client storage!
 */
export interface StoredCartItem {
  productId: string;
  quantity: number;
}

/**
 * In-memory hydrated cart item matching stored item to live backend catalog
 */
export interface HydratedCartItem {
  productId: string;
  quantity: number;
  product?: Product;
  isAvailable: boolean;
  isOutOfStock: boolean;
  maxAvailableQuantity: number;
}

export interface CartContextType {
  items: HydratedCartItem[];
  storedItems: StoredCartItem[];
  totalItems: number;
  subtotal: number;
  isLoading: boolean;
  hasUnavailableItems: boolean;
  addItem: (productId: string, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  refreshCart: () => Promise<void>;
}
