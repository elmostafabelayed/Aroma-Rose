import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Lock, Info, MessageCircle, Database } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { useStoreSettings } from '../../hooks/useStoreSettings';
import { buildWhatsAppUrl } from '../../utils/whatsapp';

export const PrivacyPage: React.FC = () => {
  const { data: storeSettings } = useStoreSettings();
  const whatsappNumber = storeSettings?.channels?.whatsapp_number || '+212600000000';
  const whatsappUrl = buildWhatsAppUrl(
    whatsappNumber,
    "Bonjour Aroma Rose, j'ai une question concernant la protection de mes données personnelles."
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
          <span className="label-editorial text-burgundy">Respect de la Vie Privée</span>
          <h1 className="text-4xl sm:text-5xl font-serif text-charcoal mt-2 mb-4">
            Politique de Confidentialité
          </h1>
          <p className="text-base font-serif italic text-charcoal/70">
            Protection et traitement des données personnelles dans le cadre du shopping invité.
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
              Aroma Rose applique les normes de sobriété des données. Nous ne collectons que les éléments strictement nécessaires à la confection et à la remise sécurisée de votre colis.
            </p>
          </div>
        </div>

        {/* Privacy Principles */}
        <div className="bg-white border border-sand-border rounded p-6 sm:p-10 space-y-8 text-xs sm:text-sm font-sans text-charcoal/80 leading-relaxed">
          <section>
            <h2 className="font-serif text-lg text-charcoal mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-burgundy" />
              <span>1. Principe de Sobriété & Commande Sans Compte</span>
            </h2>
            <p>
              Pour commander sur Aroma Rose, aucune création de mot de passe ni de compte persistant n'est exigée. Vous commandez librement en mode Invité (Guest Checkout).
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg text-charcoal mb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-burgundy" />
              <span>2. Données Strictement Nécessaires Collectées</span>
            </h2>
            <p className="mb-3">
              Lors de la passation de commande, seules les informations suivantes sont enregistrées :
            </p>
            <ul className="list-disc list-inside space-y-1 text-charcoal/70 text-xs sm:text-sm">
              <li><strong>Nom et Prénom :</strong> identification de la commande et bordereau de remise ;</li>
              <li><strong>Numéro de téléphone marocain :</strong> contact du livreur pour coordonner la remise en main propre ;</li>
              <li><strong>Ville et Adresse de livraison :</strong> destination du colis ;</li>
              <li><strong>Adresse e-mail (facultative) :</strong> envoi d'une trace numérique de commande si souhaitée ;</li>
              <li><strong>Instructions particulières (facultatives) :</strong> indications d'accès destinées au livreur.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-lg text-charcoal mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-burgundy" />
              <span>3. Absence Totale de Coordonnées Bancaires</span>
            </h2>
            <p>
              Puisque nos commandes sont réglées exclusivement en espèces lors de la livraison (COD), aucune carte bancaire, compte bancaire ou information financière n'est requise, collectée ni stockée sur nos serveurs.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg text-charcoal mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-burgundy" />
              <span>4. Non-Divulgation & Sécurité</span>
            </h2>
            <p>
              Vos coordonnées personnelles ne sont ni vendues, ni louées, ni cédées à des régies publicitaires tierces. Elles ne sont partagées qu'avec nos prestataires logistiques strictement dans le but d'acheminer votre commande.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg text-charcoal mb-2 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-burgundy" />
              <span>5. Vos Droits & Contact</span>
            </h2>
            <p>
              Vous pouvez à tout moment demander la consultation, la rectification ou l'effacement de vos coordonnées de contact en écrivant à notre service client sur WhatsApp ou par e-mail à <span className="font-mono text-burgundy">contact@aromarose.ma</span>.
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
            <span>Contacter le Délégué Clientèle WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
