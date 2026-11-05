import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Coins,
  ShoppingBag,
  Clock,
  AlertTriangle,
  Download,
  Filter,
  RefreshCw,
  Layers,
  Users,
  Truck,
  CheckCircle2,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';
import {
  useReportSummary,
  useReportSales,
  useReportOrders,
  useReportProducts,
  useReportCategories,
  useReportCollections,
  useReportCustomers,
  useReportDelivery,
} from '../../hooks/useReports';
import { reportsApi } from '../../api/reports.api';
import type { ReportPeriod, ReportDateRangeParams } from '../../types/reports.types';
import {
  formatMAD,
  formatOrderStatus,
  formatOrderSource,
} from '../../utils/formatters';

const PRESET_PERIODS: { id: ReportPeriod; label: string }[] = [
  { id: 'today', label: "Aujourd'hui" },
  { id: '7d', label: '7 derniers jours' },
  { id: '30d', label: '30 derniers jours' },
  { id: '90d', label: '90 derniers jours' },
  { id: 'year', label: 'Cette année' },
  { id: 'custom', label: 'Personnalisé' },
];

export const AdminReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [appliedCustomDates, setAppliedCustomDates] = useState<{ date_from?: string; date_to?: string }>({});
  const [dateError, setDateError] = useState<string | null>(null);

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Active query parameters
  const queryParams: ReportDateRangeParams = useMemo(() => {
    if (selectedPeriod === 'custom') {
      return {
        period: 'custom',
        date_from: appliedCustomDates.date_from,
        date_to: appliedCustomDates.date_to,
      };
    }
    return { period: selectedPeriod };
  }, [selectedPeriod, appliedCustomDates]);

  // TanStack Query Hooks
  const {
    data: summary,
    isLoading: loadingSummary,
    error: summaryError,
    refetch: refetchSummary,
    isFetching: fetchingSummary,
  } = useReportSummary(queryParams);

  const {
    data: salesData,
    isLoading: loadingSales,
    refetch: refetchSales,
  } = useReportSales(queryParams);

  const {
    data: ordersData,
    isLoading: loadingOrders,
    refetch: refetchOrders,
  } = useReportOrders(queryParams);

  const {
    data: productsData,
    isLoading: loadingProducts,
    refetch: refetchProducts,
  } = useReportProducts(queryParams);

  const {
    data: categoriesData,
    isLoading: loadingCategories,
    refetch: refetchCategories,
  } = useReportCategories(queryParams);

  const {
    data: collectionsData,
    isLoading: loadingCollections,
    refetch: refetchCollections,
  } = useReportCollections(queryParams);

  const {
    data: customersData,
    refetch: refetchCustomers,
  } = useReportCustomers(queryParams);

  const {
    data: deliveryData,
    refetch: refetchDelivery,
  } = useReportDelivery(queryParams);

  const isGlobalLoading =
    loadingSummary || loadingSales || loadingOrders || loadingProducts || loadingCategories || loadingCollections;

  const handleRefreshAll = () => {
    refetchSummary();
    refetchSales();
    refetchOrders();
    refetchProducts();
    refetchCategories();
    refetchCollections();
    refetchCustomers();
    refetchDelivery();
  };

  const handlePeriodChange = (p: ReportPeriod) => {
    setSelectedPeriod(p);
    setDateError(null);
    if (p !== 'custom') {
      setAppliedCustomDates({});
    }
  };

  const handleApplyCustomDates = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFrom || !customTo) {
      setDateError('Veuillez spécifier une date de début et une date de fin.');
      return;
    }
    if (new Date(customFrom) > new Date(customTo)) {
      setDateError('La date de début doit être antérieure ou égale à la date de fin.');
      return;
    }
    setDateError(null);
    setAppliedCustomDates({ date_from: customFrom, date_to: customTo });
  };

  const handleExport = async (type: 'sales' | 'orders' | 'products') => {
    try {
      setIsExporting(true);
      setIsExportMenuOpen(false);
      const filename = await reportsApi.downloadExportCsv({
        ...queryParams,
        type,
      });
      setExportFeedback(`Exporté avec succès : ${filename}`);
      setTimeout(() => setExportFeedback(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'exportation CSV";
      setExportFeedback(msg);
      setTimeout(() => setExportFeedback(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  if (summaryError) {
    return (
      <ErrorState
        title="Erreur de chargement des rapports"
        message="Impossible d'extraire les données analytiques sécurisées. Veuillez vérifier votre session ou retenter l'opération."
        onRetry={handleRefreshAll}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full pb-12">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-sand-border/60">
        <div>
          <span className="label-editorial text-burgundy flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-burgundy" />
            Intelligence Commerciale & Décisionnelle
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif text-charcoal mt-1">
            Rapports & Analyses
          </h1>
          <p className="text-xs text-charcoal/60 font-sans mt-0.5">
            Analysez les performances commerciales de votre boutique avec des métriques réelles issues de la base PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2 relative">
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

          {/* Export Dropdown */}
          <div className="relative">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              isLoading={isExporting}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              rightIcon={<ChevronDown className="w-3 h-3 ml-0.5" />}
              className="text-xs"
            >
              Exporter CSV
            </Button>

            {isExportMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white border border-sand-border rounded shadow-lg z-50 py-1"
                role="menu"
              >
                <button
                  type="button"
                  onClick={() => handleExport('sales')}
                  className="w-full text-left px-4 py-2 text-xs text-charcoal hover:bg-canvas flex items-center gap-2"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-burgundy" />
                  Rapport des ventes (.csv)
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('orders')}
                  className="w-full text-left px-4 py-2 text-xs text-charcoal hover:bg-canvas flex items-center gap-2"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-burgundy" />
                  Rapport des commandes (.csv)
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('products')}
                  className="w-full text-left px-4 py-2 text-xs text-charcoal hover:bg-canvas flex items-center gap-2"
                >
                  <Layers className="w-3.5 h-3.5 text-burgundy" />
                  Performance produits (.csv)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Feedback notification */}
      {exportFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {exportFeedback}
          </span>
          <button
            type="button"
            onClick={() => setExportFeedback(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* 2. Date Range Filter Bar */}
      <Card className="p-4 bg-white border-sand-border flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-burgundy" />
            <span className="text-xs font-semibold text-charcoal font-sans uppercase tracking-editorial">
              Période d'analyse :
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_PERIODS.map((p) => {
              const active = selectedPeriod === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePeriodChange(p.id)}
                  className={`text-xs px-3 py-1.5 rounded transition-all font-sans ${
                    active
                      ? 'bg-burgundy text-white font-medium shadow-sm'
                      : 'bg-canvas text-charcoal/80 hover:bg-sand/40 border border-sand-border/50'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Range Selector */}
        {selectedPeriod === 'custom' && (
          <form
            onSubmit={handleApplyCustomDates}
            className="mt-2 pt-3 border-t border-sand-border/40 flex flex-wrap items-end gap-3"
          >
            <div>
              <label className="block text-[0.7rem] uppercase tracking-editorial text-charcoal/60 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="text-xs px-3 py-1.5 border border-sand-border rounded bg-white text-charcoal focus:outline-none focus:border-burgundy"
                required
              />
            </div>
            <div>
              <label className="block text-[0.7rem] uppercase tracking-editorial text-charcoal/60 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="text-xs px-3 py-1.5 border border-sand-border rounded bg-white text-charcoal focus:outline-none focus:border-burgundy"
                required
              />
            </div>
            <Button type="submit" size="sm" variant="outline" className="text-xs">
              Appliquer la sélection
            </Button>
            {dateError && (
              <span className="text-xs text-rose-700 font-sans self-center">
                {dateError}
              </span>
            )}
          </form>
        )}
      </Card>

      {isGlobalLoading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <Spinner size="lg" message="Calcul des rapports et agrégations analytiques..." />
        </div>
      ) : summary ? (
        <>
          {/* 3. Main KPI Cards (6 Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* KPI 1: Chiffre d'Affaires Encaissé */}
            <Card className="flex flex-col justify-between border-sand-border/80 hover:border-burgundy/40 transition-colors p-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[0.68rem] uppercase tracking-editorial font-semibold text-charcoal/60 font-sans">
                    Chiffre d'affaires encaissé
                  </span>
                  <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-800 flex items-center justify-center">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-2xl sm:text-3xl font-serif text-charcoal block">
                  {formatMAD(summary.kpis.collected_revenue.current)}
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-sand-border/50 flex items-center justify-between">
                <ComparisonBadge
                  pctChange={summary.kpis.collected_revenue.pct_change}
                  diffFormatted={formatMAD(summary.kpis.collected_revenue.diff)}
                />
                <span className="text-[0.7rem] text-charcoal/50 font-sans">vs période préc.</span>
              </div>
            </Card>

            {/* KPI 2: Valeur Brute des Commandes */}
            <Card className="flex flex-col justify-between border-sand-border/80 hover:border-burgundy/40 transition-colors p-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[0.68rem] uppercase tracking-editorial font-semibold text-charcoal/60 font-sans">
                    Valeur des commandes (Brut)
                  </span>
                  <div className="w-8 h-8 rounded bg-rose-soft text-burgundy flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-2xl sm:text-3xl font-serif text-charcoal block">
                  {formatMAD(summary.kpis.gross_order_value.current)}
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-sand-border/50 flex items-center justify-between">
                <ComparisonBadge
                  pctChange={summary.kpis.gross_order_value.pct_change}
                  diffFormatted={formatMAD(summary.kpis.gross_order_value.diff)}
                />
                <span className="text-[0.7rem] text-charcoal/50 font-sans">Hors annulations</span>
              </div>
            </Card>

            {/* KPI 3: Volume de Commandes */}
            <Card className="flex flex-col justify-between border-sand-border/80 hover:border-burgundy/40 transition-colors p-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[0.68rem] uppercase tracking-editorial font-semibold text-charcoal/60 font-sans">
                    Commandes validées
                  </span>
                  <div className="w-8 h-8 rounded bg-sand/40 text-charcoal flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-2xl sm:text-3xl font-serif text-charcoal block">
                  {summary.kpis.total_orders.current}
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-sand-border/50 flex items-center justify-between">
                <ComparisonBadge
                  pctChange={summary.kpis.total_orders.pct_change}
                  diffFormatted={`${summary.kpis.total_orders.diff ?? 0} cmd`}
                />
                <span className="text-[0.7rem] text-charcoal/50 font-sans">vs période préc.</span>
              </div>
            </Card>

            {/* KPI 4: Panier Moyen (AOV) */}
            <Card className="flex flex-col justify-between border-sand-border/80 hover:border-burgundy/40 transition-colors p-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[0.68rem] uppercase tracking-editorial font-semibold text-charcoal/60 font-sans">
                    Panier moyen (AOV)
                  </span>
                  <div className="w-8 h-8 rounded bg-burgundy/10 text-burgundy flex items-center justify-center">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-2xl sm:text-3xl font-serif text-charcoal block">
                  {formatMAD(summary.kpis.average_order_value.current)}
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-sand-border/50 flex items-center justify-between">
                <ComparisonBadge
                  pctChange={summary.kpis.average_order_value.pct_change}
                  diffFormatted={formatMAD(summary.kpis.average_order_value.diff)}
                />
                <span className="text-[0.7rem] text-charcoal/50 font-sans">AOV éligible</span>
              </div>
            </Card>

            {/* KPI 5: En attente d'encaissement (COD) */}
            <Card className="flex flex-col justify-between border-sand-border/80 hover:border-burgundy/40 transition-colors p-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[0.68rem] uppercase tracking-editorial font-semibold text-charcoal/60 font-sans">
                    En attente d'encaissement
                  </span>
                  <div className="w-8 h-8 rounded bg-amber-50 text-amber-800 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-2xl sm:text-3xl font-serif text-charcoal block">
                  {formatMAD(summary.kpis.pending_collection.current)}
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-sand-border/50 text-[0.72rem] text-charcoal/60 font-sans">
                {summary.kpis.in_transit_value.current > 0 ? (
                  <span className="text-amber-800 font-medium">
                    Dont {formatMAD(summary.kpis.in_transit_value.current)} en transit logistique
                  </span>
                ) : (
                  <span>Paiements COD en attente de livraison</span>
                )}
              </div>
            </Card>

            {/* KPI 6: Taux d'annulation */}
            <Card className="flex flex-col justify-between border-sand-border/80 hover:border-burgundy/40 transition-colors p-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[0.68rem] uppercase tracking-editorial font-semibold text-charcoal/60 font-sans">
                    Taux d'annulation
                  </span>
                  <div className="w-8 h-8 rounded bg-rose-100 text-rose-800 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <span className="text-2xl sm:text-3xl font-serif text-charcoal block">
                  {summary.kpis.cancellation.rate_pct}%
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-sand-border/50 flex items-center justify-between text-[0.72rem] text-charcoal/60 font-sans">
                <span>
                  {summary.kpis.cancellation.cancelled_count} annulations sur{' '}
                  {summary.kpis.cancellation.total_orders_all}
                </span>
                <span
                  className={`font-medium ${
                    summary.kpis.cancellation.rate_diff <= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {summary.kpis.cancellation.rate_diff > 0 ? '+' : ''}
                  {summary.kpis.cancellation.rate_diff}% vs préc.
                </span>
              </div>
            </Card>
          </div>

          {/* 4. Sales Timeline Section (Chronological SVG Chart) */}
          <Card className="p-6 border-sand-border/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-lg font-serif text-charcoal">Évolution Chronologique des Ventes</h3>
                <p className="text-xs text-charcoal/60 font-sans">
                  Comparaison quotidienne entre valeur brute des commandes et chiffre d'affaires effectivement perçu.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-sans">
                <span className="flex items-center gap-1.5 text-burgundy font-medium">
                  <span className="w-3 h-3 rounded-full bg-burgundy inline-block" />
                  Encaissé (COD)
                </span>
                <span className="flex items-center gap-1.5 text-[#C9828D] font-medium">
                  <span className="w-3 h-3 rounded-full bg-[#C9828D] inline-block" />
                  Valeur brute
                </span>
              </div>
            </div>

            {salesData && salesData.timeline.length > 0 ? (
              <SalesTimelineChart timeline={salesData.timeline} />
            ) : (
              <EmptyState
                title="Aucune vente sur la période"
                description="Aucune activité de vente enregistrée pour les dates sélectionnées."
              />
            )}
          </Card>

          {/* 5. Two-column: Order Analytics & Acquisition Channels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Orders by Status */}
            <Card className="p-6 border-sand-border/80">
              <h3 className="text-lg font-serif text-charcoal mb-1">Tunnel des Commandes par Statut</h3>
              <p className="text-xs text-charcoal/60 font-sans mb-5">
                Distribution des {ordersData?.total_orders || 0} commandes reçues sur la période.
              </p>

              <div className="flex flex-col gap-3.5">
                {ordersData?.by_status.map((item) => (
                  <div key={item.status} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="font-medium text-charcoal">
                        {formatOrderStatus(item.status)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-charcoal/60">{item.count} cmd</span>
                        <span className="font-semibold text-charcoal min-w-[70px] text-right">
                          {formatMAD(item.total_value)}
                        </span>
                        <span className="text-[0.7rem] px-1.5 py-0.5 rounded bg-sand/30 text-charcoal font-medium min-w-[42px] text-right">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-sand/20 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.status === 'delivered'
                            ? 'bg-emerald-600'
                            : item.status === 'shipped'
                            ? 'bg-burgundy'
                            : item.status === 'cancelled'
                            ? 'bg-rose-400'
                            : 'bg-sand-border'
                        }`}
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Right: Orders by Channel / Source */}
            <Card className="p-6 border-sand-border/80">
              <h3 className="text-lg font-serif text-charcoal mb-1">Canaux d'Acquisition</h3>
              <p className="text-xs text-charcoal/60 font-sans mb-5">
                Répartition des ventes valides entre la boutique en ligne et les commandes WhatsApp.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ordersData?.by_source.map((src) => {
                  const isWhatsapp = src.source === 'whatsapp';
                  return (
                    <div
                      key={src.source}
                      className="p-4 rounded border border-sand-border/60 bg-canvas/40 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold uppercase tracking-editorial text-charcoal font-sans">
                            {formatOrderSource(src.source)}
                          </span>
                          <Badge variant={isWhatsapp ? 'success' : 'default'} size="sm">
                            {src.percentage}%
                          </Badge>
                        </div>
                        <span className="text-xl font-serif text-charcoal block">
                          {formatMAD(src.gross_value)}
                        </span>
                        <span className="text-xs text-charcoal/60 font-sans block mt-0.5">
                          {src.count} commandes enregistrées
                        </span>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-sand-border/40 text-[0.72rem] text-charcoal/60 font-sans">
                        Encaissé :{' '}
                        <strong className="text-charcoal font-semibold">
                          {formatMAD(src.collected_revenue)}
                        </strong>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cancellation summary */}
              <div className="mt-5 p-3 rounded bg-sand/20 border border-sand-border/40 flex items-center justify-between text-xs font-sans text-charcoal/80">
                <span>Taux global d'annulation :</span>
                <strong className="text-rose-800 font-semibold">
                  {ordersData?.cancellation_rate_pct}% ({ordersData?.cancelled_orders} commandes annulées)
                </strong>
              </div>
            </Card>
          </div>

          {/* 6. COD & Collection Analytics */}
          {collectionsData && (
            <Card className="p-6 border-sand-border/80">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-serif text-charcoal">Suivi des Encaissements COD</h3>
                  <p className="text-xs text-charcoal/60 font-sans">
                    Contrôle des flux d'argent liquide à la livraison (Cash on Delivery).
                  </p>
                </div>
                <div className="w-8 h-8 rounded bg-sand/30 flex items-center justify-center text-burgundy">
                  <Coins className="w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded">
                  <span className="text-[0.68rem] uppercase tracking-editorial text-emerald-800 font-semibold block">
                    Total Encaissé
                  </span>
                  <span className="text-xl font-serif text-emerald-950 block mt-1">
                    {formatMAD(collectionsData.total_collected)}
                  </span>
                  <span className="text-[0.7rem] text-emerald-700 block mt-1">
                    {collectionsData.delivered_paid_count} commandes acquittées
                  </span>
                </div>

                <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded">
                  <span className="text-[0.68rem] uppercase tracking-editorial text-amber-800 font-semibold block">
                    En attente de paiement
                  </span>
                  <span className="text-xl font-serif text-amber-950 block mt-1">
                    {formatMAD(collectionsData.pending_collection)}
                  </span>
                  <span className="text-[0.7rem] text-amber-700 block mt-1">
                    Commandes actives non annulées
                  </span>
                </div>

                <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded">
                  <span className="text-[0.68rem] uppercase tracking-editorial text-burgundy font-semibold block">
                    En transit logistique
                  </span>
                  <span className="text-xl font-serif text-burgundy block mt-1">
                    {formatMAD(collectionsData.shipped_pending_collection)}
                  </span>
                  <span className="text-[0.7rem] text-charcoal/60 block mt-1">
                    Expédiées mais pas encore encaissées
                  </span>
                </div>

                <div className="p-3.5 bg-canvas border border-sand-border/80 rounded">
                  <span className="text-[0.68rem] uppercase tracking-editorial text-charcoal/60 font-semibold block">
                    Paiements Remboursés
                  </span>
                  <span className="text-xl font-serif text-charcoal block mt-1">
                    {formatMAD(collectionsData.by_payment_status.refunded.total)}
                  </span>
                  <span className="text-[0.7rem] text-charcoal/60 block mt-1">
                    {collectionsData.by_payment_status.refunded.count} commandes remboursées
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* 7. Product Performance Table (Top 10) */}
          <Card className="border-sand-border/80 overflow-hidden">
            <div className="p-5 border-b border-sand-border/60 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif text-charcoal">Performance des Produits (Top 10)</h3>
                <p className="text-xs text-charcoal/60 font-sans mt-0.5">
                  Classement basé sur les instantanés immuables de commandes validées.
                </p>
              </div>
              <span className="text-xs text-charcoal/60 font-sans">
                {productsData?.products.length || 0} produits classés
              </span>
            </div>

            {productsData && productsData.products.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-sand/20 border-b border-sand-border/50 uppercase tracking-editorial text-charcoal/70 text-[0.68rem]">
                    <tr>
                      <th className="py-3 px-4">Rang</th>
                      <th className="py-3 px-4">Produit (Instantané)</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4 text-right">Unités</th>
                      <th className="py-3 px-4 text-right">Commandes</th>
                      <th className="py-3 px-4 text-right">Prix Moyen</th>
                      <th className="py-3 px-4 text-right font-semibold text-charcoal">Chiffre d'Affaires</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-border/40">
                    {productsData.products.map((p, idx) => (
                      <tr key={`${p.product_id}-${p.name}`} className="hover:bg-canvas/50">
                        <td className="py-3 px-4 font-semibold text-charcoal/60">
                          #{idx + 1}
                        </td>
                        <td className="py-3 px-4 font-medium text-charcoal">
                          {p.name}
                        </td>
                        <td className="py-3 px-4 text-charcoal/60 font-mono text-[0.7rem]">
                          {p.sku || '—'}
                        </td>
                        <td className="py-3 px-4 text-right text-charcoal font-semibold">
                          {p.units_sold}
                        </td>
                        <td className="py-3 px-4 text-right text-charcoal/70">
                          {p.order_count}
                        </td>
                        <td className="py-3 px-4 text-right text-charcoal/70">
                          {formatMAD(p.avg_unit_price)}
                        </td>
                        <td className="py-3 px-4 text-right font-serif text-burgundy font-semibold">
                          {formatMAD(p.total_revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8">
                <EmptyState
                  title="Aucune donnée produit"
                  description="Aucun article vendu sur la période sélectionnée."
                />
              </div>
            )}
          </Card>

          {/* 8. Category Performance Table */}
          <Card className="border-sand-border/80 overflow-hidden">
            <div className="p-5 border-b border-sand-border/60">
              <h3 className="text-lg font-serif text-charcoal">Performance par Catégorie</h3>
              <p className="text-xs text-charcoal/60 font-sans mt-0.5">
                Répartition des ventes par catégorie de produits.
              </p>
              {categoriesData?.attribution_note && (
                <p className="text-[0.7rem] text-burgundy/80 font-sans mt-1 italic">
                  * {categoriesData.attribution_note}
                </p>
              )}
            </div>

            {categoriesData && categoriesData.categories.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-sand/20 border-b border-sand-border/50 uppercase tracking-editorial text-charcoal/70 text-[0.68rem]">
                    <tr>
                      <th className="py-3 px-4">Catégorie</th>
                      <th className="py-3 px-4 text-right">Unités Vendues</th>
                      <th className="py-3 px-4 text-right">Commandes</th>
                      <th className="py-3 px-4 text-right">Chiffre d'Affaires</th>
                      <th className="py-3 px-4 text-right">Part des Ventes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-border/40">
                    {categoriesData.categories.map((c) => (
                      <tr key={c.category_id} className="hover:bg-canvas/50">
                        <td className="py-3 px-4 font-medium text-charcoal">
                          {c.name}
                        </td>
                        <td className="py-3 px-4 text-right text-charcoal font-semibold">
                          {c.units_sold}
                        </td>
                        <td className="py-3 px-4 text-right text-charcoal/70">
                          {c.order_count}
                        </td>
                        <td className="py-3 px-4 text-right font-serif text-burgundy font-semibold">
                          {formatMAD(c.total_revenue)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-block px-2 py-0.5 rounded bg-sand/30 font-medium text-charcoal">
                            {c.percentage_of_total}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8">
                <EmptyState
                  title="Aucune donnée de catégorie"
                  description="Aucune vente répertoriée par catégorie pour cette période."
                />
              </div>
            )}
          </Card>

          {/* 9. Highlights: Customers & Delivery Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Metrics */}
            {customersData && (
              <Card className="p-5 border-sand-border/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-burgundy" />
                    <h4 className="text-sm font-serif text-charcoal font-semibold">
                      Activité Clientèle
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs font-sans">
                    <div className="p-3 bg-canvas/60 rounded border border-sand-border/40">
                      <span className="text-[0.68rem] text-charcoal/60 uppercase tracking-editorial block">
                        Nouveaux Clients
                      </span>
                      <span className="text-lg font-serif text-charcoal block mt-0.5">
                        {customersData.new_customers_count}
                      </span>
                    </div>
                    <div className="p-3 bg-canvas/60 rounded border border-sand-border/40">
                      <span className="text-[0.68rem] text-charcoal/60 uppercase tracking-editorial block">
                        Clients Récurrents
                      </span>
                      <span className="text-lg font-serif text-charcoal block mt-0.5">
                        {customersData.repeat_customers_count}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[0.72rem] text-charcoal/60 font-sans mt-3 pt-2 border-t border-sand-border/40">
                  Moyenne de {customersData.average_orders_per_customer} commande(s) par client actif.
                </p>
              </Card>
            )}

            {/* Delivery Metrics */}
            {deliveryData && (
              <Card className="p-5 border-sand-border/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Truck className="w-4 h-4 text-burgundy" />
                    <h4 className="text-sm font-serif text-charcoal font-semibold">
                      Performance Logistique
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs font-sans">
                    <div className="p-3 bg-canvas/60 rounded border border-sand-border/40">
                      <span className="text-[0.68rem] text-charcoal/60 uppercase tracking-editorial block">
                        Expédiées
                      </span>
                      <span className="text-lg font-serif text-charcoal block mt-0.5">
                        {deliveryData.shipped_orders_count}
                      </span>
                    </div>
                    <div className="p-3 bg-canvas/60 rounded border border-sand-border/40">
                      <span className="text-[0.68rem] text-charcoal/60 uppercase tracking-editorial block">
                        Livrées
                      </span>
                      <span className="text-lg font-serif text-emerald-800 block mt-0.5">
                        {deliveryData.delivered_orders_count}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[0.72rem] text-charcoal/60 font-sans mt-3 pt-2 border-t border-sand-border/40">
                  {deliveryData.avg_delivery_hours > 0
                    ? `Délai moyen d'acheminement : ${deliveryData.avg_delivery_hours} heures`
                    : "Suivi logistique opérationnel (timestamps d'expédition et de livraison)"}
                </p>
              </Card>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

// ==============================================================================
// Sub-components: Comparison Badge & SVG Sales Timeline Chart
// ==============================================================================

interface ComparisonBadgeProps {
  pctChange?: number | null;
  diffFormatted?: string;
}

const ComparisonBadge: React.FC<ComparisonBadgeProps> = ({ pctChange, diffFormatted }) => {
  if (pctChange === null || pctChange === undefined) {
    return (
      <span className="inline-flex items-center gap-1 text-[0.7rem] px-2 py-0.5 rounded bg-sand/30 text-charcoal font-medium font-sans">
        <Minus className="w-3 h-3 text-charcoal/50" />
        Période repère
      </span>
    );
  }

  const isPositive = pctChange > 0;
  const isZero = pctChange === 0;

  if (isZero) {
    return (
      <span className="inline-flex items-center gap-1 text-[0.7rem] px-2 py-0.5 rounded bg-sand/30 text-charcoal font-medium font-sans">
        <Minus className="w-3 h-3 text-charcoal/50" />
        0.0%
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-[0.7rem] px-2 py-0.5 rounded font-medium font-sans ${
        isPositive ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
      }`}
      title={diffFormatted ? `Écart absolu : ${diffFormatted}` : undefined}
    >
      {isPositive ? (
        <ArrowUpRight className="w-3 h-3 text-emerald-700" />
      ) : (
        <ArrowDownRight className="w-3 h-3 text-rose-700" />
      )}
      {isPositive ? '+' : ''}
      {pctChange}%
    </span>
  );
};

interface SalesTimelineChartProps {
  timeline: {
    date: string;
    order_count: number;
    gross_value: number;
    collected_revenue: number;
  }[];
}

const SalesTimelineChart: React.FC<SalesTimelineChartProps> = ({ timeline }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxVal = useMemo(() => {
    let m = 0;
    for (const pt of timeline) {
      if (pt.gross_value > m) m = pt.gross_value;
      if (pt.collected_revenue > m) m = pt.collected_revenue;
    }
    return m > 0 ? m * 1.15 : 100;
  }, [timeline]);

  const height = 240;
  const width = 800;
  const paddingX = 40;
  const paddingY = 30;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const pointsGross = useMemo(() => {
    if (timeline.length === 0) return '';
    return timeline
      .map((pt, i) => {
        const x = paddingX + (i / Math.max(timeline.length - 1, 1)) * chartWidth;
        const y = height - paddingY - (pt.gross_value / maxVal) * chartHeight;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [timeline, maxVal, chartWidth, chartHeight]);

  const pointsCollected = useMemo(() => {
    if (timeline.length === 0) return '';
    return timeline
      .map((pt, i) => {
        const x = paddingX + (i / Math.max(timeline.length - 1, 1)) * chartWidth;
        const y = height - paddingY - (pt.collected_revenue / maxVal) * chartHeight;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [timeline, maxVal, chartWidth, chartHeight]);

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[600px] h-60 select-none overflow-visible"
      >
        {/* Horizontal gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = height - paddingY - ratio * chartHeight;
          const val = ratio * maxVal;
          return (
            <g key={ratio}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#E2D3BE"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
              />
              <text
                x={paddingX - 8}
                y={y + 3}
                textAnchor="end"
                className="text-[9px] fill-charcoal/40 font-mono"
              >
                {Math.round(val)}
              </text>
            </g>
          );
        })}

        {/* Polylines */}
        {pointsGross && (
          <polyline
            fill="none"
            stroke="#D98CA5"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pointsGross}
          />
        )}
        {pointsCollected && (
          <polyline
            fill="none"
            stroke="#6B1838"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pointsCollected}
          />
        )}

        {/* Interactive Hover Anchors */}
        {timeline.map((pt, i) => {
          const x = paddingX + (i / Math.max(timeline.length - 1, 1)) * chartWidth;
          const yColl = height - paddingY - (pt.collected_revenue / maxVal) * chartHeight;
          const isHovered = hoveredIndex === i;

          return (
            <g
              key={pt.date}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Invisible touch bar */}
              <rect
                x={x - (chartWidth / timeline.length) / 2}
                y={paddingY}
                width={Math.max(chartWidth / timeline.length, 12)}
                height={chartHeight}
                fill="transparent"
              />

              {/* Data points */}
              <circle
                cx={x}
                cy={yColl}
                r={isHovered ? 5 : 3}
                fill="#6B1838"
                stroke="#FFFFFF"
                strokeWidth={isHovered ? 2 : 1}
                className="transition-all"
              />

              {/* Vertical line indicator */}
              {isHovered && (
                <line
                  x1={x}
                  y1={paddingY}
                  x2={x}
                  y2={height - paddingY}
                  stroke="#6B1838"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
              )}
            </g>
          );
        })}

        {/* X Axis Labels */}
        {timeline.map((pt, i) => {
          // Display ~6-8 labels max across the timeline to prevent clutter
          const step = Math.max(Math.floor(timeline.length / 7), 1);
          if (i % step !== 0 && i !== timeline.length - 1) return null;

          const x = paddingX + (i / Math.max(timeline.length - 1, 1)) * chartWidth;
          const dateLabel = pt.date.slice(5); // e.g. "11-03"

          return (
            <text
              key={pt.date}
              x={x}
              y={height - paddingY + 16}
              textAnchor="middle"
              className="text-[9px] fill-charcoal/50 font-sans"
            >
              {dateLabel}
            </text>
          );
        })}
      </svg>

      {/* Tooltip on hover */}
      {hoveredIndex !== null && timeline[hoveredIndex] && (
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 bg-charcoal text-white text-xs px-3 py-2 rounded shadow-xl pointer-events-none z-20 flex flex-col gap-1 font-sans border border-sand-border/20"
        >
          <div className="font-semibold text-rose-soft border-b border-white/10 pb-1">
            {timeline[hoveredIndex].date} ({timeline[hoveredIndex].order_count} commande{timeline[hoveredIndex].order_count > 1 ? 's' : ''})
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-white/70">Encaissé (COD) :</span>
            <strong className="text-emerald-400 font-mono">
              {formatMAD(timeline[hoveredIndex].collected_revenue)}
            </strong>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-white/70">Valeur brute :</span>
            <strong className="text-rose-200 font-mono">
              {formatMAD(timeline[hoveredIndex].gross_value)}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
};
