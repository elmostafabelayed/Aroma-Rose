import { query } from '../../config/db.js';
import { parsePagination } from '../../utils/pagination.js';
import { NotFoundError } from '../../utils/errors.js';
import { normalizePhone } from '../../utils/phone.js';

export class CustomersService {
  static async getAdminCustomers(queryParams: any) {
    const { page, limit, offset } = parsePagination(queryParams?.page, queryParams?.limit);

    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (queryParams?.search) {
      const sanitized = String(queryParams.search).trim().replace(/[%_\\]/g, '\\$&');
      const normalizedPhoneSearch = normalizePhone(String(queryParams.search));
      conditions.push(
        `(ca.first_name ILIKE $${paramIndex} OR ca.last_name ILIKE $${paramIndex} OR ca.phone ILIKE $${paramIndex} OR ca.phone ILIKE $${paramIndex + 1} OR ca.city ILIKE $${paramIndex} OR (ca.email IS NOT NULL AND ca.email ILIKE $${paramIndex}))`
      );
      params.push(`%${sanitized}%`, `%${normalizedPhoneSearch}%`);
      paramIndex += 2;
    }

    if (queryParams?.city) {
      const sanitizedCity = String(queryParams.city).trim().replace(/[%_\\]/g, '\\$&');
      conditions.push(`ca.city ILIKE $${paramIndex}`);
      params.push(`%${sanitizedCity}%`);
      paramIndex++;
    }

    if (queryParams?.status === 'active') {
      conditions.push('ca.total_orders > 0');
    } else if (queryParams?.status === 'inactive') {
      conditions.push('ca.total_orders = 0');
    } else if (queryParams?.status === 'repeat') {
      conditions.push('ca.total_orders > 1');
    }

    const whereClause = conditions.join(' AND ');

    const countRes = await query(
      `WITH customer_aggregates AS (
         SELECT
           c.id,
           c.first_name,
           c.last_name,
           c.phone,
           c.email,
           c.city,
           c.address,
           c.postal_code,
           c.notes,
           c.created_at,
           count(o.id)::int as total_orders
         FROM public.customers c
         LEFT JOIN public.orders o ON o.customer_id = c.id
         GROUP BY c.id
       )
       SELECT count(*)::int as total FROM customer_aggregates ca WHERE ${whereClause}`,
      params
    );
    const total = countRes.rows[0]?.total || 0;

    const dataRes = await query(
      `WITH customer_aggregates AS (
         SELECT
           c.id,
           c.first_name,
           c.last_name,
           c.phone,
           c.email,
           c.city,
           c.address,
           c.postal_code,
           c.notes,
           c.created_at,
           count(o.id)::int as total_orders,
           COALESCE(sum(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0)::numeric(12,2) as total_spent,
           max(o.created_at) as last_order_date,
           (SELECT o2.order_source FROM public.orders o2 WHERE o2.customer_id = c.id ORDER BY o2.created_at DESC LIMIT 1) as last_order_source
         FROM public.customers c
         LEFT JOIN public.orders o ON o.customer_id = c.id
         GROUP BY c.id
       )
       SELECT * FROM customer_aggregates ca
       WHERE ${whereClause}
       ORDER BY ca.last_order_date DESC NULLS LAST, ca.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    const summaryRes = await query(
      `WITH customer_aggregates AS (
         SELECT
           c.id,
           count(o.id)::int as total_orders,
           COALESCE(sum(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0)::numeric(12,2) as total_spent
         FROM public.customers c
         LEFT JOIN public.orders o ON o.customer_id = c.id
         GROUP BY c.id
       )
       SELECT
         count(*)::int as total_customers,
         count(CASE WHEN total_orders > 0 THEN 1 END)::int as active_customers,
         count(CASE WHEN total_orders = 0 THEN 1 END)::int as inactive_customers,
         count(CASE WHEN total_orders > 1 THEN 1 END)::int as repeat_customers,
         COALESCE(sum(total_spent), 0)::numeric(12,2) as total_revenue
       FROM customer_aggregates`
    );

    const summary = summaryRes.rows[0] || {
      total_customers: 0,
      active_customers: 0,
      inactive_customers: 0,
      repeat_customers: 0,
      total_revenue: '0.00',
    };

    return {
      customers: dataRes.rows,
      page,
      limit,
      total,
      summary,
    };
  }

  static async getAdminCustomerById(id: string) {
    const res = await query(
      `SELECT
         c.*,
         count(o.id)::int as total_orders,
         COALESCE(sum(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0)::numeric(12,2) as total_spent,
         min(o.created_at) as first_order_date,
         max(o.created_at) as last_order_date,
         (SELECT o2.order_source FROM public.orders o2 WHERE o2.customer_id = c.id ORDER BY o2.created_at DESC LIMIT 1) as last_order_source,
         (SELECT o2.status FROM public.orders o2 WHERE o2.customer_id = c.id ORDER BY o2.created_at DESC LIMIT 1) as last_order_status
       FROM public.customers c
       LEFT JOIN public.orders o ON o.customer_id = c.id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError(`Customer with ID "${id}" not found.`);
    }

    return res.rows[0];
  }

  static async getAdminCustomerOrders(id: string) {
    const checkRes = await query('SELECT id FROM public.customers WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      throw new NotFoundError(`Customer with ID "${id}" not found.`);
    }

    const res = await query(
      `SELECT
         o.id,
         o.order_number,
         o.order_source,
         o.status,
         o.payment_method,
         o.payment_status,
         o.total_amount,
         o.created_at,
         (SELECT count(*)::int FROM public.order_items oi WHERE oi.order_id = o.id) as items_count
       FROM public.orders o
       WHERE o.customer_id = $1
       ORDER BY o.created_at DESC`,
      [id]
    );

    return res.rows;
  }
}
