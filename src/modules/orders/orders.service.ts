import { PoolClient } from 'pg';
import net from 'node:net';
import { query, withTransaction } from '../../config/db.js';
import { storeConfig } from '../../config/store.config.js';
import { parsePagination } from '../../utils/pagination.js';
import { NotFoundError, BadRequestError, ConflictError, AppError } from '../../utils/errors.js';
import { SettingsService } from '../settings/settings.service.js';
import { z } from 'zod';
import {
  guestCheckoutSchema,
  adminWhatsAppOrderSchema,
  updateOrderStatusSchema,
  orderQuerySchema
} from './orders.schema.js';

export class OrdersService {
  /**
   * Calculates shipping fee based on centralized store configuration
   */
  public static calculateShippingFee(subtotal: number): number {
    return subtotal >= storeConfig.shipping.freeShippingThreshold
      ? 0.00
      : storeConfig.shipping.standardFee;
  }

  /**
   * Verifies products and computes line totals strictly server-side
   */
  private static async prepareOrderItems(
    client: PoolClient,
    items: Array<{ product_id: string; quantity: number }>
  ) {
    let subtotal = 0;
    const preparedItems: Array<{
      product_id: string;
      name_snapshot: string;
      sku_snapshot: string | null;
      unit_price: number;
      quantity: number;
      total_price: number;
    }> = [];

    for (const item of items) {
      const prodRes = await client.query(
        `SELECT id, name, sku, price, is_active, stock_quantity
         FROM public.products
         WHERE id = $1`,
        [item.product_id]
      );

      if (prodRes.rows.length === 0) {
        throw new BadRequestError(`Product with ID "${item.product_id}" does not exist.`);
      }

      const product = prodRes.rows[0];

      if (!product.is_active) {
        throw new BadRequestError(`Product "${product.name}" is currently inactive and cannot be ordered.`);
      }

      const unitPrice = parseFloat(product.price);
      const itemTotal = parseFloat((unitPrice * item.quantity).toFixed(2));
      subtotal = parseFloat((subtotal + itemTotal).toFixed(2));

      preparedItems.push({
        product_id: product.id,
        name_snapshot: product.name,
        sku_snapshot: product.sku || null,
        unit_price: unitPrice,
        quantity: item.quantity,
        total_price: itemTotal,
      });
    }

    return { preparedItems, subtotal };
  }

