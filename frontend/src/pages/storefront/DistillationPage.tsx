import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Flame, Droplets, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const DistillationPage: React.FC = () => {
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
          <span className="label-editorial text-burgundy">Savoir-Faire Ancestral</span>
          <h1 className="text-4xl sm:text-5xl font-serif text-charcoal mt-2 mb-6">
            L'Art de la Distillation à la Vapeur
          </h1>
          <p className="text-lg font-serif italic text-burgundy/90 leading-relaxed">
            « Une extraction douce et lente qui capture la quintessence vivante de la Rose de Damas sans en altérer la délicatesse moléculaire. »
          </p>
        </div>

        <div className="prose prose-stone max-w-none text-charcoal/80 text-sm font-sans leading-relaxed space-y-6">
          <p>
            À Kelaat M’Gouna, la distillation de la <em>Rosa Damascena</em> est un rituel immuable qui débute dès les premières lueurs du jour. Entre mai et juin, les fleurs cueillies avant le lever du soleil sont acheminées immédiatement vers les alambics pour éviter toute oxydation ou déperdition des essences volatiles sous la chaleur matinale.
          </p>

          <p>
            Contrairement aux procédés industriels à haute température ou aux solvants chimiques, la méthode traditionnelle par entraînement à la vapeur d'eau douce opère à basse pression. La vapeur traverse le lit de pétales de roses fraîches, libérant avec bienveillance les principes actifs hydrosolubles et les micro-gouttelettes d'huile essentielle.
          </p>

          {/* Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10 not-prose">
            <div className="bg-white border border-sand-border rounded p-6 shadow-subtle">
              <Flame className="w-6 h-6 text-burgundy mb-3" />
              <h3 className="font-serif text-base text-charcoal mb-1">Chauffe Basse Pression</h3>
              <p className="text-xs text-charcoal/60 leading-relaxed font-sans">
                Préservation intégrale des composés thermolabiles et des propriétés tonifiantes de la fleur.
              </p>
            </div>

            <div className="bg-white border border-sand-border rounded p-6 shadow-subtle">
              <Droplets className="w-6 h-6 text-rose mb-3" />
              <h3 className="font-serif text-base text-charcoal mb-1">Ratio 1:1 d'Exception</h3>
              <p className="text-xs text-charcoal/60 leading-relaxed font-sans">
                Un kilogramme de roses fraîches pour un litre d'eau florale pure, garantissant une concentration maximale.
              </p>
            </div>

            <div className="bg-white border border-sand-border rounded p-6 shadow-subtle">
              <ShieldCheck className="w-6 h-6 text-sage mb-3" />
              <h3 className="font-serif text-base text-charcoal mb-1">Pureté Non Diluée</h3>
              <p className="text-xs text-charcoal/60 leading-relaxed font-sans">
                Sans conservateurs artificiels, sans alcool et sans ajout d'arômes de synthèse.
              </p>
            </div>
          </div>

          <p>
            En traversant le serpentin de refroidissement baigné par les eaux pures issues des cimes de l'Atlas, la vapeur se condense en deux fractions précieuses : l'eau florale pure hautement chargée en molécules aromatiques apaisantes, et à sa surface, quelques gouttes d'huile essentielle pure — le fameux attar de rose.
          </p>

          <p>
            Chaque flacon Aroma Rose est le témoin de cette alchimie entre rigueur botanique et respect des traditions marocaines.
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-sand-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/shop?category=eaux-florales">
            <Button size="lg" variant="primary" rightIcon={<Sparkles className="w-4 h-4" />}>
              Découvrir nos Eaux Florales Pures
            </Button>
          </Link>
          <Link
            to="/terroir"
            className="text-xs uppercase tracking-editorial font-semibold text-burgundy hover:text-burgundy-deep"
          >
            Explorer le Terroir de Kelaat M'Gouna →
          </Link>
        </div>
      </div>
    </div>
  );
};
