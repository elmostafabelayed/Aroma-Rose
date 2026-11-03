import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Droplets, Heart } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const AboutPage: React.FC = () => {
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
          <span className="label-editorial text-burgundy">Notre Histoire</span>
          <h1 className="text-4xl sm:text-5xl font-serif text-charcoal mt-2 mb-6">
            Maison Aroma Rose
          </h1>
          <p className="text-lg font-serif italic text-burgundy/90 leading-relaxed">
            « Préserver l’âme de la Rose de Damas dans son expression la plus pure, entre mémoire berbère et haute cosmétique botanique contemporaine. »
          </p>
        </div>

        <div className="prose prose-stone max-w-none text-charcoal/80 text-sm font-sans leading-relaxed space-y-6">
          <p>
            Aroma Rose est née au cœur de Kelaat M’Gouna, cité légendaire de la Vallée des Roses blottie entre les crêtes du Haut Atlas et les gorges spectaculaires du Dadès. Depuis des siècles, les femmes de la vallée perpétuent le rituel de la cueillette matinale des roses de Damas, lorsque les pétales sont encore baignés de rosée et gorgés de principes actifs.
          </p>

          <p>
            Face à l'industrialisation des soins cosmétiques et l'usage croissant de parfums de synthèse, notre maison a fait le choix de l'exigence absolue : valoriser les récoltes locales à travers une distillation artisanale lente, dans le respect des cycles de la nature et de la dignité des productrices et distillateurs locaux.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10 not-prose">
            <div className="bg-white border border-sand-border rounded p-6 shadow-subtle">
              <Droplets className="w-6 h-6 text-burgundy mb-3" />
              <h3 className="font-serif text-base text-charcoal mb-1">Pureté Intégrale</h3>
              <p className="text-xs text-charcoal/60 leading-relaxed font-sans">
                Aucune dilution superflue, aucun conservateur synthétique, formulation clean et saine.
              </p>
            </div>

            <div className="bg-white border border-sand-border rounded p-6 shadow-subtle">
              <Sparkles className="w-6 h-6 text-burgundy mb-3" />
              <h3 className="font-serif text-base text-charcoal mb-1">Cueillette à la Main</h3>
              <p className="text-xs text-charcoal/60 leading-relaxed font-sans">
                Récolte artisanale à l'aube pour capturer la fraîcheur moléculaire intacte de la fleur.
              </p>
            </div>

            <div className="bg-white border border-sand-border rounded p-6 shadow-subtle">
              <Heart className="w-6 h-6 text-burgundy mb-3" />
              <h3 className="font-serif text-base text-charcoal mb-1">Commerce Équitable</h3>
              <p className="text-xs text-charcoal/60 leading-relaxed font-sans">
                Partenariats directs et pérennes avec les coopératives agricoles de Kelaat M'Gouna.
              </p>
            </div>
          </div>

          <p>
            Nos flacons sont scellés directement au Maroc et distribués avec soin partout dans le royaume, avec la garantie d'une expérience authentique, sans compromis sur la qualité.
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-sand-border flex items-center justify-between">
          <Link to="/shop">
            <Button size="lg" variant="primary">
              Découvrir nos créations
            </Button>
          </Link>
          <Link to="/terroir" className="text-xs uppercase tracking-editorial font-semibold text-burgundy hover:text-burgundy-deep">
            En savoir plus sur le Terroir →
          </Link>
        </div>
      </div>
    </div>
  );
};
