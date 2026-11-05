import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../api/orders.api';
import type { OrderStatus } from '../types/order.types';

export const adminOrdersKeys = {
  all: ['admin', 'orders'] as const,
  list: (params?: { page?: number; limit?: number; status?: OrderStatus; search?: string }) =>
    [...adminOrdersKeys.all, 'list', params] as const,
};

export function useAdminOrders(params?: {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
}) {
  return useQuery({
    queryKey: adminOrdersKeys.list(params),
    queryFn: () => ordersApi.getAdminOrders(params),
    refetchInterval: 1000 * 45, // Refresh every 45s
  });
}
