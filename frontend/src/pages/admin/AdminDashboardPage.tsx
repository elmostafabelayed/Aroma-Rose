import React from 'react';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Package,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useDashboardSummary } from '../../hooks/useDashboard';
import { formatMAD } from '../../utils/formatters';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { ErrorState } from '../../components/feedback/ErrorState';

export const AdminDashboardPage: React.FC = () => {
  const { data: summary, isLoading, error, refetch, isFetching } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center">
        <Spinner size="lg" message="Calcul des indicateurs de performance..." />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <ErrorState
        title="Erreur lors du chargement des statistiques"
        message="Impossible de récupérer les métriques du tableau de bord. Vérifiez la connexion API."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="label-editorial text-burgundy">Indicateurs Opérationnels</span>
          <h2 className="text-2xl font-serif text-charcoal mt-1">Vue d’ensemble des activités</h2>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            isLoading={isFetching}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Actualiser
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => alert('Ouverture du formulaire de commande WhatsApp (Mission 05)')}
          >
            Commande WhatsApp
          </Button>
        </div>
      </div>

      {/* KPI 4-Card Executive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Realized Revenue */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[0.7rem] uppercase tracking-editorial font-semibold text-charcoal/60 font-sans">
              Revenu Réalisé (COD)
            </span>
            <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-serif text-charcoal block">
              {formatMAD(summary.collected_revenue)}
            </span>
            <p className="text-xs text-charcoal/50 font-sans mt-1">
              Commandes livrées et encaissées
            </p>
          </div>
        </Card>

        {/* KPI 2: Gross Pipeline Value */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[0.7rem] uppercase tracking-editorial font-semibold text-charcoal/60 font-sans">
              Valeur Totale Engagée
            </span>
            <div className="w-8 h-8 rounded bg-rose-soft text-burgundy flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-serif text-charcoal block">
              {formatMAD(summary.gross_order_value)}
            </span>
            <p className="text-xs text-charcoal/50 font-sans mt-1">
              En cours: {formatMAD(summary.pipeline_order_value)}
            </p>
          </div>
        </Card>

        {/* KPI 3: Orders Volume */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[0.7rem] uppercase tracking-editorial font-semibold text-charcoal/60 font-sans">
              Volume Commandes
            </span>
            <div className="w-8 h-8 rounded bg-sand/50 text-charcoal flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-serif text-charcoal block">
              {summary.total_orders}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="rose" size="sm">
                {summary.pending_orders} En attente
              </Badge>
              <Badge variant="burgundy" size="sm">
                {summary.shipped_orders} Expédiées
              </Badge>
            </div>
          </div>
        </Card>

        {/* KPI 4: Inventory Health */}
        <Card className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[0.7rem] uppercase tracking-editorial font-semibold text-charcoal/60 font-sans">
              Santé de l’Inventaire
            </span>
            <div className="w-8 h-8 rounded bg-amber-50 text-amber-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-serif text-charcoal block">
              {summary.active_products} Soins Actifs
            </span>
            {summary.low_stock_products > 0 ? (
              <p className="text-xs text-amber-700 font-sans mt-1 flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {summary.low_stock_products} soin(s) en stock critique (≤10)
              </p>
            ) : (
              <p className="text-xs text-emerald-700 font-sans mt-1">
                Tous les stocks sont approvisionnés
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Order Status Breakdown */}
      <Card>
        <div className="mb-6">
          <h3 className="text-lg font-serif text-charcoal">État du Tunnel de Commandes</h3>
          <p className="text-xs text-charcoal/60 font-sans mt-0.5">
            Répartition des commandes selon le cycle de vie légal et logistique.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 bg-canvas rounded border border-sand-border flex flex-col">
            <span className="text-[0.68rem] uppercase tracking-editorial text-charcoal/60 font-semibold mb-1">
              En attente
            </span>
            <span className="text-xl font-serif text-charcoal">{summary.pending_orders}</span>
          </div>

          <div className="p-4 bg-canvas rounded border border-sand-border flex flex-col">
            <span className="text-[0.68rem] uppercase tracking-editorial text-charcoal/60 font-semibold mb-1">
              Confirmées
            </span>
            <span className="text-xl font-serif text-charcoal">{summary.confirmed_orders}</span>
          </div>

          <div className="p-4 bg-canvas rounded border border-sand-border flex flex-col">
            <span className="text-[0.68rem] uppercase tracking-editorial text-charcoal/60 font-semibold mb-1">
              Préparation
            </span>
            <span className="text-xl font-serif text-charcoal">{summary.processing_orders}</span>
          </div>

          <div className="p-4 bg-canvas rounded border border-sand-border flex flex-col">
            <span className="text-[0.68rem] uppercase tracking-editorial text-charcoal/60 font-semibold mb-1">
              Expédiées
            </span>
            <span className="text-xl font-serif text-charcoal">{summary.shipped_orders}</span>
          </div>

          <div className="p-4 bg-canvas rounded border border-sand-border flex flex-col">
            <span className="text-[0.68rem] uppercase tracking-editorial text-charcoal/60 font-semibold mb-1">
              Livrées (COD)
            </span>
            <span className="text-xl font-serif text-emerald-800">{summary.delivered_orders}</span>
          </div>

          <div className="p-4 bg-canvas rounded border border-sand-border flex flex-col">
            <span className="text-[0.68rem] uppercase tracking-editorial text-charcoal/60 font-semibold mb-1">
              Annulées
            </span>
            <span className="text-xl font-serif text-charcoal/40">{summary.cancelled_orders}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

