import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mountain, Sun, Sparkles } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const TerroirPage: React.FC = () => {
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
          <span className="label-editorial text-burgundy">Kelaat M’Gouna & La Vallée du Dadès</span>
          <h1 className="text-4xl sm:text-5xl font-serif text-charcoal mt-2 mb-6">
            Le Terroir d'Exception
          </h1>
          <p className="text-lg font-serif italic text-burgundy/90 leading-relaxed">
            « Entre monts ocres de l’Atlas et cours d'eau cristallins du Dadès, une alchimie naturelle préservée à 1 500 mètres d'altitude. »
          </p>
        </div>

        <div className="prose prose-stone max-w-none text-charcoal/80 text-sm font-sans leading-relaxed space-y-6">
          <p>
            La Vallée des Roses s'étend le long de l'oued M'Goun et de l'oued Dadès, dans la province de Tinghir. C’est dans ce paysage grandiose, abrité des vents sahariens par la muraille minérale du Mgoun, que la <em>Rosa Damascena</em> a trouvé sa terre d'élection au Maroc au Xe siècle.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10 not-prose">
            <div className="bg-white border border-sand-border rounded p-6 shadow-subtle">
              <Mountain className="w-6 h-6 text-burgundy mb-3" />
              <h3 className="font-serif text-base text-charcoal mb-1">Altitude 1 500 m</h3>
              <p className="text-xs text-charcoal/60 leading-relaxed font-sans">
                L'amplitude thermique entre nuits fraîches et journées ensoleillées stimule la biosynthèse des composés aromatiques.
              </p>
            </div>

            <div className="bg-white border border-sand-border rounded p-6 shadow-subtle">
              <Sun className="w-6 h-6 text-burgundy mb-3" />
              <h3 className="font-serif text-base text-charcoal mb-1">Ensoleillement Pur</h3>
              <p className="text-xs text-charcoal/60 leading-relaxed font-sans">
                Plus de 300 jours d'azur par an, sans pollution atmosphérique urbaine ou industrielle.
              </p>
            </div>

            <div className="bg-white border border-sand-border rounded p-6 shadow-subtle">
              <Sparkles className="w-6 h-6 text-burgundy mb-3" />
              <h3 className="font-serif text-base text-charcoal mb-1">Eaux de Fonte</h3>
              <p className="text-xs text-charcoal/60 leading-relaxed font-sans">
                Irrigation séculaire par seguias traditionnelles alimentées par la fonte des neiges de l'Atlas.
              </p>
            </div>
          </div>

          <p>
            Chaque fleur est traitée dans les heures qui suivent sa cueillette. Pour obtenir un seul litre d'huile essentielle pure de rose (l'Attar), près de 4 tonnes de pétales de rose fraîches sont requises. C'est cette rareté qui fait de nos soins des trésors précieux pour la peau.
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-sand-border flex items-center justify-between">
          <Link to="/shop">
            <Button size="lg" variant="primary">
              Découvrir les rituels issus de ce terroir
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
