import { z } from 'zod';

export const productImageItemSchema = z.object({
  id: z.string().optional(),
  storage_path: z.string().min(1, 'L’URL ou le chemin de l’image est requis'),
  alt_text: z.string().optional().nullable(),
  display_order: z.number().int().default(0),
  is_primary: z.boolean().default(false),
  public_url: z.string().optional(),
});

export const productFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Le nom du produit doit comporter au moins 2 caractères').max(200),
    slug: z
      .string()
      .trim()
      .min(2, 'Le slug est requis')
      .regex(/^[a-z0-9-]+$/, 'Le slug doit être en minuscules avec des tirets (kebab-case, ex: huile-de-rose)'),
    sku: z.string().trim().max(50).optional().or(z.literal('')),
    category_id: z.string().uuid('Sélectionnez une catégorie valide').optional().nullable().or(z.literal('')),
    description: z.string().trim().max(5000).optional().or(z.literal('')),
    price: z
      .number({ invalid_type_error: 'Le prix doit être un nombre valide' })
      .min(0, 'Le prix ne peut être négatif'),
    compare_at_price: z
      .number({ invalid_type_error: 'Le prix barré doit être un nombre valide' })
      .min(0, 'Le prix barré ne peut être négatif')
      .optional()
      .nullable(),
    cost_price: z
      .number({ invalid_type_error: 'Le coût doit être un nombre valide' })
      .min(0, 'Le coût ne peut être négatif')
      .optional()
      .nullable(),
    stock_quantity: z
      .number({ invalid_type_error: 'La quantité de stock doit être un entier' })
      .int('Le stock doit être un nombre entier')
      .min(0, 'Le stock ne peut être négatif')
      .default(0),
    is_active: z.boolean().default(true),
    images: z.array(productImageItemSchema).default([]),
  })
  .refine(
    (data) => {
      if (data.compare_at_price !== null && data.compare_at_price !== undefined) {
        return data.compare_at_price >= data.price;
      }
      return true;
    },
    {
      message: 'Le prix d’origine barré doit être supérieur ou égal au prix de vente',
      path: ['compare_at_price'],
    }
  );

export type ProductFormValues = z.infer<typeof productFormSchema>;
