import { z } from 'zod';

export const customerQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().trim().optional(),
  status: z.enum(['all', 'active', 'inactive', 'repeat']).optional().default('all'),
  city: z.string().trim().optional(),
});

export type CustomerQueryParams = z.infer<typeof customerQuerySchema>;
