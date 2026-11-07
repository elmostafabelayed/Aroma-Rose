import React, { useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  AlertTriangle,
  RefreshCw,
  Coins,
  Truck,
  CheckCircle2,
  Calendar,
  Globe,
  MessageCircle,
  Eye,
  X,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  useDashboardSummary,
  useDashboardSales,
  useDashboardOrders,
  useDashboardInventory,
} from '../../hooks/useDashboard';
import { useAdminOrders } from '../../hooks/useAdminOrders';
import { useAuth } from '../../auth/useAuth';
import {
  formatMAD,
  formatDateTime,
  formatOrderSource,
  formatPhoneDisplay,
} from '../../utils/formatters';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';
import type { Order, OrderStatus } from '../../types/order.types';

export const AdminDashboardPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [salesDays, setSalesDays] = useState<number>(30);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Authoritative Backend Data Hooks
  const {
    data: summary,
    isLoading: loadingSummary,
    error: summaryError,
    refetch: refetchSummary,
    isFetching: fetchingSummary,
  } = useDashboardSummary();

  const {
    data: salesData,
    isLoading: loadingSales,
    error: salesError,
    refetch: refetchSales,
  } = useDashboardSales(salesDays);

  const {
    data: breakdownData,
    isLoading: loadingBreakdown,
    refetch: refetchBreakdown,
  } = useDashboardOrders();

  const {
    data: inventoryData,
    refetch: refetchInventory,
  } = useDashboardInventory();

  const {
    data: recentOrdersData,
    isLoading: loadingRecentOrders,
    error: recentOrdersError,
    refetch: refetchRecentOrders,
  } = useAdminOrders({ limit: 5 });

  const isGlobalLoading =
    loadingSummary || loadingBreakdown || loadingRecentOrders;

  const handleRefreshAll = () => {
    refetchSummary();
    refetchSales();
    refetchBreakdown();
    refetchInventory();
    refetchRecentOrders();
  };

  if (isGlobalLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Spinner size="lg" message="Chargement des indicateurs officiels de la console..." />
      </div>
    );
  }

  if (summaryError || !summary) {
    return (
      <ErrorState
        title="Erreur de connexion au tableau de bord"
        message="Impossible de récupérer les indicateurs de performance depuis l'API sécurisée. Veuillez vérifier vos identifiants ou retenter l'opération."
        onRetry={handleRefreshAll}
      />
    );
  }

  const allStatuses: { status: OrderStatus; label: string }[] = [
    { status: 'pending', label: 'En attente' },
    { status: 'confirmed', label: 'Confirmée' },
    { status: 'processing', label: 'En préparation' },
    { status: 'shipped', label: 'Expédiée' },
    { status: 'delivered', label: 'Livrée' },
    { status: 'cancelled', label: 'Annulée' },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-sand-border/60">
        <div>
          <span className="label-editorial text-burgundy">Pilotage Commercial & Logistique</span>
          <h2 className="text-2xl sm:text-3xl font-serif text-charcoal mt-1">
            Tableau de bord
          </h2>
          <p className="text-xs text-charcoal/60 font-sans mt-0.5">
            Vue d'ensemble en temps réel des ventes, expéditions et stocks de la Maison Aroma Rose.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            isLoading={fetchingSummary}
            leftIcon={<RefreshCw className="w-3.5 h-3.5 text-charcoal/70" />}
            className="text-xs bg-white hover:bg-canvas"
          >
            Actualiser
          </Button>
        </div>
      </div>

      {/* 2. Executive Financial & Logistical KPI Cards (4-Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Chiffre d'Affaires Encaissé (Strict COD Accounting) */}
        <Card className="flex flex-col justify-between border-sand-border/80 hover:border-burgundy/40 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.68rem] uppercase tracking-editorial font-semibold text-charcoal/60 font-sans">
                Montant Encaissé (COD)
              </span>
              <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-serif text-charcoal block">
              {formatMAD(summary.collected_revenue)}
            </span>
          </div>
          <p className="text-[0.72rem] text-charcoal/60 font-sans mt-3 pt-2.5 border-t border-sand-border/50 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>Paiements perçus (commandes livrées ou acquittées)</span>
          </p>
        </Card>

        {/* KPI 2: Valeur Totale des Commandes */}
        <Card className="flex flex-col justify-between border-sand-border/80 hover:border-burgundy/40 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.68rem] uppercase tracking-editorial font-semibold text-charcoal/60 font-sans">
                Valeur des Commandes
              </span>
              <div className="w-8 h-8 rounded bg-rose-soft text-burgundy flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-serif text-charcoal block">
              {formatMAD(summary.gross_order_value)}
            </span>
          </div>
          <p className="text-[0.72rem] text-charcoal/60 font-sans mt-3 pt-2.5 border-t border-sand-border/50">
            Hors commandes annulées
          </p>
        </Card>

        {/* KPI 3: Volume & Tunnel Logistique */}
        <Card className="flex flex-col justify-between border-sand-border/80 hover:border-burgundy/40 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.68rem] uppercase tracking-editorial font-semibold text-charcoal/60 font-sans">
                Total Commandes
              </span>
              <div className="w-8 h-8 rounded bg-sand/40 text-charcoal flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-serif text-charcoal block">
              {summary.total_orders}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-sand-border/50">
            <span className="text-[0.7rem] px-2 py-0.5 rounded bg-sand/30 text-charcoal font-medium font-sans">
              {summary.pending_orders} en attente
            </span>
            <span className="text-[0.7rem] px-2 py-0.5 rounded bg-rose-soft text-burgundy font-medium font-sans">
              {summary.shipped_orders} expédiées
            </span>
          </div>
        </Card>

        {/* KPI 4: Santé du Stock & Catalogue */}
        <Card className="flex flex-col justify-between border-sand-border/80 hover:border-burgundy/40 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.68rem] uppercase tracking-editorial font-semibold text-charcoal/60 font-sans">
                Catalogue Actif
              </span>
              <div className="w-8 h-8 rounded bg-sage-soft text-sage flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <span className="text-2xl sm:text-3xl font-serif text-charcoal block">
              {summary.active_products} Soins
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-sand-border/50">
            {summary.low_stock_products > 0 ? (
              <p className="text-[0.72rem] text-amber-800 font-sans font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{summary.low_stock_products} soin(s) en stock critique (≤10)</span>
              </p>
            ) : (
              <p className="text-[0.72rem] text-emerald-800 font-sans flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Tous les stocks approvisionnés</span>
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* 3. Detailed COD Financial Breakdown Banner */}
      <Card className="bg-gradient-to-r from-canvas via-white to-canvas border-sand-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-md">
            <span className="label-editorial text-burgundy">Transparence Comptable COD</span>
            <h3 className="text-lg font-serif text-charcoal mt-0.5">
              Suivi des Flux d'Encaissement
            </h3>
            <p className="text-xs text-charcoal/70 font-sans mt-1 leading-relaxed">
              Pour le modèle de vente à la livraison (Cash on Delivery), le chiffre d'affaires est distingué de la valeur des commandes en cours pour préserver l'intégrité de votre trésorerie.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
            <div className="p-3.5 rounded bg-white border border-sand-border/70 flex flex-col">
              <span className="text-[0.65rem] uppercase tracking-editorial text-charcoal/50 font-semibold mb-1">
                En Préparation (Non engagé)
              </span>
              <span className="text-base font-serif text-charcoal font-medium">
                {formatMAD(summary.pipeline_order_value)}
              </span>
              <span className="text-[0.65rem] text-charcoal/50 font-sans mt-0.5">
                Commandes en attente / préparation
              </span>
            </div>

            <div className="p-3.5 rounded bg-white border border-sand-border/70 flex flex-col">
              <span className="text-[0.65rem] uppercase tracking-editorial text-charcoal/50 font-semibold mb-1">
                En Cours d'Expédition
              </span>
              <span className="text-base font-serif text-charcoal font-medium flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-burgundy" />
                {formatMAD(summary.in_transit_value)}
              </span>
              <span className="text-[0.65rem] text-charcoal/50 font-sans mt-0.5">
                Colis confiés aux transporteurs
              </span>
            </div>

            <div className="p-3.5 rounded bg-emerald-50/60 border border-emerald-200/60 flex flex-col">
              <span className="text-[0.65rem] uppercase tracking-editorial text-emerald-800 font-semibold mb-1">
                Montant Réel Encaissé
              </span>
              <span className="text-base font-serif text-emerald-900 font-semibold">
                {formatMAD(summary.collected_revenue)}
              </span>
              <span className="text-[0.65rem] text-emerald-700/80 font-sans mt-0.5">
                Fonds définitivement perçus
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Sales Evolution & Analytical Filter Controls (Admin Only) */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-sand-border/60">
          <div>
            <span className="label-editorial text-burgundy">Analyse Historique</span>
            <h3 className="text-lg font-serif text-charcoal mt-0.5">
              Évolution des Ventes & Panier Moyen
            </h3>
          </div>

          {/* Date range filter controls supported by backend */}
          <div className="flex items-center gap-1.5 bg-canvas p-1 rounded border border-sand-border text-xs font-sans">
            <Calendar className="w-3.5 h-3.5 text-charcoal/50 ml-1.5 mr-1" />
            {[
              { label: '7 jours', days: 7 },
              { label: '30 jours', days: 30 },
              { label: '90 jours', days: 90 },
              { label: 'Cette année', days: 365 },
            ].map((f) => (
              <button
                key={f.days}
                type="button"
                onClick={() => setSalesDays(f.days)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  salesDays === f.days
                    ? 'bg-white text-burgundy font-semibold shadow-xs'
                    : 'text-charcoal/70 hover:text-charcoal'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isAdmin ? (
          loadingSales ? (
            <div className="py-12 flex justify-center">
              <Spinner size="md" message="Analyse des ventes en cours..." />
            </div>
          ) : salesError ? (
            <div className="py-8 text-center text-xs text-charcoal/50 font-sans">
              Impossible de charger l'historique des ventes pour cette période.
            </div>
          ) : salesData?.timeline && salesData.timeline.length > 0 ? (
            <div className="flex flex-col gap-6">
              {/* Average Order Value indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-canvas rounded border border-sand-border flex items-center justify-between">
                  <div>
                    <span className="text-[0.68rem] uppercase tracking-editorial text-charcoal/60 font-semibold block">
                      Panier Moyen Global (AOV)
                    </span>
                    <span className="text-xl font-serif text-charcoal mt-1 block">
                      {formatMAD(salesData.average_order_value)}
                    </span>
                  </div>
                  <span className="text-xs text-charcoal/50 font-sans">
                    Commandes actives
                  </span>
                </div>

                <div className="p-4 bg-canvas rounded border border-sand-border flex items-center justify-between">
                  <div>
                    <span className="text-[0.68rem] uppercase tracking-editorial text-charcoal/60 font-semibold block">
                      Panier Moyen Livré
                    </span>
                    <span className="text-xl font-serif text-emerald-800 mt-1 block">
                      {formatMAD(salesData.average_delivered_value)}
                    </span>
                  </div>
                  <span className="text-xs text-charcoal/50 font-sans">
                    Commandes acquittées
                  </span>
                </div>
              </div>

              {/* Timeline Table / Visual */}
              <div className="overflow-x-auto rounded border border-sand-border">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-canvas border-b border-sand-border text-[0.68rem] uppercase tracking-editorial font-semibold text-charcoal/70">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-center">Commandes</th>
                      <th className="py-3 px-4 text-right">Valeur Brute</th>
                      <th className="py-3 px-4 text-right">Revenu Encaissé (COD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-border/50 bg-white">
                    {salesData.timeline.map((point) => (
                      <tr key={point.date} className="hover:bg-canvas/40 transition-colors">
                        <td className="py-3 px-4 font-medium text-charcoal">
                          {point.date}
                        </td>
                        <td className="py-3 px-4 text-center font-serif text-charcoal">
                          {point.order_count}
                        </td>
                        <td className="py-3 px-4 text-right font-serif text-charcoal">
                          {formatMAD(point.daily_gross_value)}
                        </td>
                        <td className="py-3 px-4 text-right font-serif text-emerald-800 font-semibold">
                          {formatMAD(point.daily_collected_revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-charcoal/50 font-sans italic">
              Pas encore suffisamment de données pour afficher cette évolution.
            </div>
          )
        ) : (
          <div className="py-8 text-center text-xs text-charcoal/50 font-sans">
            L'analyse détaillée des ventes est réservée au profil administrateur.
          </div>
        )}
      </Card>

      {/* 5. Order Status Tunnel & Acquisition Channels (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Tunnel de Commandes par Statut */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <span className="label-editorial text-burgundy">Cycle Logistique</span>
              <h3 className="text-lg font-serif text-charcoal mt-0.5">
                Tunnel de Commandes
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {allStatuses.map(({ status, label }) => {
                const statusData = breakdownData?.by_status.find(
                  (s) => s.status === status
                );
                const count = statusData ? statusData.count : 0;
                const totalValue = statusData ? statusData.total_value : '0.00';

                return (
                  <div
                    key={status}
                    className="p-3 bg-canvas rounded border border-sand-border/70 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[0.65rem] uppercase tracking-editorial font-semibold text-charcoal/60 truncate">
                        {label}
                      </span>
                      <Badge status={status} size="sm" className="text-[0.55rem] px-1.5 py-0">
                        {count}
                      </Badge>
                    </div>
                    <span className="text-xs font-serif text-charcoal/80">
                      {formatMAD(totalValue)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Right: Canaux d'Acquisition (Website vs WhatsApp) */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <span className="label-editorial text-burgundy">Canaux de Vente</span>
              <h3 className="text-lg font-serif text-charcoal mt-0.5">
                Répartition par Source
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Website Channel */}
              {(() => {
                const web = breakdownData?.by_source.find(
                  (s) => s.order_source === 'website'
                );
                return (
                  <div className="p-4 rounded bg-white border border-sand-border flex flex-col justify-between gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-burgundy/10 text-burgundy flex items-center justify-center">
                          <Globe className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-editorial font-sans text-charcoal">
                          Site Web
                        </span>
                      </div>
                      <Badge variant="burgundy" size="sm">
                        {web ? web.count : 0} cmd
                      </Badge>
                    </div>

                    <div className="pt-2 border-t border-sand-border/50 text-xs font-sans">
                      <div className="flex justify-between py-0.5 text-charcoal/60">
                        <span>Valeur brute :</span>
                        <span className="font-serif text-charcoal font-medium">
                          {formatMAD(web?.gross_value || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5 text-charcoal/60">
                        <span>Encaissé (COD) :</span>
                        <span className="font-serif text-emerald-800 font-semibold">
                          {formatMAD(web?.collected_revenue || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* WhatsApp Channel */}
              {(() => {
                const wa = breakdownData?.by_source.find(
                  (s) => s.order_source === 'whatsapp'
                );
                return (
                  <div className="p-4 rounded bg-white border border-sand-border flex flex-col justify-between gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-editorial font-sans text-charcoal">
                          WhatsApp
                        </span>
                      </div>
                      <Badge variant="sage" size="sm">
                        {wa ? wa.count : 0} cmd
                      </Badge>
                    </div>

                    <div className="pt-2 border-t border-sand-border/50 text-xs font-sans">
                      <div className="flex justify-between py-0.5 text-charcoal/60">
                        <span>Valeur brute :</span>
                        <span className="font-serif text-charcoal font-medium">
                          {formatMAD(wa?.gross_value || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5 text-charcoal/60">
                        <span>Encaissé (COD) :</span>
                        <span className="font-serif text-emerald-800 font-semibold">
                          {formatMAD(wa?.collected_revenue || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </Card>
      </div>

      {/* 6. Recent Orders Table (Real Backend Data) */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-sand-border/60">
          <div>
            <span className="label-editorial text-burgundy">Commandes Récentes</span>
            <h3 className="text-lg font-serif text-charcoal mt-0.5">
              Dernières Commandes Enregistrées
            </h3>
          </div>
          <span className="text-xs text-charcoal/50 font-sans">
            Affichage des 5 dernières commandes clients
          </span>
        </div>

        {recentOrdersError ? (
          <div className="py-8 text-center text-xs text-charcoal/50 font-sans">
            Impossible de charger les commandes récentes.
          </div>
        ) : recentOrdersData?.orders && recentOrdersData.orders.length > 0 ? (
          <div className="overflow-x-auto rounded border border-sand-border">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-canvas border-b border-sand-border text-[0.68rem] uppercase tracking-editorial font-semibold text-charcoal/70">
                <tr>
                  <th className="py-3 px-4">Commande</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Montant</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-border/50 bg-white">
                {recentOrdersData.orders.map((order) => {
                  const source = order.order_source || order.source;
                  const isPaid = order.payment_status === 'paid';

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-canvas/50 transition-colors"
                    >
                      {/* Commande */}
                      <td className="py-3 px-4 font-mono font-medium text-burgundy">
                        <div className="flex items-center gap-1.5">
                          <span>{order.order_number}</span>
                          {order.items_count !== undefined && (
                            <span className="text-[0.6rem] px-1 rounded bg-sand/30 text-charcoal font-sans font-normal">
                              {order.items_count} art.
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4 text-charcoal">
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

                      {/* Date */}
                      <td className="py-3 px-4 text-charcoal/70 whitespace-nowrap">
                        {formatDateTime(order.created_at)}
                      </td>

                      {/* Montant */}
                      <td className="py-3 px-4">
                        <span className="font-serif font-medium text-charcoal block">
                          {formatMAD(order.total_amount)}
                        </span>
                        <span
                          className={`text-[0.62rem] font-semibold font-sans ${
                            isPaid ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {isPaid ? 'Encaissé' : 'COD à percevoir'}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="py-3 px-4">
                        <Badge
                          variant={source === 'whatsapp' ? 'sage' : 'neutral'}
                          size="sm"
                          className="text-[0.65rem] px-2 py-0.5 capitalize"
                        >
                          {formatOrderSource(source)}
                        </Badge>
                      </td>

                      {/* Statut */}
                      <td className="py-3 px-4">
                        <Badge status={order.status} size="sm" />
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-charcoal/60 hover:text-burgundy"
                          aria-label={`Détails commande ${order.order_number}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Aucune commande récente"
            description="Les nouvelles commandes passées par vos clients apparaîtront automatiquement ici."
          />
        )}
      </Card>

      {/* 7. Low-Stock Inventory Alerts (if any items ≤ 10) */}
      {inventoryData?.low_stock_items && inventoryData.low_stock_items.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <h3 className="text-sm font-semibold uppercase tracking-editorial text-amber-900 font-sans">
              Alerte de Stock Critique ({inventoryData.low_stock_items.length} soin(s))
            </h3>
          </div>
          <p className="text-xs text-amber-900/70 font-sans mb-4">
            Ces soins artisanaux ont atteint ou dépassé le seuil de réapprovisionnement de 10 unités.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {inventoryData.low_stock_items.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded bg-white border border-amber-200/80 flex items-center justify-between"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-xs font-semibold text-charcoal truncate font-sans">
                    {item.name}
                  </span>
                  <span className="text-[0.65rem] text-charcoal/50 font-mono">
                    {item.sku} • {item.category_name || 'Général'}
                  </span>
                </div>
                <span className="text-xs font-semibold font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 shrink-0">
                  {item.stock_quantity} restant(s)
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Order Quick View Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-xs"
          onClick={() => setSelectedOrder(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-modal-title"
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-lg w-full border border-sand-border p-6 flex flex-col gap-5 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-sand-border">
              <div>
                <span className="label-editorial text-burgundy">Fiche Commande</span>
                <h3 id="order-modal-title" className="text-xl font-serif text-charcoal">
                  {selectedOrder.order_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded text-charcoal/50 hover:text-charcoal hover:bg-canvas transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-col gap-4 text-xs font-sans text-charcoal">
              {/* Order Metadata Strip */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-canvas rounded border border-sand-border/70">
                <div>
                  <span className="text-[0.65rem] uppercase tracking-editorial text-charcoal/50 block">
                    Statut Actuel
                  </span>
                  <div className="mt-1">
                    <Badge status={selectedOrder.status} size="sm" />
                  </div>
                </div>
                <div>
                  <span className="text-[0.65rem] uppercase tracking-editorial text-charcoal/50 block">
                    Date & Heure
                  </span>
                  <span className="font-medium text-charcoal block mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-charcoal/40" />
                    {formatDateTime(selectedOrder.created_at)}
                  </span>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <span className="text-[0.68rem] uppercase font-semibold tracking-editorial text-charcoal/60 mb-1.5 block">
                  Informations Client
                </span>
                <div className="p-3 bg-white rounded border border-sand-border flex flex-col gap-1.5">
                  <div className="font-semibold text-charcoal text-sm">
                    {selectedOrder.customer
                      ? `${selectedOrder.customer.first_name} ${selectedOrder.customer.last_name}`
                      : 'Client Invité'}
                  </div>
                  {selectedOrder.customer?.phone && (
                    <div className="flex items-center gap-1.5 text-charcoal/70">
                      <Phone className="w-3.5 h-3.5 text-sage" />
                      <span>{formatPhoneDisplay(selectedOrder.customer.phone)}</span>
                    </div>
                  )}
                  {selectedOrder.customer?.city && (
                    <div className="flex items-center gap-1.5 text-charcoal/70">
                      <MapPin className="w-3.5 h-3.5 text-sage" />
                      <span>{selectedOrder.customer.city}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Breakdown */}
              <div>
                <span className="text-[0.68rem] uppercase font-semibold tracking-editorial text-charcoal/60 mb-1.5 block">
                  Règlement (Paiement à la livraison)
                </span>
                <div className="p-3 bg-canvas/70 rounded border border-sand-border flex flex-col gap-1">
                  <div className="flex justify-between py-0.5">
                    <span className="text-charcoal/60">Sous-total :</span>
                    <span className="font-serif">{formatMAD(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-charcoal/60">Frais de livraison :</span>
                    <span className="font-serif">{formatMAD(selectedOrder.shipping_fee)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-sand-border text-sm font-semibold text-burgundy">
                    <span>Total de la commande :</span>
                    <span className="font-serif">{formatMAD(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-sand-border flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrder(null)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
