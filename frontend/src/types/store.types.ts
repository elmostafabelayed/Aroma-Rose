export interface PaymentMethod {
  code: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface StoreShippingSettings {
  standard_fee: number;
  free_shipping_threshold: number;
  estimated_delivery_days: string;
}

export interface StoreChannelSettings {
  guest_checkout_enabled: boolean;
  whatsapp_ordering_enabled: boolean;
  whatsapp_number: string;
}

export interface StoreOrigin {
  region: string;
  country: string;
}

export interface StoreSettings {
  store_name: string;
  tagline: string;
  currency: string;
  currency_symbol: string;
  payment_methods: PaymentMethod[];
  shipping: StoreShippingSettings;
  channels: StoreChannelSettings;
  origin: StoreOrigin;
}

