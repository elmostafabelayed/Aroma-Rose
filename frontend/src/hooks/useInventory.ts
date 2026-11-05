import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventory.api';
import { productKeys } from './useProducts';
import { dashboardKeys } from './useDashboard';
import type {
  InventoryQueryParams,
  MovementQueryParams,
  ManualStockAdjustmentPayload,
} from '../types/inventory.types';

export const inventoryKeys = {
  all: ['admin', 'inventory'] as const,
  overviews: () => [...inventoryKeys.all, 'overview'] as const,
  overview: (params?: InventoryQueryParams) =>
    [...inventoryKeys.overviews(), params] as const,
  movementsList: () => [...inventoryKeys.all, 'movements'] as const,
  movements: (params?: MovementQueryParams) =>
    [...inventoryKeys.movementsList(), params] as const,
};

/**
 * Hook to fetch current inventory overview, stock levels, and KPI metrics
 */
export function useInventory(params?: InventoryQueryParams) {
  return useQuery({
    queryKey: inventoryKeys.overview(params),
    queryFn: () => inventoryApi.getInventoryOverview(params),
    refetchInterval: 1000 * 30, // Poll every 30s for live inventory visibility
  });
}

/**
 * Hook to fetch the paginated inventory movement audit trail
 */
export function useInventoryMovements(params?: MovementQueryParams) {
  return useQuery({
    queryKey: inventoryKeys.movements(params),
    queryFn: () => inventoryApi.getInventoryMovements(params),
  });
}

/**
 * Mutation to execute an atomic manual stock adjustment (Admin only)
 */
export function useStockAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ManualStockAdjustmentPayload) =>
      inventoryApi.makeManualAdjustment(payload),
    onSuccess: () => {
      // Invalidate all inventory queries, product caches, and dashboard metrics
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
