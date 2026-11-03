import { query } from '../../config/db.js';

export class DashboardService {
  static async getSummary() {
    const res = await query(`
      SELECT
        COALESCE(sum(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0)::numeric(12,2) as total_revenue,
        count(*)::int as total_orders,
        count(CASE WHEN status = 'pending' THEN 1 END)::int as pending_orders,
        count(CASE WHEN status = 'processing' THEN 1 END)::int as processing_orders,
        count(CASE WHEN status = 'shipped' THEN 1 END)::int as shipped_orders,
        count(CASE WHEN status = 'delivered' THEN 1 END)::int as delivered_orders,
        (SELECT count(*)::int FROM public.customers) as total_customers,
        (SELECT count(*)::int FROM public.products WHERE is_active = true) as active_products,
        (SELECT count(*)::int FROM public.products WHERE is_active = true AND stock_quantity <= 10) as low_stock_products
      FROM public.orders
    `);
    return res.rows[0];
  }

  static async getSalesAnalytics(days: number = 30) {
    const res = await query(
      `SELECT
         to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as date,
         count(*)::int as order_count,
         COALESCE(sum(total_amount), 0)::numeric(12,2) as daily_revenue
       FROM public.orders
       WHERE created_at >= now() - ($1 || ' days')::interval
         AND status != 'cancelled'
       GROUP BY date_trunc('day', created_at)
       ORDER BY date ASC`,
      [days]
    );

    // Calculate Average Order Value
    const aovRes = await query(`
      SELECT COALESCE(avg(total_amount), 0)::numeric(12,2) as average_order_value
      FROM public.orders
      WHERE status != 'cancelled'
    `);

    return {
      timeline: res.rows,
      average_order_value: aovRes.rows[0]?.average_order_value || '0.00',
    };
  }

  static async getOrdersBreakdown() {
    const statusRes = await query(`
      SELECT status, count(*)::int as count
      FROM public.orders
      GROUP BY status
    `);

    const sourceRes = await query(`
      SELECT order_source, count(*)::int as count, COALESCE(sum(total_amount), 0)::numeric(12,2) as revenue
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

