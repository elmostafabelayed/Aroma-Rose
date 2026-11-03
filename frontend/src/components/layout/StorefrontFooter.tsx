import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Sparkles, HeartHandshake } from 'lucide-react';

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
            <div className="p-2.5 rounded bg-rose-soft text-burgundy shrink-0">
              <Sparkles className="w-5 h-5" />
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
            <div className="p-2.5 rounded bg-rose-soft text-burgundy shrink-0">
              <ShieldCheck className="w-5 h-5" />
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
          {/* Brand Philosophy */}
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
            <div className="pt-2">
              <span className="text-[0.68rem] tracking-editorial uppercase text-charcoal/50 font-semibold block">
                Origine : Kelaat M'Gouna, Tinghir, Maroc
              </span>
            </div>
          </div>

          {/* Catalog Navigation */}
          <div className="md:col-span-2 md:col-start-7 flex flex-col gap-3">
            <h5 className="text-[0.72rem] uppercase font-semibold tracking-editorial text-charcoal font-sans mb-1">
              Soins & Rituels
            </h5>
            <ul className="flex flex-col gap-2 text-xs text-charcoal/75 font-sans">
              <li><Link to="/shop?category=eaux-florales" className="hover:text-burgundy transition-colors">Eaux Florales</Link></li>
              <li><Link to="/shop?category=huiles-serums" className="hover:text-burgundy transition-colors">Huiles & Sérums</Link></li>
              <li><Link to="/shop?category=soins-visage" className="hover:text-burgundy transition-colors">Soins Visage</Link></li>
              <li><Link to="/shop?category=soins-corps" className="hover:text-burgundy transition-colors">Soins Corps</Link></li>
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

