import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Info, MessageCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useStoreSettings } from '../../hooks/useStoreSettings';
import { buildWhatsAppUrl } from '../../utils/whatsapp';

export const TermsPage: React.FC = () => {
  const { data: storeSettings } = useStoreSettings();
  const whatsappNumber = storeSettings?.channels?.whatsapp_number || '+212600000000';
  const whatsappUrl = buildWhatsAppUrl(
    whatsappNumber,
    "Bonjour Aroma Rose, j'ai une question relative aux Conditions Générales de Vente."
  );

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

        <div className="mb-8">
          <span className="label-editorial text-burgundy">Cadre Contractuel</span>
          <h1 className="text-4xl sm:text-5xl font-serif text-charcoal mt-2 mb-4">
            Conditions Générales de Vente
          </h1>
          <p className="text-base font-serif italic text-charcoal/70">
            Modalités applicables aux commandes de soins botaniques passées sur la boutique en ligne Aroma Rose.
          </p>
        </div>

        {/* Disclaimer / Status Banner */}
        <div className="mb-10 p-4 rounded bg-rose-soft/40 border border-sand-border flex items-start gap-3">
          <Info className="w-5 h-5 text-burgundy shrink-0 mt-0.5" />
          <div className="text-xs text-charcoal/80 font-sans leading-relaxed">
            <span className="inline-block px-2 py-0.5 rounded bg-sand/60 text-burgundy font-semibold uppercase tracking-wider text-[0.65rem] mb-1">
              Informations en cours d'actualisation — Service client disponible sur WhatsApp
            </span>
            <p>
              Ce document présente les principes commerciaux généraux régissant les transactions sur Aroma Rose au Maroc. Pour toute précision contractuelle ou question d’ordre juridique, notre équipe d'assistance reste à votre entière disposition.
            </p>
          </div>
        </div>

        {/* Terms Content */}
        <div className="bg-white border border-sand-border rounded p-6 sm:p-10 space-y-8 text-xs sm:text-sm font-sans text-charcoal/80 leading-relaxed">
          <section>
            <h2 className="font-serif text-lg text-charcoal mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-burgundy" />
              <span>1. Objet & Présentation de la Maison</span>
            </h2>
            <p>
              Les présentes Conditions Générales de Vente (CGV) encadrent les ventes à distance de produits de beauté et soins botaniques à base de Rose de Damas, confectionnés et commercialisés par la Maison Aroma Rose à Kelaat M’Gouna (Maroc).
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg text-charcoal mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-burgundy" />
              <span>2. Prix & Disponibilité des Produits</span>
            </h2>
            <p className="mb-2">
              Les prix de nos soins sont indiqués en Dirhams Marocains (MAD), toutes taxes applicables comprises. Les frais d'expédition sont calculés et affichés clairement lors de l'étape de validation du panier.
            </p>
            <p className="text-xs text-charcoal/60">
              Nos produits sont confectionnés de manière artisanale en séries limitées. Les offres sont valables tant qu'elles sont visibles sur le catalogue en ligne et dans la limite des stocks disponibles à notre atelier.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg text-charcoal mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-burgundy" />
              <span>3. Commande & Mode Invité</span>
            </h2>
            <p>
              Afin de faciliter l'expérience d'achat et respecter la liberté des clients, Aroma Rose propose la commande directe en mode invité (Guest Checkout) sans obligation de créer un compte. La validation de la commande génère un numéro de référence unique (AR-XXXXXX) garantissant la traçabilité logistique.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg text-charcoal mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-burgundy" />
              <span>4. Modalités de Paiement (Paiement à la Livraison)</span>
            </h2>
            <p>
              En version 1.0, le seul mode de paiement accepté est le <strong>Paiement en Espèces à la Livraison (Cash on Delivery / COD)</strong>. Le client s'engage à régler le montant total exact mentionné sur son bordereau directement au livreur lors de la remise de son colis.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg text-charcoal mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-burgundy" />
              <span>5. Expédition & Réclamations</span>
            </h2>
            <p className="mb-2">
              Les livraisons sont assurées sur l'ensemble du territoire marocain dans un délai indicatif de 24h à 48h ouvrables.
            </p>
            <p>
              Le client est tenu de contrôler l'état du colis à la remise. En cas de constat d'article endommagé ou manquant, le client est invité à contacter sans délai notre service client via WhatsApp en fournissant les photographies justificatives nécessaires.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-sand-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/shop">
            <Button size="lg" variant="primary">
              Retour à la Boutique
            </Button>
          </Link>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-editorial font-semibold text-emerald-800 hover:text-emerald-950"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Assistance Client WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
