import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Package,
  Plus,
  RefreshCw,
  Search,
  X,
  Edit,
  ChevronLeft,
  ChevronRight,
  Archive,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useAdminProducts, useDeleteProduct } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useAuth } from '../../auth/useAuth';
import { formatMAD, formatDateTime } from '../../utils/formatters';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { useToast } from '../../context/ToastContext';
import type { ProductQueryParams } from '../../types/product.types';
import { cn } from '../../utils/cn';

export const AdminProductsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const deleteMutation = useDeleteProduct();

  // Search and filter state from URL params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const categoryFilter = searchParams.get('category') || '';
  const statusFilter = (searchParams.get('status') as 'all' | 'active' | 'inactive') || 'all';
  const stockFilter = (searchParams.get('stock') as 'all' | 'in_stock' | 'low_stock' | 'out_of_stock') || 'all';
  const searchInput = searchParams.get('search') || '';

  const [localSearch, setLocalSearch] = useState(searchInput);
  const [productToArchive, setProductToArchive] = useState<{ id: string; name: string } | null>(null);

  // Fetch real categories
  const { data: categories = [] } = useCategories();

  // Construct query parameters
  const queryParams = useMemo<ProductQueryParams>(() => {
    return {
      page,
      limit: 15,
      category: categoryFilter ? categoryFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      stock_status: stockFilter !== 'all' ? stockFilter : undefined,
      search: searchInput ? searchInput : undefined,
    };
  }, [page, categoryFilter, statusFilter, stockFilter, searchInput]);

  // Fetch real products from backend
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useAdminProducts(queryParams);

  const products = data?.products || [];
  const meta = data?.meta;
  const totalProducts = meta?.total ?? products.length;
  const totalPages = meta?.totalPages ?? (Math.ceil(totalProducts / 15) || 1);

  // Filter update helpers
  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('search', localSearch.trim());
  };

  const clearAllFilters = () => {
    setLocalSearch('');
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(
    (categoryFilter && categoryFilter !== 'all') ||
      (statusFilter && statusFilter !== 'all') ||
      (stockFilter && stockFilter !== 'all') ||
      searchInput
  );

  // Archive / Soft-delete handler
  const handleConfirmArchive = async () => {
    if (!productToArchive) return;
    try {
      await deleteMutation.mutateAsync(productToArchive.id);
      showSuccessToast(
        'Produit archivé',
        `Le produit "${productToArchive.name}" a été désactivé du catalogue.`
      );
      setProductToArchive(null);
    } catch (err: any) {
      showErrorToast(
        'Erreur d’archivage',
        err?.message || 'Impossible d’archiver ce produit.'
      );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          {/* Breadcrumb */}
          <nav
            aria-label="Fil d'Ariane"
            className="flex items-center gap-1.5 text-xs text-charcoal/50 mb-1 font-sans"
          >
            <span>Console</span>
            <span>/</span>
            <span className="text-burgundy font-medium">Catalogue</span>
          </nav>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-serif font-medium text-charcoal tracking-tight">
              Produits
            </h1>
            {!isLoading && (
              <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-sand/30 border border-sand-border text-charcoal/70 font-medium">
                {totalProducts} au total
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-sans text-charcoal/60 mt-1">
            Gestion du catalogue cosmétique, des fiches botaniques et de la tarification.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5"
            title="Rafraîchir les données"
          >
            <RefreshCw
              className={cn('w-3.5 h-3.5 text-charcoal/70', isFetching && 'animate-spin')}
            />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/admin/products/new')}
            className="flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un produit</span>
          </Button>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <Card className="p-4 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search input */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-md flex items-center"
          >
            <Search className="w-4 h-4 absolute left-3 text-charcoal/40" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Rechercher par nom de produit ou SKU..."
              className="w-full pl-9 pr-9 py-2 text-xs font-sans border border-sand-border rounded bg-canvas/30 focus:bg-white focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy transition-all"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  updateFilter('search', '');
                }}
                className="absolute right-3 p-0.5 text-charcoal/40 hover:text-charcoal"
                title="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 text-xs font-sans">
              <span className="text-charcoal/50 text-[0.7rem] uppercase tracking-editorial font-semibold">
                Catégorie :
              </span>
              <select
                value={categoryFilter}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-canvas/30 border border-sand-border rounded focus:outline-none focus:border-burgundy"
              >
                <option value="">Toutes les catégories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name} ({c.products_count})
                  </option>
                ))}
              </select>
            </div>

            {/* Statut Filter */}
            <div className="flex items-center gap-1.5 text-xs font-sans">
              <span className="text-charcoal/50 text-[0.7rem] uppercase tracking-editorial font-semibold">
                Statut :
              </span>
              <select
                value={statusFilter}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-canvas/30 border border-sand-border rounded focus:outline-none focus:border-burgundy"
              >
                <option value="all">Tous</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>

            {/* Stock Filter */}
            <div className="flex items-center gap-1.5 text-xs font-sans">
              <span className="text-charcoal/50 text-[0.7rem] uppercase tracking-editorial font-semibold">
                Stock :
              </span>
              <select
                value={stockFilter}
                onChange={(e) => updateFilter('stock', e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-canvas/30 border border-sand-border rounded focus:outline-none focus:border-burgundy"
              >
                <option value="all">Tous les stocks</option>
                <option value="in_stock">En stock (&gt; 5)</option>
                <option value="low_stock">Stock faible (1 à 5)</option>
                <option value="out_of_stock">Rupture (0)</option>
              </select>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-sans text-burgundy hover:bg-rose-soft/40 rounded transition-colors"
                title="Réinitialiser tous les filtres"
              >
                <X className="w-3 h-3" />
                <span>Réinitialiser</span>
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* 3. Products Table Content */}
      <Card className="overflow-hidden border border-sand-border">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
            <Spinner size="md" />
            <p className="text-xs font-sans text-charcoal/60">
              Chargement des produits du catalogue...
            </p>
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState
              title="Erreur de chargement"
              message="Impossible de récupérer la liste des produits. Veuillez vérifier votre connexion au serveur."
              onRetry={() => refetch()}
            />
          </div>
        ) : products.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="Aucun produit trouvé"
              description={
                hasActiveFilters
                  ? "Aucun produit ne correspond à ces critères de recherche. Essayez de réinitialiser les filtres."
                  : "Votre catalogue est actuellement vide."
              }
              actionLabel={hasActiveFilters ? "Réinitialiser les filtres" : "Ajouter un premier produit"}
              onAction={
                hasActiveFilters
                  ? clearAllFilters
                  : () => navigate('/admin/products/new')
              }
            />
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-canvas border-b border-sand-border text-[0.68rem] uppercase tracking-editorial font-semibold text-charcoal/70">
                  <tr>
                    <th className="py-3.5 px-4">Image</th>
                    <th className="py-3.5 px-4">Produit</th>
                    <th className="py-3.5 px-4">SKU</th>
                    <th className="py-3.5 px-4">Catégorie</th>
                    <th className="py-3.5 px-4">Prix</th>
                    <th className="py-3.5 px-4">Stock</th>
                    <th className="py-3.5 px-4">Statut</th>
                    <th className="py-3.5 px-4">Dernière modification</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-border/50 bg-white">
                  {products.map((product) => {
                    const primaryUrl =
                      product.primary_image?.public_url || product.primary_image?.storage_path;
                    const stock = product.stock_quantity;

                    return (
                      <tr
                        key={product.id}
                        onClick={() => navigate(`/admin/products/${product.id}`)}
                        className="hover:bg-canvas/40 transition-colors cursor-pointer group"
                      >
                        {/* Image */}
                        <td className="py-3 px-4">
                          <div className="w-12 h-12 rounded border border-sand-border bg-canvas overflow-hidden shrink-0 flex items-center justify-center">
                            {primaryUrl ? (
                              <img
                                src={primaryUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <Package className="w-5 h-5 text-charcoal/30" />
                            )}
                          </div>
                        </td>

                        {/* Produit */}
                        <td className="py-3 px-4">
                          <div className="font-serif font-medium text-charcoal group-hover:text-burgundy transition-colors">
                            {product.name}
                          </div>
                          <span className="text-[0.65rem] font-mono text-charcoal/40">
                            /{product.slug}
                          </span>
                        </td>

                        {/* SKU */}
                        <td className="py-3 px-4 font-mono text-charcoal/70">
                          {product.sku || '—'}
                        </td>

                        {/* Catégorie */}
                        <td className="py-3 px-4 text-charcoal/80">
                          {product.category?.name ? (
                            <span className="inline-block px-2 py-0.5 rounded bg-sand/30 border border-sand-border/70 text-[0.68rem] font-medium text-charcoal/80">
                              {product.category.name}
                            </span>
                          ) : (
                            <span className="text-charcoal/40">—</span>
                          )}
                        </td>

                        {/* Prix */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-serif font-semibold text-burgundy">
                            {formatMAD(product.price)}
                          </div>
                          {product.compare_at_price && (
                            <div className="text-[0.65rem] text-charcoal/40 line-through">
                              {formatMAD(product.compare_at_price)}
                            </div>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {stock > 5 ? (
                            <span className="inline-flex items-center gap-1 text-[0.68rem] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {stock} en stock
                            </span>
                          ) : stock > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[0.68rem] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              {stock} restants
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[0.68rem] px-2 py-0.5 rounded bg-rose-soft text-red-900 border border-red-200 font-medium">
                              Rupture (0)
                            </span>
                          )}
                        </td>

                        {/* Statut */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {product.is_active ? (
                            <Badge variant="sage" size="sm">
                              Actif
                            </Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">
                              Inactif
                            </Badge>
                          )}
                        </td>

                        {/* Dernière modification */}
                        <td className="py-3 px-4 text-charcoal/60 whitespace-nowrap text-[0.7rem]">
                          {formatDateTime(product.updated_at || product.created_at)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/products/${product.id}`);
                              }}
                              className="inline-flex items-center gap-1 text-[0.7rem] px-2.5 py-1"
                              title="Modifier la fiche produit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Modifier</span>
                            </Button>

                            {/* Archive button (Admin only) */}
                            {isAdmin && product.is_active && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProductToArchive({ id: product.id, name: product.name });
                                }}
                                className="p-1.5 text-charcoal/40 hover:text-red-700 hover:bg-rose-soft/40 rounded transition-colors"
                                title="Archiver ce produit"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-canvas/30 border-t border-sand-border text-xs font-sans text-charcoal/70">
              <div>
                Affichage de{' '}
                <span className="font-semibold text-charcoal">
                  {Math.min((page - 1) * 15 + 1, totalProducts)}
                </span>{' '}
                à{' '}
                <span className="font-semibold text-charcoal">
                  {Math.min(page * 15, totalProducts)}
                </span>{' '}
                sur <span className="font-semibold text-charcoal">{totalProducts}</span>{' '}
                produits
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter('page', String(page - 1))}
                  disabled={page <= 1}
                  className="px-2.5 py-1 text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Précédent
                </Button>

                <span className="text-xs font-sans px-2 text-charcoal/60">
                  Page {page} sur {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilter('page', String(page + 1))}
                  disabled={page >= totalPages}
                  className="px-2.5 py-1 text-xs"
                >
                  Suivant
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Confirmation Modal: Archiver Produit */}
      {productToArchive && (
        <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded shadow-2xl border border-sand-border max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-900">
              <div className="w-10 h-10 rounded-full bg-rose-soft flex items-center justify-center shrink-0">
                <Archive className="w-5 h-5 text-red-700" />
              </div>
              <div>
                <h3 className="font-serif font-medium text-base text-charcoal">
                  Archiver ce produit ?
                </h3>
                <p className="text-xs text-charcoal/60">
                  {productToArchive.name}
                </p>
              </div>
            </div>

            <p className="text-xs font-sans text-charcoal/80 leading-relaxed">
              Le produit sera désactivé du catalogue public mais restera préservé dans l’historique des commandes et dans les mouvements de stock.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setProductToArchive(null)}
                disabled={deleteMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmArchive}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Archivage...' : 'Confirmer l’archivage'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
