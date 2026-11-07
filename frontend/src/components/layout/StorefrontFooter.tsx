import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Sparkles, HeartHandshake, MapPin, Instagram, Facebook } from 'lucide-react';
import { OFFICIAL_CONTACT_LINKS } from '../../constants/contact';

export const StorefrontFooter: React.FC = () => {
  return (
    <footer className="bg-canvas border-t border-sand-border pt-16 pb-12 mt-auto">
      {/* Service Highlights Bar */}
      <div className="container-editorial mb-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-8 border-y border-sand-border">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded bg-rose-soft text-burgundy shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-editorial text-charcoal font-sans mb-1">
                Expédition Express
              </h4>
              <p className="text-xs text-charcoal/65 leading-relaxed">
                Livraison en 24h à 48h partout au Maroc. Gratuite dès 300 MAD d'achat.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded bg-rose-soft text-burgundy shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-editorial text-charcoal font-sans mb-1">
                Paiement à la livraison
              </h4>
              <p className="text-xs text-charcoal/65 leading-relaxed">
                Réglez votre commande en espèces à la réception de votre colis.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded bg-sage-soft text-sage-dark shrink-0">
              <Sparkles className="w-5 h-5 text-sage" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-editorial text-charcoal font-sans mb-1">
                Terroir de Kelaat M'Gouna
              </h4>
              <p className="text-xs text-charcoal/65 leading-relaxed">
                100% Rosa Damascena pure récoltée à la main à l'aube dans la Vallée du Dadès.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded bg-sage-soft text-sage-dark shrink-0">
              <ShieldCheck className="w-5 h-5 text-sage" />
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-editorial text-charcoal font-sans mb-1">
                Formules Botaniques Pures
              </h4>
              <p className="text-xs text-charcoal/65 leading-relaxed">
                Sans conservateurs synthétiques, sans parabènes, non testé sur les animaux.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container-editorial">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12">
          {/* Brand Philosophy, Cooperative Location & Social Media */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <Link to="/" className="inline-block group focus:outline-none">
              <img
                src="/images/logo.webp"
                alt="Aroma Rose"
                className="h-14 sm:h-16 w-auto object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.05)] group-hover:scale-[1.03] transition-transform duration-200"
              />
            </Link>
            <p className="text-xs text-charcoal/70 leading-relaxed font-sans max-w-sm">
              Maison de haute cosmétique botanique inspirée des traditions ancestrales de la Vallée des Roses. Nous distillons la quintessence de la Rose de Damas pour offrir des rituels de beauté purs, bienfaisants et authentiques.
            </p>

            {/* Cooperative Location (Google Maps) */}
            <div className="pt-1">
              <span className="text-[0.68rem] tracking-editorial uppercase text-charcoal/50 font-semibold block mb-1">
                Atelier & Terroir :
              </span>
              <a
                href={OFFICIAL_CONTACT_LINKS.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-start sm:items-center gap-2 text-xs text-burgundy hover:text-burgundy-deep font-medium transition-colors group max-w-full"
                aria-label="Localiser la Coopérative Rosa M'Goun à Kelaat M'Gouna sur Google Maps (ouvre un nouvel onglet)"
                title="Coopérative Rosa M'Goun sur Google Maps"
              >
                <MapPin className="w-4 h-4 shrink-0 text-burgundy group-hover:scale-110 transition-transform mt-0.5 sm:mt-0" />
                <span className="underline decoration-sand-border hover:decoration-burgundy break-words">
                  Coopérative Rosa M'Goun : Kelaat M'Gouna, Tinghir (Google Maps)
                </span>
              </a>
            </div>

            {/* Social Media Channels */}
            <div className="pt-2">
              <span className="text-[0.68rem] tracking-editorial uppercase text-charcoal/50 font-semibold block mb-2">
                Suivez la Coopérative :
              </span>
              <div className="flex items-center gap-3">
                <a
                  href={OFFICIAL_CONTACT_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Suivre la Coopérative Rosa M'Goun sur Instagram (ouvre un nouvel onglet)"
                  title="Instagram @cooperativerosamgoun"
                  className="w-8 h-8 rounded-full border border-sand-border bg-white text-charcoal/75 hover:text-burgundy hover:border-burgundy flex items-center justify-center transition-all duration-200 shadow-subtle hover:scale-105 focus:outline-none focus:ring-2 focus:ring-burgundy/30"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href={OFFICIAL_CONTACT_LINKS.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Suivre Aroma Rose sur Facebook (ouvre un nouvel onglet)"
                  title="Facebook @kacihassan"
                  className="w-8 h-8 rounded-full border border-sand-border bg-white text-charcoal/75 hover:text-burgundy hover:border-burgundy flex items-center justify-center transition-all duration-200 shadow-subtle hover:scale-105 focus:outline-none focus:ring-2 focus:ring-burgundy/30"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href={OFFICIAL_CONTACT_LINKS.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Échanger avec notre équipe sur WhatsApp (ouvre un nouvel onglet)"
                  title="WhatsApp (+212 606-010908)"
                  className="w-8 h-8 rounded-full border border-sand-border bg-white text-[#25D366] hover:bg-[#25D366] hover:text-white hover:border-[#25D366] flex items-center justify-center transition-all duration-200 shadow-subtle hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#25D366]/30"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                    <path d="M17.507 14.307l-.009.075c-.238-.12-1.406-.694-1.624-.774-.219-.079-.378-.12-.538.12-.16.239-.617.774-.756.934-.14.16-.279.18-.518.06-.239-.12-1.01-.372-1.925-1.188-.712-.635-1.193-1.42-1.332-1.66-.14-.239-.015-.368.105-.487.108-.107.239-.279.359-.419.119-.14.159-.239.239-.398.079-.16.04-.299-.02-.419-.06-.12-.538-1.295-.737-1.774-.194-.467-.393-.404-.538-.412l-.46-.008c-.16 0-.419.06-.638.299-.219.24-.837.818-.837 1.994 0 1.176.857 2.311.977 2.471.12.16 1.688 2.578 4.09 3.614.572.247 1.018.394 1.366.505.574.183 1.097.157 1.51.095.46-.07 1.406-.575 1.605-1.13.199-.556.199-1.033.14-1.13-.06-.098-.219-.158-.458-.278z" />
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.975-1.403C8.423 21.492 10.15 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.182c-1.63 0-3.14-.492-4.402-1.337l-.315-.21-2.955.833.805-2.88-.228-.328C3.992 15.02 3.818 13.548 3.818 12c0-4.512 3.67-8.182 8.182-8.182 4.511 0 8.182 3.67 8.182 8.182 0 4.512-3.671 8.182-8.182 8.182z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Catalog Navigation */}
          <div className="md:col-span-2 md:col-start-7 flex flex-col gap-3">
            <h5 className="text-[0.72rem] uppercase font-semibold tracking-editorial text-charcoal font-sans mb-1">
              Soins & Rituels
            </h5>
            <ul className="flex flex-col gap-2 text-xs text-charcoal/75 font-sans">
              <li><Link to="/shop?category=soins-du-visage" className="hover:text-burgundy transition-colors">Soins du Visage</Link></li>
              <li><Link to="/shop?category=eaux-et-huiles" className="hover:text-burgundy transition-colors">Eaux & Huiles</Link></li>
              <li><Link to="/shop?category=parfums-et-deodorants" className="hover:text-burgundy transition-colors">Parfums & Déodorants</Link></li>
              <li><Link to="/shop?category=soins-des-cheveux" className="hover:text-burgundy transition-colors">Soins des Cheveux</Link></li>
              <li><Link to="/shop?category=soins-du-corps" className="hover:text-burgundy transition-colors">Soins du Corps</Link></li>
            </ul>
          </div>

          {/* Maison & Heritage */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <h5 className="text-[0.72rem] uppercase font-semibold tracking-editorial text-charcoal font-sans mb-1">
              La Maison
            </h5>
            <ul className="flex flex-col gap-2 text-xs text-charcoal/75 font-sans">
              <li><Link to="/about" className="hover:text-burgundy transition-colors">Notre Histoire</Link></li>
              <li><Link to="/terroir" className="hover:text-burgundy transition-colors">La Vallée du Dadès</Link></li>
              <li><Link to="/distillation" className="hover:text-burgundy transition-colors">Art de la Distillation</Link></li>
              <li><Link to="/contact" className="hover:text-burgundy transition-colors">Nous Contacter</Link></li>
            </ul>
          </div>

          {/* Legal & Orders */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <h5 className="text-[0.72rem] uppercase font-semibold tracking-editorial text-charcoal font-sans mb-1">
              Service Client
            </h5>
            <ul className="flex flex-col gap-2 text-xs text-charcoal/75 font-sans">
              <li><Link to="/shipping" className="hover:text-burgundy transition-colors">Livraison & Retours</Link></li>
              <li><Link to="/terms" className="hover:text-burgundy transition-colors">Conditions Générales</Link></li>
              <li><Link to="/privacy" className="hover:text-burgundy transition-colors">Confidentialité</Link></li>
              <li>
                <a
                  href={OFFICIAL_CONTACT_LINKS.googleMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-burgundy transition-colors inline-flex items-center gap-1.5"
                  title="Localiser la coopérative sur Google Maps"
                >
                  <MapPin className="w-3.5 h-3.5 text-burgundy shrink-0" />
                  <span>Coopérative (Maps)</span>
                </a>
              </li>
              <li><Link to="/admin/login" className="hover:text-burgundy transition-colors text-charcoal/40">Espace Admin</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-footer */}
        <div className="pt-8 border-t border-sand-border/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-charcoal/50 font-sans">
          <p>© {new Date().getFullYear()} Aroma Rose. Tous droits réservés.</p>
          <p className="text-[0.7rem] uppercase tracking-editorial">
            Conçu avec passion pour la rose marocaine
          </p>
        </div>
      </div>
    </footer>
  );
};

