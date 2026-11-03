import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { productsApi } from '../api/products.api';
import type { StoredCartItem, HydratedCartItem, CartContextType } from '../types/cart.types';
import type { Product } from '../types/product.types';

const CART_STORAGE_KEY = 'aroma_rose_cart';

const CartContext = createContext<CartContextType | undefined>(undefined);

function getSafeStoredCart(): StoredCartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
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
    // Graceful recovery from corrupt client storage
    return [];
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storedItems, setStoredItems] = useState<StoredCartItem[]>(getSafeStoredCart);
  const [catalogMap, setCatalogMap] = useState<Record<string, Product>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync to localStorage whenever storedItems changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(storedItems));
    } catch {
      // Storage quota or private mode protection
    }
  }, [storedItems]);

  // Rehydrate cart items by fetching live catalog data from backend
  const refreshCart = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch up to 100 active products to hydrate client cart
      const { products } = await productsApi.getPublicProducts({ limit: 100 });
      const map: Record<string, Product> = {};
      products.forEach((p) => {
        map[p.id] = p;
      });
      setCatalogMap(map);
    } catch {
      // Offline fallback: keep existing catalogMap
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Compute hydrated items from stored IDs and live catalog map
  const items: HydratedCartItem[] = useMemo(() => {
    return storedItems.map((stored) => {
      const product = catalogMap[stored.productId];
      const isAvailable = Boolean(product && product.is_active);
      const isOutOfStock = !product || product.stock_quantity <= 0;
      const maxAvailableQuantity = product ? product.stock_quantity : 0;

      return {
        productId: stored.productId,
        quantity: stored.quantity,
        product,
        isAvailable,
        isOutOfStock,
        maxAvailableQuantity,
      };
    });
  }, [storedItems, catalogMap]);

  const hasUnavailableItems = useMemo(() => {
    return items.some((item) => !item.isAvailable || item.isOutOfStock);
  }, [items]);

  const totalItems = useMemo(() => {
    return storedItems.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [storedItems]);

  // Client-side preview subtotal (Note: Server recalculates authoritative price on checkout!)
  const subtotal = useMemo(() => {
    return items.reduce((acc, curr) => {
      if (!curr.product || !curr.isAvailable || curr.isOutOfStock) return acc;
      const price = Number(curr.product.price) || 0;
      return acc + price * curr.quantity;
    }, 0);
  }, [items]);

  const addItem = useCallback((productId: string, quantity: number = 1) => {
    const qty = Math.max(1, Math.floor(quantity));
    setStoredItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.productId === productId);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + qty,
        };
        return next;
      }
      return [...prev, { productId, quantity: qty }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const qty = Math.floor(quantity);
    if (qty <= 0) {
      setStoredItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setStoredItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setStoredItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setStoredItems([]);
  }, []);

  const getItemQuantity = useCallback(
    (productId: string) => {
      const match = storedItems.find((i) => i.productId === productId);
      return match ? match.quantity : 0;
    },
    [storedItems]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        storedItems,
        totalItems,
        subtotal,
        isLoading,
        hasUnavailableItems,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        getItemQuantity,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
