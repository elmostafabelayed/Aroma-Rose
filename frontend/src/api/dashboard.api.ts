import { apiClient } from './client';
import { ENDPOINTS } from './endpoints';
import type { OrderStatus } from '../types/order.types';

export interface DashboardSummary {
  collected_revenue: number | string;
  gross_order_value: number | string;
  pipeline_order_value: number | string;
  in_transit_value: number | string;
  total_revenue: number | string;
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

export interface SalesTimelinePoint {
  date: string;
  order_count: number;
  daily_gross_value: string;
  daily_collected_revenue: string;
}

export interface SalesAnalytics {
  timeline: SalesTimelinePoint[];
  average_order_value: string;
  average_delivered_value: string;
}

export interface OrdersBreakdownStatus {
  status: OrderStatus;
  count: number;
  total_value: string;
}

export interface OrdersBreakdownSource {
  order_source: string;
  count: number;
  gross_value: string;
  collected_revenue: string;
}

export interface OrdersBreakdown {
  by_status: OrdersBreakdownStatus[];
  by_source: OrdersBreakdownSource[];
}

export interface LowStockItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  stock_quantity: number;
  category_name: string | null;
}

export interface InventoryHealth {
  low_stock_items: LowStockItem[];
}

export const dashboardApi = {
  /**
   * Fetch executive KPI summary (All Staff & Admin)
   */
  async getSummary(): Promise<DashboardSummary> {
    const res = await apiClient.get<DashboardSummary>(ENDPOINTS.ADMIN_DASHBOARD.SUMMARY);
    return res.data;
  },

  /**
   * Fetch sales timeline & AOV analytics (Admin Only)
   */
  async getSales(days: number = 30): Promise<SalesAnalytics> {
    const res = await apiClient.get<SalesAnalytics>(ENDPOINTS.ADMIN_DASHBOARD.SALES(days));
    return res.data;
  },

  /**
   * Fetch orders status and channel breakdown
   */
  async getOrdersBreakdown(): Promise<OrdersBreakdown> {
    const res = await apiClient.get<OrdersBreakdown>(ENDPOINTS.ADMIN_DASHBOARD.ORDERS);
    return res.data;
  },

  /**
   * Fetch inventory health and low stock list
   */
  async getInventoryHealth(): Promise<InventoryHealth> {
    const res = await apiClient.get<InventoryHealth>(ENDPOINTS.ADMIN_DASHBOARD.INVENTORY);
    return res.data;
  },
};
