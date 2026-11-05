import { query } from '../../config/db.js';
import { FINANCIAL_SQL } from '../orders/orders.financial.js';

export class DashboardService {
  /**
   * Executive KPI Summary with Strict COD Accounting Distinction:
   * Collected Revenue is strictly cash collected and paid (payment_status = 'paid' AND status != 'cancelled').
   * Unpaid pending/shipped orders are reported as gross order value and pipeline value.
   */
  static async getSummary() {
    const res = await query(`
      SELECT
        -- Financial Metrics (Authoritative Shared Logic)
        ${FINANCIAL_SQL.COLLECTED_REVENUE} as collected_revenue,
        ${FINANCIAL_SQL.GROSS_ORDER_VALUE} as gross_order_value,
        ${FINANCIAL_SQL.PIPELINE_ORDER_VALUE} as pipeline_order_value,
        ${FINANCIAL_SQL.IN_TRANSIT_VALUE} as in_transit_value,

        -- Order Volume Metrics
        count(*)::int as total_orders,
        count(CASE WHEN status = 'pending' THEN 1 END)::int as pending_orders,
        count(CASE WHEN status = 'confirmed' THEN 1 END)::int as confirmed_orders,
        count(CASE WHEN status = 'processing' THEN 1 END)::int as processing_orders,
        count(CASE WHEN status = 'shipped' THEN 1 END)::int as shipped_orders,
        count(CASE WHEN status = 'delivered' THEN 1 END)::int as delivered_orders,
        count(CASE WHEN status = 'cancelled' THEN 1 END)::int as cancelled_orders,

        -- Catalog & Customer Metrics
        (SELECT count(*)::int FROM public.customers) as total_customers,
        (SELECT count(*)::int FROM public.products WHERE is_active = true) as active_products,
        (SELECT count(*)::int FROM public.products WHERE is_active = true AND stock_quantity <= 10) as low_stock_products
      FROM public.orders
    `);

    // Backwards-compatible mapping: total_revenue alias provided alongside collected_revenue
    const data = res.rows[0];
    return {
      ...data,
      total_revenue: data.collected_revenue, // Canonical financial revenue
    };
  }

  static async getSalesAnalytics(days: number = 30) {
    const res = await query(
      `SELECT
         to_char(date_trunc('day', created_at AT TIME ZONE 'Africa/Casablanca'), 'YYYY-MM-DD') as date,
         count(*)::int as order_count,
         COALESCE(sum(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0)::numeric(12,2) as daily_gross_value,
         COALESCE(sum(CASE WHEN payment_status = 'paid' AND status != 'cancelled' THEN total_amount ELSE 0 END), 0)::numeric(12,2) as daily_collected_revenue
       FROM public.orders
       WHERE created_at >= now() - ($1 || ' days')::interval
       GROUP BY date_trunc('day', created_at AT TIME ZONE 'Africa/Casablanca')
       ORDER BY date ASC`,
      [days]
    );

    // Calculate Average Order Value (AOV) on non-cancelled orders
    const aovRes = await query(`
      SELECT
        COALESCE(avg(CASE WHEN status != 'cancelled' THEN total_amount END), 0)::numeric(12,2) as average_order_value,
        COALESCE(avg(CASE WHEN payment_status = 'paid' AND status != 'cancelled' THEN total_amount END), 0)::numeric(12,2) as average_delivered_value
      FROM public.orders
    `);

    return {
      timeline: res.rows,
      average_order_value: aovRes.rows[0]?.average_order_value || '0.00',
      average_delivered_value: aovRes.rows[0]?.average_delivered_value || '0.00',
    };
  }

  static async getOrdersBreakdown() {
    const statusRes = await query(`
      SELECT
        status,
        count(*)::int as count,
        COALESCE(sum(total_amount), 0)::numeric(12,2) as total_value
      FROM public.orders
      GROUP BY status
    `);

    const sourceRes = await query(`
      SELECT
        order_source,
        count(*)::int as count,
        COALESCE(sum(total_amount), 0)::numeric(12,2) as gross_value,
        COALESCE(sum(CASE WHEN payment_status = 'paid' AND status != 'cancelled' THEN total_amount ELSE 0 END), 0)::numeric(12,2) as collected_revenue
      FROM public.orders
      WHERE status != 'cancelled'
      GROUP BY order_source
    `);

    return {
      by_status: statusRes.rows,
      by_source: sourceRes.rows,
    };
  }

  static async getInventoryHealth() {
    const res = await query(`
      SELECT
        p.id,
        p.name,
        p.slug,
        p.sku,
        p.stock_quantity,
        c.name as category_name
      FROM public.products p
      LEFT JOIN public.categories c ON c.id = p.category_id
      WHERE p.is_active = true AND p.stock_quantity <= 10
      ORDER BY p.stock_quantity ASC
    `);

    return {
      low_stock_items: res.rows,
    };
  }
}
