import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Truck, Banknote, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { useStoreSettings } from '../../hooks/useStoreSettings';
import { formatMAD } from '../../utils/formatters';

export const ShippingPolicyPage: React.FC = () => {
  const { data: storeSettings } = useStoreSettings();
  const standardFee = storeSettings?.shipping?.standard_fee ?? 30;
  const freeThreshold = storeSettings?.shipping?.free_shipping_threshold ?? 300;

  return (
    <div className="py-16 md:py-24 bg-canvas min-h-screen">
      <div className="container-editorial max-w-4xl mx-auto">
        <Link
          to="/"
          className="text-xs uppercase tracking-editorial font-semibold text-charcoal/60 hover:text-burgundy inline-flex items-center gap-1.5 transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour à l’accueil</span>
        </Link>

        <div className="mb-12">
          <span className="label-editorial text-burgundy">Transparence Logistique</span>
          <h1 className="text-4xl sm:text-5xl font-serif text-charcoal mt-2 mb-6">
            Livraison & Expédition
          </h1>
          <p className="text-lg font-serif italic text-burgundy/90 leading-relaxed">
            « Nous apportons le plus grand soin à l'emballage et au transport de vos flacons précieux, expédiés avec rapidité dans toutes les villes du Maroc. »
          </p>
        </div>

        {/* Key Delivery Facts Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 border-sand-border">
            <Clock className="w-6 h-6 text-burgundy mb-3" />
            <h3 className="font-serif text-base text-charcoal mb-1">Délai 24h à 48h</h3>
            <p className="text-xs text-charcoal/70 font-sans leading-relaxed">
              Expédition express depuis notre atelier dès la confirmation de votre panier.
            </p>
          </Card>

          <Card className="p-6 border-sand-border">
            <Truck className="w-6 h-6 text-burgundy mb-3" />
            <h3 className="font-serif text-base text-charcoal mb-1">
              Gratuit dès {formatMAD(freeThreshold)}
            </h3>
            <p className="text-xs text-charcoal/70 font-sans leading-relaxed">
              Tarif standard de {formatMAD(standardFee)} pour les paniers inférieurs au seuil.
            </p>
          </Card>

          <Card className="p-6 border-sand-border">
            <Banknote className="w-6 h-6 text-burgundy mb-3" />
            <h3 className="font-serif text-base text-charcoal mb-1">Paiement à la Livraison</h3>
            <p className="text-xs text-charcoal/70 font-sans leading-relaxed">
              Règlement en espèces (COD) à la réception en main propre de votre colis.
            </p>
          </Card>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-sm font-sans text-charcoal/80 leading-relaxed">
          <section className="bg-white border border-sand-border rounded p-6 sm:p-8">
            <h2 className="font-serif text-xl text-charcoal mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-burgundy" />
              <span>Zone de Couverture</span>
            </h2>
            <p className="mb-3">
              Nous livrons dans l'ensemble des villes et provinces du Royaume du Maroc (Casablanca, Rabat, Marrakech, Fès, Tanger, Agadir, Oujda, Meknès, Tinghir, Ouarzazate, etc.).
            </p>
            <p className="text-xs text-charcoal/60">
              Pour certaines localités reculées du Moyen ou Haut Atlas, un délai additionnel de 24h peut être requis selon les tournées de notre partenaire transporteur.
            </p>
          </section>

          <section className="bg-white border border-sand-border rounded p-6 sm:p-8">
            <h2 className="font-serif text-xl text-charcoal mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-burgundy" />
              <span>Déroulement de la Livraison</span>
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-charcoal/75">
              <li>
                <strong>Confirmation & Préparation :</strong> Votre commande est préparée avec soin et conditionnée dans des matériaux de calage protecteurs.
              </li>
              <li>
                <strong>Appel du livreur :</strong> Le jour de la livraison, le livreur vous contacte préalablement par téléphone pour valider votre disponibilité et convenir du créneau de passage.
              </li>
              <li>
                <strong>Remise en main propre :</strong> Vous vérifiez l'intégrité extérieure de votre colis et réglez le montant exact en espèces.
              </li>
            </ol>
          </section>

          <section className="bg-white border border-sand-border rounded p-6 sm:p-8">
            <h2 className="font-serif text-xl text-charcoal mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-burgundy" />
              <span>Protection & Réception du Colis</span>
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed mb-3">
              Nos flacons en verre brun et blanc sont scellés hermétiquement. En cas d'avarie constatée lors de la remise en main propre (flacon endommagé ou colis écrasé), nous vous invitons à le refuser auprès du livreur ou à photographier le colis et contacter immédiatement notre service client WhatsApp pour un remplacement immédiat.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-sand-border flex items-center justify-between">
          <Link to="/shop">
            <Button size="lg" variant="primary">
              Commencer mes Achats
            </Button>
          </Link>
          <Link
            to="/contact"
            className="text-xs uppercase tracking-editorial font-semibold text-burgundy hover:text-burgundy-deep"
          >
            Une question ? Contactez notre support →
          </Link>
        </div>
      </div>
    </div>
  );
};
