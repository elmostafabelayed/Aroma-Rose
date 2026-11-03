import { z } from 'zod';

/**
 * Moroccan Phone Number Normalization & Validation Helper
 * Cleans spaces, hyphens, dots, and parentheses before validation.
 */
export const cleanPhone = (val: string): string => val.replace(/[\s\-\.\(\)]/g, '');

export const isValidMoroccanPhone = (val: string): boolean => {
  const cleaned = cleanPhone(val);
  // Validates Moroccan mobile (06, 07) or fixed line (05), with 0, +212, or 00212 prefix
  return /^(?:(?:\+|00)212|0)[5-7]\d{8}$/.test(cleaned);
};

export const checkoutFormSchema = z.object({
  first_name: z.string().trim().min(2, 'Le prénom doit comporter au moins 2 caractères'),
  last_name: z.string().trim().min(2, 'Le nom doit comporter au moins 2 caractères'),
  phone: z
    .string()
    .trim()
    .min(9, 'Le numéro de téléphone est incomplet')
    .refine(
      isValidMoroccanPhone,
      'Veuillez renseigner un numéro de téléphone marocain valide (ex: 06 12 34 56 78)'
    ),
  email: z.string().trim().email('Adresse e-mail invalide').optional().or(z.literal('')),
  city: z.string().trim().min(2, 'La ville de livraison est requise'),
  address: z.string().trim().min(5, 'L’adresse de livraison complète est requise'),
  postal_code: z.string().trim().optional().or(z.literal('')),
  notes: z.string().trim().max(500, 'Les remarques ne peuvent dépasser 500 caractères').optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
