import fs from 'fs';
import path from 'path';
import { PoolClient } from 'pg';
import { query, withTransaction } from '../../config/db.js';
import { parsePagination } from '../../utils/pagination.js';
import { NotFoundError, BadRequestError, ConflictError } from '../../utils/errors.js';
import {
  getStoragePublicUrl,
  MAX_IMAGE_SIZE_BYTES,
  validateImageSignature,
  uploadProductImageToStorage,
  deleteProductImageFromStorage,
} from '../../utils/storage.js';
import { z } from 'zod';
import {
  productQuerySchema,
  createProductSchema,
  updateProductSchema,
  uploadImageSchema,
} from './products.schema.js';

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
      const sanitized = queryFilters.search.replace(/[%_\\]/g, '\\$&');
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
      params.push(`%${sanitized}%`);
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

    // Enrich primary image with public_url
    const products = dataRes.rows.map((prod) => {
      if (prod.primary_image) {
        prod.primary_image.public_url = getStoragePublicUrl(prod.primary_image.storage_path);
      }
      return prod;
    });

    return {
      products,
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

    const product = res.rows[0];
    if (Array.isArray(product.images)) {
      product.images = product.images.map((img: any) => ({
        ...img,
        public_url: getStoragePublicUrl(img.storage_path),
      }));
    }

    return product;
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
      const sanitized = queryFilters.search.replace(/[%_\\]/g, '\\$&');
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex})`);
      params.push(`%${sanitized}%`);
      paramIndex++;
    }

    if (queryFilters.status === 'active') {
      conditions.push('p.is_active = true');
    } else if (queryFilters.status === 'inactive') {
      conditions.push('p.is_active = false');
    }

    if (queryFilters.stock_status === 'in_stock') {
      conditions.push('p.stock_quantity > 5');
    } else if (queryFilters.stock_status === 'low_stock') {
      conditions.push('p.stock_quantity > 0 AND p.stock_quantity <= 5');
    } else if (queryFilters.stock_status === 'out_of_stock') {
      conditions.push('p.stock_quantity = 0');
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
           SELECT json_build_object('storage_path', pi.storage_path, 'alt_text', pi.alt_text)
           FROM public.product_images pi
           WHERE pi.product_id = p.id
           ORDER BY pi.is_primary DESC, pi.display_order ASC
           LIMIT 1
         ) as primary_image,
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

    const products = dataRes.rows.map((prod) => {
      if (prod.primary_image) {
        prod.primary_image.public_url = getStoragePublicUrl(prod.primary_image.storage_path);
      }
      return prod;
    });

    return {
      products,
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

    const product = res.rows[0];
    if (Array.isArray(product.images)) {
      product.images = product.images.map((img: any) => ({
        ...img,
        public_url: getStoragePublicUrl(img.storage_path),
      }));
    }

    return product;
  }

  /**
   * Admin Create Product
   */
  static async createAdminProduct(data: z.infer<typeof createProductSchema>) {
    try {
      return await withTransaction(async (client: PoolClient) => {
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
            // Lock image path to prevent race conditions with concurrent deletion
            await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
              `storage_img:${img.storage_path}`,
            ]);
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
    } catch (err) {
      // If product creation fails, clean up newly uploaded storage objects
      if (data.images && data.images.length > 0) {
        for (const img of data.images) {
          if (img.storage_path && !img.storage_path.startsWith('/')) {
            try {
              // Safety: only delete if NO OTHER product references this storage path
              let hasOtherReference = false;
              try {
                const refCheck = await query(
                  'SELECT 1 FROM public.product_images WHERE storage_path = $1 LIMIT 1',
                  [img.storage_path]
                );
                hasOtherReference = refCheck.rows.length > 0;
              } catch (dbErr) {
                // If database is disconnected or unreachable, object is guaranteed orphaned from this attempt
                console.warn(`[STORAGE CLEANUP] DB reference check skipped due to DB error; proceeding with cleanup.`);
              }

              if (!hasOtherReference) {
                await deleteProductImageFromStorage(img.storage_path);
                console.info(`[STORAGE CLEANUP] Rolled back unreferenced uploaded object on product creation failure: ${img.storage_path}`);
              } else {
                console.info(`[STORAGE CLEANUP] Preserving "${img.storage_path}" as it is still referenced by other products.`);
              }
            } catch (cleanupErr) {
              console.error(
                `[STORAGE RECOVERY REQUIRED] Manual cleanup check failed for storage object "${img.storage_path}":`,
                cleanupErr
              );
            }
          }
        }
      }
      throw err;
    }
  }

  /**
   * Admin Update Product
   */
  static async updateAdminProduct(id: string, data: z.infer<typeof updateProductSchema>) {
    return withTransaction(async (client: PoolClient) => {
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
          // Lock image path to serialize with concurrent deletion operations
          await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
            `storage_img:${img.storage_path}`,
          ]);
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

  /**
   * Admin Upload Product Image
   * Validates size, MIME type, and binary file signature (magic numbers).
   * Directly uploads to Supabase Storage with zero local filesystem dependencies.
   */
  static async uploadProductImage(data: z.infer<typeof uploadImageSchema>) {
    let base64Clean = data.file_base64;
    if (base64Clean.includes('base64,')) {
      base64Clean = base64Clean.split('base64,')[1];
    }

    const buffer = Buffer.from(base64Clean, 'base64');
    if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
      throw new BadRequestError(
        `File size exceeds maximum allowed of 5MB (size: ${(buffer.length / (1024 * 1024)).toFixed(2)}MB).`
      );
    }

    // 1. Strict binary magic number signature validation
    const sigCheck = validateImageSignature(buffer, data.content_type);
    if (!sigCheck.valid) {
      throw new BadRequestError(sigCheck.error || 'Invalid image file signature.');
    }

    // 2. Direct upload to Supabase Storage via Service Role client
    return await uploadProductImageToStorage(buffer, data.content_type);
  }

  /**
   * Admin Delete Product Image from Storage
   * Protected with PostgreSQL transaction-level advisory locks to eliminate race conditions
   * against concurrent product creation and update operations.
   */
  static async deleteProductImage(storagePath: string) {
    return withTransaction(async (client: PoolClient) => {
      // 1. Transaction-level advisory lock serializes concurrent image deletions with product image updates
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        `storage_img:${storagePath}`,
      ]);

      // 2. Strict catalog referential check
      const refCheck = await client.query(
        'SELECT product_id FROM public.product_images WHERE storage_path = $1 LIMIT 1',
        [storagePath]
      );
      if (refCheck.rows.length > 0) {
        throw new ConflictError(
          `Cannot delete image: storage_path "${storagePath}" is actively referenced by product ${refCheck.rows[0].product_id}. Remove it from the product first.`
        );
      }

      // 3. Perform object deletion from cloud storage
      const deleted = await deleteProductImageFromStorage(storagePath);
      return {
        success: deleted,
        message: deleted
          ? 'Image deleted from storage.'
          : 'Image not found in storage or path is preserved legacy local asset.',
        storage_path: storagePath,
      };
    });
  }
}
