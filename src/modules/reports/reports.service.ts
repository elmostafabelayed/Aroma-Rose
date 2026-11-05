import { query } from '../../config/db.js';
import { ReportDateRangeQuery, ReportExportQuery } from './reports.schema.js';

export interface DateBoundaries {
  startDate: Date;
  endDate: Date;
  prevStartDate: Date;
  prevEndDate: Date;
  intervalName: string;
}

export class ReportsService {
  /**
   * Resolves query period to strict UTC Date boundaries for current and previous comparison periods.
   */
  static resolveDateBoundaries(params: ReportDateRangeQuery): DateBoundaries {
    const period = params.period || '30d';
    const now = new Date();

    let startDate: Date;
    let endDate: Date;
    let prevStartDate: Date;
    let prevEndDate: Date;

    if (period === 'today') {
      const todayStr = now.toISOString().slice(0, 10);
      startDate = new Date(`${todayStr}T00:00:00.000Z`);
      endDate = new Date(`${todayStr}T23:59:59.999Z`);

      const yesterday = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      prevStartDate = new Date(`${yesterdayStr}T00:00:00.000Z`);
      prevEndDate = new Date(`${yesterdayStr}T23:59:59.999Z`);
    } else if (period === '7d') {
      endDate = now;
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      prevEndDate = new Date(startDate.getTime());
      prevStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '30d') {
      endDate = now;
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      prevEndDate = new Date(startDate.getTime());
      prevStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === '90d') {
      endDate = now;
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      prevEndDate = new Date(startDate.getTime());
      prevStartDate = new Date(startDate.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (period === 'year') {
      const currentYear = now.getUTCFullYear();
      startDate = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0, 0));
      endDate = now;
      const duration = endDate.getTime() - startDate.getTime();

      prevEndDate = new Date(Date.UTC(currentYear - 1, 11, 31, 23, 59, 59, 999));
      prevStartDate = new Date(prevEndDate.getTime() - duration);
    } else if (period === 'custom') {
      startDate = new Date(`${params.date_from}T00:00:00.000Z`);
      endDate = new Date(`${params.date_to}T23:59:59.999Z`);
      const duration = endDate.getTime() - startDate.getTime();

      prevEndDate = new Date(startDate.getTime() - 1);
      prevStartDate = new Date(prevEndDate.getTime() - duration);
    } else {
      // Fallback 30d
      endDate = now;
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      prevEndDate = new Date(startDate.getTime());
      prevStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return {
      startDate,
      endDate,
      prevStartDate,
      prevEndDate,
      intervalName: period,
    };
  }

  /**
   * Safe percentage difference calculation handling zero denominators.
   * Returns null if not meaningful, or formatted number (e.g., +12.5 or -5.0).
   */
  static safePctChange(current: number, prev: number): number | null {
    if (prev === 0) {
      if (current === 0) return 0;
      return 100.0;
    }
    const pct = ((current - prev) / prev) * 100;
    if (isNaN(pct) || !isFinite(pct)) return null;
    return Number(pct.toFixed(1));
  }

  /**
   * Executive KPI Summary with Strict COD Semantics and Period Comparison
   */
  static async getSummary(params: ReportDateRangeQuery) {
    const { startDate, endDate, prevStartDate, prevEndDate, intervalName } =
      this.resolveDateBoundaries(params);

    const summarySql = `
      SELECT
        COALESCE(sum(CASE WHEN payment_status = 'paid' OR status = 'delivered' THEN total_amount ELSE 0 END), 0)::numeric(12,2) as collected_revenue,
        COALESCE(sum(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0)::numeric(12,2) as gross_order_value,
        count(CASE WHEN status != 'cancelled' THEN 1 END)::int as total_orders,
        count(CASE WHEN status = 'cancelled' THEN 1 END)::int as cancelled_orders,
        count(*)::int as total_orders_all,
        COALESCE(avg(CASE WHEN status != 'cancelled' THEN total_amount END), 0)::numeric(12,2) as average_order_value,
        COALESCE(sum(CASE WHEN payment_status != 'paid' AND status != 'cancelled' THEN total_amount ELSE 0 END), 0)::numeric(12,2) as pending_collection,
        COALESCE(sum(CASE WHEN status = 'shipped' AND payment_status != 'paid' THEN total_amount ELSE 0 END), 0)::numeric(12,2) as in_transit_value
      FROM public.orders
      WHERE created_at >= $1 AND created_at <= $2
    `;

    const [currentRes, prevRes] = await Promise.all([
      query(summarySql, [startDate.toISOString(), endDate.toISOString()]),
      query(summarySql, [prevStartDate.toISOString(), prevEndDate.toISOString()]),
    ]);

    const cur = currentRes.rows[0];
    const prev = prevRes.rows[0];

    const curCollected = Number(cur.collected_revenue);
    const prevCollected = Number(prev.collected_revenue);

    const curGross = Number(cur.gross_order_value);
    const prevGross = Number(prev.gross_order_value);

    const curOrders = Number(cur.total_orders);
    const prevOrders = Number(prev.total_orders);

    const curAov = Number(cur.average_order_value);
    const prevAov = Number(prev.average_order_value);

    const curPending = Number(cur.pending_collection);
    const prevPending = Number(prev.pending_collection);

    const curCancelled = Number(cur.cancelled_orders);
    const curAllOrders = Number(cur.total_orders_all);
    const cancellationRate = curAllOrders > 0 ? Number(((curCancelled / curAllOrders) * 100).toFixed(1)) : 0.0;

    const prevCancelled = Number(prev.cancelled_orders);
    const prevAllOrders = Number(prev.total_orders_all);
    const prevCancellationRate = prevAllOrders > 0 ? Number(((prevCancelled / prevAllOrders) * 100).toFixed(1)) : 0.0;

    return {
      period: intervalName,
      date_from: startDate.toISOString(),
      date_to: endDate.toISOString(),
      previous_period: {
        date_from: prevStartDate.toISOString(),
        date_to: prevEndDate.toISOString(),
      },
      kpis: {
        collected_revenue: {
          current: curCollected,
          previous: prevCollected,
          diff: Number((curCollected - prevCollected).toFixed(2)),
          pct_change: this.safePctChange(curCollected, prevCollected),
        },
        gross_order_value: {
          current: curGross,
          previous: prevGross,
          diff: Number((curGross - prevGross).toFixed(2)),
          pct_change: this.safePctChange(curGross, prevGross),
        },
        total_orders: {
          current: curOrders,
          previous: prevOrders,
          diff: curOrders - prevOrders,
          pct_change: this.safePctChange(curOrders, prevOrders),
        },
        average_order_value: {
          current: curAov,
          previous: prevAov,
          diff: Number((curAov - prevAov).toFixed(2)),
          pct_change: this.safePctChange(curAov, prevAov),
        },
        pending_collection: {
          current: curPending,
          previous: prevPending,
          diff: Number((curPending - prevPending).toFixed(2)),
          pct_change: this.safePctChange(curPending, prevPending),
        },
        in_transit_value: {
          current: Number(cur.in_transit_value),
          previous: Number(prev.in_transit_value),
        },
        cancellation: {
          cancelled_count: curCancelled,
          total_orders_all: curAllOrders,
          rate_pct: cancellationRate,
          previous_rate_pct: prevCancellationRate,
          rate_diff: Number((cancellationRate - prevCancellationRate).toFixed(1)),
        },
      },
    };
  }

  /**
   * Sales Timeline with Full Chronological Calendar Zero-Filling
   */
  static async getSalesTimeline(params: ReportDateRangeQuery) {
    const { startDate, endDate } = this.resolveDateBoundaries(params);

    const res = await query(
      `SELECT
         to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as date,
         count(*)::int as total_orders_count,
         count(CASE WHEN status != 'cancelled' THEN 1 END)::int as order_count,
         COALESCE(sum(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0)::numeric(12,2) as gross_value,
         COALESCE(sum(CASE WHEN payment_status = 'paid' OR status = 'delivered' THEN total_amount ELSE 0 END), 0)::numeric(12,2) as collected_revenue
       FROM public.orders
       WHERE created_at >= $1 AND created_at <= $2
       GROUP BY date_trunc('day', created_at)
       ORDER BY date ASC`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    const dbMap = new Map<string, (typeof res.rows)[0]>();
    for (const row of res.rows) {
      dbMap.set(row.date, row);
    }

    // Generate chronological calendar list from startDate to endDate
    const timeline: {
      date: string;
      order_count: number;
      gross_value: number;
      collected_revenue: number;
    }[] = [];

    const cursor = new Date(startDate.toISOString().slice(0, 10) + 'T00:00:00.000Z');
    const endLimit = new Date(endDate.toISOString().slice(0, 10) + 'T00:00:00.000Z');

    while (cursor <= endLimit) {
      const dateKey = cursor.toISOString().slice(0, 10);
      const row = dbMap.get(dateKey);
      if (row) {
        timeline.push({
          date: dateKey,
          order_count: Number(row.order_count),
          gross_value: Number(row.gross_value),
          collected_revenue: Number(row.collected_revenue),
        });
      } else {
        timeline.push({
          date: dateKey,
          order_count: 0,
          gross_value: 0.0,
          collected_revenue: 0.0,
        });
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return {
      date_from: startDate.toISOString(),
      date_to: endDate.toISOString(),
      timeline,
    };
  }

  /**
   * Order Status Distribution, Channel Breakdown and Cancellation Rates
   */
  static async getOrderAnalytics(params: ReportDateRangeQuery) {
    const { startDate, endDate } = this.resolveDateBoundaries(params);

    const [statusRes, sourceRes, summaryRes] = await Promise.all([
      query(
        `SELECT
           status,
           count(*)::int as count,
           COALESCE(sum(total_amount), 0)::numeric(12,2) as total_value
         FROM public.orders
         WHERE created_at >= $1 AND created_at <= $2
         GROUP BY status`,
        [startDate.toISOString(), endDate.toISOString()]
      ),
      query(
        `SELECT
           order_source,
           count(*)::int as count,
           COALESCE(sum(total_amount), 0)::numeric(12,2) as gross_value,
           COALESCE(sum(CASE WHEN payment_status = 'paid' OR status = 'delivered' THEN total_amount ELSE 0 END), 0)::numeric(12,2) as collected_revenue
         FROM public.orders
         WHERE created_at >= $1 AND created_at <= $2 AND status != 'cancelled'
         GROUP BY order_source`,
        [startDate.toISOString(), endDate.toISOString()]
      ),
      query(
        `SELECT
           count(*)::int as total_orders,
           count(CASE WHEN status = 'cancelled' THEN 1 END)::int as cancelled_orders,
           count(CASE WHEN status != 'cancelled' THEN 1 END)::int as valid_orders
         FROM public.orders
         WHERE created_at >= $1 AND created_at <= $2`,
        [startDate.toISOString(), endDate.toISOString()]
      ),
    ]);

    const totalOrders = Number(summaryRes.rows[0]?.total_orders || 0);
    const cancelledOrders = Number(summaryRes.rows[0]?.cancelled_orders || 0);
    const validOrders = Number(summaryRes.rows[0]?.valid_orders || 0);

    const allStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    const statusMap = new Map(statusRes.rows.map((r) => [r.status, r]));

    const byStatus = allStatuses.map((st) => {
      const match = statusMap.get(st);
      const cnt = match ? Number(match.count) : 0;
      const val = match ? Number(match.total_value) : 0.0;
      const pct = totalOrders > 0 ? Number(((cnt / totalOrders) * 100).toFixed(1)) : 0.0;
      return {
        status: st,
        count: cnt,
        total_value: val,
        percentage: pct,
      };
    });

    const allSources = ['website', 'whatsapp'];
    const sourceMap = new Map(sourceRes.rows.map((r) => [r.order_source, r]));

    const bySource = allSources.map((src) => {
      const match = sourceMap.get(src);
      const cnt = match ? Number(match.count) : 0;
      const gross = match ? Number(match.gross_value) : 0.0;
      const collected = match ? Number(match.collected_revenue) : 0.0;
      const pct = validOrders > 0 ? Number(((cnt / validOrders) * 100).toFixed(1)) : 0.0;
      return {
        source: src,
        count: cnt,
        gross_value: gross,
        collected_revenue: collected,
        percentage: pct,
      };
    });

    const cancellationRate =
      totalOrders > 0 ? Number(((cancelledOrders / totalOrders) * 100).toFixed(1)) : 0.0;

    return {
      date_from: startDate.toISOString(),
      date_to: endDate.toISOString(),
      total_orders: totalOrders,
      valid_orders: validOrders,
      cancelled_orders: cancelledOrders,
      cancellation_rate_pct: cancellationRate,
      by_status: byStatus,
      by_source: bySource,
    };
  }

  /**
   * Product Performance Ranking using Immutable Order-Item Snapshots
   */
  static async getProductPerformance(params: ReportDateRangeQuery, limit = 10) {
    const { startDate, endDate } = this.resolveDateBoundaries(params);

    const res = await query(
      `SELECT
         oi.product_id,
         oi.product_name_snapshot as name,
         oi.product_sku_snapshot as sku,
         sum(oi.quantity)::int as units_sold,
         count(DISTINCT oi.order_id)::int as order_count,
         COALESCE(sum(oi.total_price), 0)::numeric(12,2) as total_revenue,
         COALESCE(avg(oi.unit_price_snapshot), 0)::numeric(12,2) as avg_unit_price,
         (
           SELECT pi.storage_path
           FROM public.product_images pi
           WHERE pi.product_id = oi.product_id
           ORDER BY pi.is_primary DESC, pi.display_order ASC
           LIMIT 1
         ) as image_storage_path
       FROM public.order_items oi
       JOIN public.orders o ON o.id = oi.order_id
       WHERE o.status != 'cancelled'
         AND o.created_at >= $1
         AND o.created_at <= $2
       GROUP BY oi.product_id, oi.product_name_snapshot, oi.product_sku_snapshot
       ORDER BY total_revenue DESC, units_sold DESC
       LIMIT $3`,
      [startDate.toISOString(), endDate.toISOString(), limit]
    );

    const products = res.rows.map((r) => ({
      product_id: r.product_id,
      name: r.name,
      sku: r.sku,
      units_sold: Number(r.units_sold),
      order_count: Number(r.order_count),
      total_revenue: Number(r.total_revenue),
      avg_unit_price: Number(r.avg_unit_price),
      image_storage_path: r.image_storage_path || null,
    }));

    return {
      date_from: startDate.toISOString(),
      date_to: endDate.toISOString(),
      products,
    };
  }

  /**
   * Category Performance Aggregation
   * Note: order_items stores immutable product snapshots, but category attribution is joined via products -> categories.
   */
  static async getCategoryPerformance(params: ReportDateRangeQuery) {
    const { startDate, endDate } = this.resolveDateBoundaries(params);

    const res = await query(
      `SELECT
         COALESCE(c.id::text, 'uncategorized') as category_id,
         COALESCE(c.name, 'Non catégorisé') as category_name,
         COALESCE(c.slug, 'non-categorise') as category_slug,
         sum(oi.quantity)::int as units_sold,
         count(DISTINCT oi.order_id)::int as order_count,
         COALESCE(sum(oi.total_price), 0)::numeric(12,2) as total_revenue
       FROM public.order_items oi
       JOIN public.orders o ON o.id = oi.order_id
       LEFT JOIN public.products p ON p.id = oi.product_id
       LEFT JOIN public.categories c ON c.id = p.category_id
       WHERE o.status != 'cancelled'
         AND o.created_at >= $1
         AND o.created_at <= $2
       GROUP BY c.id, c.name, c.slug
       ORDER BY total_revenue DESC`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    const totalRevenueSum = res.rows.reduce((acc, r) => acc + Number(r.total_revenue), 0);

    const categories = res.rows.map((r) => {
      const rev = Number(r.total_revenue);
      const pct = totalRevenueSum > 0 ? Number(((rev / totalRevenueSum) * 100).toFixed(1)) : 0.0;
      return {
        category_id: r.category_id,
        name: r.category_name,
        slug: r.category_slug,
        units_sold: Number(r.units_sold),
        order_count: Number(r.order_count),
        total_revenue: rev,
        percentage_of_total: pct,
      };
    });

    return {
      date_from: startDate.toISOString(),
      date_to: endDate.toISOString(),
      attribution_note:
        'Attribution par catégorie actuelle du produit (les instantanés de commande conservent le produit mais la catégorie est attribuée via le catalogue actuel).',
      categories,
    };
  }

  /**
   * COD & Collection Analytics
   */
  static async getCollectionAnalytics(params: ReportDateRangeQuery) {
    const { startDate, endDate } = this.resolveDateBoundaries(params);

    const res = await query(
      `SELECT
         COALESCE(sum(CASE WHEN payment_status = 'paid' OR status = 'delivered' THEN total_amount ELSE 0 END), 0)::numeric(12,2) as total_collected,
         COALESCE(sum(CASE WHEN payment_status != 'paid' AND status != 'cancelled' THEN total_amount ELSE 0 END), 0)::numeric(12,2) as pending_collection,
         COALESCE(sum(CASE WHEN status = 'shipped' AND payment_status != 'paid' THEN total_amount ELSE 0 END), 0)::numeric(12,2) as shipped_pending_collection,
         count(CASE WHEN status = 'delivered' OR payment_status = 'paid' THEN 1 END)::int as delivered_paid_count,
         COALESCE(sum(CASE WHEN status = 'delivered' OR payment_status = 'paid' THEN total_amount ELSE 0 END), 0)::numeric(12,2) as delivered_paid_amount,

         count(CASE WHEN payment_status = 'unpaid' THEN 1 END)::int as unpaid_count,
         COALESCE(sum(CASE WHEN payment_status = 'unpaid' THEN total_amount ELSE 0 END), 0)::numeric(12,2) as unpaid_amount,
         count(CASE WHEN payment_status = 'paid' THEN 1 END)::int as paid_count,
         COALESCE(sum(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END), 0)::numeric(12,2) as paid_amount,
         count(CASE WHEN payment_status = 'refunded' THEN 1 END)::int as refunded_count,
         COALESCE(sum(CASE WHEN payment_status = 'refunded' THEN total_amount ELSE 0 END), 0)::numeric(12,2) as refunded_amount
       FROM public.orders
       WHERE created_at >= $1 AND created_at <= $2`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    const row = res.rows[0];

    return {
      date_from: startDate.toISOString(),
      date_to: endDate.toISOString(),
      total_collected: Number(row.total_collected),
      pending_collection: Number(row.pending_collection),
      shipped_pending_collection: Number(row.shipped_pending_collection),
      delivered_paid_count: Number(row.delivered_paid_count),
      delivered_paid_amount: Number(row.delivered_paid_amount),
      by_payment_status: {
        unpaid: { count: Number(row.unpaid_count), total: Number(row.unpaid_amount) },
        paid: { count: Number(row.paid_count), total: Number(row.paid_amount) },
        refunded: { count: Number(row.refunded_count), total: Number(row.refunded_amount) },
      },
    };
  }

  /**
   * Customer Analytics
   */
  static async getCustomerAnalytics(params: ReportDateRangeQuery) {
    const { startDate, endDate } = this.resolveDateBoundaries(params);

    const [mainRes, repeatRes] = await Promise.all([
      query(
        `SELECT
           (SELECT count(*)::int FROM public.customers WHERE created_at >= $1 AND created_at <= $2) as new_customers_count,
           count(DISTINCT o.customer_id)::int as active_customers_count,
           count(CASE WHEN o.status != 'cancelled' THEN 1 END)::int as valid_orders_count
         FROM public.orders o
         WHERE o.created_at >= $1 AND o.created_at <= $2`,
        [startDate.toISOString(), endDate.toISOString()]
      ),
      query(
        `SELECT count(*)::int as repeat_customers_count
         FROM (
           SELECT customer_id
           FROM public.orders
           WHERE status != 'cancelled' AND created_at >= $1 AND created_at <= $2
           GROUP BY customer_id
           HAVING count(*) >= 2
         ) t`,
        [startDate.toISOString(), endDate.toISOString()]
      ),
    ]);

    const activeCust = Number(mainRes.rows[0]?.active_customers_count || 0);
    const validOrders = Number(mainRes.rows[0]?.valid_orders_count || 0);
    const avgOrders = activeCust > 0 ? Number((validOrders / activeCust).toFixed(2)) : 0.0;

    return {
      date_from: startDate.toISOString(),
      date_to: endDate.toISOString(),
      new_customers_count: Number(mainRes.rows[0]?.new_customers_count || 0),
      active_customers_count: activeCust,
      repeat_customers_count: Number(repeatRes.rows[0]?.repeat_customers_count || 0),
      average_orders_per_customer: avgOrders,
    };
  }

  /**
   * Delivery Analytics
   */
  static async getDeliveryAnalytics(params: ReportDateRangeQuery) {
    const { startDate, endDate } = this.resolveDateBoundaries(params);

    const res = await query(
      `SELECT
         count(CASE WHEN shipped_at IS NOT NULL OR status IN ('shipped', 'delivered') THEN 1 END)::int as shipped_orders_count,
         count(CASE WHEN delivered_at IS NOT NULL OR status = 'delivered' THEN 1 END)::int as delivered_orders_count,
         count(CASE WHEN status = 'cancelled' THEN 1 END)::int as cancelled_orders_count,
         COALESCE(avg(CASE WHEN shipped_at IS NOT NULL AND delivered_at IS NOT NULL THEN EXTRACT(EPOCH FROM (delivered_at - shipped_at)) / 3600.0 END), 0)::numeric(10,1) as avg_delivery_hours
       FROM public.orders
       WHERE created_at >= $1 AND created_at <= $2`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    const row = res.rows[0];

    return {
      date_from: startDate.toISOString(),
      date_to: endDate.toISOString(),
      shipped_orders_count: Number(row.shipped_orders_count),
      delivered_orders_count: Number(row.delivered_orders_count),
      cancelled_orders_count: Number(row.cancelled_orders_count),
      avg_delivery_hours: Number(row.avg_delivery_hours),
    };
  }

  /**
   * Sanitizes values against CSV Formula Injection and formats as CSV cell
   */
  private static sanitizeCsvValue(val: unknown): string {
    if (val === null || val === undefined) return '';
    let str = String(val);

    // Protection against Formula Injection in spreadsheet tools (=, +, -, @, \t, \r)
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }

    // Escape quotes and wrap in quotes if containing delimiter or special chars
    if (str.includes('"') || str.includes(';') || str.includes(',') || str.includes('\n')) {
      str = `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  }

  /**
   * Generates CSV Export with French Headers, UTF-8 BOM, and Formula Sanitization
   */
  static async exportCsv(params: ReportExportQuery): Promise<{ filename: string; csv: string }> {
    const { startDate, endDate } = this.resolveDateBoundaries(params);
    const dateStr = new Date().toISOString().slice(0, 10);
    const type = params.type || 'sales';

    let filename: string;
    let headers: string[];
    const rows: string[][] = [];

    if (type === 'sales') {
      filename = `rapport-ventes-aroma-rose-${dateStr}.csv`;
      headers = [
        'Date',
        'Nombre de commandes',
        'Valeur brute (MAD)',
        "Chiffre d'affaires encaisse (MAD)",
      ];

      const salesData = await this.getSalesTimeline(params);
      for (const pt of salesData.timeline) {
        rows.push([
          this.sanitizeCsvValue(pt.date),
          this.sanitizeCsvValue(pt.order_count),
          this.sanitizeCsvValue(pt.gross_value.toFixed(2)),
          this.sanitizeCsvValue(pt.collected_revenue.toFixed(2)),
        ]);
      }
    } else if (type === 'orders') {
      filename = `rapport-commandes-aroma-rose-${dateStr}.csv`;
      headers = [
        'Numero de commande',
        'Date de creation',
        'Canal',
        'Statut',
        'Mode de paiement',
        'Statut de paiement',
        'Sous-total (MAD)',
        'Frais de livraison (MAD)',
        'Montant total (MAD)',
        'Ville de livraison',
      ];

      const ordersRes = await query(
        `SELECT
           order_number,
           to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as formatted_date,
           order_source,
           status,
           payment_method,
           payment_status,
           subtotal,
           shipping_fee,
           total_amount,
           shipping_city
         FROM public.orders
         WHERE created_at >= $1 AND created_at <= $2
         ORDER BY created_at DESC`,
        [startDate.toISOString(), endDate.toISOString()]
      );

      for (const o of ordersRes.rows) {
        rows.push([
          this.sanitizeCsvValue(o.order_number),
          this.sanitizeCsvValue(o.formatted_date),
          this.sanitizeCsvValue(o.order_source === 'whatsapp' ? 'WhatsApp' : 'Site web'),
          this.sanitizeCsvValue(o.status),
          this.sanitizeCsvValue(o.payment_method.toUpperCase()),
          this.sanitizeCsvValue(o.payment_status),
          this.sanitizeCsvValue(Number(o.subtotal).toFixed(2)),
          this.sanitizeCsvValue(Number(o.shipping_fee).toFixed(2)),
          this.sanitizeCsvValue(Number(o.total_amount).toFixed(2)),
          this.sanitizeCsvValue(o.shipping_city),
        ]);
      }
    } else {
      // Products
      filename = `rapport-produits-aroma-rose-${dateStr}.csv`;
      headers = [
        'Produit (Instantané)',
        'SKU',
        'Unites vendues',
        'Nombre de commandes',
        "Chiffre d'affaires total (MAD)",
        'Prix unitaire moyen (MAD)',
      ];

      const prodData = await this.getProductPerformance(params, 100);
      for (const p of prodData.products) {
        rows.push([
          this.sanitizeCsvValue(p.name),
          this.sanitizeCsvValue(p.sku || '-'),
          this.sanitizeCsvValue(p.units_sold),
          this.sanitizeCsvValue(p.order_count),
          this.sanitizeCsvValue(p.total_revenue.toFixed(2)),
          this.sanitizeCsvValue(p.avg_unit_price.toFixed(2)),
        ]);
      }
    }

    // Format with French Excel delimiter (semicolon) and UTF-8 BOM
    const csvContent =
      '\uFEFF' +
      [
        headers.join(';'),
        ...rows.map((r) => r.join(';')),
      ].join('\r\n');

    return { filename, csv: csvContent };
  }
}
