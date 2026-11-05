import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  Coins,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useCustomer, useCustomerOrders } from '../../hooks/useCustomers';
import {
  formatMAD,
  formatPhoneDisplay,
  formatDateTime,
  formatOrderStatus,
  formatOrderSource,
  formatPaymentStatus,
  formatCustomerStatus,
} from '../../utils/formatters';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { ErrorState } from '../../components/feedback/ErrorState';
import { EmptyState } from '../../components/feedback/EmptyState';
import type { CustomerOrder } from '../../types/customer.types';

export const AdminCustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const {
    data: customer,
    isLoading: isCustomerLoading,
    error: customerError,
    refetch: refetchCustomer,
  } = useCustomer(id || '');

  const {
    data: orders = [],
    isLoading: isOrdersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useCustomerOrders(id || '');

  if (isCustomerLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Spinner size="lg" className="text-burgundy" />
        <span className="text-sm text-charcoal/60 font-sans mt-3">
          Chargement du profil client…
        </span>
      </div>
    );
  }

  if (customerError || !customer) {
    return (
      <div className="py-12 max-w-lg mx-auto">
        <ErrorState
          title="Fiche client introuvable"
          message="Impossible de charger les données de ce client. L'enregistrement est peut-être introuvable ou a été supprimé."
          onRetry={() => refetchCustomer()}
        />
        <div className="mt-4 text-center">
          <Link to="/admin/customers">
            <Button variant="outline" size="sm">
              Retour au répertoire
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const ordersCount = Number(customer.total_orders) || 0;
  const totalSpent = Number(customer.total_spent) || 0;
  const averageOrderValue = ordersCount > 0 ? totalSpent / ordersCount : 0;
  const isRepeat = ordersCount > 1;
  const isActive = ordersCount === 1;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* =========================================================================
          1. Header & Navigation Back
         ========================================================================= */}
      <div>
        <Link
          to="/admin/customers"
          className="inline-flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-charcoal/60 hover:text-burgundy transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au répertoire clients</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-sand-light/60 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-burgundy/10 text-burgundy font-serif font-medium text-xl flex items-center justify-center shrink-0 border border-burgundy/20">
              {(customer.first_name?.[0] || '').toUpperCase()}
              {(customer.last_name?.[0] || '').toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-serif text-charcoal font-normal">
                  {customer.first_name} {customer.last_name}
                </h1>
                <Badge
                  variant={isRepeat ? 'sage' : isActive ? 'rose' : 'neutral'}
                  size="sm"
                >
                  {formatCustomerStatus(customer.total_orders)}
                </Badge>
              </div>
              <p className="text-xs text-charcoal/60 font-sans mt-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-charcoal/40" />
                <span>Client enregistré le {formatDateTime(customer.created_at)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchCustomer();
                refetchOrders();
              }}
              className="text-xs border-sand-light text-charcoal"
            >
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. Customer Metrics Summary
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <Card className="p-5 border-sand-light bg-warm-cream/50">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-sans text-charcoal/60">
              Commandes totales
            </span>
            <div className="w-8 h-8 rounded-full bg-sand-light/50 flex items-center justify-center text-charcoal/70">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-serif text-charcoal font-normal">
              {ordersCount}
            </span>
          </div>
          <p className="text-xs text-charcoal/50 mt-1">
            {ordersCount > 1 ? 'Commandes récurrentes' : 'Commande unique'}
          </p>
        </Card>

        {/* Total Spent */}
        <Card className="p-5 border-sand-light bg-warm-cream/50">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-sans text-charcoal/60">
              Total dépensé
            </span>
            <div className="w-8 h-8 rounded-full bg-burgundy/5 flex items-center justify-center text-burgundy">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif text-charcoal font-normal">
              {formatMAD(totalSpent)}
            </span>
          </div>
          <p className="text-xs text-charcoal/50 mt-1">
            Valeur cumulée (hors annulées)
          </p>
        </Card>

        {/* Average Order Value */}
        <Card className="p-5 border-sand-light bg-warm-cream/50">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-sans text-charcoal/60">
              Panier moyen
            </span>
            <div className="w-8 h-8 rounded-full bg-sage-50 flex items-center justify-center text-sage">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-serif text-charcoal font-normal">
              {ordersCount > 0 ? formatMAD(averageOrderValue) : '—'}
            </span>
          </div>
          <p className="text-xs text-charcoal/50 mt-1">
            Moyenne par commande
          </p>
        </Card>

        {/* Last Order Date */}
        <Card className="p-5 border-sand-light bg-warm-cream/50">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-sans text-charcoal/60">
              Dernière activité
            </span>
            <div className="w-8 h-8 rounded-full bg-sand-light/50 flex items-center justify-center text-charcoal/70">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm font-medium text-charcoal">
              {customer.last_order_date
                ? formatDateTime(customer.last_order_date)
                : 'Aucune commande'}
            </span>
          </div>
          <p className="text-xs text-charcoal/50 mt-1">
            Canal : {customer.last_order_source ? formatOrderSource(customer.last_order_source) : '—'}
          </p>
        </Card>
      </div>

      {/* =========================================================================
          3. Two-Column Layout: Order History & Customer Profile
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Order History (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif text-charcoal font-medium">
              Historique des commandes
            </h2>
            <span className="text-xs text-charcoal/60 font-sans">
              {orders.length} commande{orders.length > 1 ? 's' : ''} enregistrée{orders.length > 1 ? 's' : ''}
            </span>
          </div>

          <Card className="border-sand-light bg-white shadow-xs overflow-hidden">
            {isOrdersLoading ? (
              <div className="py-12 flex justify-center items-center">
                <Spinner size="md" className="text-burgundy" />
              </div>
            ) : ordersError ? (
              <div className="p-6">
                <ErrorState
                  title="Erreur de chargement"
                  message="Impossible de récupérer l'historique des commandes."
                  onRetry={() => refetchOrders()}
                />
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="Aucune commande trouvée"
                  description="Ce client n'a encore finalisé aucune commande sur la plateforme."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-sand-light bg-warm-cream/40 text-[11px] font-sans uppercase tracking-wider text-charcoal/60">
                      <th className="py-3 px-4 font-medium">Référence</th>
                      <th className="py-3 px-4 font-medium">Date</th>
                      <th className="py-3 px-4 font-medium text-center">Articles</th>
                      <th className="py-3 px-4 font-medium text-right">Montant</th>
                      <th className="py-3 px-4 font-medium">Canal</th>
                      <th className="py-3 px-4 font-medium">Statut</th>
                      <th className="py-3 px-4 font-medium">Paiement</th>
                      <th className="py-3 px-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-light/60 text-sm font-sans">
                    {orders.map((order: CustomerOrder) => (
                      <tr
                        key={order.id}
                        className="hover:bg-warm-cream/30 transition-colors"
                      >
                        {/* Order Number */}
                        <td className="py-3 px-4 font-mono text-xs font-medium text-charcoal">
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="hover:text-burgundy transition-colors"
                          >
                            {order.order_number}
                          </Link>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 text-xs text-charcoal/70">
                          {formatDateTime(order.created_at)}
                        </td>

                        {/* Items Count */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-sand-light/30 text-charcoal text-xs font-medium">
                            {order.items_count}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-4 text-right font-serif font-medium text-charcoal">
                          {formatMAD(order.total_amount)}
                        </td>

                        {/* Order Source */}
                        <td className="py-3 px-4">
                          <Badge
                            variant={order.order_source === 'whatsapp' ? 'sage' : 'neutral'}
                            size="sm"
                          >
                            {formatOrderSource(order.order_source)}
                          </Badge>
                        </td>

                        {/* Order Status */}
                        <td className="py-3 px-4">
                          <Badge status={order.status as any} size="sm">
                            {formatOrderStatus(order.status)}
                          </Badge>
                        </td>

                        {/* Payment Status */}
                        <td className="py-3 px-4">
                          <Badge status={order.payment_status as any} size="sm">
                            {formatPaymentStatus(order.payment_status)}
                          </Badge>
                        </td>

                        {/* Action Link */}
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/admin/orders/${order.id}`}
                            className="inline-flex items-center gap-1 text-xs text-burgundy hover:text-burgundy/80 font-medium"
                          >
                            <span>Détails</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Customer Details & Contact (1 col on lg) */}
        <div className="space-y-4">
          <h2 className="text-lg font-serif text-charcoal font-medium">
            Coordonnées & Informations
          </h2>

          <Card className="p-6 border-sand-light bg-white shadow-xs space-y-6">
            {/* Identity & Contact Info */}
            <div className="space-y-4">
              <span className="text-[11px] uppercase tracking-wider font-sans text-charcoal/50 font-medium">
                Identité & Coordonnées
              </span>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-charcoal/40 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-charcoal/50 block">Nom complet</span>
                    <span className="font-medium text-charcoal">
                      {customer.first_name} {customer.last_name}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-charcoal/40 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-charcoal/50 block">Téléphone</span>
                    <a
                      href={`tel:${customer.phone}`}
                      className="font-mono text-charcoal hover:text-burgundy transition-colors"
                    >
                      {formatPhoneDisplay(customer.phone)}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-charcoal/40 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-charcoal/50 block">Adresse email</span>
                    {customer.email ? (
                      <a
                        href={`mailto:${customer.email}`}
                        className="text-charcoal hover:text-burgundy transition-colors break-all"
                      >
                        {customer.email}
                      </a>
                    ) : (
                      <span className="text-charcoal/40 italic">Non renseignée</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-sand-light/60" />

            {/* Delivery Address */}
            <div className="space-y-4">
              <span className="text-[11px] uppercase tracking-wider font-sans text-charcoal/50 font-medium">
                Adresse de livraison principale
              </span>

              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-charcoal/40 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-medium text-charcoal">{customer.city}</div>
                  <div className="text-xs text-charcoal/70 leading-relaxed">
                    {customer.address}
                  </div>
                  {customer.postal_code && (
                    <div className="text-xs text-charcoal/50">
                      Code postal : {customer.postal_code}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes if any */}
            {customer.notes && (
              <>
                <hr className="border-sand-light/60" />
                <div className="space-y-2">
                  <span className="text-[11px] uppercase tracking-wider font-sans text-charcoal/50 font-medium">
                    Notes client
                  </span>
                  <p className="text-xs text-charcoal/70 bg-warm-cream/40 p-3 rounded border border-sand-light/40 leading-relaxed">
                    {customer.notes}
                  </p>
                </div>
              </>
            )}

            <hr className="border-sand-light/60" />

            {/* Security & Access Info */}
            <div className="flex items-center gap-2 text-xs text-charcoal/50 bg-sand-light/20 p-3 rounded">
              <ShieldCheck className="w-4 h-4 text-sage shrink-0" />
              <span>
                Fiche client consolidée à partir des commandes validées.
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
