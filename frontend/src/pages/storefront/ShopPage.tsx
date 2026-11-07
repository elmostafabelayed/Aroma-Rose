import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, ShoppingBag, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePublicProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useCart } from '../../hooks/useCart';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import { formatMAD } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { cn } from '../../utils/cn';

function getVisiblePages(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 3) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & Filter state derived from URL
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';
  const initialSort = (searchParams.get('sort') as 'price_asc' | 'price_desc' | 'created_desc' | 'name_asc') || 'created_desc';
  const initialPage = parseInt(searchParams.get('page') || '1', 10);

  const [category, setCategory] = useState<string>(initialCategory);
  const [searchInput, setSearchInput] = useState<string>(initialSearch);
  const [sort, setSort] = useState<'price_asc' | 'price_desc' | 'created_desc' | 'name_asc'>(initialSort);
  const [page, setPage] = useState<number>(initialPage);

  const catalogListingRef = useRef<HTMLDivElement>(null);
  const isInitialPageMount = useRef(true);

  const scrollToCatalogTop = () => {
    if (catalogListingRef.current) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

      const rect = catalogListingRef.current.getBoundingClientRect();
      const targetY = rect.top + window.pageYOffset - 100;

      if (window.pageYOffset > targetY) {
        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
      }
    }
  };

  // Scroll to top of catalog listing when page changes (pagination)
  useEffect(() => {
    if (isInitialPageMount.current) {
      isInitialPageMount.current = false;
      return;
    }

    if (catalogListingRef.current) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

      const rect = catalogListingRef.current.getBoundingClientRect();
      const targetY = rect.top + window.pageYOffset - 100;

      window.scrollTo({
        top: Math.max(0, targetY),
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    }
  }, [page]);

  const debouncedSearch = useDebounce(searchInput, 350);

  const { addItem } = useCart();
  const { success } = useToast();

  const { data: categoriesData } = useCategories();

  // Fetch products using TanStack Query
  const {
    data: productsData,
    isLoading: loadingProducts,
    isFetching,
    error,
    refetch,
  } = usePublicProducts({
    category: category || undefined,
    search: debouncedSearch.trim() || undefined,
    sort,
    page,
    limit: 12,
  });

  // Sync URL search parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    if (sort !== 'created_desc') params.set('sort', sort);
    if (page > 1) params.set('page', String(page));
    setSearchParams(params, { replace: true });
  }, [category, debouncedSearch, sort, page, setSearchParams]);

  // Reset page to 1 when filters change
  const handleCategoryChange = (slug: string) => {
    setCategory(slug);
    if (page === 1) {
      scrollToCatalogTop();
    } else {
      setPage(1);
    }
  };

  const handleSortChange = (newSort: typeof sort) => {
    setSort(newSort);
    if (page === 1) {
      scrollToCatalogTop();
    } else {
      setPage(1);
    }
  };

  const handleClearFilters = () => {
    setCategory('');
    setSearchInput('');
    setSort('created_desc');
    if (page === 1) {
      scrollToCatalogTop();
    } else {
      setPage(1);
    }
  };

  const handleAddToCart = (e: React.MouseEvent, productId: string, productName: string) => {
    e.preventDefault();
    addItem(productId, 1);
    success('Rituel ajouté au panier', `${productName} a été ajouté à votre sélection.`);
  };

  const totalPages = productsData?.meta?.totalPages || 1;
  const totalCount = productsData?.meta?.total || 0;

  return (
    <div className="py-10 md:py-16 bg-canvas min-h-screen">
      <div className="container-editorial">
        {/* Editorial Page Header */}
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <span className="label-editorial text-burgundy">Maison Botanique</span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-charcoal mt-2 mb-3">
            Le Catalogue des Rituels
          </h1>
          <p className="text-sm font-sans text-charcoal/70 leading-relaxed">
            Eaux florales pures, huiles végétales précieuses et baumes parfumés élaborés à Kelaat M’Gouna selon les procédés de distillation ancestraux.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white border border-sand-border rounded p-4 md:p-6 mb-10 shadow-subtle flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-charcoal/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                placeholder="Rechercher par nom, extrait, rituel..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-9 py-2 text-xs font-sans bg-canvas/40 border border-sand-border rounded focus:outline-none focus:border-burgundy focus:bg-white transition-colors"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal"
                  aria-label="Effacer la recherche"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort & Quick Results Count */}
            <div className="flex items-center justify-between md:justify-end gap-3">
              <span className="text-xs text-charcoal/60 font-sans hidden sm:inline">
                {totalCount} soin{totalCount > 1 ? 's' : ''} disponible{totalCount > 1 ? 's' : ''}
              </span>

              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-charcoal/60" />
                <label htmlFor="sort-select" className="text-xs font-sans text-charcoal/60 sr-only">
                  Trier par
                </label>
                <select
                  id="sort-select"
                  value={sort}
                  onChange={(e) => handleSortChange(e.target.value as typeof sort)}
                  className="text-xs font-sans bg-white border border-sand-border rounded py-2 px-3 focus:outline-none focus:border-burgundy cursor-pointer"
                >
                  <option value="created_desc">Nouveautés & Découvertes</option>
                  <option value="price_asc">Prix : du plus bas au plus haut</option>
                  <option value="price_desc">Prix : du plus haut au plus bas</option>
                  <option value="name_asc">Ordre Alphabétique (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Categories Pill Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-sand-border/70 scrollbar-none">
            <button
              type="button"
              onClick={() => handleCategoryChange('')}
              className={cn(
                'text-[0.68rem] uppercase tracking-editorial font-semibold px-3.5 py-1.5 rounded whitespace-nowrap transition-colors border',
                category === ''
                  ? 'bg-burgundy text-white border-burgundy'
                  : 'bg-canvas text-charcoal/80 border-sand-border hover:border-burgundy'
              )}
            >
              Tous les Rituels
            </button>

            {categoriesData?.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.slug)}
                className={cn(
                  'text-[0.68rem] uppercase tracking-editorial font-semibold px-3.5 py-1.5 rounded whitespace-nowrap transition-colors border',
                  category === cat.slug
                    ? 'bg-burgundy text-white border-burgundy'
                    : 'bg-canvas text-charcoal/80 border-sand-border hover:border-burgundy'
                )}
              >
                {cat.name} ({cat.products_count})
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Grid View */}
        <div ref={catalogListingRef} className="scroll-mt-28">
        {loadingProducts ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <Spinner size="lg" message="Exploration des récoltes..." />
          </div>
        ) : error ? (
          <ErrorState
            title="Erreur lors de la récupération des soins"
            message="Impossible d'accéder au catalogue. Veuillez vérifier votre connexion et réessayer."
            onRetry={() => refetch()}
          />
        ) : productsData?.products.length === 0 ? (
          <EmptyState
            title="Aucun soin ne correspond à votre recherche"
            description="Essayez de modifier vos critères de recherche ou réinitialisez les filtres botaniques."
            actionLabel="Réinitialiser les filtres"
            onAction={handleClearFilters}
          />
        ) : (
          <>
            <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8', isFetching && 'opacity-60 transition-opacity')}>
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

                      {/* Natural Botanical Badge */}
                      <span className="absolute top-3 left-3 bg-sage-soft text-sage-dark border border-sage-border text-[0.6rem] uppercase tracking-editorial font-semibold px-2 py-0.5 rounded-sm shadow-subtle">
                        100% Naturel
                      </span>

                      {/* Stock Badges */}
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav aria-label="Pagination du catalogue" className="mt-14 flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                  aria-label="Page précédente"
                >
                  Précédent
                </Button>

                <div className="flex items-center gap-1 mx-2">
                  {getVisiblePages(page, totalPages).map((pItem, idx) =>
                    pItem === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 text-xs text-charcoal/40 select-none">
                        …
                      </span>
                    ) : (
                      <button
                        key={pItem}
                        type="button"
                        onClick={() => setPage(pItem as number)}
                        aria-current={pItem === page ? 'page' : undefined}
                        aria-label={`Page ${pItem}`}
                        className={cn(
                          'min-w-[36px] h-9 px-3 rounded text-xs font-medium font-sans transition-colors',
                          pItem === page
                            ? 'bg-burgundy text-white shadow-subtle'
                            : 'bg-white text-charcoal/80 border border-sand-border hover:border-burgundy hover:text-burgundy'
                        )}
                      >
                        {pItem}
                      </button>
                    )
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  rightIcon={<ChevronRight className="w-4 h-4" />}
                  aria-label="Page suivante"
                >
                  Suivant
                </Button>
              </nav>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
};
