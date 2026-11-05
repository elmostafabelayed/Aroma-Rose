import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  History,
  RefreshCw,
  Search,
  X,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  PackageX,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useInventory } from '../../hooks/useInventory';
import { useCategories } from '../../hooks/useCategories';
import { useAuth } from '../../auth/useAuth';
import { formatMAD } from '../../utils/formatters';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { StockAdjustmentModal } from '../../components/admin/StockAdjustmentModal';
import type {
  InventoryItem,
  InventoryQueryParams,
  StockStatus,
} from '../../types/inventory.types';
import { cn } from '../../utils/cn';

export const AdminInventoryOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useAuth();

  // Search & filter params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const statusFilter = (searchParams.get('status') as StockStatus | 'all') || 'all';
  const categoryFilter = searchParams.get('category') || '';
  const searchInput = searchParams.get('search') || '';

  const [localSearch, setLocalSearch] = useState(searchInput);
  const [selectedProductForAdjustment, setSelectedProductForAdjustment] = useState<InventoryItem | null>(null);

  // Fetch real categories
  const { data: categories = [] } = useCategories();

  // Construct query params
  const queryParams = useMemo<InventoryQueryParams>(() => {
    return {
      page,
      limit: 20,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      category: categoryFilter ? categoryFilter : undefined,
      search: searchInput ? searchInput : undefined,
    };
  }, [page, statusFilter, categoryFilter, searchInput]);

  // Fetch inventory data
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useInventory(queryParams);

  const inventory = data?.data?.inventory || [];
  const summary = data?.data?.summary;
  const meta = data?.meta;
  const totalItems = meta?.total ?? inventory.length;
  const totalPages = meta?.totalPages ?? (Math.ceil(totalItems / 20) || 1);

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
    (statusFilter && statusFilter !== 'all') ||
      categoryFilter ||
      searchInput
  );

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
            <Link to="/admin" className="hover:text-burgundy">
              Console
            </Link>
            <span>/</span>
            <span className="text-burgundy font-medium">Gestion du stock</span>
          </nav>

          <h1 className="text-2xl lg:text-3xl font-serif font-medium text-charcoal tracking-tight">
            Gestion du stock
          </h1>
          <p className="text-xs sm:text-sm font-sans text-charcoal/60 mt-1">
            Suivez les niveaux de stock, les alertes et les mouvements d'inventaire.
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
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/inventory/movements')}
            className="flex items-center gap-2 border-sand-border"
          >
            <History className="w-4 h-4 text-burgundy" />
            <span>Historique des mouvements</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Cards (4 Authoritative Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Produits en stock */}
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[0.68rem] uppercase tracking-editorial font-semibold text-charcoal/60 block">
              Produits en stock
            </span>
            <span className="text-2xl font-serif font-semibold text-emerald-800 mt-1 block">
              {summary
                ? summary.in_stock_count ??
                  Math.max(
                    0,
                    summary.total_products -
                      summary.low_stock_count -
                      summary.out_of_stock_count
                  )
                : '—'}
            </span>
            <span className="text-[0.65rem] text-charcoal/50 mt-0.5 block">
              Disponibilité normale (&gt; 10 unités)
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        {/* Card 2: Stock faible */}
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[0.68rem] uppercase tracking-editorial font-semibold text-charcoal/60 block">
              Stock faible
            </span>
            <span className="text-2xl font-serif font-semibold text-amber-800 mt-1 block">
              {summary ? summary.low_stock_count : '—'}
            </span>
            <span className="text-[0.65rem] text-charcoal/50 mt-0.5 block">
              Seuil d'alerte (1 à 10 unités)
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </Card>

        {/* Card 3: Rupture de stock */}
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[0.68rem] uppercase tracking-editorial font-semibold text-charcoal/60 block">
              Rupture de stock
            </span>
            <span className="text-2xl font-serif font-semibold text-red-900 mt-1 block">
              {summary ? summary.out_of_stock_count : '—'}
            </span>
            <span className="text-[0.65rem] text-charcoal/50 mt-0.5 block">
              Zéro unité disponible
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-soft text-red-900 flex items-center justify-center shrink-0">
            <PackageX className="w-5 h-5" />
          </div>
        </Card>

        {/* Card 4: Total des unités en stock */}
        <Card className="p-4 flex items-center justify-between">
          <div>
            <span className="text-[0.68rem] uppercase tracking-editorial font-semibold text-charcoal/60 block">
              Total des unités
            </span>
            <span className="text-2xl font-serif font-semibold text-burgundy mt-1 block">
              {summary ? summary.total_stock_units.toLocaleString('fr-FR') : '—'}
            </span>
            <span className="text-[0.65rem] text-charcoal/50 mt-0.5 block">
              Volume total en réserve
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-burgundy/10 text-burgundy flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* 3. Filters & Search Bar */}
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
              placeholder="Rechercher par produit ou SKU..."
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
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Status Filter */}
            <div className="flex items-center gap-1.5 text-xs font-sans">
              <span className="text-charcoal/50 text-[0.7rem] uppercase tracking-editorial font-semibold">
                État du stock :
              </span>
              <select
                value={statusFilter}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-canvas/30 border border-sand-border rounded focus:outline-none focus:border-burgundy"
              >
                <option value="all">Tous</option>
                <option value="in_stock">En stock (&gt; 10)</option>
                <option value="low_stock">Stock faible (1 à 10)</option>
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

      {/* 4. Inventory Table Content */}
      <Card className="overflow-hidden border border-sand-border">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
            <Spinner size="md" />
            <p className="text-xs font-sans text-charcoal/60">
              Chargement des niveaux de stock en cours...
            </p>
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState
              title="Erreur de chargement"
              message="Impossible de récupérer l'état des stocks. Veuillez vérifier votre connexion au serveur."
              onRetry={() => refetch()}
            />
          </div>
        ) : inventory.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="Aucun article d'inventaire"
              description={
                hasActiveFilters
                  ? "Aucun produit ne correspond aux filtres de stock actuels."
                  : "Aucun produit n'est actuellement répertorié dans le catalogue."
              }
              actionLabel={hasActiveFilters ? "Réinitialiser les filtres" : undefined}
              onAction={hasActiveFilters ? clearAllFilters : undefined}
            />
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-canvas border-b border-sand-border text-[0.68rem] uppercase tracking-editorial font-semibold text-charcoal/70">
                  <tr>
                    <th className="py-3.5 px-4">Produit</th>
                    <th className="py-3.5 px-4">SKU</th>
                    <th className="py-3.5 px-4">Catégorie</th>
                    <th className="py-3.5 px-4">Prix</th>
                    <th className="py-3.5 px-4 text-center">Stock actuel</th>
                    <th className="py-3.5 px-4 text-center">Seuil d'alerte</th>
                    <th className="py-3.5 px-4">Statut</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-border/50 bg-white">
                  {inventory.map((item) => {
                    const stock = item.stock_quantity;
                    const isOutOfStock = stock === 0;
                    const isLowStock = stock > 0 && stock <= 10;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-canvas/30 transition-colors"
                      >
                        {/* Produit */}
                        <td className="py-3.5 px-4">
                          <span className="font-serif font-medium text-charcoal block">
                            {item.name}
                          </span>
                          {!item.is_active && (
                            <span className="text-[0.6rem] text-charcoal/50 italic">
                              (Produit inactif / archivé)
                            </span>
                          )}
                        </td>

                        {/* SKU */}
                        <td className="py-3.5 px-4 font-mono text-charcoal/70">
                          {item.sku || '—'}
                        </td>

                        {/* Catégorie */}
                        <td className="py-3.5 px-4 text-charcoal/80">
                          {item.category_name ? (
                            <span className="inline-block px-2 py-0.5 rounded bg-sand/30 border border-sand-border/70 text-[0.68rem]">
                              {item.category_name}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Prix */}
                        <td className="py-3.5 px-4 font-serif font-medium text-charcoal/80 whitespace-nowrap">
                          {formatMAD(item.price)}
                        </td>

                        {/* Stock actuel */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-block px-2.5 py-1 rounded font-mono font-semibold text-xs',
                              isOutOfStock
                                ? 'bg-rose-soft text-red-900 border border-red-200'
                                : isLowStock
                                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                            )}
                          >
                            {stock} unité{stock > 1 ? 's' : ''}
                          </span>
                        </td>

                        {/* Seuil d'alerte */}
                        <td className="py-3.5 px-4 text-center text-charcoal/50 font-mono">
                          10
                        </td>

                        {/* Statut */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge status={item.stock_status as any} size="sm" />
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Ajuster le stock button */}
                            {isAdmin ? (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setSelectedProductForAdjustment(item)}
                                className="inline-flex items-center gap-1 text-[0.68rem] px-2.5 py-1"
                                title="Ajuster le stock"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Ajuster</span>
                              </Button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="inline-flex items-center gap-1 text-[0.68rem] px-2.5 py-1 rounded bg-sand/20 text-charcoal/40 border border-sand-border/50 cursor-not-allowed select-none"
                                title="Action réservée aux administrateurs"
                              >
                                <ShieldAlert className="w-3 h-3 opacity-60" />
                                <span>Ajuster</span>
                              </button>
                            )}

                            {/* View movement ledger for this product */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(`/admin/inventory/movements?product_id=${item.id}`)
                              }
                              className="inline-flex items-center gap-1 text-[0.68rem] px-2 py-1"
                              title="Consulter l'historique des mouvements"
                            >
                              <History className="w-3.5 h-3.5" />
                            </Button>
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
                  {Math.min((page - 1) * 20 + 1, totalItems)}
                </span>{' '}
                à{' '}
                <span className="font-semibold text-charcoal">
                  {Math.min(page * 20, totalItems)}
                </span>{' '}
                sur <span className="font-semibold text-charcoal">{totalItems}</span>{' '}
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

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={Boolean(selectedProductForAdjustment)}
        product={selectedProductForAdjustment}
        onClose={() => setSelectedProductForAdjustment(null)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
