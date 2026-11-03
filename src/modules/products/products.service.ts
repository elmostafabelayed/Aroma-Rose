import { query, withTransaction } from '../../config/db.js';
import { parsePagination } from '../../utils/pagination.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { z } from 'zod';
import { productQuerySchema, createProductSchema, updateProductSchema } from './products.schema.js';

export class ProductsService {
  /**
   * Public Product Listing (Strictly active products only)
   */
  static async getPublicProducts(queryFilters: z.infer<typeof productQuerySchema>) {
    const { page, limit, offset } = parsePagination(queryFilters.page, queryFilters.limit);

    const conditions: string[] = ['p.is_active = true'];
    const params: any[] = [];
    let paramIndex = 1;

    if (queryFilters.category) {
      conditions.push(`(c.slug = $${paramIndex} OR c.id::text = $${paramIndex})`);
      params.push(queryFilters.category);
      paramIndex++;
    }

    if (queryFilters.search) {
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
      params.push(`%${queryFilters.search}%`);
      paramIndex++;
    }

    if (queryFilters.min_price !== undefined) {
      conditions.push(`p.price >= $${paramIndex}`);
      params.push(queryFilters.min_price);
      paramIndex++;
    }

    if (queryFilters.max_price !== undefined) {
      conditions.push(`p.price <= $${paramIndex}`);
      params.push(queryFilters.max_price);
      paramIndex++;
    }

    let orderBy = 'p.created_at DESC';
    if (queryFilters.sort === 'price_asc') orderBy = 'p.price ASC';
    else if (queryFilters.sort === 'price_desc') orderBy = 'p.price DESC';
    else if (queryFilters.sort === 'name_asc') orderBy = 'p.name ASC';

    const whereClause = conditions.join(' AND ');

    // Count query
    const countRes = await query(
      `SELECT count(*)::int as total
       FROM public.products p
       LEFT JOIN public.categories c ON c.id = p.category_id
       WHERE ${whereClause}`,
      params
    );
    const total = countRes.rows[0]?.total || 0;

    // Items query with category and primary image
    const dataRes = await query(
      `SELECT
         p.id,
         p.name,
         p.slug,
         p.sku,
         p.price,
         p.compare_at_price,
         p.stock_quantity,
         p.is_active,
         p.created_at,
         json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category,
         (
           SELECT json_build_object('storage_path', pi.storage_path, 'alt_text', pi.alt_text)
           FROM public.product_images pi
           WHERE pi.product_id = p.id
           ORDER BY pi.is_primary DESC, pi.display_order ASC
           LIMIT 1
         ) as primary_image
       FROM public.products p
       LEFT JOIN public.categories c ON c.id = p.category_id
       WHERE ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      products: dataRes.rows,
      page,
      limit,
      total,
    };
  }

  /**
   * Public Single Product by Slug (Strictly active only)
   */
  static async getPublicProductBySlug(slug: string) {
    const res = await query(
      `SELECT
         p.id,
         p.name,
         p.slug,
         p.sku,
         p.description,
         p.price,
         p.compare_at_price,
         p.stock_quantity,
         p.is_active,
         p.created_at,
         json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category,
         COALESCE(
           (
             SELECT json_agg(
               json_build_object(
                 'id', pi.id,
                 'storage_path', pi.storage_path,
                 'alt_text', pi.alt_text,
                 'display_order', pi.display_order,
                 'is_primary', pi.is_primary
               ) ORDER BY pi.is_primary DESC, pi.display_order ASC
             )
             FROM public.product_images pi
             WHERE pi.product_id = p.id
           ),
           '[]'::json
         ) as images
       FROM public.products p
       LEFT JOIN public.categories c ON c.id = p.category_id
       WHERE p.slug = $1 AND p.is_active = true`,
      [slug]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError(`Product with slug "${slug}" not found or currently unavailable.`);
    }

    return res.rows[0];
  }

  /**
   * Admin Product Listing (all products, including drafts/inactive)
   */
  static async getAdminProducts(queryFilters: z.infer<typeof productQuerySchema>) {
    const { page, limit, offset } = parsePagination(queryFilters.page, queryFilters.limit);

    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIndex = 1;

    if (queryFilters.category) {
      conditions.push(`(c.slug = $${paramIndex} OR c.id::text = $${paramIndex})`);
      params.push(queryFilters.category);
      paramIndex++;
    }

    if (queryFilters.search) {
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`);
      params.push(`%${queryFilters.search}%`);
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
         p.slug,
         p.sku,
         p.price,
         p.compare_at_price,
         p.cost_price,
         p.stock_quantity,
         p.is_active,
         p.created_at,
         p.updated_at,
         json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category,
         (
           SELECT count(*)::int
           FROM public.product_images pi
           WHERE pi.product_id = p.id
         ) as images_count
       FROM public.products p
       LEFT JOIN public.categories c ON c.id = p.category_id
       WHERE ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      products: dataRes.rows,
      page,
      limit,
      total,
    };
  }

  /**
   * Admin Product Details by ID
   */
  static async getAdminProductById(id: string) {
    const res = await query(
      `SELECT
         p.id,
         p.name,
         p.slug,
         p.sku,
         p.description,
         p.price,
         p.compare_at_price,
         p.cost_price,
         p.stock_quantity,
         p.is_active,
         p.created_at,
         p.updated_at,
         json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category,
         COALESCE(
           (
             SELECT json_agg(
               json_build_object(
                 'id', pi.id,
                 'storage_path', pi.storage_path,
                 'alt_text', pi.alt_text,
                 'display_order', pi.display_order,
                 'is_primary', pi.is_primary
               ) ORDER BY pi.is_primary DESC, pi.display_order ASC
             )
             FROM public.product_images pi
             WHERE pi.product_id = p.id
           ),
           '[]'::json
         ) as images
       FROM public.products p
       LEFT JOIN public.categories c ON c.id = p.category_id
       WHERE p.id = $1`,
      [id]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError(`Product with ID "${id}" not found.`);
    }

    return res.rows[0];
  }

  /**
   * Admin Create Product
   */
  static async createAdminProduct(data: z.infer<typeof createProductSchema>) {
    return withTransaction(async (client) => {
      const insertProductQuery = `
        INSERT INTO public.products (
          name, slug, sku, category_id, description,
          price, compare_at_price, cost_price, stock_quantity, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      const prodRes = await client.query(insertProductQuery, [
        data.name,
        data.slug,
        data.sku || null,
        data.category_id || null,
        data.description || null,
        data.price,
        data.compare_at_price || null,
        data.cost_price || null,
        data.stock_quantity,
        data.is_active !== undefined ? data.is_active : true,
      ]);

      const product = prodRes.rows[0];

      // Insert images if provided
      if (data.images && data.images.length > 0) {
        for (const img of data.images) {
          await client.query(
            `INSERT INTO public.product_images (
               product_id, storage_path, alt_text, display_order, is_primary
             ) VALUES ($1, $2, $3, $4, $5)`,
            [product.id, img.storage_path, img.alt_text || null, img.display_order, img.is_primary]
          );
        }
      }

      return product;
    });
  }

  /**
   * Admin Update Product
   */
  static async updateAdminProduct(id: string, data: z.infer<typeof updateProductSchema>) {
    return withTransaction(async (client) => {
      // Verify product exists
      const checkRes = await client.query('SELECT * FROM public.products WHERE id = $1', [id]);
      if (checkRes.rows.length === 0) {
        throw new NotFoundError(`Product with ID "${id}" not found.`);
      }
      const existing = checkRes.rows[0];

      const newPrice = data.price !== undefined ? data.price : Number(existing.price);
      const newCompareAt = data.compare_at_price !== undefined ? data.compare_at_price : existing.compare_at_price ? Number(existing.compare_at_price) : null;
      if (newCompareAt && newCompareAt < newPrice) {
        throw new BadRequestError('compare_at_price cannot be less than retail price.');
      }

      const updates: string[] = [];
      const values: any[] = [];
      let valIdx = 1;

      if (data.name !== undefined) { updates.push(`name = $${valIdx++}`); values.push(data.name); }
      if (data.slug !== undefined) { updates.push(`slug = $${valIdx++}`); values.push(data.slug); }
      if (data.sku !== undefined) { updates.push(`sku = $${valIdx++}`); values.push(data.sku); }
      if (data.category_id !== undefined) { updates.push(`category_id = $${valIdx++}`); values.push(data.category_id); }
      if (data.description !== undefined) { updates.push(`description = $${valIdx++}`); values.push(data.description); }
      if (data.price !== undefined) { updates.push(`price = $${valIdx++}`); values.push(data.price); }
      if (data.compare_at_price !== undefined) { updates.push(`compare_at_price = $${valIdx++}`); values.push(data.compare_at_price); }
      if (data.cost_price !== undefined) { updates.push(`cost_price = $${valIdx++}`); values.push(data.cost_price); }
      if (data.stock_quantity !== undefined) { updates.push(`stock_quantity = $${valIdx++}`); values.push(data.stock_quantity); }
      if (data.is_active !== undefined) { updates.push(`is_active = $${valIdx++}`); values.push(data.is_active); }

      let updatedProduct = existing;
      if (updates.length > 0) {
        values.push(id);
        const updateQuery = `
          UPDATE public.products
          SET ${updates.join(', ')}, updated_at = now()
          WHERE id = $${valIdx}
          RETURNING *
        `;
        const res = await client.query(updateQuery, values);
        updatedProduct = res.rows[0];
      }

      // Handle image replacements if provided
      if (data.images !== undefined) {
        await client.query('DELETE FROM public.product_images WHERE product_id = $1', [id]);
        for (const img of data.images) {
          await client.query(
            `INSERT INTO public.product_images (
               product_id, storage_path, alt_text, display_order, is_primary
             ) VALUES ($1, $2, $3, $4, $5)`,
            [id, img.storage_path, img.alt_text || null, img.display_order, img.is_primary]
          );
        }
      }

      return updatedProduct;
    });
  }

  /**
   * Admin Delete Product (Archive rather than hard delete)
   * Requirement 6: "Product deletion must archive rather than hard-delete."
   */
  static async deleteAdminProduct(id: string) {
    const res = await query(
      `UPDATE public.products
       SET is_active = false, updated_at = now()
       WHERE id = $1
       RETURNING id, name, slug, is_active`,
      [id]
    );

    if (res.rows.length === 0) {
      throw new NotFoundError(`Product with ID "${id}" not found.`);
    }

    return {
      message: 'Product archived successfully.',
      product: res.rows[0],
    };
  }
}

