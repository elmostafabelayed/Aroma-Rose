import { z } from 'zod';

export const inventoryAdjustmentSchema = z.object({
  product_id: z.string().uuid('Invalid product ID format'),
  quantity_change: z.number().int().refine((val) => val !== 0, {
    message: 'quantity_change must not be zero',
  }),
  notes: z.string().min(2, 'Notes explaining the adjustment are required').max(500),
});
