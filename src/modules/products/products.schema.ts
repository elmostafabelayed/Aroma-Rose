import { z } from 'zod';
import { ALLOWED_IMAGE_TYPES } from '../../utils/storage.js';

export const productQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  status: z.enum(['all', 'active', 'inactive']).optional(),
  stock_status: z.enum(['all', 'in_stock', 'low_stock', 'out_of_stock']).optional(),
  min_price: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  max_price: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  sort: z.enum(['price_asc', 'price_desc', 'created_desc', 'name_asc']).optional().default('created_desc'),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('12'),
});

export const productImageSchema = z.object({
  storage_path: z.string().min(1, 'storage_path is required'),
  alt_text: z.string().optional(),
  display_order: z.number().int().default(0),
  is_primary: z.boolean().default(false),
});

export const baseProductSchema = z.object({
  name: z.string().min(2, 'Product name must have at least 2 characters'),
  slug: z.string().min(2, 'Product slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be kebab-case lowercase alphanumeric'),
  sku: z.string().optional(),
  category_id: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  price: z.number().nonnegative('Price must be greater than or equal to 0'),
  compare_at_price: z.number().nonnegative().optional().nullable(),
  cost_price: z.number().nonnegative().optional().nullable(),
  stock_quantity: z.number().int().nonnegative('Stock quantity cannot be negative').default(0),
  is_active: z.boolean().default(true),
  images: z.array(productImageSchema).optional(),
});

export const createProductSchema = baseProductSchema.refine(
  (data) => !data.compare_at_price || data.compare_at_price >= data.price,
  {
    message: 'compare_at_price must be greater than or equal to price',
    path: ['compare_at_price'],
  }
);

export const updateProductSchema = baseProductSchema.partial();

export const uploadImageSchema = z.object({
  file_name: z.string().min(1, 'file_name is required'),
  content_type: z.string().refine((val) => ALLOWED_IMAGE_TYPES.includes(val), {
    message: `Invalid image type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
  }),
  file_base64: z.string().min(1, 'file_base64 is required'),
});
