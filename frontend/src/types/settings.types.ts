export interface StoreSettings {
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

export type UpdateStoreSettingsInput = Partial<
  Omit<StoreSettings, 'updated_at' | 'updated_by'>
>;

export interface PublicStoreSettings {
  store_name: string;
  tagline: string;
  currency: string;
  currency_symbol: string;
  store_status: 'open' | 'closed';
  store_closure_message?: string;
  payment_methods: Array<{
    code: string;
    name: string;
    description: string;
    enabled: boolean;
  }>;
  shipping: {
    standard_fee: number;
    free_shipping_threshold: number;
    free_shipping_enabled: boolean;
    shipping_enabled: boolean;
    estimated_delivery_days: string;
  };
  channels: {
    guest_checkout_enabled: boolean;
    whatsapp_ordering_enabled: boolean;
    whatsapp_number: string;
  };
  origin: {
    region: string;
    country: string;
  };
}
