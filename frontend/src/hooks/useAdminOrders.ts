import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../api/orders.api';
import { dashboardKeys } from './useDashboard';
import type {
  AdminOrderQueryParams,
  AdminWhatsAppOrderPayload,
  OrderStatus,
} from '../types/order.types';

export const adminOrdersKeys = {
  all: ['admin', 'orders'] as const,
  lists: () => [...adminOrdersKeys.all, 'list'] as const,
  list: (params?: AdminOrderQueryParams) =>
    [...adminOrdersKeys.all, 'list', params] as const,
  details: () => [...adminOrdersKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminOrdersKeys.all, 'detail', id] as const,
  history: (id: string) => [...adminOrdersKeys.all, 'history', id] as const,
};

/**
 * Hook to fetch paginated & filtered admin orders list
 */
export function useAdminOrders(params?: AdminOrderQueryParams) {
  return useQuery({
    queryKey: adminOrdersKeys.list(params),
    queryFn: () => ordersApi.getAdminOrders(params),
    refetchInterval: 1000 * 30, // Refresh list every 30s for live order stream
  });
}

/**
 * Hook to fetch a single order by ID with line items, customer, and history
 */
export function useAdminOrder(id: string | undefined) {
  return useQuery({
    queryKey: adminOrdersKeys.detail(id || ''),
    queryFn: () => ordersApi.getAdminOrderById(id!),
    enabled: Boolean(id),
  });
}

/**
 * Hook to fetch status history audit trail for an order
 */
export function useOrderStatusHistory(id: string | undefined) {
  return useQuery({
    queryKey: adminOrdersKeys.history(id || ''),
    queryFn: () => ordersApi.getOrderStatusHistory(id!),
    enabled: Boolean(id),
  });
}

/**
 * Mutation to update order lifecycle status
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: OrderStatus;
      notes?: string;
    }) => ordersApi.updateOrderStatus(id, status, notes),
    onSuccess: (_, variables) => {
      // Invalidate order list, order detail, history, and dashboard metrics
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.history(variables.id) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

/**
 * Mutation to update admin internal notes
 */
export function useUpdateOrderNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, admin_notes }: { id: string; admin_notes: string }) =>
      ordersApi.updateOrderNotes(id, admin_notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.detail(variables.id) });
    },
  });
}

/**
 * Mutation to reconcile COD payment (Admin only)
 */
export function useReconcileCodPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      ordersApi.reconcileCodPayment(id, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.history(variables.id) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

/**
 * Mutation to create a manual WhatsApp order
 */
export function useCreateWhatsAppOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminWhatsAppOrderPayload) =>
      ordersApi.createAdminWhatsAppOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.lists() });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
