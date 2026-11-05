import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Sparkles,
  Search,
  X,
  RefreshCw,
  Coins,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { useCustomers } from '../../hooks/useCustomers';
import {
  formatMAD,
  formatPhoneDisplay,
  formatDateTime,
  formatOrderSource,
  formatCustomerStatus,
} from '../../utils/formatters';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import type { Customer, CustomerQueryParams } from '../../types/customer.types';

export const AdminCustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search & filter params from URL
  const page = parseInt(searchParams.get('page') || '1', 10);
  const statusFilter = (searchParams.get('status') as CustomerQueryParams['status']) || 'all';
  const cityFilter = searchParams.get('city') || '';
  const searchInput = searchParams.get('search') || '';

  const [localSearch, setLocalSearch] = useState(searchInput);

  // Construct query params
  const queryParams = useMemo<CustomerQueryParams>(() => {
    return {
      page,
      limit: 20,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      city: cityFilter ? cityFilter : undefined,
      search: searchInput ? searchInput : undefined,
    };
  }, [page, statusFilter, cityFilter, searchInput]);

  // Fetch customers data via TanStack Query
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useCustomers(queryParams);

  const customers = data?.customers || [];
  const meta = data?.meta;
  const summary = meta?.summary;
  const totalPages = meta?.totalPages || 1;
  const totalItems = meta?.total ?? customers.length;

  // Handle live search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (localSearch.trim()) {
      newParams.set('search', localSearch.trim());
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Clear all filters
  const handleResetFilters = () => {
    setLocalSearch('');
    setSearchParams(new URLSearchParams());
  };

  // Change status filter
  const handleStatusFilterChange = (status: CustomerQueryParams['status']) => {
    const newParams = new URLSearchParams(searchParams);
    if (status && status !== 'all') {
      newParams.set('status', status);
    } else {
      newParams.delete('status');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Change page
  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(newPage));
    setSearchParams(newParams);
  };

  const hasActiveFilters = Boolean(
    (statusFilter && statusFilter !== 'all') || cityFilter || searchInput
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* =========================================================================
          1. Editorial Header
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-sand-light/60 pb-6">
        <div>
          <span className="label-editorial text-burgundy">Répertoire & Fidélité</span>
          <h1 className="text-3xl font-serif text-charcoal font-normal mt-1">
            Clients
          </h1>
          <p className="text-sm text-charcoal/60 font-sans mt-1">
            Consultez le répertoire des clients, leur historique de commandes et leur activité.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 border-sand-dark/30 hover:border-burgundy text-charcoal"
          >
            <RefreshCw className={isFetching ? 'w-4 h-4 animate-spin text-burgundy' : 'w-4 h-4'} />
            <span className="text-xs uppercase tracking-wider">Actualiser</span>
          </Button>
        </div>
      </div>

      {/* =========================================================================
          2. Real KPI Summary Cards
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total clients */}
        <Card className="p-5 border-sand-light bg-warm-cream/50 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-sans text-charcoal/60">
              Total clients
            </span>
            <div className="w-9 h-9 rounded-full bg-burgundy/5 flex items-center justify-center text-burgundy">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-serif text-charcoal font-normal">
              {summary ? summary.total_customers : '—'}
            </span>
          </div>
          <p className="text-xs text-charcoal/50 mt-1">
            Répertoire consolidé
          </p>
        </Card>

        {/* Clients actifs */}
        <Card className="p-5 border-sand-light bg-warm-cream/50 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-sans text-charcoal/60">
              Clients actifs
            </span>
            <div className="w-9 h-9 rounded-full bg-sage-50 flex items-center justify-center text-sage">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-serif text-charcoal font-normal">
              {summary ? summary.active_customers : '—'}
            </span>
          </div>
          <p className="text-xs text-charcoal/50 mt-1">
            Au moins 1 commande enregistrée
          </p>
        </Card>

        {/* Clients fidèles (repeat) */}
        <Card className="p-5 border-sand-light bg-warm-cream/50 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-sans text-charcoal/60">
              Clients fidèles
            </span>
            <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-serif text-charcoal font-normal">
              {summary ? summary.repeat_customers : '—'}
            </span>
          </div>
          <p className="text-xs text-charcoal/50 mt-1">
            Plusieurs commandes passées
          </p>
        </Card>

        {/* Chiffre d'affaires clients */}
        <Card className="p-5 border-sand-light bg-warm-cream/50 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-sans text-charcoal/60">
              CA généré
            </span>
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-700">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif text-charcoal font-normal">
              {summary ? formatMAD(summary.total_revenue) : '—'}
            </span>
          </div>
          <p className="text-xs text-charcoal/50 mt-1">
            Total hors commandes annulées
          </p>
        </Card>
      </div>

      {/* =========================================================================
          3. Search & Filter Bar
         ========================================================================= */}
      <Card className="p-4 border-sand-light bg-white/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal/40" />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone, ville ou email..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-warm-cream/30 border border-sand-light focus:border-burgundy focus:ring-1 focus:ring-burgundy rounded text-sm text-charcoal placeholder:text-charcoal/40 font-sans transition-colors"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('');
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete('search');
                  newParams.set('page', '1');
                  setSearchParams(newParams);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => handleStatusFilterChange('all')}
              className={`px-3 py-1.5 text-xs font-sans rounded transition-colors whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-burgundy text-white font-medium shadow-xs'
                  : 'bg-warm-cream/50 text-charcoal/70 hover:bg-sand-light/50'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => handleStatusFilterChange('active')}
              className={`px-3 py-1.5 text-xs font-sans rounded transition-colors whitespace-nowrap ${
                statusFilter === 'active'
                  ? 'bg-burgundy text-white font-medium shadow-xs'
                  : 'bg-warm-cream/50 text-charcoal/70 hover:bg-sand-light/50'
              }`}
            >
              Actifs
            </button>
            <button
              onClick={() => handleStatusFilterChange('repeat')}
              className={`px-3 py-1.5 text-xs font-sans rounded transition-colors whitespace-nowrap ${
                statusFilter === 'repeat'
                  ? 'bg-burgundy text-white font-medium shadow-xs'
                  : 'bg-warm-cream/50 text-charcoal/70 hover:bg-sand-light/50'
              }`}
            >
              Fidèles
            </button>
            <button
              onClick={() => handleStatusFilterChange('inactive')}
              className={`px-3 py-1.5 text-xs font-sans rounded transition-colors whitespace-nowrap ${
                statusFilter === 'inactive'
                  ? 'bg-burgundy text-white font-medium shadow-xs'
                  : 'bg-warm-cream/50 text-charcoal/70 hover:bg-sand-light/50'
              }`}
            >
              Inactifs
            </button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs text-charcoal/60 hover:text-burgundy ml-1"
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* =========================================================================
          4. Customer Directory Table
         ========================================================================= */}
      <Card className="border-sand-light bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Spinner size="lg" className="text-burgundy" />
            <span className="text-sm text-charcoal/60 font-sans mt-3">
              Chargement des clients…
            </span>
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState
              title="Erreur lors de la récupération des clients"
              message="Impossible d'accéder au répertoire clients. Veuillez réessayer."
              onRetry={() => refetch()}
            />
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title={hasActiveFilters ? 'Aucun client ne correspond à votre recherche' : 'Aucun client trouvé'}
              description={
                hasActiveFilters
                  ? 'Essayez de modifier ou de réinitialiser vos critères de recherche.'
                  : 'Aucun enregistrement client n’est présent dans la base de données.'
              }
              actionLabel={hasActiveFilters ? 'Réinitialiser les filtres' : undefined}
              onAction={hasActiveFilters ? handleResetFilters : undefined}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-sand-light bg-warm-cream/40 text-[11px] font-sans uppercase tracking-wider text-charcoal/60">
                  <th className="py-3.5 px-4 font-medium">Client</th>
                  <th className="py-3.5 px-4 font-medium">Téléphone & Email</th>
                  <th className="py-3.5 px-4 font-medium text-center">Commandes</th>
                  <th className="py-3.5 px-4 font-medium text-right">Montant total</th>
                  <th className="py-3.5 px-4 font-medium">Dernière commande</th>
                  <th className="py-3.5 px-4 font-medium">Canal</th>
                  <th className="py-3.5 px-4 font-medium">Statut</th>
                  <th className="py-3.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-light/60 text-sm font-sans">
                {customers.map((c: Customer) => {
                  const ordersCount = Number(c.total_orders) || 0;
                  const isRepeat = ordersCount > 1;
                  const isActive = ordersCount === 1;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/admin/customers/${c.id}`)}
                      className="hover:bg-warm-cream/30 transition-colors cursor-pointer group"
                    >
                      {/* Name & City */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-burgundy/10 text-burgundy font-serif font-medium flex items-center justify-center shrink-0 text-sm">
                            {(c.first_name?.[0] || '').toUpperCase()}
                            {(c.last_name?.[0] || '').toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-charcoal group-hover:text-burgundy transition-colors">
                              {c.first_name} {c.last_name}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-charcoal/50 mt-0.5">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span>{c.city}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone & Email */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-charcoal font-mono">
                            <Phone className="w-3 h-3 text-charcoal/40 shrink-0" />
                            <span>{formatPhoneDisplay(c.phone)}</span>
                          </div>
                          {c.email ? (
                            <div className="flex items-center gap-1.5 text-xs text-charcoal/60 truncate max-w-[180px]">
                              <Mail className="w-3 h-3 text-charcoal/40 shrink-0" />
                              <span title={c.email}>{c.email}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-charcoal/30 italic">Sans email</span>
                          )}
                        </div>
                      </td>

                      {/* Orders Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full bg-sand-light/40 text-charcoal text-xs font-medium font-sans">
                          {ordersCount}
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-serif font-medium text-charcoal">
                          {formatMAD(c.total_spent)}
                        </span>
                      </td>

                      {/* Last Order Date */}
                      <td className="py-3.5 px-4">
                        {c.last_order_date ? (
                          <div className="text-xs text-charcoal/70">
                            {formatDateTime(c.last_order_date)}
                          </div>
                        ) : (
                          <span className="text-xs text-charcoal/40 italic">Aucune commande</span>
                        )}
                      </td>

                      {/* Order Source / Channel */}
                      <td className="py-3.5 px-4">
                        {c.last_order_source ? (
                          <Badge
                            variant={c.last_order_source === 'whatsapp' ? 'sage' : 'neutral'}
                            size="sm"
                          >
                            {formatOrderSource(c.last_order_source)}
                          </Badge>
                        ) : (
                          <span className="text-xs text-charcoal/40">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={isRepeat ? 'sage' : isActive ? 'rose' : 'neutral'}
                          size="sm"
                        >
                          {formatCustomerStatus(c.total_orders)}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/admin/customers/${c.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs text-burgundy hover:text-burgundy/80 font-medium transition-colors"
                        >
                          <span>Fiche</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* =========================================================================
            5. Server-side Pagination
           ========================================================================= */}
        {!isLoading && !error && customers.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-t border-sand-light bg-warm-cream/20 text-xs text-charcoal/60">
            <div>
              Affichage de <span className="font-medium text-charcoal">{customers.length}</span> sur{' '}
              <span className="font-medium text-charcoal">{totalItems}</span> clients
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(page - 1, 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-2.5 py-1 text-xs border-sand-light text-charcoal"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Précédent</span>
              </Button>

              <span className="px-2 font-medium text-charcoal">
                Page {page} sur {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.min(page + 1, totalPages))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-2.5 py-1 text-xs border-sand-light text-charcoal"
              >
                <span>Suivant</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
