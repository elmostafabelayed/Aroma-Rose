import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';

export const dashboardKeys = {
  summary: ['admin', 'dashboard', 'summary'] as const,
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary,
    queryFn: () => dashboardApi.getSummary(),
    refetchInterval: 1000 * 60, // Refresh every minute
  });
}

