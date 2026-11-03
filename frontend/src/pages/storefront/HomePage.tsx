import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Droplets, ShieldCheck, ShoppingBag } from 'lucide-react';
import { usePublicProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useStoreSettings } from '../../hooks/useStoreSettings';
import { formatMAD } from '../../utils/formatters';
import { Spinner } from '../../components/common/Spinner';
import { ErrorState } from '../../components/feedback/ErrorState';
import { Button } from '../../components/common/Button';

export const HomePage: React.FC = () => {
  const { data: categoriesData, isLoading: loadingCategories } = useCategories();
  const { data: productsData, isLoading: loadingProducts, error: productsError, refetch } = usePublicProducts({
    limit: 6,
  });
  const { data: storeSettings } = useStoreSettings();

  return (
    <div className="flex flex-col">
      {/* Editorial Hero Section */}
      <section className="relative overflow-hidden bg-[#FAF6F0] border-b border-sand-border py-20 md:py-32">
        <div className="container-editorial relative z-10">
          <div className="max-w-2xl flex flex-col items-start gap-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-rose-soft border border-rose/30">
              <Sparkles className="w-3.5 h-3.5 text-burgundy" />
              <span className="text-[0.68rem] uppercase font-semibold tracking-editorial text-burgundy font-sans">
                Haute Cosmétique Botanique du Maroc
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal text-charcoal leading-[1.15] tracking-tight">
              Quintessence Botanique de <span className="italic text-burgundy">Kelaat M’Gouna</span>
            </h1>

            <p className="text-base sm:text-lg text-charcoal/75 font-sans leading-relaxed max-w-xl">
              Des rituels de beauté purs et bienfaisants, nés de la distillation artisanale des roses de Damas cueillies à la main aux premières lueurs du jour dans la Vallée du Dadès.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to="/products">
                <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Découvrir le Catalogue
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" size="lg">
                  Notre Histoire
                </Button>
              </Link>
            </div>

            {/* Quick value badges */}
            <div className="flex items-center gap-6 pt-6 text-xs text-charcoal/60 font-sans border-t border-sand-border/80 w-full">
              <span className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-rose" />
                100% Naturel & Pur
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-rose" />
                Paiement à la livraison (COD)
              </span>
            </div>
          </div>
        </div>

        {/* Subtle Decorative Botanical Accent */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full opacity-10 pointer-events-none hidden lg:block"
          style={{
            backgroundImage: `radial-gradient(circle at 70% 50%, #6B1838 0%, transparent 60%)`,
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
              to="/products"
              className="text-xs uppercase font-semibold tracking-editorial text-burgundy hover:text-burgundy-deep flex items-center gap-1"
            >
              <span>Tous les produits</span>
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
                  to={`/products?category=${category.slug}`}
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
      <section className="py-16 md:py-24 bg-canvas">
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

                return (
                  <article
                    key={product.id}
                    className="group bg-white border border-sand-border rounded overflow-hidden flex flex-col transition-all duration-300 hover:shadow-card hover:border-rose/60"
                  >
                    {/* Image Area */}
                    <div className="relative aspect-[4/5] bg-sand/20 overflow-hidden flex items-center justify-center">
                      <img
                        src={primaryImage}
                        alt={product.primary_image?.alt_text || product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          // Fallback to botanical rose silhouette
                          (e.currentTarget as HTMLImageElement).src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500" fill="%23FAF7F2"><rect width="400" height="500" fill="%23FAF7F2"/><text x="50%" y="50%" font-family="serif" font-size="20" fill="%236B1838" dominant-baseline="middle" text-anchor="middle">Aroma Rose</text></svg>';
                        }}
                      />

                      {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                        <span className="absolute top-3 left-3 bg-rose text-white text-[0.62rem] uppercase tracking-editorial font-semibold px-2 py-0.5 rounded-sm">
                          Édition Limitée
                        </span>
                      )}

                      {product.stock_quantity <= 0 && (
                        <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="bg-charcoal text-white text-xs uppercase tracking-editorial font-semibold px-3 py-1 rounded">
                            Épuisé
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content Area */}
                    <div className="p-6 flex flex-col flex-1 justify-between">
                      <div>
                        {product.category && (
                          <span className="text-[0.65rem] tracking-editorial uppercase text-charcoal/50 font-semibold font-sans block mb-1">
                            {product.category.name}
                          </span>
                        )}
                        <h3 className="font-serif text-lg font-normal text-charcoal group-hover:text-burgundy transition-colors line-clamp-1 mb-2">
                          <Link to={`/products/${product.slug}`}>{product.name}</Link>
                        </h3>
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

                        <Link to={`/products/${product.slug}`}>
                          <Button variant="outline" size="sm" rightIcon={<ShoppingBag className="w-3.5 h-3.5" />}>
                            Découvrir
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-14 text-center">
            <Link to="/products">
              <Button size="lg" variant="outline">
                Voir l'Ensemble du Catalogue ({storeSettings?.currency || 'MAD'})
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
