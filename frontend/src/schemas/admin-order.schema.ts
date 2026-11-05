import { z } from 'zod';
import { isValidMoroccanPhone } from './checkout.schema';

export const whatsappOrderItemSchema = z.object({
  product_id: z.string().uuid('Veuillez sélectionner un produit valide'),
  quantity: z
    .number({ invalid_type_error: 'La quantité doit être un nombre' })
    .int('La quantité doit être un entier')
    .min(1, 'Quantité minimum : 1'),
});

export const createWhatsAppOrderSchema = z.object({
  customer: z.object({
    first_name: z.string().trim().min(2, 'Le prénom doit comporter au moins 2 caractères'),
    last_name: z.string().trim().min(2, 'Le nom doit comporter au moins 2 caractères'),
    phone: z
      .string()
      .trim()
      .min(9, 'Numéro de téléphone incomplet')
      .refine(
        isValidMoroccanPhone,
        'Numéro marocain invalide (ex: 06 12 34 56 78 ou +212612345678)'
      ),
    email: z.string().trim().email('Adresse e-mail invalide').optional().or(z.literal('')),
    city: z.string().trim().min(2, 'La ville est requise'),
    address: z.string().trim().min(5, 'L’adresse de livraison complète est requise'),
    postal_code: z.string().trim().optional().or(z.literal('')),
    notes: z.string().trim().max(500, '500 caractères maximum').optional().or(z.literal('')),
  }),
  items: z.array(whatsappOrderItemSchema).min(1, 'La commande doit comporter au moins un article'),
  shipping_fee: z
    .number({ invalid_type_error: 'Les frais doivent être un nombre' })
    .nonnegative('Les frais ne peuvent être négatifs')
    .default(30),
  customer_notes: z.string().trim().max(500, '500 caractères maximum').optional().or(z.literal('')),
  admin_notes: z.string().trim().max(1000, '1000 caractères maximum').optional().or(z.literal('')),
});

export type CreateWhatsAppOrderFormValues = z.infer<typeof createWhatsAppOrderSchema>;
