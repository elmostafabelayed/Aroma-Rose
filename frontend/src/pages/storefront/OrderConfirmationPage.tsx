import React, { useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Truck,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useStoreSettings } from '../../hooks/useStoreSettings';
import { formatMAD, formatDateTime } from '../../utils/formatters';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import type { Order } from '../../types/order.types';

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const { data: storeSettings } = useStoreSettings();

  const [order] = useState<Partial<Order> | null>(() => {
    // 1. First priority: state passed directly through React Router navigate
    const stateOrder = (location.state as { order?: Partial<Order> })?.order;
    if (stateOrder && (!orderId || stateOrder.id === orderId)) {
      return stateOrder;
    }
    // 2. Second priority: sessionStorage snapshot saved during checkout
    try {
      const stored = sessionStorage.getItem('aroma_rose_last_order');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!orderId || parsed.id === orderId) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
    return null;
  });

  const orderNumber = order?.order_number || (orderId ? `AR-${orderId.slice(0, 8).toUpperCase()}` : 'AR-CONFIRMEE');
  const totalAmount = order?.total_amount ?? 0;
  const subtotal = order?.subtotal ?? 0;
  const shippingFee = order?.shipping_fee ?? 0;

  const whatsappMessage = `Bonjour Aroma Rose, j'ai passé la commande N° ${orderNumber} et je souhaite avoir confirmation de la date de livraison. Merci !`;
  const whatsappUrl = buildWhatsAppUrl(storeSettings?.channels?.whatsapp_number, whatsappMessage);

  return (
    <div className="py-12 md:py-20 bg-canvas min-h-screen">
      <div className="container-editorial max-w-3xl mx-auto">
        {/* Main Success Banner Card */}
        <Card className="text-center p-8 sm:p-12 mb-8 shadow-card border-sand-border">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="label-editorial text-burgundy mb-2">Maison Aroma Rose</span>
          <h1 className="text-3xl sm:text-4xl font-serif text-charcoal mb-3">
            Commande Enregistrée avec Succès
          </h1>
          <p className="text-sm font-sans text-charcoal/70 max-w-md mx-auto leading-relaxed mb-6">
            Votre commande a été transmise à notre atelier à Kelaat M’Gouna. Vos soins botaniques sont en cours de préparation.
          </p>

          {/* Reference Pill */}
          <div className="inline-flex flex-col items-center justify-center p-4 bg-canvas rounded border border-sand-border mb-6">
            <span className="text-[0.65rem] uppercase tracking-editorial text-charcoal/50 font-sans font-semibold mb-1">
              Numéro de Référence Officiel
            </span>
            <span className="font-mono text-xl font-bold text-burgundy tracking-wider">
              {orderNumber}
            </span>
            <span className="text-[0.65rem] text-charcoal/40 font-sans mt-1">
              Conservez ce numéro pour tout échange avec notre service client.
            </span>
          </div>

          {/* COD Instruction Alert */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded max-w-lg mx-auto text-left flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 font-sans leading-relaxed">
              <strong className="block font-semibold mb-0.5">Rappel : Paiement en Espèces à la Livraison</strong>
              Votre commande est en mode <strong>Cash on Delivery (COD)</strong>. Vous réglerez le montant
              {totalAmount > 0 ? (
                <> de <span className="font-semibold text-burgundy">{formatMAD(totalAmount)}</span></>
              ) : ''}{' '}
              directement au livreur lors de la remise de votre colis.
            </div>
          </div>
        </Card>

        {/* Cold Session Privacy Notice */}
        {!order && (
          <Card className="mb-8 p-6 text-center border-sand-border">
            <div className="w-12 h-12 rounded-full bg-sand/30 text-charcoal/60 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg text-charcoal mb-2">
              Détails de commande protégés
            </h3>
            <p className="text-xs text-charcoal/70 font-sans max-w-md mx-auto leading-relaxed mb-5">
              Les détails confidentiels de cette commande ne sont pas accessibles dans cette session de navigation. Notre service logistique prépare votre colis et vous contactera avant la livraison.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold uppercase tracking-editorial transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Assistance Suivi WhatsApp ({orderNumber})</span>
            </a>
          </Card>
        )}

        {/* Order Details Breakdown */}
        {order && (
          <Card className="mb-8">
            <div className="border-b border-sand-border pb-4 mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg text-charcoal">Détails de la Commande</h3>
                <span className="text-[0.65rem] uppercase tracking-editorial text-charcoal/50 font-sans">
                  Enregistrée le {formatDateTime(order.created_at || new Date().toISOString())}
                </span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-editorial px-2.5 py-1 rounded bg-sand/40 border border-sand-border text-charcoal">
                Statut : En Attente
              </span>
            </div>

            <div className="flex flex-col gap-3 text-xs font-sans">
              <div className="flex justify-between items-center text-charcoal/70">
                <span>Sous-total des soins :</span>
                <span className="font-serif text-sm font-medium text-charcoal">{formatMAD(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-charcoal/70">
                <span>Frais de livraison :</span>
                <span className="font-serif text-sm font-medium text-charcoal">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-800 font-semibold">Offerte</span>
                  ) : (
                    formatMAD(shippingFee)
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-sand-border flex justify-between items-baseline">
                <span className="text-sm font-semibold uppercase tracking-editorial text-charcoal">
                  Total Final à Payer (COD) :
                </span>
                <span className="font-serif text-2xl font-medium text-burgundy">
                  {formatMAD(totalAmount)}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Next Steps & Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <Card className="flex items-start gap-4">
            <div className="w-10 h-10 rounded bg-rose-soft text-burgundy flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-editorial text-charcoal font-sans mb-1">
                Livraison en 24h à 48h
              </h4>
              <p className="text-xs text-charcoal/65 font-sans leading-relaxed">
                Notre partenaire de livraison vous contactera par téléphone le jour de la livraison pour convenir de l'horaire précis.
              </p>
            </div>
          </Card>

          <Card className="flex items-start gap-4">
            <div className="w-10 h-10 rounded bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-editorial text-charcoal font-sans mb-1">
                Suivi de Commande WhatsApp
              </h4>
              <p className="text-xs text-charcoal/65 font-sans leading-relaxed mb-3">
                Une question sur votre livraison ? Échangez directement avec notre équipe en citant votre numéro.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.7rem] uppercase tracking-editorial font-semibold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1"
              >
                <span>Contacter par WhatsApp</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </Card>
        </div>

        {/* Return to Home Actions */}
        <div className="text-center pt-4">
          <Link to="/shop">
            <Button size="lg" variant="outline" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Poursuivre mes Découvertes
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