  /**
   * Associates or creates customer record by normalized phone
   */
  private static async upsertCustomer(
    client: PoolClient,
    customerData: z.infer<typeof guestCheckoutSchema>['customer']
  ): Promise<string> {
    const existing = await client.query(
      `SELECT id FROM public.customers WHERE phone = $1 ORDER BY updated_at DESC LIMIT 1`,
      [customerData.phone]
    );

    if (existing.rows.length > 0) {
      const customerId = existing.rows[0].id;
      await client.query(
        `UPDATE public.customers
         SET first_name = $1, last_name = $2, email = COALESCE($3, email),
             city = $4, address = $5, postal_code = COALESCE($6, postal_code),
             notes = COALESCE($7, notes), updated_at = now()
         WHERE id = $8`,
        [
          customerData.first_name,
          customerData.last_name,
          customerData.email || null,
          customerData.city,
          customerData.address,
          customerData.postal_code || null,
          customerData.notes || null,
          customerId,
        ]
      );
      return customerId;
    }

    const insertRes = await client.query(
      `INSERT INTO public.customers (
         first_name, last_name, phone, email, city, address, postal_code, notes
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        customerData.first_name,
        customerData.last_name,
        customerData.phone,
        customerData.email || null,
        customerData.city,
        customerData.address,
        customerData.postal_code || null,
        customerData.notes || null,
      ]
    );
    return insertRes.rows[0].id;
  }

  /**
   * Public Guest Checkout Order Creation
   */
  static async createGuestOrder(data: z.infer<typeof guestCheckoutSchema>) {
    // 0. Verify store operational status and COD availability from live settings
    const settings = await SettingsService.getAllSettings();
    if (settings.store_status === 'closed') {
      throw new AppError(
        settings.store_closure_message ||
          'Notre boutique en ligne est temporairement fermée aux nouvelles commandes.',
        422,
        'BUSINESS_RULE_VIOLATION'
      );
    }
    if (!settings.cod_enabled) {
      throw new AppError(
        'Le paiement à la livraison (COD) est temporairement désactivé.',
        422,
        'BUSINESS_RULE_VIOLATION'
      );
    }

    return withTransaction(async (client) => {
      // 1. Verify products & calculate prices strictly server-side
      const { preparedItems, subtotal } = await this.prepareOrderItems(client, data.items);
      const shippingFee =
        settings.free_shipping_enabled && subtotal >= Number(settings.shipping_free_threshold)
          ? 0.00
          : Number(settings.shipping_standard_fee);
      const totalAmount = parseFloat((subtotal + shippingFee).toFixed(2));

      // 2. Associate or create customer record by normalized phone
      const customerId = await this.upsertCustomer(client, data.customer);

      // 3. Duplicate Order Submission Protection:
      // If exact same order was submitted from this customer in the last 60 seconds, return it
      const duplicateCheck = await client.query(
        `SELECT id, order_number, status, payment_method, payment_status, subtotal, shipping_fee, total_amount, created_at
         FROM public.orders
         WHERE customer_id = $1
           AND total_amount = $2
           AND status = 'pending'
           AND created_at >= now() - interval '60 seconds'
         ORDER BY created_at DESC
         LIMIT 1`,
        [customerId, totalAmount]
      );

      if (duplicateCheck.rows.length > 0) {
        const dup = duplicateCheck.rows[0];
        return {
          id: dup.id,
          order_number: dup.order_number,
          status: dup.status,
          payment_method: dup.payment_method,
          payment_status: dup.payment_status,
          subtotal: parseFloat(dup.subtotal),
          shipping_fee: parseFloat(dup.shipping_fee),
          total_amount: parseFloat(dup.total_amount),
          items_count: preparedItems.length,
          created_at: dup.created_at,
          is_duplicate: true,
        };
      }

      // 4. Insert order (order_number auto-generated by database trigger)
      const orderRes = await client.query(
        `INSERT INTO public.orders (
           customer_id, order_source, status, payment_method, payment_status,
           subtotal, shipping_fee, total_amount,
           shipping_city, shipping_address, shipping_phone,
           customer_notes
         ) VALUES ($1, 'website', 'pending', 'cod', 'unpaid', $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, order_number, status, payment_method, payment_status, subtotal, shipping_fee, total_amount, created_at`,
        [
          customerId,
          subtotal,
          shippingFee,
          totalAmount,
          data.customer.city,
          data.customer.address,
          data.customer.phone,
          data.customer_notes || null,
        ]
      );
      const order = orderRes.rows[0];

      // 5. Insert order items snapshot
      for (const item of preparedItems) {
        await client.query(
          `INSERT INTO public.order_items (
             order_id, product_id, product_name_snapshot, product_sku_snapshot,
             unit_price_snapshot, quantity, total_price
           ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            order.id,
            item.product_id,
            item.name_snapshot,
            item.sku_snapshot,
            item.unit_price,
            item.quantity,
            item.total_price,
          ]
        );
      }

      return {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        subtotal: parseFloat(order.subtotal),
        shipping_fee: parseFloat(order.shipping_fee),
        total_amount: parseFloat(order.total_amount),
        items_count: preparedItems.length,
        created_at: order.created_at,
      };
    });
  }

  /**
   * Admin WhatsApp Order Creation
   */
  static async createAdminWhatsAppOrder(
    data: z.infer<typeof adminWhatsAppOrderSchema>,
    adminProfileId: string
  ) {
    const settings = await SettingsService.getAllSettings();

    return withTransaction(async (client) => {
      // 1. Verify products & calculate prices strictly server-side
      const { preparedItems, subtotal } = await this.prepareOrderItems(client, data.items);
      const shippingFee =
        data.shipping_fee !== undefined
          ? data.shipping_fee
          : settings.free_shipping_enabled &&
            subtotal >= Number(settings.shipping_free_threshold)
          ? 0.0
          : Number(settings.shipping_standard_fee);
      const totalAmount = parseFloat((subtotal + shippingFee).toFixed(2));

      // 2. Upsert customer
      const customerId = await this.upsertCustomer(client, data.customer);

      // 3. Insert order with created_by_profile_id
      const orderRes = await client.query(
        `INSERT INTO public.orders (
           customer_id, order_source, status, payment_method, payment_status,
           subtotal, shipping_fee, total_amount,
           shipping_city, shipping_address, shipping_phone,
           customer_notes, admin_notes, created_by_profile_id
         ) VALUES ($1, 'whatsapp', 'pending', 'cod', 'unpaid', $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, order_number, status, order_source, payment_method, payment_status, subtotal, shipping_fee, total_amount, created_at`,
        [
          customerId,
          subtotal,
          shippingFee,
          totalAmount,
          data.customer.city,
          data.customer.address,
          data.customer.phone,
          data.customer_notes || null,
          data.admin_notes || null,
          adminProfileId,
        ]
      );
      const order = orderRes.rows[0];

      // 4. Insert items
      for (const item of preparedItems) {
        await client.query(
          `INSERT INTO public.order_items (
             order_id, product_id, product_name_snapshot, product_sku_snapshot,
             unit_price_snapshot, quantity, total_price
           ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            order.id,
            item.product_id,
            item.name_snapshot,
            item.sku_snapshot,
            item.unit_price,
            item.quantity,
            item.total_price,
          ]
        );
      }

      return {
        id: order.id,
        order_number: order.order_number,
        order_source: order.order_source,
        status: order.status,
        subtotal: parseFloat(order.subtotal),
        shipping_fee: parseFloat(order.shipping_fee),
        total_amount: parseFloat(order.total_amount),
        items_count: preparedItems.length,
        created_at: order.created_at,
      };
    });
  }

  /**
   * Admin Orders Listing
   */
  static async getAdminOrders(queryFilters: z.infer<typeof orderQuerySchema>) {
    const { page, limit, offset } = parsePagination(queryFilters.page, queryFilters.limit);

    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (queryFilters.status) {
      conditions.push(`o.status = $${paramIndex}`);
      params.push(queryFilters.status);
      paramIndex++;
    }

    if (queryFilters.order_source) {
      conditions.push(`o.order_source = $${paramIndex}`);
      params.push(queryFilters.order_source);
      paramIndex++;
    }

    if (queryFilters.search) {
      const sanitized = queryFilters.search.replace(/[%_\\]/g, '\\$&');
      conditions.push(`(o.order_number ILIKE $${paramIndex} OR c.phone ILIKE $${paramIndex} OR c.first_name ILIKE $${paramIndex} OR c.last_name ILIKE $${paramIndex})`);
      params.push(`%${sanitized}%`);
      paramIndex++;
    }

    if (queryFilters.date_from) {
      conditions.push(`o.created_at >= $${paramIndex}`);
      params.push(queryFilters.date_from);
      paramIndex++;
    }

    if (queryFilters.date_to) {
      conditions.push(`o.created_at <= $${paramIndex}`);
      params.push(queryFilters.date_to);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const countRes = await query(
      `SELECT count(*)::int as total
       FROM public.orders o
       JOIN public.customers c ON c.id = o.customer_id
       WHERE ${whereClause}`,
      params
    );
    const total = countRes.rows[0]?.total || 0;

    const dataRes = await query(
      `SELECT
         o.id,
         o.order_number,
         o.order_source,
         o.status,
         o.payment_method,
         o.payment_status,
         o.subtotal,
         o.shipping_fee,
         o.total_amount,
         o.created_at,
         json_build_object(
           'id', c.id,
           'first_name', c.first_name,
           'last_name', c.last_name,
           'phone', c.phone,
           'city', c.city
         ) as customer,
         (
           SELECT count(*)::int
           FROM public.order_items oi
           WHERE oi.order_id = o.id
         ) as items_count
       FROM public.orders o
       JOIN public.customers c ON c.id = o.customer_id
       WHERE ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      orders: dataRes.rows,
      page,
      limit,
      total,
    };
  }

  /**
   * Admin Get Single Order Details
   */
  static async getAdminOrderById(id: string) {
    const orderRes = await query(
      `SELECT
         o.*,
         json_build_object(
           'id', c.id,
           'first_name', c.first_name,
           'last_name', c.last_name,
           'phone', c.phone,
           'email', c.email,
           'city', c.city,
           'address', c.address,
           'postal_code', c.postal_code
         ) as customer,
         json_build_object(
           'id', p.id,
           'full_name', p.full_name,
           'role', p.role
         ) as created_by_profile
       FROM public.orders o
       JOIN public.customers c ON c.id = o.customer_id
       LEFT JOIN public.profiles p ON p.id = o.created_by_profile_id
       WHERE o.id = $1`,
      [id]
    );

    if (orderRes.rows.length === 0) {
      throw new NotFoundError(`Order with ID "${id}" not found.`);
    }

    const order = orderRes.rows[0];

    // Fetch items
    const itemsRes = await query(
      `SELECT
         oi.id,
         oi.product_id,
         oi.product_name_snapshot,
         oi.product_sku_snapshot,
         oi.unit_price_snapshot,
         oi.quantity,
         oi.total_price,
         (
           SELECT json_build_object('storage_path', pi.storage_path, 'alt_text', pi.alt_text)
           FROM public.product_images pi
           WHERE pi.product_id = oi.product_id
           ORDER BY pi.is_primary DESC
           LIMIT 1
         ) as product_image
       FROM public.order_items oi
       WHERE oi.order_id = $1
       ORDER BY oi.created_at ASC`,
      [id]
    );

    // Fetch status history
    const historyRes = await query(
      `SELECT
         h.id,
         h.from_status,
         h.to_status,
         h.notes,
         h.created_at,
         json_build_object('id', p.id, 'full_name', p.full_name) as changed_by
       FROM public.order_status_history h
       LEFT JOIN public.profiles p ON p.id = h.changed_by_profile_id
       WHERE h.order_id = $1
       ORDER BY h.created_at ASC`,
      [id]
    );

    return {
      ...order,
      items: itemsRes.rows,
      status_history: historyRes.rows,
    };
  }

  /**
   * Admin Update Order Status
   * Automatically sets payment_status = 'paid' when a COD order is delivered!
   */
  static async updateOrderStatus(
    id: string,
    data: z.infer<typeof updateOrderStatusSchema>,
    adminProfileId: string
  ) {
    return withTransaction(async (client: PoolClient) => {
      // 1. Verify order exists
      const checkRes = await client.query('SELECT id, status, payment_method, order_number FROM public.orders WHERE id = $1', [id]);
      if (checkRes.rows.length === 0) {
        throw new NotFoundError(`Order with ID "${id}" not found.`);
      }
      const existing = checkRes.rows[0];

      if (existing.status === data.status) {
        return existing;
      }

      // 2. Update status: triggers trg_orders_01_validate_status_transition
      // and trg_orders_02_handle_shipment if status == 'shipped'.
      // Note: Financial reconciliation is separated from physical fulfillment.
      // Physical delivery does NOT automatically mark COD payment as collected.
      const updateRes = await client.query(
        `UPDATE public.orders
         SET status = $1::order_status,
             updated_at = now()
         WHERE id = $2
         RETURNING id, order_number, status, payment_status, shipped_at, delivered_at, cancelled_at, updated_at`,
        [data.status, id]
      );

      // If custom note provided, append to latest order_status_history record
      if (data.notes) {
        await client.query(
          `UPDATE public.order_status_history
           SET notes = notes || ' | Note: ' || $1, changed_by_profile_id = $2
           WHERE id = (
             SELECT id FROM public.order_status_history
             WHERE order_id = $3
             ORDER BY created_at DESC
             LIMIT 1
           )`,
          [data.notes, adminProfileId, id]
        );
      }

      return updateRes.rows[0];
    });
  }

  /**
   * Admin-Only: Reconcile COD Payment
   * Explicitly marks COD payment as collected/paid after courier cash remittance.
   * Does NOT alter order delivery status, stock, or order totals.
   */
  static async reconcileCodPayment(
    id: string,
    adminProfileId: string,
    notes?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    return withTransaction(async (client: PoolClient) => {
      // 1. Fetch current order state with explicit FOR UPDATE row-level lock
      // Prevents concurrent race conditions and duplicate audit records
      const checkRes = await client.query(
        'SELECT id, order_number, status, payment_method, payment_status, total_amount FROM public.orders WHERE id = $1 FOR UPDATE',
        [id]
      );
      if (checkRes.rows.length === 0) {
        throw new NotFoundError(`Order with ID "${id}" not found.`);
      }
      const existing = checkRes.rows[0];

      // 2. Business validation rules
      if (existing.status === 'cancelled') {
        throw new ConflictError(
          `Impossible d'encaisser le paiement: la commande ${existing.order_number} est annulée.`
        );
      }

      if (existing.payment_status === 'refunded') {
        throw new ConflictError(
          `Impossible d'encaisser le paiement: la commande ${existing.order_number} a déjà été remboursée.`
        );
      }

      // Repeated collection attempt is idempotent
      if (existing.payment_status === 'paid') {
        return {
          ...existing,
          message: 'Paiement déjà encaissé.',
          already_paid: true,
        };
      }

      // COD payment can only be reconciled for orders that are shipped or delivered
      if (existing.status !== 'delivered' && existing.status !== 'shipped') {
        throw new ConflictError(
          `Le paiement COD ne peut être encaissé que pour une commande expédiée ou livrée (statut actuel: "${existing.status}").`
        );
      }

      // 3. Update payment status (with savepoint to handle backward compatibility gracefully)
      let updateRes;
      await client.query('SAVEPOINT cod_reconcile_sp');
      try {
        updateRes = await client.query(
          `UPDATE public.orders
           SET payment_status = 'paid'::payment_status,
               paid_at = COALESCE(paid_at, now()),
               payment_collected_by = COALESCE(payment_collected_by, $1),
               updated_at = now()
           WHERE id = $2
           RETURNING id, order_number, status, payment_status, payment_method, total_amount, shipped_at, delivered_at, updated_at`,
          [adminProfileId, id]
        );
        await client.query('RELEASE SAVEPOINT cod_reconcile_sp');
      } catch (err: any) {
        await client.query('ROLLBACK TO SAVEPOINT cod_reconcile_sp');
        // Fallback if schema migration 20261105000400 is not yet applied
        if (err.code === '42703') {
          updateRes = await client.query(
            `UPDATE public.orders
             SET payment_status = 'paid'::payment_status,
                 updated_at = now()
             WHERE id = $1
             RETURNING id, order_number, status, payment_status, payment_method, total_amount, shipped_at, delivered_at, updated_at`,
            [id]
          );
        } else {
          throw err;
        }
      }

      const updatedOrder = updateRes.rows[0];

      // 4. Create immutable audit log entry
      const safeIp = ipAddress && net.isIP(ipAddress.trim()) !== 0 ? ipAddress.trim() : null;

      await client.query(
        `INSERT INTO public.audit_logs (
           profile_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at
         ) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::inet, $8, now())`,
        [
          adminProfileId,
          'order.payment_reconciliation',
          'orders',
          id,
          JSON.stringify({ payment_status: existing.payment_status }),
          JSON.stringify({
            payment_status: 'paid',
            reconciled_by: adminProfileId,
            notes: notes || null,
          }),
          safeIp,
          userAgent || null,
        ]
      );

      // 5. If note provided, also append to admin_notes on order
      if (notes) {
        const auditNote = `[${new Date().toISOString()}] Paiement COD encaissé: ${notes}`;
        await client.query(
          `UPDATE public.orders
           SET admin_notes = CASE
             WHEN admin_notes IS NULL OR admin_notes = '' THEN $1
             ELSE admin_notes || E'\n' || $1
           END
           WHERE id = $2`,
          [auditNote, id]
        );
      }

      return updatedOrder;
    });
  }

  /**
   * Admin Update Order Notes
   */
  static async updateOrderNotes(id: string, adminNotes: string) {
    const res = await query(
      `UPDATE public.orders
       SET admin_notes = $1, updated_at = now()
       WHERE id = $2
       RETURNING id, order_number, admin_notes, updated_at`,
      [adminNotes, id]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError(`Order with ID "${id}" not found.`);
    }

    return res.rows[0];
  }

  /**
   * Admin Get Order Status History
   */
  static async getOrderStatusHistory(id: string) {
    const checkRes = await query('SELECT id FROM public.orders WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      throw new NotFoundError(`Order with ID "${id}" not found.`);
    }

    const res = await query(
      `SELECT
         h.id,
         h.from_status,
         h.to_status,
         h.notes,
         h.created_at,
         json_build_object('id', p.id, 'full_name', p.full_name) as changed_by
       FROM public.order_status_history h
       LEFT JOIN public.profiles p ON p.id = h.changed_by_profile_id
       WHERE h.order_id = $1
       ORDER BY h.created_at ASC`,
      [id]
    );

    return res.rows;
  }
}
