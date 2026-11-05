import { query, withTransaction } from '../../config/db.js';
import { parsePagination } from '../../utils/pagination.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { z } from 'zod';
import { inventoryAdjustmentSchema } from './inventory.schema.js';

export class InventoryService {
  /**
   * Get Inventory overview & current stock levels
   */
  static async getInventoryOverview(queryParams: any) {
    const { page, limit, offset } = parsePagination(queryParams?.page, queryParams?.limit, 20);

    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (queryParams?.status === 'in_stock') {
      conditions.push('p.stock_quantity > 10');
    } else if (queryParams?.status === 'low_stock') {
      conditions.push('p.stock_quantity > 0 AND p.stock_quantity <= 10');
    } else if (queryParams?.status === 'out_of_stock') {
      conditions.push('p.stock_quantity = 0');
    }

    if (queryParams?.category) {
      conditions.push(`(c.slug = $${paramIndex} OR c.id::text = $${paramIndex})`);
      params.push(queryParams.category);
      paramIndex++;
    }

    if (queryParams?.search) {
      const sanitized = queryParams.search.replace(/[%_\\]/g, '\\$&');
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`);
      params.push(`%${sanitized}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const countRes = await query(
      `SELECT count(*)::int as total
       FROM public.products p
       LEFT JOIN public.categories c ON c.id = p.category_id
       WHERE ${whereClause}`,
      params
    );
    const total = countRes.rows[0]?.total || 0;

    const dataRes = await query(
      `SELECT
         p.id,
         p.name,
         p.sku,
         p.stock_quantity,
         p.price,
         p.is_active,
         c.name as category_name,
         CASE
           WHEN p.stock_quantity = 0 THEN 'out_of_stock'
           WHEN p.stock_quantity <= 10 THEN 'low_stock'
           ELSE 'in_stock'
         END as stock_status
       FROM public.products p
       LEFT JOIN public.categories c ON c.id = p.category_id
       WHERE ${whereClause}
       ORDER BY p.stock_quantity ASC, p.name ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    // Summary counts
    const summaryRes = await query(`
      SELECT
        count(*)::int as total_products,
        count(CASE WHEN stock_quantity > 10 THEN 1 END)::int as in_stock_count,
        count(CASE WHEN stock_quantity = 0 THEN 1 END)::int as out_of_stock_count,
        count(CASE WHEN stock_quantity > 0 AND stock_quantity <= 10 THEN 1 END)::int as low_stock_count,
        COALESCE(sum(stock_quantity), 0)::int as total_stock_units
      FROM public.products
      WHERE is_active = true
    `);

    return {
      inventory: dataRes.rows,
      summary: summaryRes.rows[0],
      page,
      limit,
      total,
    };
  }

  /**
   * Get Paginated Inventory Movement History
   */
  static async getInventoryMovements(queryParams: any) {
    const { page, limit, offset } = parsePagination(queryParams?.page, queryParams?.limit, 20);

    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (queryParams?.product_id) {
      conditions.push(`im.product_id = $${paramIndex}`);
      params.push(queryParams.product_id);
      paramIndex++;
    }

    if (queryParams?.movement_type) {
      conditions.push(`im.movement_type = $${paramIndex}`);
      params.push(queryParams.movement_type);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const countRes = await query(
      `SELECT count(*)::int as total FROM public.inventory_movements im WHERE ${whereClause}`,
      params
    );
    const total = countRes.rows[0]?.total || 0;

    const dataRes = await query(
      `SELECT
         im.id,
         im.product_id,
         p.name as product_name,
         p.sku as product_sku,
         im.order_id,
         o.order_number,
         im.movement_type,
         im.quantity_change,
         im.previous_stock,
         im.new_stock,
         im.notes,
         im.created_at,
         json_build_object('id', pr.id, 'full_name', pr.full_name) as performed_by
       FROM public.inventory_movements im
       JOIN public.products p ON p.id = im.product_id
       LEFT JOIN public.orders o ON o.id = im.order_id
       LEFT JOIN public.profiles pr ON pr.id = im.performed_by_profile_id
       WHERE ${whereClause}
       ORDER BY im.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      movements: dataRes.rows,
      page,
      limit,
      total,
    };
  }

  /**
   * Post Manual Inventory Adjustment
   */
  static async makeManualAdjustment(
    data: z.infer<typeof inventoryAdjustmentSchema>,
    adminProfileId: string
  ) {
    return withTransaction(async (client) => {
      // 1. Lock target product
      const prodRes = await client.query(
        'SELECT id, name, stock_quantity FROM public.products WHERE id = $1 FOR UPDATE',
        [data.product_id]
      );

      if (prodRes.rows.length === 0) {
        throw new NotFoundError(`Product with ID "${data.product_id}" not found.`);
      }

      const product = prodRes.rows[0];
      const previousStock = product.stock_quantity;
      const newStock = previousStock + data.quantity_change;

      if (newStock < 0) {
        throw new BadRequestError(
          `Adjustment rejected: Cannot reduce stock below 0. Current stock is ${previousStock}, adjustment is ${data.quantity_change}.`
        );
      }

      // 2. Update product stock
      await client.query(
        `UPDATE public.products
         SET stock_quantity = $1, updated_at = now()
         WHERE id = $2`,
        [newStock, data.product_id]
      );

      // 3. Record movement in inventory_movements
      const movRes = await client.query(
        `INSERT INTO public.inventory_movements (
           product_id, movement_type, quantity_change, previous_stock, new_stock,
           performed_by_profile_id, notes
         ) VALUES ($1, 'manual_adjustment', $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          data.product_id,
          data.quantity_change,
          previousStock,
          newStock,
          adminProfileId,
          data.notes,
        ]
      );

      return {
        message: 'Stock adjusted successfully.',
        movement: movRes.rows[0],
      };
    });
  }
}

