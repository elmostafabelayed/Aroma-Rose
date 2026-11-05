import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  AlertTriangle,
  Plus,
  Minus,
} from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useStoreSettings } from '../../hooks/useStoreSettings';
import { formatMAD } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Spinner } from '../../components/common/Spinner';

export const CartPage: React.FC = () => {
  const {
    items,
    totalItems,
    subtotal,
    isLoading,
    hasUnavailableItems,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const { data: storeSettings } = useStoreSettings();
  const navigate = useNavigate();

  const standardShipping = storeSettings?.shipping?.standard_fee ?? 30;
  const freeThreshold = storeSettings?.shipping?.free_shipping_threshold ?? 300;

  const isFreeShipping = subtotal >= freeThreshold;
  const estimatedShipping = isFreeShipping ? 0 : standardShipping;
  const estimatedTotal = subtotal + estimatedShipping;
  const amountToFreeShipping = Math.max(0, freeThreshold - subtotal);
  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeThreshold) * 100));

  if (isLoading && items.length === 0) {
    return (
      <div className="py-32 flex flex-col items-center justify-center bg-canvas min-h-screen">
        <Spinner size="lg" message="Synchronisation de votre sélection..." />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-20 md:py-32 container-editorial min-h-[70vh] flex flex-col justify-center">
        <EmptyState
          title="Votre panier est vide"
          description="Vous n'avez pas encore sélectionné de rituel de beauté. Découvrez nos eaux florales et soins d'exception."
          icon={<ShoppingBag className="w-8 h-8 text-charcoal/40" />}
          actionLabel="Découvrir la boutique"
          onAction={() => navigate('/shop')}
        />
      </div>
    );
  }

  return (
    <div className="py-10 md:py-16 bg-canvas min-h-screen">
      <div className="container-editorial">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-sand-border">
          <div>
            <span className="label-editorial text-burgundy">Votre Sélection</span>
            <h1 className="text-3xl font-serif text-charcoal mt-1">
              Panier d’Achat ({totalItems} soin{totalItems > 1 ? 's' : ''})
            </h1>
          </div>
          <button
            type="button"
            onClick={clearCart}
            className="text-xs uppercase font-sans tracking-editorial text-charcoal/50 hover:text-burgundy flex items-center gap-1 self-start sm:self-auto transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vider le panier</span>
          </button>
        </div>

        {/* Unavailable items alert banner */}
        {hasUnavailableItems && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-300 rounded flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 font-sans leading-relaxed">
              <strong className="block font-semibold mb-0.5">Articles indisponibles détectés</strong>
              Certains produits de votre panier ne sont plus en stock ou ont été retirés. Veuillez les supprimer pour poursuivre la commande.
            </div>
          </div>
        )}

        {/* Free Shipping Progress Indicator */}
        <div className="mb-8 p-4 bg-white border border-sand-border rounded shadow-subtle">
          <div className="flex items-center justify-between text-xs font-sans mb-2">
            <span className="font-medium text-charcoal flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-burgundy" />
              {isFreeShipping ? (
                <span className="text-sage-dark font-semibold">
                  Félicitations ! Vous bénéficiez de la livraison offerte partout au Maroc.
                </span>
              ) : (
                <span>
                  Ajoutez encore <strong className="text-burgundy">{formatMAD(amountToFreeShipping)}</strong> pour la livraison offerte.
                </span>
              )}
            </span>
            <span className="text-charcoal/50 font-semibold">{freeShippingProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-canvas rounded-full overflow-hidden">
            <div
              className="h-full bg-burgundy transition-all duration-500 rounded-full"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* Layout Grid: Items Table vs Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {items.map((item) => {
              const product = item.product;
              const unitPrice = product ? Number(product.price) : 0;
              const lineTotal = unitPrice * item.quantity;
              const primaryImage = product?.primary_image?.public_url || '/placeholder-rose.jpg';

              return (
                <div
                  key={item.productId}
                  className="bg-white border border-sand-border rounded p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-subtle"
                >
                  {/* Thumbnail & Product Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-20 h-24 bg-sand/20 border border-sand-border rounded overflow-hidden shrink-0">
                      <img
                        src={primaryImage}
                        alt={product?.name || 'Produit'}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex flex-col min-w-0">
                      {product?.category && (
                        <span className="text-[0.62rem] uppercase tracking-editorial text-charcoal/50 font-semibold font-sans mb-0.5">
                          {product.category.name}
                        </span>
                      )}
                      <h3 className="font-serif text-base text-charcoal truncate hover:text-burgundy transition-colors">
                        {product ? (
                          <Link to={`/shop/${product.slug}`}>{product.name}</Link>
                        ) : (
                          'Soin retiré du catalogue'
                        )}
                      </h3>
                      <span className="font-serif text-sm font-medium text-burgundy mt-1">
                        {formatMAD(unitPrice)}
                      </span>

                      {/* Out of stock error indicator */}
                      {(!item.isAvailable || item.isOutOfStock) && (
                        <span className="text-[0.68rem] text-red-600 font-sans font-medium mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Rupture de stock — Veuillez retirer cet article
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-sand-border/70">
                    {/* Quantity controls */}
                    <div className="inline-flex items-center justify-between border border-sand-border rounded bg-canvas px-2.5 py-1.5 w-28 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-0.5 text-charcoal/60 hover:text-burgundy"
                        aria-label="Diminuer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-sans font-semibold text-charcoal select-none">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.maxAvailableQuantity}
                        className="p-0.5 text-charcoal/60 hover:text-burgundy disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Augmenter"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Line Total */}
                    <span className="font-serif text-base font-medium text-charcoal min-w-[90px] text-right">
                      {formatMAD(lineTotal)}
                    </span>

                    {/* Remove Action */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="p-1.5 text-charcoal/40 hover:text-red-700 transition-colors"
                      title="Supprimer du panier"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="pt-4">
              <Link
                to="/shop"
                className="text-xs uppercase tracking-editorial font-semibold text-burgundy hover:text-burgundy-deep inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Poursuivre mes découvertes</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Order Summary & Checkout CTA */}
          <div className="lg:col-span-4">
            <Card className="sticky top-28 flex flex-col gap-6">
              <div className="border-b border-sand-border pb-4">
                <h3 className="font-serif text-lg text-charcoal">Récapitulatif de la Commande</h3>
                <span className="text-[0.68rem] uppercase tracking-editorial text-charcoal/50 font-sans block mt-0.5">
                  Calculé en Dirham Marocain (MAD)
                </span>
              </div>

              {/* Price Breakdown */}
              <div className="flex flex-col gap-3 text-xs font-sans">
                <div className="flex justify-between items-center text-charcoal/70">
                  <span>Sous-total articles :</span>
                  <span className="font-serif text-sm font-medium text-charcoal">
                    {formatMAD(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-charcoal/70">
                  <span className="flex items-center gap-1">
                    <span>Livraison express :</span>
                    {isFreeShipping && (
                      <span className="text-[0.62rem] uppercase tracking-editorial bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                        Offerte
                      </span>
                    )}
                  </span>
                  <span className="font-serif text-sm font-medium text-charcoal">
                    {isFreeShipping ? '0.00 MAD' : formatMAD(standardShipping)}
                  </span>
                </div>

                <div className="pt-3 border-t border-sand-border flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-semibold uppercase tracking-editorial text-charcoal block">
                      Total Estimé :
                    </span>
                    <span className="text-[0.65rem] text-charcoal/50 block font-normal">
                      Paiement en espèces à réception
                    </span>
                  </div>
                  <span className="font-serif text-2xl font-medium text-burgundy">
                    {formatMAD(estimatedTotal)}
                  </span>
                </div>
              </div>

              {/* Payment Method COD Badge */}
              <div className="p-3 bg-canvas border border-sand-border rounded flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-[0.72rem] text-charcoal/80 font-sans leading-relaxed">
                  <strong className="font-semibold block text-charcoal">Paiement à la livraison (COD)</strong>
                  Aucun paiement en ligne requis. Vous réglez directement auprès du transporteur à la livraison de vos soins.
                </div>
              </div>

              {/* Checkout Button */}
              <Link to="/checkout" className="w-full">
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full"
                  disabled={hasUnavailableItems}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Commander en 1 Clic (COD)
                </Button>
              </Link>

              {/* Server-authoritative Price Notice */}
              <p className="text-[0.65rem] text-charcoal/50 font-sans text-center leading-relaxed">
                Les montants exacts et les frais de livraison sont calculés de manière certifiée par notre serveur lors de la validation.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
