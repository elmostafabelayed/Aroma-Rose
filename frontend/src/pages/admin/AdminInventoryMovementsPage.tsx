import React, { useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useInventoryMovements } from '../../hooks/useInventory';
import { formatDateTime, formatMovementType } from '../../utils/formatters';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import type {
  MovementQueryParams,
  InventoryMovementType,
} from '../../types/inventory.types';
import { cn } from '../../utils/cn';

export const AdminInventoryMovementsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const movementTypeFilter = (searchParams.get('type') as InventoryMovementType) || '';
  const productIdFilter = searchParams.get('product_id') || '';

  const queryParams = useMemo<MovementQueryParams>(() => {
    return {
      page,
      limit: 25,
      movement_type: movementTypeFilter ? movementTypeFilter : undefined,
      product_id: productIdFilter ? productIdFilter : undefined,
    };
  }, [page, movementTypeFilter, productIdFilter]);

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useInventoryMovements(queryParams);

  const movements = data?.movements || [];
  const meta = data?.meta;
  const totalMovements = meta?.total ?? movements.length;
  const totalPages = meta?.totalPages ?? (Math.ceil(totalMovements / 25) || 1);

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(movementTypeFilter || productIdFilter);

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* 1. Header & Navigation */}
      <div>
        {/* Breadcrumb */}
        <nav
          aria-label="Fil d'Ariane"
          className="flex items-center gap-1.5 text-xs text-charcoal/50 mb-3 font-sans"
        >
          <Link to="/admin" className="hover:text-burgundy">
            Console
          </Link>
          <span>/</span>
          <Link to="/admin/inventory" className="hover:text-burgundy">
            Gestion du stock
          </Link>
          <span>/</span>
          <span className="text-burgundy font-medium">Historique des mouvements</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/inventory')}
              className="p-2 text-charcoal/60 hover:text-burgundy"
              title="Retour à la gestion du stock"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-serif font-medium text-charcoal tracking-tight">
                  Grand Livre des Mouvements
                </h1>
                {!isLoading && (
                  <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-sand/30 border border-sand-border text-charcoal/70 font-medium">
                    {totalMovements} écritures
                  </span>
                )}
              </div>
              <p className="text-xs font-sans text-charcoal/60 mt-0.5">
                Journal immuable des variations de stock, expéditions et ajustements manuels.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 self-start sm:self-center"
            title="Rafraîchir les données"
          >
            <RefreshCw
              className={cn('w-3.5 h-3.5 text-charcoal/70', isFetching && 'animate-spin')}
            />
            <span>Actualiser</span>
          </Button>
        </div>
      </div>

      {/* 2. Filters & Active Product Filter Alert */}
      <Card className="p-4 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Type */}
            <div className="flex items-center gap-1.5 text-xs font-sans">
              <span className="text-charcoal/50 text-[0.7rem] uppercase tracking-editorial font-semibold">
                Type de mouvement :
              </span>
              <select
                value={movementTypeFilter}
                onChange={(e) => updateFilter('type', e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-canvas/30 border border-sand-border rounded focus:outline-none focus:border-burgundy"
              >
                <option value="">Tous les types</option>
                <option value="order_shipment">Vente (Expédition commande)</option>
                <option value="manual_adjustment">Ajustement manuel</option>
                <option value="restock">Réception / Réapprovisionnement</option>
                <option value="return_restock">Retour client</option>
              </select>
            </div>

            {/* Product ID filter notification */}
            {productIdFilter && (
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-sand/30 border border-sand-border text-xs font-sans">
                <span className="text-charcoal/70">Filtre par produit actif</span>
                <button
                  type="button"
                  onClick={() => updateFilter('product_id', '')}
                  className="p-0.5 hover:text-burgundy"
                  title="Afficher tous les produits"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 text-xs font-sans text-burgundy hover:underline self-end sm:self-center"
            >
              <X className="w-3.5 h-3.5" />
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>
      </Card>

      {/* 3. Movement Ledger Table */}
      <Card className="overflow-hidden border border-sand-border">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
            <Spinner size="md" />
            <p className="text-xs font-sans text-charcoal/60">
              Chargement des écritures d'inventaire...
            </p>
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState
              title="Erreur de chargement"
              message="Impossible de récupérer l'historique des mouvements. Veuillez vérifier votre connexion au serveur."
              onRetry={() => refetch()}
            />
          </div>
        ) : movements.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="Aucun mouvement d'inventaire"
              description={
                hasActiveFilters
                  ? "Aucune écriture ne correspond à vos filtres actuels."
                  : "Aucun mouvement de stock n'a encore été enregistré."
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
                    <th className="py-3 px-4">Date & Heure</th>
                    <th className="py-3 px-4">Produit</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-center">Variation</th>
                    <th className="py-3 px-4 text-center">Stock avant</th>
                    <th className="py-3 px-4 text-center">Stock après</th>
                    <th className="py-3 px-4">Motif & Référence</th>
                    <th className="py-3 px-4">Opérateur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-border/50 bg-white">
                  {movements.map((mov) => {
                    const isPositive = mov.quantity_change > 0;

                    return (
                      <tr key={mov.id} className="hover:bg-canvas/30 transition-colors">
                        {/* Date & Heure */}
                        <td className="py-3 px-4 font-mono text-[0.7rem] text-charcoal/70 whitespace-nowrap">
                          {formatDateTime(mov.created_at)}
                        </td>

                        {/* Produit */}
                        <td className="py-3 px-4">
                          <span className="font-serif font-medium text-charcoal block">
                            {mov.product_name}
                          </span>
                          {mov.product_sku && (
                            <span className="text-[0.65rem] font-mono text-charcoal/50">
                              {mov.product_sku}
                            </span>
                          )}
                        </td>

                        {/* Type */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded bg-sand/30 border border-sand-border text-[0.65rem] font-medium text-charcoal">
                            {formatMovementType(mov.movement_type)}
                          </span>
                        </td>

                        {/* Variation */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center gap-0.5 font-mono font-semibold text-xs px-2 py-0.5 rounded',
                              isPositive
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-soft text-red-900 border border-red-200'
                            )}
                          >
                            {isPositive ? (
                              <ArrowUpRight className="w-3 h-3 text-emerald-700" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-red-700" />
                            )}
                            <span>{isPositive ? `+${mov.quantity_change}` : mov.quantity_change}</span>
                          </span>
                        </td>

                        {/* Stock avant */}
                        <td className="py-3 px-4 text-center font-mono text-charcoal/60">
                          {mov.previous_stock}
                        </td>

                        {/* Stock après */}
                        <td className="py-3 px-4 text-center font-mono font-semibold text-charcoal">
                          {mov.new_stock}
                        </td>

                        {/* Motif & Référence */}
                        <td className="py-3 px-4 text-charcoal/80 max-w-xs truncate">
                          {mov.notes ? (
                            <span>{mov.notes}</span>
                          ) : (
                            <span className="text-charcoal/40 italic">Aucune note</span>
                          )}
                          {mov.order_number && (
                            <Link
                              to={`/admin/orders/${mov.order_id}`}
                              className="ml-2 font-mono text-[0.65rem] text-burgundy hover:underline inline-block"
                            >
                              ({mov.order_number})
                            </Link>
                          )}
                        </td>

                        {/* Opérateur */}
                        <td className="py-3 px-4 whitespace-nowrap text-charcoal/70">
                          {mov.performed_by?.full_name || 'Système (Commande)'}
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
                  {Math.min((page - 1) * 25 + 1, totalMovements)}
                </span>{' '}
                à{' '}
                <span className="font-semibold text-charcoal">
                  {Math.min(page * 25, totalMovements)}
                </span>{' '}
                sur <span className="font-semibold text-charcoal">{totalMovements}</span>{' '}
                mouvements
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
    </div>
  );
};
