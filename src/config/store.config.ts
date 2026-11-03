import { env } from './env.js';

export interface StoreConfig {
  name: string;
  tagline: string;
  currency: string;
  currencySymbol: string;
  shipping: {
    standardFee: number;
    freeShippingThreshold: number;
    estimatedDelivery: string;
  };
  channels: {
    guestCheckoutEnabled: boolean;
    whatsappOrderingEnabled: boolean;
    whatsappNumber: string;
  };
  origin: {
    region: string;
    country: string;
  };
}

export const storeConfig: StoreConfig = {
  name: 'Aroma Rose',
  tagline: 'L’élégance pure de la rose de Kelaat M’Gouna',
  currency: 'MAD',
  currencySymbol: 'DH',
  shipping: {
    standardFee: parseFloat(process.env.SHIPPING_STANDARD_FEE || '30.00'),
    freeShippingThreshold: parseFloat(process.env.SHIPPING_FREE_THRESHOLD || '300.00'),
    estimatedDelivery: '24h à 48h dans tout le Maroc',
  },
  channels: {
    guestCheckoutEnabled: true,
    whatsappOrderingEnabled: true,
    whatsappNumber: process.env.WHATSAPP_NUMBER || '+212600000000',
  },
  origin: {
    region: 'Kelaat M’Gouna, Vallée des Roses',
    country: 'Maroc',
  },
};
