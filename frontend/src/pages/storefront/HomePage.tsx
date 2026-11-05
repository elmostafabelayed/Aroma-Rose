import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Droplets,
  ShieldCheck,
  ShoppingBag,
  MessageCircle,
  Truck,
  Flame,
  Leaf,
  Mail,
} from 'lucide-react';
import { usePublicProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useStoreSettings } from '../../hooks/useStoreSettings';
import { useCart } from '../../hooks/useCart';
import { useToast } from '../../context/ToastContext';
import { formatMAD } from '../../utils/formatters';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { Spinner } from '../../components/common/Spinner';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Button } from '../../components/common/Button';

export const HomePage: React.FC = () => {
  const { data: categoriesData, isLoading: loadingCategories } = useCategories();
  const { data: productsData, isLoading: loadingProducts, error: productsError, refetch } = usePublicProducts({
    limit: 6,
  });
  const { data: storeSettings } = useStoreSettings();
  const { addItem } = useCart();
  const { success } = useToast();

  const handleAddToCart = (e: React.MouseEvent, productId: string, productName: string) => {
    e.preventDefault();
    addItem(productId, 1);
    success('Rituel ajouté au panier', `${productName} a été ajouté à votre sélection.`);
  };

  const whatsappUrl = buildWhatsAppUrl(
    storeSettings?.channels?.whatsapp_number,
    "Bonjour Aroma Rose, j'aimerais en savoir plus sur vos soins botaniques de Kelaat M'Gouna."
  );

  return (
    <div className="flex flex-col">
      {/* Editorial Hero Section */}
      <section className="relative overflow-hidden bg-canvas border-b border-sand-border py-20 md:py-32">
        <div className="container-editorial relative z-10">
          <div className="max-w-2xl flex flex-col items-start gap-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sage-soft border border-sage-border">
              <Leaf className="w-3.5 h-3.5 text-sage" />
              <span className="text-[0.68rem] uppercase font-semibold tracking-editorial text-sage-dark font-sans">
                Haute Cosmétique Botanique du Maroc • Kelaat M'Gouna
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal text-charcoal leading-[1.15] tracking-tight">
              Quintessence Botanique de <span className="italic text-burgundy">Kelaat M’Gouna</span>
            </h1>

            <p className="text-base sm:text-lg text-charcoal/75 font-sans leading-relaxed max-w-xl">
              Des rituels de beauté purs et bienfaisants, nés de la distillation artisanale des roses de Damas cueillies à la main aux premières lueurs du jour dans la Vallée du Dadès.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to="/shop">
                <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Découvrir la Boutique
                </Button>
              </Link>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" leftIcon={<MessageCircle className="w-4 h-4 text-sage" />}>
                  Conseil WhatsApp
                </Button>
              </a>
            </div>

            {/* Quick value badges */}
            <div className="flex items-center gap-6 pt-6 text-xs text-charcoal/70 font-sans border-t border-sand-border/80 w-full">
              <span className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-sage" />
                100% Rosa Damascena pure
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sage" />
                Paiement à la livraison (COD)
              </span>
              <span className="flex items-center gap-1.5 hidden sm:flex">
                <Truck className="w-4 h-4 text-sage" />
                Expédition en 24h-48h
              </span>
            </div>
          </div>
        </div>

        {/* Subtle Decorative Botanical Accent */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full opacity-10 pointer-events-none hidden lg:block"
          style={{
            backgroundImage: `radial-gradient(circle at 70% 50%, #783747 0%, transparent 60%)`,
          }}
        />
      </section>

      {/* Categories Showcase Strip */}
      <section className="py-12 border-b border-sand-border bg-white">
        <div className="container-editorial">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <span className="label-editorial text-burgundy">Sélection Botanique</span>
              <h2 className="text-2xl font-serif text-charcoal mt-1">Nos Rituels de Beauté</h2>
            </div>
            <Link
              to="/shop"
              className="text-xs uppercase font-semibold tracking-editorial text-burgundy hover:text-burgundy-deep flex items-center gap-1"
            >
              <span>Voir tout le catalogue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingCategories ? (
            <div className="py-8 flex justify-center">
              <Spinner size="md" message="Chargement des collections..." />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categoriesData?.map((category) => (
                <Link
                  key={category.id}
                  to={`/shop?category=${category.slug}`}
                  className="group apothecary-card p-6 flex flex-col justify-between min-h-[140px] hover:border-burgundy"
                >
                  <div>
                    <span className="text-[0.65rem] tracking-editorial uppercase text-charcoal/40 font-semibold font-sans block mb-1">
                      {category.products_count} Soin{category.products_count > 1 ? 's' : ''}
                    </span>
                    <h3 className="font-serif text-lg text-charcoal group-hover:text-burgundy transition-colors">
                      {category.name}
                    </h3>
                  </div>
                  <span className="text-xs text-charcoal/60 font-sans group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 text-[0.7rem] uppercase tracking-editorial font-medium">
                    Explorer <ArrowRight className="w-3 h-3 text-burgundy" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="py-16 md:py-24 bg-canvas border-b border-sand-border">
        <div className="container-editorial">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="label-editorial text-burgundy">Édition Limitée</span>
            <h2 className="text-3xl md:text-4xl font-serif text-charcoal mt-2 mb-4">
              Les Créations Emblématiques
            </h2>
            <p className="text-sm font-sans text-charcoal/70 leading-relaxed">
              Formulées avec les récoltes fraîches de mai, nos créations allient authenticité des traditions berbères et rigueur de la formulation contemporaine.
            </p>
          </div>

          {loadingProducts ? (
            <div className="py-16 flex justify-center">
              <Spinner size="lg" message="Préparation des soins..." />
            </div>
          ) : productsError ? (
            <ErrorState
              title="Impossible de charger le catalogue"
              message="Vérifiez que le serveur API est en ligne ou réessayez dans quelques instants."
              onRetry={() => refetch()}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {productsData?.products.map((product) => {
                const primaryImage = product.primary_image?.public_url || '/placeholder-rose.jpg';
                const isOutOfStock = product.stock_quantity <= 0;

                return (
                  <article
                    key={product.id}
                    className="group bg-white border border-sand-border rounded overflow-hidden flex flex-col transition-all duration-300 hover:shadow-card hover:border-rose/60"
                  >
                    {/* Image Area */}
                    <Link
                      to={`/shop/${product.slug}`}
                      className="relative aspect-[4/5] bg-sand/20 overflow-hidden flex items-center justify-center cursor-pointer"
                    >
                      <img
                        src={primaryImage}
                        alt={product.primary_image?.alt_text || product.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500" fill="%23F8F2EE"><rect width="400" height="500" fill="%23F8F2EE"/><text x="50%" y="50%" font-family="serif" font-size="20" fill="%23783747" dominant-baseline="middle" text-anchor="middle">Aroma Rose</text></svg>';
                        }}
                      />

                      {/* Botanical & Limited Badges */}
                      <span className="absolute top-3 left-3 bg-sage-soft text-sage-dark border border-sage-border text-[0.6rem] uppercase tracking-editorial font-semibold px-2 py-0.5 rounded-sm">
                        100% Naturel
                      </span>

                      {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                        <span className="absolute top-3 right-3 bg-rose text-white text-[0.62rem] uppercase tracking-editorial font-semibold px-2 py-0.5 rounded-sm shadow-subtle">
                          Édition Limitée
                        </span>
                      )}

                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="bg-charcoal text-white text-xs uppercase tracking-editorial font-semibold px-3 py-1 rounded">
                            Épuisé
                          </span>
                        </div>
                      )}
                    </Link>

                    {/* Content Area */}
                    <div className="p-6 flex flex-col flex-1 justify-between">
                      <div>
                        {product.category && (
                          <span className="text-[0.65rem] tracking-editorial uppercase text-charcoal/50 font-semibold font-sans block mb-1">
                            {product.category.name}
                          </span>
                        )}
                        <h3 className="font-serif text-lg font-normal text-charcoal group-hover:text-burgundy transition-colors line-clamp-1 mb-2">
                          <Link to={`/shop/${product.slug}`}>{product.name}</Link>
                        </h3>
                        {product.description && (
                          <p className="text-xs text-charcoal/60 font-sans line-clamp-2 leading-relaxed mb-4">
                            {product.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 border-t border-sand-border/70 flex items-center justify-between mt-auto">
                        <div className="flex flex-col">
                          <span className="font-serif text-lg font-medium text-burgundy">
                            {formatMAD(product.price)}
                          </span>
                          {product.compare_at_price && product.compare_at_price > product.price && (
                            <span className="text-xs text-charcoal/40 line-through font-sans">
                              {formatMAD(product.compare_at_price)}
                            </span>
                          )}
                        </div>

                        <Button
                          variant={isOutOfStock ? 'outline' : 'primary'}
                          size="sm"
                          disabled={isOutOfStock}
                          onClick={(e) => handleAddToCart(e, product.id, product.name)}
                          leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}
                        >
                          {isOutOfStock ? 'Épuisé' : 'Ajouter'}
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-14 text-center">
            <Link to="/shop">
              <Button size="lg" variant="outline">
                Explorer Tout le Catalogue
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Terroir & Ancestral Distillation Narrative Section */}
      <section className="py-20 bg-white">
        <div className="container-editorial">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-sand/30 border border-sand-border self-start">
                <Flame className="w-3.5 h-3.5 text-burgundy" />
                <span className="text-[0.68rem] uppercase font-semibold tracking-editorial text-charcoal font-sans">
                  Savoir-Faire Séculaire
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-serif text-charcoal leading-tight">
                La Rose de Damas de la <span className="italic text-burgundy">Vallée du Dadès</span>
              </h2>

              <p className="text-sm font-sans text-charcoal/75 leading-relaxed">
                Nichée à 1 500 mètres d'altitude entre les cimes de l'Atlas et les oasis du sud marocain, Kelaat M'Gouna bénéficie d'un microclimat unique. L'air pur de la montagne et la pureté des eaux de fonte confèrent à la Rose de Damas (<em>Rosa Damascena</em>) une concentration aromatique exceptionnelle.
              </p>

              <p className="text-sm font-sans text-charcoal/75 leading-relaxed">
                Chaque printemps, les boutons de roses sont cueillis un à un à la main, avant que le soleil ne dissipe leurs huiles essentielles les plus subtiles. Distillées à la vapeur d'eau douce dans des alambics traditionnels, elles donnent naissance à des soins d'une pureté absolue.
              </p>

              <div className="pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-editorial font-semibold text-sage-dark hover:text-burgundy transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-sage" />
                  <span>Poser une question sur nos méthodes de récolte</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="apothecary-card p-8 bg-canvas/60 flex flex-col gap-6">
                <h3 className="font-serif text-xl text-charcoal border-b border-sand-border pb-3">
                  Les Engagements Botaniques Aroma Rose
                </h3>

                <div className="flex flex-col gap-4 text-xs font-sans">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-rose-soft text-burgundy font-serif font-semibold flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div>
                      <strong className="block text-charcoal font-semibold mb-0.5">
                        Pureté & Traçabilité Garantie
                      </strong>
                      <span className="text-charcoal/65 leading-relaxed">
                        100% issue des récoltes de Kelaat M'Gouna, sans intermédiaire ni adultération.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-rose-soft text-burgundy font-serif font-semibold flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div>
                      <strong className="block text-charcoal font-semibold mb-0.5">
                        Formules Sans Conservateurs Artificiels
                      </strong>
                      <span className="text-charcoal/65 leading-relaxed">
                        Sans parabènes, sans phtalates, sans parfum de synthèse ajouté.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-rose-soft text-burgundy font-serif font-semibold flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div>
                      <strong className="block text-charcoal font-semibold mb-0.5">
                        Paiement à la Livraison & Sérénité
                      </strong>
                      <span className="text-charcoal/65 leading-relaxed">
                        Réglez votre colis en espèces en toute confiance uniquement lors de la remise par le transporteur.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Botanical Newsletter Section */}
      <section className="py-20 bg-canvas border-b border-sand-border relative overflow-hidden">
        <div className="container-editorial max-w-3xl mx-auto text-center relative z-10">
          <div className="w-12 h-12 rounded-full bg-sage-soft text-sage-dark border border-sage-border flex items-center justify-center mx-auto mb-5 shadow-subtle">
            <Mail className="w-5 h-5 text-sage" />
          </div>

          <span className="label-editorial text-burgundy mb-2 block">
            Le Cercle Botanique
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif text-charcoal mb-4">
            Rejoignez la Maison Aroma Rose
          </h2>
          <p className="text-sm font-sans text-charcoal/70 leading-relaxed max-w-xl mx-auto mb-8">
            Recevez nos secrets de beauté à la Rose de Damas, nos conseils de rituels holistiques et des invitations exclusives aux récoltes de mai dans la Vallée du Dadès.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              success('Bienvenue au Cercle', 'Votre adresse e-mail a été enregistrée avec succès.');
              (e.currentTarget as HTMLFormElement).reset();
            }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              placeholder="Votre adresse e-mail..."
              className="flex-1 py-3 px-4 bg-white border border-sand-border rounded text-xs font-sans text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy/20"
            />
            <Button type="submit" variant="primary" size="md" className="shrink-0">
              S'inscrire
            </Button>
          </form>

          <p className="text-[0.68rem] text-charcoal/50 font-sans mt-4">
            Paiement à la livraison au Maroc • Aucun spam • Désinscription en un clic
          </p>
        </div>
      </section>
    </div>
  );
};
