import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  RefreshCw,
  Search,
  X,
  Globe,
  MessageCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Phone,
} from 'lucide-react';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import {
  formatMAD,
  formatDateTime,
  formatPhoneDisplay,
} from '../../utils/formatters';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { CreateWhatsAppOrderModal } from '../../components/admin/CreateWhatsAppOrderModal';
import type { OrderStatus, OrderSource } from '../../types/order.types';
import { cn } from '../../utils/cn';

export const AdminOrdersListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search and filter state from URL params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const statusFilter = (searchParams.get('status') as OrderStatus) || '';
  const sourceFilter = (searchParams.get('source') as OrderSource) || '';
  const searchInput = searchParams.get('search') || '';
  const dateFrom = searchParams.get('date_from') || '';
  const dateTo = searchParams.get('date_to') || '';

  const [localSearch, setLocalSearch] = useState(searchInput);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  // Construct query parameters
  const queryParams = useMemo(() => {
    return {
      page,
      limit: 20,
      status: statusFilter ? statusFilter : undefined,
      order_source: sourceFilter ? sourceFilter : undefined,
      search: searchInput ? searchInput : undefined,
      date_from: dateFrom ? dateFrom : undefined,
      date_to: dateTo ? dateTo : undefined,
    };
  }, [page, statusFilter, sourceFilter, searchInput, dateFrom, dateTo]);

  // Fetch real order data from backend
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useAdminOrders(queryParams);

  const orders = data?.orders || [];
  const meta = data?.meta;
  const totalOrders = meta?.total ?? orders.length;
  const totalPages = meta?.totalPages ?? (Math.ceil(totalOrders / 20) || 1);

  // Filter update helpers
  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // Reset to page 1 on filter change
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
    statusFilter || sourceFilter || searchInput || dateFrom || dateTo
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
            <span>Console</span>
            <span>/</span>
            <span className="text-burgundy font-medium">Commandes</span>
          </nav>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-serif font-medium text-charcoal tracking-tight">
              Commandes
            </h1>
            {!isLoading && (
              <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-sand/30 border border-sand-border text-charcoal/70 font-medium">
                {totalOrders} au total
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-sans text-charcoal/60 mt-1">
            Suivi des ventes, gestion du cycle de vie des expéditions et commandes manuelles.
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
            onClick={() => setIsWhatsAppModalOpen(true)}
            className="flex items-center gap-2 shadow-sm"
          >
            <MessageCircle className="w-4 h-4 text-emerald-300" />
            <span>Nouvelle commande WhatsApp</span>
          </Button>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <Card className="p-4 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Search input */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-md flex items-center"
          >
            <Search className="w-4 h-4 absolute left-3 text-charcoal/40" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Rechercher par N° commande, client ou téléphone..."
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

          {/* Right: Filter dropdowns & Date selectors */}
          <div className="flex flex-wrap items-center gap-2.5">
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
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmée</option>
                <option value="processing">En préparation</option>
                <option value="shipped">Expédiée</option>
                <option value="delivered">Livrée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>

            {/* Source Filter */}
            <div className="flex items-center gap-1.5 text-xs font-sans">
              <span className="text-charcoal/50 text-[0.7rem] uppercase tracking-editorial font-semibold">
                Canal :
              </span>
              <select
                value={sourceFilter}
                onChange={(e) => updateFilter('source', e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-canvas/30 border border-sand-border rounded focus:outline-none focus:border-burgundy"
              >
                <option value="">Tous les canaux</option>
                <option value="website">Site web</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            {/* Date range filters */}
            <div className="flex items-center gap-1 text-xs font-sans">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => updateFilter('date_from', e.target.value)}
                className="px-2 py-1 text-xs bg-canvas/30 border border-sand-border rounded focus:outline-none focus:border-burgundy"
                title="Date de début"
              />
              <span className="text-charcoal/40 font-mono">→</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => updateFilter('date_to', e.target.value)}
                className="px-2 py-1 text-xs bg-canvas/30 border border-sand-border rounded focus:outline-none focus:border-burgundy"
                title="Date de fin"
              />
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

      {/* 3. Orders Table Content */}
      <Card className="overflow-hidden border border-sand-border">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
            <Spinner size="md" />
            <p className="text-xs font-sans text-charcoal/60">
              Chargement des commandes en cours...
            </p>
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState
              title="Erreur de chargement"
              message="Impossible de récupérer la liste des commandes. Veuillez vérifier votre connexion au serveur."
              onRetry={() => refetch()}
            />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="Aucune commande trouvée"
              description={
                hasActiveFilters
                  ? "Aucune commande ne correspond aux filtres actuels. Essayez de réinitialiser la recherche."
                  : "Aucune commande n'a encore été enregistrée dans le système."
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
                    <th className="py-3.5 px-4">N° Commande</th>
                    <th className="py-3.5 px-4">Client</th>
                    <th className="py-3.5 px-4">Téléphone</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Montant</th>
                    <th className="py-3.5 px-4">Canal</th>
                    <th className="py-3.5 px-4">Paiement</th>
                    <th className="py-3.5 px-4">Statut</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-border/50 bg-white">
                  {orders.map((order) => {
                    const source = order.order_source || order.source;
                    const isPaid =
                      order.payment_status === 'paid' || order.status === 'delivered';

                    return (
                      <tr
                        key={order.id}
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                        className="hover:bg-canvas/40 transition-colors cursor-pointer group"
                      >
                        {/* Commande */}
                        <td className="py-3.5 px-4 font-mono font-medium text-burgundy group-hover:underline">
                          <div className="flex items-center gap-1.5">
                            <span>{order.order_number}</span>
                            {order.items_count !== undefined && (
                              <span className="text-[0.62rem] px-1.5 py-0.2 rounded bg-sand/30 text-charcoal font-sans font-normal border border-sand-border/40">
                                {order.items_count} art.
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Client */}
                        <td className="py-3.5 px-4 text-charcoal">
                          <div className="font-medium">
                            {order.customer
                              ? `${order.customer.first_name} ${order.customer.last_name}`
                              : 'Client Invité'}
                          </div>
                          {order.customer?.city && (
                            <div className="text-[0.65rem] text-charcoal/50">
                              {order.customer.city}
                            </div>
                          )}
                        </td>

                        {/* Téléphone */}
                        <td className="py-3.5 px-4 font-mono text-charcoal/80">
                          {order.customer?.phone ? (
                            <a
                              href={`tel:${order.customer.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 hover:text-burgundy transition-colors"
                              title="Appeler le client"
                            >
                              <Phone className="w-3 h-3 opacity-60" />
                              <span>{formatPhoneDisplay(order.customer.phone)}</span>
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-charcoal/70 whitespace-nowrap">
                          {formatDateTime(order.created_at)}
                        </td>

                        {/* Montant */}
                        <td className="py-3.5 px-4 font-serif font-semibold text-burgundy whitespace-nowrap">
                          {formatMAD(order.total_amount)}
                        </td>

                        {/* Canal Source */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {source === 'whatsapp' ? (
                            <span className="inline-flex items-center gap-1 text-[0.65rem] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                              <MessageCircle className="w-3 h-3" />
                              WhatsApp
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[0.65rem] px-2 py-0.5 rounded bg-sand/30 text-charcoal border border-sand-border font-medium">
                              <Globe className="w-3 h-3 text-charcoal/60" />
                              Site Web
                            </span>
                          )}
                        </td>

                        {/* Paiement */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isPaid ? (
                            <Badge variant="sage" size="sm">
                              Payé (COD)
                            </Badge>
                          ) : (
                            <Badge variant="warning" size="sm">
                              À encaisser
                            </Badge>
                          )}
                        </td>

                        {/* Statut */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge status={order.status} size="sm" />
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/orders/${order.id}`);
                            }}
                            className="inline-flex items-center gap-1 text-[0.7rem] px-2.5 py-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Consulter</span>
                          </Button>
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
                  {Math.min((page - 1) * 20 + 1, totalOrders)}
                </span>{' '}
                à{' '}
                <span className="font-semibold text-charcoal">
                  {Math.min(page * 20, totalOrders)}
                </span>{' '}
                sur <span className="font-semibold text-charcoal">{totalOrders}</span>{' '}
                commandes
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

      {/* Modal: Nouvelle commande WhatsApp */}
      <CreateWhatsAppOrderModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        onSuccess={(newOrderId) => {
          refetch();
          navigate(`/admin/orders/${newOrderId}`);
        }}
      />
    </div>
  );
};
