import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import type {
  InventoryOverviewData,
  InventoryMovement,
  ManualStockAdjustmentPayload,
  ManualStockAdjustmentResponse,
  InventoryQueryParams,
  MovementQueryParams,
} from '../types/inventory.types';
import type { PaginatedMeta } from '../types/api.types';

export const inventoryApi = {
  /**
   * Fetch current inventory overview, stock levels, and KPI summary
   */
  async getInventoryOverview(
    params?: InventoryQueryParams
  ): Promise<{ data: InventoryOverviewData; meta?: PaginatedMeta }> {
    const res = await apiClient.get<InventoryOverviewData>(
      ENDPOINTS.ADMIN_INVENTORY.OVERVIEW,
      params as Record<string, string | number | undefined>
    );
    return {
      data: res.data,
      meta: res.meta,
    };
  },

  /**
   * Fetch immutable inventory movement ledger
   */
  async getInventoryMovements(
    params?: MovementQueryParams
  ): Promise<{ movements: InventoryMovement[]; meta?: PaginatedMeta }> {
    const res = await apiClient.get<InventoryMovement[]>(
      ENDPOINTS.ADMIN_INVENTORY.MOVEMENTS,
      params as Record<string, string | number | undefined>
    );
    return {
      movements: res.data || [],
      meta: res.meta,
    };
  },

  /**
   * Post manual atomic inventory stock adjustment (Admin only)
   */
  async makeManualAdjustment(
    payload: ManualStockAdjustmentPayload
  ): Promise<ManualStockAdjustmentResponse> {
    const res = await apiClient.post<ManualStockAdjustmentResponse>(
      ENDPOINTS.ADMIN_INVENTORY.ADJUSTMENTS,
      payload
    );
    return res.data;
  },
};
