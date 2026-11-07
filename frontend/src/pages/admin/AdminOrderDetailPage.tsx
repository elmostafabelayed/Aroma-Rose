import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Phone,
  MapPin,
  Mail,
  FileText,
  Truck,
  CheckCircle2,
  Ban,
  Package,
  Globe,
  MessageCircle,
  Copy,
  Check,
  Save,
  ShieldCheck,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  useAdminOrder,
  useUpdateOrderStatus,
  useUpdateOrderNotes,
  useReconcileCodPayment,
} from '../../hooks/useAdminOrders';
import { useAuth } from '../../auth/useAuth';
import {
  formatMAD,
  formatDateTime,
  formatDate,
  formatPhoneDisplay,
  formatOrderStatus,
  formatOrderSource,
  formatPaymentStatus,
  formatUserRole,
} from '../../utils/formatters';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { ErrorState } from '../../components/feedback/ErrorState';
import { OrderStatusTransitionModal } from '../../components/admin/OrderStatusTransitionModal';
import { useToast } from '../../context/ToastContext';
import type { OrderStatus } from '../../types/order.types';
import { cn } from '../../utils/cn';

export const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const { isAdmin } = useAuth();

  const {
    data: order,
    isLoading,
    error,
    refetch,
  } = useAdminOrder(id);

  const updateStatusMutation = useUpdateOrderStatus();
  const updateNotesMutation = useUpdateOrderNotes();
  const reconcilePaymentMutation = useReconcileCodPayment();

  // Modal & Transition State
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<OrderStatus | null>(null);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // COD Payment Reconciliation State
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [reconcileNotes, setReconcileNotes] = useState('');
  const [reconcileError, setReconcileError] = useState<string | null>(null);

  // Admin notes local state
  const [adminNotes, setAdminNotes] = useState('');
  const [isCopiedPhone, setIsCopiedPhone] = useState(false);

  useEffect(() => {
    if (order?.admin_notes) {
      setAdminNotes(order.admin_notes);
    }
  }, [order?.admin_notes]);

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs font-sans text-charcoal/60">
          Chargement des détails de la commande...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <ErrorState
          title="Commande introuvable"
          message="Impossible de récupérer les informations de cette commande. Elle a peut-être été supprimée ou l’identifiant est invalide."
          onRetry={() => refetch()}
        />
        <div className="mt-6 text-center">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/orders')}>
            ← Retour à la liste des commandes
          </Button>
        </div>
      </div>
    );
  }

  const source = order.order_source || order.source;
  const isPaid = order.payment_status === 'paid';
  const customer = order.customer;
  const items = order.items || [];
  const history = order.status_history || [];

  // Reconcile COD payment handler (Admin only)
  const handleConfirmReconciliation = async () => {
    if (!id) return;
    setReconcileError(null);
    try {
      await reconcilePaymentMutation.mutateAsync({
        id,
        notes: reconcileNotes.trim() || undefined,
      });
      showSuccessToast(
        'Paiement Encaissé',
        'Le versement du paiement COD a été validé et marqué comme encaissé.'
      );
      setIsReconcileModalOpen(false);
      setReconcileNotes('');
      refetch();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Échec de la validation de l’encaissement.';
      setReconcileError(message);
      showErrorToast('Erreur d’encaissement', message);
    }
  };

  // Copy phone handler
  const copyPhoneToClipboard = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setIsCopiedPhone(true);
    showSuccessToast('Copié', 'Numéro de téléphone copié dans le presse-papier.');
    setTimeout(() => setIsCopiedPhone(false), 2000);
  };

  // Open modal with desired status
  const handleInitiateTransition = (nextStatus: OrderStatus) => {
    setTargetStatus(nextStatus);
    setTransitionError(null);
    setIsTransitionModalOpen(true);
  };

  // Execute status update mutation
  const handleConfirmTransition = async (notes?: string) => {
    if (!targetStatus || !id) return;
    setTransitionError(null);

    try {
      await updateStatusMutation.mutateAsync({
        id,
        status: targetStatus,
        notes,
      });

      showSuccessToast(
        'Statut mis à jour',
        `La commande est désormais : ${formatOrderStatus(targetStatus)}.`
      );
      setIsTransitionModalOpen(false);
      setTargetStatus(null);
    } catch (err: any) {
      // Backend returns structured error message (e.g. check_violation stock error)
      const message =
        err?.message ||
        'Échec de la transition de statut. Veuillez vérifier les contraintes.';
      setTransitionError(message);
      showErrorToast('Erreur de transition', message);
    }
  };

  // Save admin notes
  const handleSaveAdminNotes = async () => {
    if (!id) return;
    try {
      await updateNotesMutation.mutateAsync({
        id,
        admin_notes: adminNotes,
      });
      showSuccessToast(
        'Notes enregistrées',
        'La note interne a été mise à jour avec succès.'
      );
    } catch (err: any) {
      showErrorToast('Erreur', 'Impossible d’enregistrer la note interne.');
    }
  };

  // Lifecycle progression visualizer steps
  const steps: { key: OrderStatus; label: string }[] = [
    { key: 'pending', label: 'En attente' },
    { key: 'confirmed', label: 'Confirmée' },
    { key: 'processing', label: 'En préparation' },
    { key: 'shipped', label: 'Expédiée' },
    { key: 'delivered', label: 'Livrée' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-16">
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
          <Link to="/admin/orders" className="hover:text-burgundy">
            Commandes
          </Link>
          <span>/</span>
          <span className="text-burgundy font-mono font-medium">
            {order.order_number}
          </span>
        </nav>

        {/* Title bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/orders')}
              className="p-2 text-charcoal/60 hover:text-burgundy"
              title="Retour aux commandes"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-serif font-medium text-charcoal tracking-tight">
                  {order.order_number}
                </h1>
                <Badge status={order.status} size="md" />
                {source === 'whatsapp' ? (
                  <span className="inline-flex items-center gap-1 text-[0.68rem] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                    <MessageCircle className="w-3 h-3" />
                    WhatsApp
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[0.68rem] px-2 py-0.5 rounded bg-sand/30 text-charcoal border border-sand-border font-medium">
                    <Globe className="w-3 h-3 text-charcoal/60" />
                    Site Web
                  </span>
                )}
                <Badge variant={isPaid ? 'sage' : 'warning'} size="sm">
                  {isPaid ? 'Payé (COD)' : 'À encaisser'}
                </Badge>
              </div>
              <p className="text-xs font-sans text-charcoal/60 mt-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Créée le {formatDateTime(order.created_at)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Order Lifecycle Progression Tracker */}
      <Card className="p-6 bg-white border border-sand-border">
        <div className="mb-4 flex items-center justify-between border-b border-sand-border/50 pb-3">
          <div>
            <span className="label-editorial text-burgundy">Progression</span>
            <h2 className="text-sm font-serif font-medium text-charcoal">
              Cycle de Vie de la Commande
            </h2>
          </div>
          {isCancelled && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-rose-soft text-red-900 border border-red-200 text-xs font-semibold uppercase tracking-editorial">
              <Ban className="w-3.5 h-3.5" />
              Commande Annulée {order.cancelled_at && `le ${formatDate(order.cancelled_at)}`}
            </span>
          )}
        </div>

        {!isCancelled && (
          <div className="relative my-4">
            {/* Progress line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-sand-border -translate-y-1/2 z-0 hidden sm:block" />
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-burgundy -translate-y-1/2 z-0 transition-all duration-500 hidden sm:block"
              style={{
                width: `${(currentStepIndex / (steps.length - 1)) * 100}%`,
              }}
            />

            {/* Steps */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-5 gap-3">
              {steps.map((step, idx) => {
                const isCompleted = currentStepIndex > idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div
                    key={step.key}
                    className={cn(
                      'flex flex-col items-center text-center p-2 rounded transition-all',
                      isCurrent && 'bg-sand/20 ring-1 ring-burgundy/20',
                      !isCurrent && !isCompleted && 'opacity-60'
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold mb-1.5 transition-colors',
                        isCompleted && 'bg-burgundy text-white',
                        isCurrent && 'bg-burgundy text-white ring-4 ring-rose-soft',
                        !isCompleted && !isCurrent && 'bg-sand/40 text-charcoal/60 border border-sand-border'
                      )}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-sans font-medium',
                        isCurrent ? 'text-burgundy font-semibold' : 'text-charcoal'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* State Machine Action Controls Bar */}
        <div className="mt-6 pt-4 border-t border-sand-border flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-sans text-charcoal/60">
            {isCancelled ? (
              <span className="text-red-800">
                Cette commande est annulée. Aucune action supplémentaire n’est possible.
              </span>
            ) : order.status === 'delivered' ? (
              <span className="text-emerald-800 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Commande finalisée et livrée avec succès. Paiement COD encaissé.
              </span>
            ) : (
              <span>Actions permises selon l’état actuel de la commande :</span>
            )}
          </div>

          {/* Valid Next Transition Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* If Pending: Confirmer OR Annuler */}
            {order.status === 'pending' && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleInitiateTransition('confirmed')}
                  disabled={updateStatusMutation.isPending}
                  className="flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmer la commande</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleInitiateTransition('cancelled')}
                  disabled={updateStatusMutation.isPending}
                  className="text-red-700 hover:bg-rose-soft/40 border-red-200"
                >
                  <Ban className="w-3.5 h-3.5 mr-1" />
                  <span>Annuler</span>
                </Button>
              </>
            )}

            {/* If Confirmed: Passer en préparation OR Annuler */}
            {order.status === 'confirmed' && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleInitiateTransition('processing')}
                  disabled={updateStatusMutation.isPending}
                  className="flex items-center gap-1.5"
                >
                  <Package className="w-4 h-4" />
                  <span>Mettre en préparation</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleInitiateTransition('cancelled')}
                  disabled={updateStatusMutation.isPending}
                  className="text-red-700 hover:bg-rose-soft/40 border-red-200"
                >
                  <Ban className="w-3.5 h-3.5 mr-1" />
                  <span>Annuler</span>
                </Button>
              </>
            )}

            {/* If Processing: Expédier OR Annuler */}
            {order.status === 'processing' && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleInitiateTransition('shipped')}
                  disabled={updateStatusMutation.isPending}
                  className="flex items-center gap-1.5 shadow-sm"
                >
                  <Truck className="w-4 h-4 text-emerald-300" />
                  <span>Expédier la commande</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleInitiateTransition('cancelled')}
                  disabled={updateStatusMutation.isPending}
                  className="text-red-700 hover:bg-rose-soft/40 border-red-200"
                >
                  <Ban className="w-3.5 h-3.5 mr-1" />
                  <span>Annuler</span>
                </Button>
              </>
            )}

            {/* If Shipped: Marquer comme livrée (Strictly NO cancel option allowed!) */}
            {order.status === 'shipped' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleInitiateTransition('delivered')}
                disabled={updateStatusMutation.isPending}
                className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span>Marquer comme livrée & encaissée</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 3. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols on lg): Items, Customer, Audit Trail */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Articles commandés */}
          <Card>
            <div className="mb-4 pb-3 border-b border-sand-border/60 flex items-center justify-between">
              <div>
                <span className="label-editorial text-burgundy">Composition</span>
                <h2 className="text-base font-serif font-medium text-charcoal mt-0.5">
                  Articles Commandés ({items.length})
                </h2>
              </div>
              <span className="text-xs font-sans text-charcoal/50">
                Instantanés garantis par le serveur
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-canvas/50 border-b border-sand-border text-[0.65rem] uppercase tracking-editorial font-semibold text-charcoal/70">
                  <tr>
                    <th className="py-2.5 px-3">Produit</th>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3 text-right">Prix Unitaire</th>
                    <th className="py-2.5 px-3 text-center">Quantité</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-border/50 bg-white">
                  {items.map((item) => {
                    const name = item.product_name_snapshot || item.product_name || 'Produit Botanique';
                    const sku = item.product_sku_snapshot || item.product_sku || '—';
                    const unitPrice = item.unit_price_snapshot || item.unit_price || 0;
                    const imagePath = item.product_image?.storage_path;

                    return (
                      <tr key={item.id} className="hover:bg-canvas/20">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded border border-sand-border/80 bg-canvas overflow-hidden shrink-0 flex items-center justify-center">
                              {imagePath ? (
                                <img
                                  src={imagePath}
                                  alt={name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-charcoal/30" />
                              )}
                            </div>
                            <div>
                              <span className="font-serif font-medium text-charcoal block">
                                {name}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-charcoal/60">
                          {sku}
                        </td>
                        <td className="py-3 px-3 text-right font-serif text-charcoal/80">
                          {formatMAD(unitPrice)}
                        </td>
                        <td className="py-3 px-3 text-center font-sans font-semibold text-charcoal">
                          × {item.quantity}
                        </td>
                        <td className="py-3 px-3 text-right font-serif font-semibold text-burgundy">
                          {formatMAD(item.total_price)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Card: Informations Client & Livraison */}
          <Card>
            <div className="mb-4 pb-3 border-b border-sand-border/60">
              <span className="label-editorial text-burgundy">Destinataire</span>
              <h2 className="text-base font-serif font-medium text-charcoal mt-0.5">
                Coordonnées & Adresse de Livraison
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-sans">
              {/* Coordonnées Client */}
              <div className="space-y-3">
                <div>
                  <span className="text-[0.65rem] uppercase tracking-editorial font-semibold text-charcoal/50 block mb-0.5">
                    Nom & Prénom
                  </span>
                  <p className="text-sm font-serif font-medium text-charcoal">
                    {customer
                      ? `${customer.first_name} ${customer.last_name}`
                      : 'Client Invité'}
                  </p>
                </div>

                <div>
                  <span className="text-[0.65rem] uppercase tracking-editorial font-semibold text-charcoal/50 block mb-0.5">
                    Téléphone
                  </span>
                  {customer?.phone ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${customer.phone}`}
                        className="font-mono text-xs text-burgundy font-medium hover:underline flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{formatPhoneDisplay(customer.phone)}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => copyPhoneToClipboard(customer.phone)}
                        className="p-1 text-charcoal/40 hover:text-charcoal hover:bg-canvas rounded"
                        title="Copier le numéro"
                      >
                        {isCopiedPhone ? (
                          <Check className="w-3 h-3 text-emerald-700" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-charcoal/40">Non renseigné</span>
                  )}
                </div>

                {customer?.email && (
                  <div>
                    <span className="text-[0.65rem] uppercase tracking-editorial font-semibold text-charcoal/50 block mb-0.5">
                      Adresse E-mail
                    </span>
                    <a
                      href={`mailto:${customer.email}`}
                      className="text-charcoal hover:text-burgundy flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5 opacity-60" />
                      <span>{customer.email}</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Adresse Livraison */}
              <div className="space-y-3">
                <div>
                  <span className="text-[0.65rem] uppercase tracking-editorial font-semibold text-charcoal/50 block mb-0.5">
                    Lieu de livraison
                  </span>
                  <div className="flex items-start gap-1.5 text-charcoal/80">
                    <MapPin className="w-4 h-4 text-burgundy shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-charcoal">
                        {order.shipping_city || customer?.city || 'Maroc'}
                      </p>
                      <p className="leading-relaxed mt-0.5">
                        {order.shipping_address || customer?.address || '—'}
                      </p>
                      {customer?.postal_code && (
                        <p className="text-charcoal/50 font-mono mt-0.5">
                          Code postal : {customer.postal_code}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {order.customer_notes && (
                  <div className="p-3 rounded bg-sand/20 border border-sand-border/70">
                    <span className="text-[0.65rem] uppercase tracking-editorial font-semibold text-charcoal/60 block mb-1">
                      Instructions du client
                    </span>
                    <p className="italic text-charcoal/80">
                      « {order.customer_notes} »
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Card: Audit Trail & Historique des Statuts */}
          <Card>
            <div className="mb-4 pb-3 border-b border-sand-border/60">
              <span className="label-editorial text-burgundy">Traçabilité</span>
              <h2 className="text-base font-serif font-medium text-charcoal mt-0.5">
                Historique des Changements de Statut
              </h2>
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-charcoal/50 italic py-2">
                Aucun changement d'état consigné pour le moment.
              </p>
            ) : (
              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-sand-border">
                {history.map((record) => (
                  <div key={record.id} className="relative text-xs font-sans">
                    {/* Timeline bullet dot */}
                    <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-burgundy ring-4 ring-white" />

                    <div className="flex flex-wrap items-center gap-2">
                      {record.from_status ? (
                        <>
                          <Badge status={record.from_status} size="sm" />
                          <span className="text-charcoal/40 font-bold">→</span>
                        </>
                      ) : (
                        <span className="text-[0.65rem] text-charcoal/50 uppercase tracking-editorial font-semibold">
                          Création :
                        </span>
                      )}
                      <Badge status={record.to_status} size="sm" />
                      <span className="text-charcoal/40">•</span>
                      <span className="text-charcoal/60 font-mono text-[0.7rem]">
                        {formatDateTime(record.created_at)}
                      </span>
                    </div>

                    <div className="mt-1 text-charcoal/70 flex items-center gap-2">
                      <span className="font-medium text-charcoal">
                        Par : {record.changed_by?.full_name || 'Système / Boutique'}
                      </span>
                      {record.notes && (
                        <span className="italic text-charcoal/60">
                          — « {record.notes} »
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (1 col on lg): Financial Breakdown, Admin Notes, Meta */}
        <div className="space-y-6">
          {/* Card: Récapitulatif Financier */}
          <Card>
            <div className="mb-4 pb-3 border-b border-sand-border/60">
              <span className="label-editorial text-burgundy">Facturation</span>
              <h2 className="text-base font-serif font-medium text-charcoal mt-0.5">
                Récapitulatif Financier
              </h2>
            </div>

            <div className="space-y-3 text-xs font-sans">
              <div className="flex justify-between py-1 border-b border-sand-border/40 text-charcoal/70">
                <span>Sous-total articles :</span>
                <span className="font-serif font-medium text-charcoal">
                  {formatMAD(order.subtotal)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-sand-border/40 text-charcoal/70">
                <span>Frais de livraison :</span>
                <span className="font-serif font-medium text-charcoal">
                  {formatMAD(order.shipping_fee)}
                </span>
              </div>

              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between py-1 border-b border-sand-border/40 text-emerald-800">
                  <span>Remise appliquée :</span>
                  <span className="font-serif font-medium">
                    - {formatMAD(order.discount_amount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center py-2 pt-3 text-sm">
                <span className="font-semibold text-charcoal">
                  Total de la commande :
                </span>
                <span className="text-xl font-serif font-semibold text-burgundy">
                  {formatMAD(order.total_amount)}
                </span>
              </div>

              {/* Mode et statut de paiement */}
              <div className="pt-3 border-t border-sand-border/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-charcoal/60">Mode de paiement :</span>
                  <span className="font-medium text-charcoal">
                    Paiement à la livraison (COD)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-charcoal/60">État du règlement :</span>
                  <Badge variant={isPaid ? 'sage' : 'warning'} size="sm">
                    {formatPaymentStatus(order.payment_status)}
                  </Badge>
                </div>

                {/* COD Reconciliation Action */}
                {!isPaid && order.status !== 'cancelled' && (
                  <div className="pt-2">
                    {isAdmin ? (
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full text-xs flex items-center justify-center gap-1.5"
                        onClick={() => {
                          setReconcileNotes('');
                          setReconcileError(null);
                          setIsReconcileModalOpen(true);
                        }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Marquer le paiement COD comme encaissé
                      </Button>
                    ) : (
                      <div className="p-2 bg-sand/30 rounded border border-sand-border/40 text-center text-[0.68rem] text-charcoal/60">
                        Encaissement comptable réservé aux administrateurs
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Card: Notes Internes d'Administration */}
          <Card>
            <div className="mb-3 pb-2 border-b border-sand-border/60 flex items-center justify-between">
              <div>
                <span className="label-editorial text-burgundy">Interne</span>
                <h2 className="text-base font-serif font-medium text-charcoal mt-0.5">
                  Notes d’Administration
                </h2>
              </div>
              <FileText className="w-4 h-4 text-charcoal/40" />
            </div>

            <div className="space-y-3">
              <textarea
                rows={4}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Consignes internes d'emballage, remarques opérateur, accords particuliers..."
                className="w-full p-2.5 text-xs font-sans border border-sand-border rounded focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy resize-none"
              />

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveAdminNotes}
                  disabled={updateNotesMutation.isPending}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {updateNotesMutation.isPending
                      ? 'Enregistrement...'
                      : 'Enregistrer la note'}
                  </span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Card: Origine & Métadonnées */}
          <Card className="text-xs font-sans space-y-3">
            <div className="pb-2 border-b border-sand-border/60">
              <span className="label-editorial text-burgundy">Détails Système</span>
              <h2 className="text-base font-serif font-medium text-charcoal mt-0.5">
                Origine & Dates Clés
              </h2>
            </div>

            <div className="space-y-2 text-charcoal/70">
              <div className="flex justify-between py-0.5">
                <span>Canal de vente :</span>
                <span className="font-medium text-charcoal">
                  {formatOrderSource(source)}
                </span>
              </div>

              {order.created_by_profile && (
                <div className="flex justify-between py-0.5">
                  <span>Créateur de commande :</span>
                  <span className="font-medium text-burgundy">
                    {order.created_by_profile.full_name} ({formatUserRole(order.created_by_profile.role)})
                  </span>
                </div>
              )}

              <div className="flex justify-between py-0.5">
                <span>Créée le :</span>
                <span className="font-mono text-charcoal">
                  {formatDateTime(order.created_at)}
                </span>
              </div>

              {order.shipped_at && (
                <div className="flex justify-between py-0.5">
                  <span>Expédiée le :</span>
                  <span className="font-mono text-charcoal">
                    {formatDateTime(order.shipped_at)}
                  </span>
                </div>
              )}

              {order.delivered_at && (
                <div className="flex justify-between py-0.5">
                  <span>Livrée le :</span>
                  <span className="font-mono text-charcoal">
                    {formatDateTime(order.delivered_at)}
                  </span>
                </div>
              )}

              {order.cancelled_at && (
                <div className="flex justify-between py-0.5 text-red-700">
                  <span>Annulée le :</span>
                  <span className="font-mono">
                    {formatDateTime(order.cancelled_at)}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* 4. Status Transition Confirmation Modal */}
      <OrderStatusTransitionModal
        isOpen={isTransitionModalOpen}
        orderNumber={order.order_number}
        fromStatus={order.status}
        toStatus={targetStatus}
        onClose={() => {
          setIsTransitionModalOpen(false);
          setTargetStatus(null);
          setTransitionError(null);
        }}
        onConfirm={handleConfirmTransition}
        isLoading={updateStatusMutation.isPending}
        errorMessage={transitionError}
      />

      {/* 5. COD Payment Reconciliation Modal */}
      {isReconcileModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded shadow-2xl border border-sand-border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-canvas border-b border-sand-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-serif font-medium text-charcoal">
                    Encaisser le paiement COD
                  </h2>
                  <span className="text-xs font-mono text-charcoal/60">
                    Commande {order.order_number}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReconcileModalOpen(false)}
                disabled={reconcilePaymentMutation.isPending}
                className="p-1.5 text-charcoal/50 hover:text-charcoal hover:bg-white rounded transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="p-4 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <div className="font-semibold text-emerald-900">
                  Confirmation du versement transporteur
                </div>
                <p className="leading-relaxed">
                  Cette action comptable certifie que le montant en espèces de{' '}
                  <strong>{formatMAD(order.total_amount)}</strong> a bien été versé par le transporteur au marchand.
                </p>
                <p className="text-[0.68rem] text-emerald-700">
                  Le statut financier passera à <strong>Payé (COD)</strong> et les recettes seront incluses dans les revenus collectés officiels.
                </p>
              </div>

              {reconcileError && (
                <div className="p-3.5 rounded bg-rose-soft/70 border border-red-300 text-red-950 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                  <span>{reconcileError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
                  Référence de versement ou bordereau (optionnel)
                </label>
                <textarea
                  rows={2}
                  value={reconcileNotes}
                  onChange={(e) => setReconcileNotes(e.target.value)}
                  placeholder="Ex: Bordereau Amana BDR-20261105-04, chèque/virement n°..."
                  className="w-full p-2.5 text-xs font-sans border border-sand-border rounded focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-canvas border-t border-sand-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReconcileModalOpen(false)}
                disabled={reconcilePaymentMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReconciliation}
                disabled={reconcilePaymentMutation.isPending}
                className="flex items-center gap-1.5"
              >
                {reconcilePaymentMutation.isPending ? (
                  <>
                    <Spinner size="sm" />
                    <span>Validation en cours...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmer l’encaissement</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
