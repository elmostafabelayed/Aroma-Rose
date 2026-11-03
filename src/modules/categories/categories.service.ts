import { query } from '../../config/db.js';

export class CategoriesService {
  static async getActiveCategories() {
    const res = await query(
      `SELECT
         c.id,
         c.name,
         c.slug,
         c.description,
         c.display_order,
         (
           SELECT count(*)::int
           FROM public.products p
           WHERE p.category_id = c.id AND p.is_active = true
         ) as products_count
       FROM public.categories c
       WHERE c.is_active = true
       ORDER BY c.display_order ASC, c.name ASC`
    );
    return res.rows;
  }
}

