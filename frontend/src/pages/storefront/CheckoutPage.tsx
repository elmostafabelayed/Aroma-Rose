import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ShieldCheck,
  Truck,
  ArrowRight,
  AlertCircle,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useStoreSettings } from '../../hooks/useStoreSettings';
import { ordersApi } from '../../api/orders.api';
import { checkoutFormSchema, type CheckoutFormValues } from '../../schemas/checkout.schema';
import { formatMAD } from '../../utils/formatters';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import type { GuestCheckoutPayload } from '../../types/order.types';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, clearCart, hasUnavailableItems } = useCart();
  const { data: storeSettings } = useStoreSettings();

  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const standardShipping = storeSettings?.shipping?.standard_fee ?? 30;
  const freeThreshold = storeSettings?.shipping?.free_shipping_threshold ?? 300;
  const isFreeShipping = subtotal >= freeThreshold;
  const estimatedShipping = isFreeShipping ? 0 : standardShipping;
  const estimatedTotal = subtotal + estimatedShipping;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      city: '',
      address: '',
      postal_code: '',
      notes: '',
    },
  });

  // If cart is empty, redirect back to shop
  if (items.length === 0) {
    return (
      <div className="py-24 container-editorial text-center min-h-[60vh] flex flex-col justify-center items-center">
        <ShoppingBag className="w-12 h-12 text-charcoal/30 mb-4" />
        <h2 className="text-2xl font-serif text-charcoal mb-2">Votre panier est vide</h2>
        <p className="text-xs text-charcoal/60 font-sans mb-6">
          Veuillez sélectionner au moins un rituel avant de finaliser votre commande.
        </p>
        <Link to="/shop">
          <Button variant="primary" size="md">
            Découvrir la boutique
          </Button>
        </Link>
      </div>
    );
  }

  const onSubmit = async (values: CheckoutFormValues) => {
    if (hasUnavailableItems) {
      setApiError('Certains articles de votre panier sont en rupture de stock. Veuillez vérifier votre panier.');
      return;
    }

    setApiError(null);
    setIsSubmitting(true);

    try {
      // CRITICAL SECURITY RULE:
      // Submit ONLY product IDs and quantities. Prices, shipping fees, and totals are computed strictly server-side!
      const payload: GuestCheckoutPayload = {
        customer: {
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone,
          email: values.email || null,
          city: values.city,
          address: values.address,
          postal_code: values.postal_code || null,
          notes: values.notes || null,
        },
        items: items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
        })),
        customer_notes: values.notes || null,
      };

      const createdOrder = await ordersApi.createGuestOrder(payload);

      // Save order snapshot in sessionStorage so confirmation page can display reference safely
      try {
        sessionStorage.setItem('aroma_rose_last_order', JSON.stringify(createdOrder));
      } catch {
        // Storage protection fallback
      }

      // Clear the local cart
      clearCart();

      // Navigate to order confirmation
      navigate(`/order-confirmation/${createdOrder.id}`, {
        state: { order: createdOrder },
        replace: true,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue lors de la validation.';
      setApiError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-10 md:py-16 bg-canvas min-h-screen">
      <div className="container-editorial">
        {/* Breadcrumb Header */}
        <div className="mb-8">
          <Link
            to="/cart"
            className="text-xs uppercase tracking-editorial font-semibold text-charcoal/60 hover:text-burgundy inline-flex items-center gap-1.5 transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Modifier mon panier</span>
          </Link>
          <span className="label-editorial text-burgundy block">Commande Express</span>
          <h1 className="text-3xl sm:text-4xl font-serif text-charcoal mt-1">
            Paiement à la Livraison (COD)
          </h1>
        </div>

        {/* API Error Alert */}
        {apiError && (
          <div className="mb-8 p-4 bg-rose-soft border border-rose/40 rounded flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-burgundy shrink-0 mt-0.5" />
            <div className="text-xs text-burgundy font-sans leading-relaxed">
              <strong className="block font-semibold mb-0.5">Erreur lors de la commande</strong>
              {apiError}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Guest Delivery Form */}
          <div className="lg:col-span-7">
            <Card>
              <div className="border-b border-sand-border pb-4 mb-6">
                <h2 className="text-lg font-serif text-charcoal">Coordonnées de Livraison</h2>
                <p className="text-xs text-charcoal/60 font-sans mt-0.5">
                  Aucun compte requis. Renseignez simplement l'adresse où vous souhaitez recevoir vos soins.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                {/* Name fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Prénom"
                    placeholder="ex: Fatima"
                    required
                    error={errors.first_name?.message}
                    {...register('first_name')}
                  />
                  <Input
                    label="Nom"
                    placeholder="ex: Zahra"
                    required
                    error={errors.last_name?.message}
                    {...register('last_name')}
                  />
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="Téléphone Portable (Maroc)"
                      type="tel"
                      placeholder="06 12 34 56 78 ou +2126..."
                      required
                      helperText="Le transporteur vous contactera avant la livraison."
                      error={errors.phone?.message}
                      {...register('phone')}
                    />
                  </div>
                  <div>
                    <Input
                      label="Adresse E-mail"
                      type="email"
                      placeholder="optionnel (pour le suivi)"
                      helperText="Pour recevoir votre confirmation détaillée."
                      error={errors.email?.message}
                      {...register('email')}
                    />
                  </div>
                </div>

                {/* City & Postal Code */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <Input
                      label="Ville de livraison"
                      placeholder="ex: Casablanca, Marrakech, Rabat, Tanger..."
                      required
                      error={errors.city?.message}
                      {...register('city')}
                    />
                  </div>
                  <div>
                    <Input
                      label="Code Postal"
                      placeholder="optionnel"
                      error={errors.postal_code?.message}
                      {...register('postal_code')}
                    />
                  </div>
                </div>

                {/* Full Address */}
                <Input
                  label="Adresse Complète de Livraison"
                  placeholder="Numéro, rue, quartier, étage, code d'immeuble..."
                  required
                  error={errors.address?.message}
                  {...register('address')}
                />

                {/* Customer Notes */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="order-notes"
                    className="text-[0.72rem] font-semibold uppercase tracking-editorial text-charcoal font-sans"
                  >
                    Remarques ou instructions particulières (Optionnel)
                  </label>
                  <textarea
                    id="order-notes"
                    rows={3}
                    placeholder="Instructions pour le livreur (ex: appeler à l'interphone B, livraison après 14h)..."
                    className="w-full bg-white text-charcoal text-sm font-sans placeholder:text-charcoal/40 border border-sand-border rounded p-3 focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy/20"
                    {...register('notes')}
                  />
                  {errors.notes && (
                    <p className="text-xs text-red-600 font-sans">{errors.notes.message}</p>
                  )}
                </div>

                {/* Payment Method Notice */}
                <div className="p-4 bg-canvas border border-sand-border rounded flex items-start gap-3 mt-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-editorial text-charcoal font-sans">
                      Modalité de règlement : Espèces à la livraison
                    </h4>
                    <p className="text-xs text-charcoal/70 font-sans mt-0.5 leading-relaxed">
                      Vous payez le montant exact directement auprès de notre transporteur au moment de la remise de votre colis.
                    </p>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    size="lg"
                    variant="primary"
                    className="w-full"
                    isLoading={isSubmitting}
                    disabled={isSubmitting || hasUnavailableItems}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Confirmer ma Commande ({formatMAD(estimatedTotal)})
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5">
            <Card className="sticky top-28 flex flex-col gap-6">
              <div className="border-b border-sand-border pb-4">
                <h3 className="font-serif text-lg text-charcoal">Détail des Soins Sélectionnés</h3>
                <span className="text-[0.68rem] uppercase tracking-editorial text-charcoal/50 font-sans block mt-0.5">
                  {items.length} soin{items.length > 1 ? 's' : ''} dans votre rituel
                </span>
              </div>

              {/* Items List Preview */}
              <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between gap-3 text-xs font-sans py-1">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-9 h-11 bg-sand/20 rounded overflow-hidden shrink-0 border border-sand-border">
                        <img
                          src={item.product?.primary_image?.public_url || '/placeholder-rose.jpg'}
                          alt={item.product?.name || ''}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="truncate">
                        <span className="font-medium text-charcoal truncate block font-serif">
                          {item.product?.name || 'Soin'}
                        </span>
                        <span className="text-[0.65rem] text-charcoal/50">
                          Qté : {item.quantity} × {formatMAD(item.product?.price || 0)}
                        </span>
                      </div>
                    </div>
                    <span className="font-serif font-medium text-charcoal shrink-0">
                      {formatMAD((item.product?.price || 0) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pricing Totals */}
              <div className="border-t border-sand-border pt-4 flex flex-col gap-2.5 text-xs font-sans">
                <div className="flex justify-between items-center text-charcoal/70">
                  <span>Sous-total soins :</span>
                  <span className="font-serif text-sm font-medium text-charcoal">
                    {formatMAD(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-charcoal/70">
                  <span>Frais de livraison :</span>
                  <span className="font-serif text-sm font-medium text-charcoal">
                    {isFreeShipping ? (
                      <span className="text-emerald-800 font-semibold">Gratuit (Dès {freeThreshold} MAD)</span>
                    ) : (
                      formatMAD(standardShipping)
                    )}
                  </span>
                </div>

                <div className="pt-3 border-t border-sand-border flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-semibold uppercase tracking-editorial text-charcoal block">
                      Total à Régler :
                    </span>
                    <span className="text-[0.65rem] text-charcoal/50 font-sans block">
                      Règlement à la livraison (COD)
                    </span>
                  </div>
                  <span className="font-serif text-2xl font-medium text-burgundy">
                    {formatMAD(estimatedTotal)}
                  </span>
                </div>
              </div>

              {/* Guarantees */}
              <div className="pt-4 border-t border-sand-border/70 flex flex-col gap-2 text-xs font-sans text-charcoal/60">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-burgundy shrink-0" />
                  <span>Livraison express sécurisée sous 24h à 48h</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-burgundy shrink-0" />
                  <span>Produits authentiques scellés à Kelaat M'Gouna</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
