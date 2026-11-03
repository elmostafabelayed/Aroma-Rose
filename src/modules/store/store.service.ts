import { storeConfig } from '../../config/store.config.js';

export class StoreService {
  static getStoreSettings() {
    return {
      store_name: storeConfig.name,
      tagline: storeConfig.tagline,
      currency: storeConfig.currency,
      currency_symbol: storeConfig.currencySymbol,
      payment_methods: [
        {
          code: 'cod',
          name: 'Paiement à la livraison (Cash on Delivery)',
          description: 'Réglez votre commande en espèces directement auprès du livreur à la réception.',
          enabled: true,
        },
      ],
      shipping: {
        standard_fee: storeConfig.shipping.standardFee,
        free_shipping_threshold: storeConfig.shipping.freeShippingThreshold,
        estimated_delivery_days: storeConfig.shipping.estimatedDelivery,
      },
      channels: {
        guest_checkout_enabled: storeConfig.channels.guestCheckoutEnabled,
        whatsapp_ordering_enabled: storeConfig.channels.whatsappOrderingEnabled,
        whatsapp_number: storeConfig.channels.whatsappNumber,
      },
      origin: {
        region: storeConfig.origin.region,
        country: storeConfig.origin.country,
      },
    };
  }
}
