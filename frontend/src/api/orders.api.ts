import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import type { Order, GuestCheckoutPayload, OrderStatus } from '../types/order.types';
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
   * Fetch admin orders list
   */
  async getAdminOrders(params?: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    search?: string;
  }): Promise<{ orders: Order[]; meta?: PaginatedMeta }> {
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
};

