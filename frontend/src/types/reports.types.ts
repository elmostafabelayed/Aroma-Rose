export type ReportPeriod = 'today' | '7d' | '30d' | '90d' | 'year' | 'custom';

export interface ReportDateRangeParams {
  period?: ReportPeriod;
  date_from?: string;
  date_to?: string;
}

export interface KpiMetric<T = number> {
  current: T;
  previous: T;
  diff?: number;
  pct_change?: number | null;
}

export interface ReportSummaryData {
  period: ReportPeriod | string;
  date_from: string;
  date_to: string;
  previous_period: {
    date_from: string;
    date_to: string;
  };
  kpis: {
    collected_revenue: KpiMetric;
    gross_order_value: KpiMetric;
    total_orders: KpiMetric;
    average_order_value: KpiMetric;
    pending_collection: KpiMetric;
    in_transit_value: {
      current: number;
      previous: number;
    };
    cancellation: {
      cancelled_count: number;
      total_orders_all: number;
      rate_pct: number;
      previous_rate_pct: number;
      rate_diff: number;
    };
  };
}

export interface SalesTimelinePoint {
  date: string;
  order_count: number;
  gross_value: number;
  collected_revenue: number;
}

export interface ReportSalesData {
  date_from: string;
  date_to: string;
  timeline: SalesTimelinePoint[];
}

export interface OrderStatusItem {
  status: string;
  count: number;
  total_value: number;
  percentage: number;
}

export interface OrderSourceItem {
  source: string;
  count: number;
  gross_value: number;
  collected_revenue: number;
  percentage: number;
}

export interface ReportOrdersData {
  date_from: string;
  date_to: string;
  total_orders: number;
  valid_orders: number;
  cancelled_orders: number;
  cancellation_rate_pct: number;
  by_status: OrderStatusItem[];
  by_source: OrderSourceItem[];
}

export interface ProductPerformanceItem {
  product_id: string;
  name: string;
  sku: string | null;
  units_sold: number;
  order_count: number;
  total_revenue: number;
  avg_unit_price: number;
  image_storage_path: string | null;
}

export interface ReportProductsData {
  date_from: string;
  date_to: string;
  products: ProductPerformanceItem[];
}

export interface CategoryPerformanceItem {
  category_id: string;
  name: string;
  slug: string;
  units_sold: number;
  order_count: number;
  total_revenue: number;
  percentage_of_total: number;
}

export interface ReportCategoriesData {
  date_from: string;
  date_to: string;
  attribution_note: string;
  categories: CategoryPerformanceItem[];
}

export interface CollectionAnalyticsData {
  date_from: string;
  date_to: string;
  total_collected: number;
  pending_collection: number;
  shipped_pending_collection: number;
  delivered_paid_count: number;
  delivered_paid_amount: number;
  by_payment_status: {
    unpaid: { count: number; total: number };
    paid: { count: number; total: number };
    refunded: { count: number; total: number };
  };
}

export interface CustomerAnalyticsData {
  date_from: string;
  date_to: string;
  new_customers_count: number;
  active_customers_count: number;
  repeat_customers_count: number;
  average_orders_per_customer: number;
}

export interface DeliveryAnalyticsData {
  date_from: string;
  date_to: string;
  shipped_orders_count: number;
  delivered_orders_count: number;
  cancelled_orders_count: number;
  avg_delivery_hours: number;
}
