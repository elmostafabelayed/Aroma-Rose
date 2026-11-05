import { useQuery } from '@tanstack/react-query';
import { customersApi } from '../api/customers.api';
import type { CustomerQueryParams } from '../types/customer.types';

export const customerKeys = {
  all: ['admin', 'customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params?: CustomerQueryParams) =>
    [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  orders: (id: string) => [...customerKeys.detail(id), 'orders'] as const,
};

/**
 * Hook to fetch paginated customer list with search and filters
 */
export function useCustomers(params?: CustomerQueryParams) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => customersApi.getCustomers(params),
  });
}

/**
 * Hook to fetch single customer profile details
 */
export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customersApi.getCustomerById(id),
    enabled: Boolean(id),
  });
}

/**
 * Hook to fetch orders history for a specific customer
 */
export function useCustomerOrders(id: string) {
  return useQuery({
    queryKey: customerKeys.orders(id),
    queryFn: () => customersApi.getCustomerOrders(id),
    enabled: Boolean(id),
  });
}
