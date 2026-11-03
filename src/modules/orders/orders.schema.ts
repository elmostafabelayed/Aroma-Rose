import { z } from 'zod';
import { normalizePhone, isValidPhone } from '../../utils/phone.js';

export const customerInputSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required').max(100),
  last_name: z.string().trim().min(1, 'Last name is required').max(100),
  phone: z
    .string()
    .trim()
    .min(8, 'Phone number must be at least 8 characters')
    .max(30)
    .refine((val) => isValidPhone(val), {
      message: 'Invalid phone number format. Please provide a valid Moroccan (+212) or international number.',
    })
    .transform((val) => normalizePhone(val)),
  email: z.string().trim().email('Invalid email address').optional().nullable(),
  city: z.string().trim().min(1, 'City is required').max(100),
  address: z.string().trim().min(3, 'Address is required').max(300),
  postal_code: z.string().trim().max(20).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const orderItemInputSchema = z.object({
  product_id: z.string().uuid('Invalid product ID format'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

export const guestCheckoutSchema = z.object({
  customer: customerInputSchema,
  items: z.array(orderItemInputSchema).min(1, 'Order must contain at least one product'),
  customer_notes: z.string().trim().max(500).optional().nullable(),
});

export const adminWhatsAppOrderSchema = z.object({
  customer: customerInputSchema,
  items: z.array(orderItemInputSchema).min(1, 'Order must contain at least one product'),
  shipping_fee: z.number().nonnegative().optional(),
  customer_notes: z.string().trim().max(500).optional().nullable(),
  admin_notes: z.string().trim().max(1000).optional().nullable(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], {
    message: 'Invalid order status',
  }),
  notes: z.string().trim().max(500).optional(),
});

export const updateOrderNotesSchema = z.object({
  admin_notes: z.string().trim().max(1000, 'Admin notes cannot exceed 1000 characters'),
});

export const orderQuerySchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  order_source: z.enum(['website', 'whatsapp']).optional(),
  search: z.string().trim().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
});
