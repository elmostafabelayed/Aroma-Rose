import { query, withTransaction } from '../../config/db.js';
import type { StoreSettingsMap, UpdateSettingsInput } from './settings.schema.js';

export const DEFAULT_STORE_SETTINGS: StoreSettingsMap = {
  store_name: 'Aroma Rose',
  store_description:
    'L’élégance pure de la rose de Kelaat M’Gouna. Cosmétiques naturels & artisanat marocain.',
  store_address: 'Vallée des Roses, Kelaat M’Gouna',
  store_city: 'Kelaat M’Gouna',
  store_phone: '+212 5 24 88 00 00',
  store_email: 'contact@aromarose.ma',
  whatsapp_number: '+212600000000',
  shipping_standard_fee: 30.0,
  shipping_free_threshold: 300.0,
  free_shipping_enabled: true,
  shipping_enabled: true,
  estimated_delivery_days: '24h à 48h dans tout le Maroc',
  cod_enabled: true,
  currency: 'MAD',
  currency_symbol: 'DH',
  store_status: 'open',
  store_closure_message:
    'Notre boutique en ligne est temporairement fermée aux nouvelles commandes.',
  low_stock_alert_enabled: true,
  new_order_notification_enabled: true,
  low_stock_threshold: 10,
};

export class SettingsService {
  /**
   * Fetch all persisted settings as a structured map (Admin & Staff)
   */
  static async getAllSettings(): Promise<StoreSettingsMap> {
    const res = await query(
      `SELECT setting_key, setting_value, updated_at, updated_by
       FROM public.store_settings`
    );

    const settings: any = { ...DEFAULT_STORE_SETTINGS };
    let latestUpdatedAt: string | undefined;
    let lastUpdatedBy: string | null = null;

    for (const row of res.rows) {
      const key = row.setting_key;
      let val = row.setting_value;
      if (typeof val === 'string') {
        try {
          val = JSON.parse(val);
        } catch {
          // keep as string
        }
      }
      settings[key] = val;

      if (!latestUpdatedAt || new Date(row.updated_at) > new Date(latestUpdatedAt)) {
        latestUpdatedAt = row.updated_at;
        lastUpdatedBy = row.updated_by;
      }
    }

    settings.updated_at = latestUpdatedAt;
    settings.updated_by = lastUpdatedBy;

    return settings as StoreSettingsMap;
  }

  /**
   * Fetch public storefront configuration (Safe for anonymous / guest shoppers)
   */
  static async getPublicSettings() {
    const settings = await this.getAllSettings();

    return {
      store_name: settings.store_name,
      tagline: settings.store_description,
      currency: settings.currency,
      currency_symbol: settings.currency_symbol,
      store_status: settings.store_status,
      store_closure_message:
        settings.store_status === 'closed' ? settings.store_closure_message : undefined,
      payment_methods: [
        {
          code: 'cod',
          name: 'Paiement à la livraison (Cash on Delivery)',
          description:
            'Réglez votre commande en espèces directement auprès du livreur à la réception.',
          enabled: settings.cod_enabled,
        },
      ],
      shipping: {
        standard_fee: Number(settings.shipping_standard_fee),
        free_shipping_threshold: Number(settings.shipping_free_threshold),
        free_shipping_enabled: settings.free_shipping_enabled,
        shipping_enabled: settings.shipping_enabled,
        estimated_delivery_days: settings.estimated_delivery_days,
      },
      channels: {
        guest_checkout_enabled: true,
        whatsapp_ordering_enabled: true,
        whatsapp_number: settings.whatsapp_number,
      },
      origin: {
        region: 'Kelaat M’Gouna, Vallée des Roses',
        country: 'Maroc',
      },
    };
  }

  /**
   * Atomically update store configuration with audit log entry (Admin only)
   */
  static async updateSettings(
    payload: UpdateSettingsInput,
    adminProfileId: string
  ): Promise<StoreSettingsMap> {
    return withTransaction(async (client) => {
      // 1. Fetch existing settings for audit old_values
      const currentRes = await client.query(
        `SELECT setting_key, setting_value FROM public.store_settings WHERE setting_key = ANY($1)`,
        [Object.keys(payload)]
      );

      const oldValues: Record<string, any> = {};
      for (const row of currentRes.rows) {
        let val = row.setting_value;
        if (typeof val === 'string') {
          try {
            val = JSON.parse(val);
          } catch {
            // keep
          }
        }
        oldValues[row.setting_key] = val;
      }

      // 2. Persist each changed setting
      for (const [key, value] of Object.entries(payload)) {
        if (value === undefined) continue;

        let valueType = 'string';
        if (typeof value === 'number') valueType = 'number';
        else if (typeof value === 'boolean') valueType = 'boolean';
        else if (typeof value === 'object') valueType = 'json';

        await client.query(
          `INSERT INTO public.store_settings (setting_key, setting_value, value_type, updated_at, updated_by)
           VALUES ($1, $2::jsonb, $3, now(), $4)
           ON CONFLICT (setting_key) DO UPDATE
           SET setting_value = EXCLUDED.setting_value,
               value_type = EXCLUDED.value_type,
               updated_at = now(),
               updated_by = EXCLUDED.updated_by`,
          [key, JSON.stringify(value), valueType, adminProfileId]
        );
      }

      // 3. Create audit log entry
      await client.query(
        `INSERT INTO public.audit_logs (profile_id, action, entity_type, old_values, new_values)
         VALUES ($1, 'update', 'store_settings', $2::jsonb, $3::jsonb)`,
        [adminProfileId, JSON.stringify(oldValues), JSON.stringify(payload)]
      );

      // 4. Return complete updated state
      const updatedRows = await client.query(
        `SELECT setting_key, setting_value, updated_at, updated_by FROM public.store_settings`
      );

      const updatedSettings: any = { ...DEFAULT_STORE_SETTINGS };
      let latestUpdated: string | undefined;
      let lastUpdatedBy: string | null = null;

      for (const row of updatedRows.rows) {
        const k = row.setting_key;
        let v = row.setting_value;
        if (typeof v === 'string') {
          try {
            v = JSON.parse(v);
          } catch {
            // keep
          }
        }
        updatedSettings[k] = v;
        if (!latestUpdated || new Date(row.updated_at) > new Date(latestUpdated)) {
          latestUpdated = row.updated_at;
          lastUpdatedBy = row.updated_by;
        }
      }

      updatedSettings.updated_at = latestUpdated;
      updatedSettings.updated_by = lastUpdatedBy;

      return updatedSettings as StoreSettingsMap;
    });
  }

  /**
   * Helper to compute dynamic shipping fee based on live database settings
   */
  static async calculateShippingFee(subtotal: number): Promise<number> {
    const settings = await this.getAllSettings();
    if (!settings.shipping_enabled) {
      return 0.0;
    }
    if (settings.free_shipping_enabled && subtotal >= Number(settings.shipping_free_threshold)) {
      return 0.0;
    }
    return Number(settings.shipping_standard_fee);
  }
}
