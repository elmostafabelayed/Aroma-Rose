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
      conditions.push(`(c.first_name ILIKE $${paramIndex} OR c.last_name ILIKE $${paramIndex} OR c.phone ILIKE $${paramIndex} OR c.phone ILIKE $${paramIndex + 1} OR c.city ILIKE $${paramIndex})`);
      params.push(`%${sanitized}%`, `%${normalizedPhoneSearch}%`);
      paramIndex += 2;
    }

    const whereClause = conditions.join(' AND ');

    const countRes = await query(
      `SELECT count(*)::int as total FROM public.customers c WHERE ${whereClause}`,
      params
    );
    const total = countRes.rows[0]?.total || 0;

    const dataRes = await query(
      `SELECT
         c.id,
         c.first_name,
         c.last_name,
         c.phone,
         c.email,
         c.city,
         c.address,
         c.postal_code,
         c.created_at,
         count(o.id)::int as total_orders,
         COALESCE(sum(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0)::numeric(12,2) as total_spent,
         max(o.created_at) as last_order_date
       FROM public.customers c
       LEFT JOIN public.orders o ON o.customer_id = c.id
       WHERE ${whereClause}
       GROUP BY c.id
       ORDER BY last_order_date DESC NULLS LAST, c.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      customers: dataRes.rows,
      page,
      limit,
      total,
    };
  }

  static async getAdminCustomerById(id: string) {
    const res = await query(
      `SELECT
         c.*,
         count(o.id)::int as total_orders,
         COALESCE(sum(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0)::numeric(12,2) as total_spent
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
