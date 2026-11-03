import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Phone, MapPin, Clock, Mail, ShieldAlert } from 'lucide-react';
import { useStoreSettings } from '../../hooks/useStoreSettings';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

export const ContactPage: React.FC = () => {
  const { data: storeSettings } = useStoreSettings();

  const whatsappNumber = storeSettings?.channels?.whatsapp_number || '+212600000000';
  const whatsappUrl = buildWhatsAppUrl(
    whatsappNumber,
    "Bonjour Aroma Rose, je souhaite obtenir des informations sur vos rituels et soins botaniques."
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

        <div className="mb-12">
          <span className="label-editorial text-burgundy">Service Clientèle & Conseil</span>
          <h1 className="text-4xl sm:text-5xl font-serif text-charcoal mt-2 mb-6">
            Nous Contacter
          </h1>
          <p className="text-lg font-serif italic text-burgundy/90 leading-relaxed">
            « Une question sur un soin, une commande en cours ou besoin d’un conseil personnalisé ? Notre équipe vous répond avec écoute et bienveillance. »
          </p>
        </div>

        {/* Primary Contact Channels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* WhatsApp Channel */}
          <Card className="p-8 border-emerald-200 bg-emerald-50/30 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mb-5">
                <MessageCircle className="w-6 h-6" />
              </div>
              <span className="text-[0.68rem] uppercase tracking-editorial font-semibold text-emerald-800 font-sans block mb-1">
                Canal Privilégié & Rapide
              </span>
              <h3 className="font-serif text-2xl text-charcoal mb-3">Conseil via WhatsApp</h3>
              <p className="text-xs text-charcoal/70 font-sans leading-relaxed mb-6">
                Échangez en direct avec notre conseillère beauté pour passer commande ou poser vos questions sur l’utilisation de nos rituels.
              </p>
            </div>
            <div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-sans text-xs uppercase tracking-editorial font-semibold transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Ouvrir une discussion WhatsApp</span>
              </a>
            </div>
          </Card>

          {/* Operational Hours & Details */}
          <Card className="p-8 border-sand-border flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-burgundy shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-editorial text-charcoal font-sans mb-1">
                    Horaires d'Ouverture
                  </h4>
                  <p className="text-xs text-charcoal/70 font-sans leading-relaxed">
                    Du Lundi au Samedi : 09h00 – 19h00 (Heure du Maroc, GMT+1)
                  </p>
                  <p className="text-[0.7rem] text-charcoal/50 font-sans mt-0.5">
                    Dimanche : permanence pour les urgences d'expédition
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-burgundy shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-editorial text-charcoal font-sans mb-1">
                    Atelier & Terroir
                  </h4>
                  <p className="text-xs text-charcoal/70 font-sans leading-relaxed">
                    Kelaat M’Gouna, Province de Tinghir, Région Drâa-Tafilalet, Maroc
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-burgundy shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-editorial text-charcoal font-sans mb-1">
                    Téléphone Direct
                  </h4>
                  <p className="text-xs font-mono text-charcoal/80 font-medium">
                    {whatsappNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-burgundy shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-editorial text-charcoal font-sans mb-1">
                    Courrier Électronique
                  </h4>
                  <p className="text-xs font-mono text-charcoal/80">
                    contact@aromarose.ma
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Order Guidance Note */}
        <div className="p-5 rounded bg-sand/30 border border-sand-border flex items-start gap-3.5 mb-12">
          <ShieldAlert className="w-5 h-5 text-burgundy shrink-0 mt-0.5" />
          <div className="text-xs text-charcoal/75 font-sans leading-relaxed">
            <strong className="font-semibold text-charcoal block mb-0.5">
              Suivi d’une commande existante :
            </strong>
            Afin d'accélérer le traitement de votre demande, merci de nous communiquer votre référence de commande (ex : <span className="font-mono text-burgundy">AR-XXXXXX</span>) figurant sur votre page de confirmation ou dans votre historique d'échanges.
          </div>
        </div>

        <div className="pt-8 border-t border-sand-border flex items-center justify-between">
          <Link to="/shop">
            <Button size="lg" variant="primary">
              Découvrir la boutique en ligne
            </Button>
          </Link>
          <Link
            to="/shipping"
            className="text-xs uppercase tracking-editorial font-semibold text-burgundy hover:text-burgundy-deep"
          >
            Consulter les modalités de livraison →
          </Link>
        </div>
      </div>
    </div>
  );
};
