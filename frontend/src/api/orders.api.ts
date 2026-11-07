import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import type {
  Order,
  GuestCheckoutPayload,
  AdminWhatsAppOrderPayload,
  AdminOrderQueryParams,
  OrderStatus,
  OrderStatusHistoryItem,
} from '../types/order.types';
import type { PaginatedMeta } from '../types/api.types';

export const ordersApi = {
  /**
   * Submit guest checkout order (Public)
   */
  async createGuestOrder(payload: GuestCheckoutPayload): Promise<Order> {
    const res = await apiClient.post<Order>(ENDPOINTS.PUBLIC_ORDERS.GUEST_CHECKOUT, payload);
    return res.data;
  },

  /**
   * Create admin WhatsApp order
   */
  async createAdminWhatsAppOrder(payload: AdminWhatsAppOrderPayload): Promise<Order> {
    const res = await apiClient.post<Order>(ENDPOINTS.ADMIN_ORDERS.CREATE_WHATSAPP, payload);
    return res.data;
  },

  /**
   * Fetch admin orders list with filters and pagination
   */
  async getAdminOrders(params?: AdminOrderQueryParams): Promise<{ orders: Order[]; meta?: PaginatedMeta }> {
    const res = await apiClient.get<Order[]>(
      ENDPOINTS.ADMIN_ORDERS.LIST,
      params as Record<string, string | number | undefined>
    );
    return {
      orders: res.data || [],
      meta: res.meta,
    };
  },

  /**
   * Fetch single order details by ID
   */
  async getAdminOrderById(id: string): Promise<Order> {
    const res = await apiClient.get<Order>(ENDPOINTS.ADMIN_ORDERS.BY_ID(id));
    return res.data;
  },

  /**
   * Update order status lifecycle transition
   */
  async updateOrderStatus(id: string, status: OrderStatus, notes?: string): Promise<Order> {
    const res = await apiClient.patch<Order>(ENDPOINTS.ADMIN_ORDERS.UPDATE_STATUS(id), {
      status,
      notes,
    });
    return res.data;
  },

  /**
   * Admin only: Reconcile COD Payment
   * Explicitly marks COD payment as collected/paid after courier cash remittance.
   */
  async reconcileCodPayment(id: string, notes?: string): Promise<Order> {
    const res = await apiClient.post<Order>(ENDPOINTS.ADMIN_ORDERS.RECONCILE_PAYMENT(id), {
      notes,
    });
    return res.data;
  },

  /**
   * Update order internal admin notes
   */
  async updateOrderNotes(id: string, admin_notes: string): Promise<Order> {
    const res = await apiClient.patch<Order>(ENDPOINTS.ADMIN_ORDERS.UPDATE_NOTES(id), {
      admin_notes,
    });
    return res.data;
  },

  /**
   * Fetch order status audit history trail
   */
  async getOrderStatusHistory(id: string): Promise<OrderStatusHistoryItem[]> {
    const res = await apiClient.get<OrderStatusHistoryItem[]>(ENDPOINTS.ADMIN_ORDERS.HISTORY(id));
    return res.data || [];
  },
};
