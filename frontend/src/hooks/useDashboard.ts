import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';
import { useAuth } from '../auth/useAuth';

export const dashboardKeys = {
  all: ['admin', 'dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
  sales: (days: number) => [...dashboardKeys.all, 'sales', days] as const,
  orders: () => [...dashboardKeys.all, 'orders'] as const,
  inventory: () => [...dashboardKeys.all, 'inventory'] as const,
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: () => dashboardApi.getSummary(),
    refetchInterval: 1000 * 60, // Refresh every minute
  });
}

export function useDashboardSales(days: number = 30) {
  const { isAdmin } = useAuth();

  return useQuery({
    queryKey: dashboardKeys.sales(days),
    queryFn: () => dashboardApi.getSales(days),
    enabled: isAdmin, // Only administrators have permission on /dashboard/sales
    retry: false,
  });
}

export function useDashboardOrders() {
  return useQuery({
    queryKey: dashboardKeys.orders(),
    queryFn: () => dashboardApi.getOrdersBreakdown(),
    refetchInterval: 1000 * 60,
  });
}

export function useDashboardInventory() {
  return useQuery({
    queryKey: dashboardKeys.inventory(),
    queryFn: () => dashboardApi.getInventoryHealth(),
  });
}
