/**
 * Authoritative Backend API Endpoint Definitions
 * Exact mapping to /api/v1 routes
 */

export const ENDPOINTS = {
  // Public Storefront Endpoints
  STORE: {
    SETTINGS: '/store/settings',
  },
  PUBLIC_PRODUCTS: {
    LIST: '/products',
    BY_SLUG: (slug: string) => `/products/${slug}`,
  },
  PUBLIC_CATEGORIES: {
    LIST: '/categories',
  },
  PUBLIC_ORDERS: {
    GUEST_CHECKOUT: '/orders',
  },

  // Admin & Staff Endpoints
  AUTH: {
    LOGIN: '/admin/auth/login',
    LOGOUT: '/admin/auth/logout',
    ME: '/admin/auth/me',
  },
  ADMIN_PRODUCTS: {
    LIST: '/admin/products',
    BY_ID: (id: string) => `/admin/products/${id}`,
    CREATE: '/admin/products',
    UPDATE: (id: string) => `/admin/products/${id}`,
    DELETE: (id: string) => `/admin/products/${id}`,
    UPLOAD_IMAGE: '/admin/products/upload-image',
  },
  ADMIN_ORDERS: {
    LIST: '/admin/orders',
    BY_ID: (id: string) => `/admin/orders/${id}`,
    CREATE_WHATSAPP: '/admin/orders',
    UPDATE_STATUS: (id: string) => `/admin/orders/${id}/status`,
    RECONCILE_PAYMENT: (id: string) => `/admin/orders/${id}/reconcile-payment`,
    UPDATE_NOTES: (id: string) => `/admin/orders/${id}/notes`,
    HISTORY: (id: string) => `/admin/orders/${id}/history`,
  },
  ADMIN_CUSTOMERS: {
    LIST: '/admin/customers',
    BY_ID: (id: string) => `/admin/customers/${id}`,
    ORDERS: (id: string) => `/admin/customers/${id}/orders`,
  },
  ADMIN_INVENTORY: {
    OVERVIEW: '/admin/inventory',
    MOVEMENTS: '/admin/inventory/movements',
    ADJUSTMENTS: '/admin/inventory/adjustments',
  },
  ADMIN_DASHBOARD: {
    SUMMARY: '/admin/dashboard/summary',
    SALES: (days: number = 30) => `/admin/dashboard/sales?days=${days}`,
    ORDERS: '/admin/dashboard/orders',
    INVENTORY: '/admin/dashboard/inventory',
  },
  ADMIN_SETTINGS: {
    GET: '/admin/settings',
    UPDATE: '/admin/settings',
  },
  ADMIN_REPORTS: {
    SUMMARY: '/admin/reports/summary',
    SALES: '/admin/reports/sales',
    ORDERS: '/admin/reports/orders',
    PRODUCTS: '/admin/reports/products',
    CATEGORIES: '/admin/reports/categories',
    COLLECTIONS: '/admin/reports/collections',
    CUSTOMERS: '/admin/reports/customers',
    DELIVERY: '/admin/reports/delivery',
    EXPORT: '/admin/reports/export',
  },
} as const;

