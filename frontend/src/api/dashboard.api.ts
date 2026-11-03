import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';

export interface DashboardSummary {
  collected_revenue: number;
  gross_order_value: number;
  pipeline_order_value: number;
  in_transit_value: number;
  total_revenue: number;
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_customers: number;
  active_products: number;
  low_stock_products: number;
}

export const dashboardApi = {
  /**
   * Fetch executive KPI summary
   */
  async getSummary(): Promise<DashboardSummary> {
    const res = await apiClient.get<DashboardSummary>(ENDPOINTS.ADMIN_DASHBOARD.SUMMARY);
    return res.data;
  },
};
