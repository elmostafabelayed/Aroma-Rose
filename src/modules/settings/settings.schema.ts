import { z } from 'zod';

export const updateSettingsSchema = z
  .object({
    store_name: z.string().min(1, 'Le nom du magasin est requis').max(100).optional(),
    store_description: z.string().max(500).optional(),
    store_address: z.string().max(255).optional(),
    store_city: z.string().max(100).optional(),
    store_phone: z.string().max(30).optional(),
    store_email: z.string().email('Format email invalide').optional().or(z.literal('')),
    whatsapp_number: z.string().min(8, 'Numéro WhatsApp trop court').max(25).optional(),

    shipping_standard_fee: z.coerce
      .number()
      .min(0, 'Les frais de livraison ne peuvent pas être négatifs')
      .max(10000)
      .optional(),
    shipping_free_threshold: z.coerce
      .number()
      .min(0, 'Le seuil de livraison gratuite ne peut pas être négatif')
      .max(100000)
      .optional(),
    free_shipping_enabled: z.boolean().optional(),
    shipping_enabled: z.boolean().optional(),
    estimated_delivery_days: z.string().max(100).optional(),

    cod_enabled: z.boolean().optional(),

    currency: z.literal('MAD').optional(),
    currency_symbol: z.string().max(10).optional(),

    store_status: z.enum(['open', 'closed']).optional(),
    store_closure_message: z.string().max(500).optional(),

    low_stock_alert_enabled: z.boolean().optional(),
    new_order_notification_enabled: z.boolean().optional(),
    low_stock_threshold: z.coerce.number().int().min(0).max(1000).optional(),
  })
  .strict();

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

export interface StoreSettingsMap {
  store_name: string;
  store_description: string;
  store_address: string;
  store_city: string;
  store_phone: string;
  store_email: string;
  whatsapp_number: string;
  shipping_standard_fee: number;
  shipping_free_threshold: number;
  free_shipping_enabled: boolean;
  shipping_enabled: boolean;
  estimated_delivery_days: string;
  cod_enabled: boolean;
  currency: string;
  currency_symbol: string;
  store_status: 'open' | 'closed';
  store_closure_message: string;
  low_stock_alert_enabled: boolean;
  new_order_notification_enabled: boolean;
  low_stock_threshold: number;
  updated_at?: string;
  updated_by?: string | null;
}
