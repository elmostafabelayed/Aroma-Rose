export class StoreService {
  static getStoreSettings() {
    return {
      store_name: 'Aroma Rose',
      tagline: 'L’élégance pure de la rose de Kelaat M’Gouna',
      currency: 'MAD',
      currency_symbol: 'DH',
      payment_methods: [
        {
          code: 'cod',
          name: 'Paiement à la livraison (Cash on Delivery)',
          description: 'Réglez votre commande en espèces directement auprès du livreur à la réception.',
          enabled: true,
        },
      ],
      shipping: {
        standard_fee: 30.00,
        free_shipping_threshold: 300.00,
        estimated_delivery_days: '24h à 48h dans tout le Maroc',
      },
      channels: {
        guest_checkout_enabled: true,
        whatsapp_ordering_enabled: true,
        whatsapp_number: '+212600000000',
      },
      origin: {
        region: 'Kelaat M’Gouna, Vallée des Roses',
        country: 'Maroc',
      },
    };
  }
}
