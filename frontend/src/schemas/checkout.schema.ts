import { z } from 'zod';

export const checkoutFormSchema = z.object({
  first_name: z.string().trim().min(2, 'Le prénom doit comporter au moins 2 caractères'),
  last_name: z.string().trim().min(2, 'Le nom doit comporter au moins 2 caractères'),
  phone: z
    .string()
    .trim()
    .min(9, 'Le numéro de téléphone est incomplet')
    .regex(
      /^(?:(?:\+|00)212|0)[5-7]\d{8}$/,
      'Veuillez renseigner un numéro de téléphone marocain valide (ex: 06 12 34 56 78)'
    ),
  email: z.string().trim().email('Adresse e-mail invalide').optional().or(z.literal('')),
  city: z.string().trim().min(2, 'La ville de livraison est requise'),
  address: z.string().trim().min(5, 'L’adresse de livraison complète est requise'),
  postal_code: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().max(500, 'Les remarques ne peuvent dépasser 500 caractères').optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

