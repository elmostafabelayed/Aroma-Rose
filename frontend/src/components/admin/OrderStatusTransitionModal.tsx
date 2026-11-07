import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Truck,
  CheckCircle2,
  Ban,
  PackageCheck,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Spinner } from '../common/Spinner';
import type { OrderStatus } from '../../types/order.types';
import { formatOrderStatus } from '../../utils/formatters';

interface OrderStatusTransitionModalProps {
  isOpen: boolean;
  orderNumber: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus | null;
  onClose: () => void;
  onConfirm: (notes?: string) => Promise<void>;
  isLoading?: boolean;
  errorMessage?: string | null;
}

export const OrderStatusTransitionModal: React.FC<OrderStatusTransitionModalProps> = ({
  isOpen,
  orderNumber,
  fromStatus,
  toStatus,
  onClose,
  onConfirm,
  isLoading = false,
  errorMessage = null,
}) => {
  const [transitionNotes, setTransitionNotes] = useState('');

  if (!isOpen || !toStatus) return null;

  const isShipment = toStatus === 'shipped';
  const isDelivered = toStatus === 'delivered';
  const isCancelled = toStatus === 'cancelled';

  const handleConfirm = async () => {
    await onConfirm(transitionNotes.trim() || undefined);
    setTransitionNotes('');
  };

  const getHeaderIcon = () => {
    if (isShipment) {
      return (
        <div className="w-10 h-10 rounded-full bg-burgundy/10 text-burgundy flex items-center justify-center">
          <Truck className="w-5 h-5" />
        </div>
      );
    }
    if (isDelivered) {
      return (
        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      );
    }
    if (isCancelled) {
      return (
        <div className="w-10 h-10 rounded-full bg-rose-soft text-red-900 flex items-center justify-center">
          <Ban className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-sand/40 text-charcoal flex items-center justify-center">
        <PackageCheck className="w-5 h-5" />
      </div>
    );
  };

  const getTitle = () => {
    switch (toStatus) {
      case 'confirmed':
        return 'Confirmer la commande';
      case 'processing':
        return 'Mettre en préparation';
      case 'shipped':
        return 'Confirmer l’expédition & déduire le stock';
      case 'delivered':
        return 'Confirmer la livraison au client';
      case 'cancelled':
        return 'Annuler définitivement la commande';
      default:
        return `Passer au statut ${formatOrderStatus(toStatus)}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded shadow-2xl border border-sand-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-canvas border-b border-sand-border">
          <div className="flex items-center gap-3">
            {getHeaderIcon()}
            <div>
              <h2 className="text-base font-serif font-medium text-charcoal">
                {getTitle()}
              </h2>
              <span className="text-xs font-mono text-charcoal/60">
                Commande {orderNumber}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-charcoal/50 hover:text-charcoal hover:bg-white rounded transition-colors"
            aria-label="Fermer la boîte de dialogue"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Status Progression Visual */}
          <div className="flex items-center justify-center gap-3 p-3 bg-canvas/60 rounded border border-sand-border/70 text-xs font-sans">
            <span className="text-charcoal/60">Statut actuel :</span>
            <Badge status={fromStatus} size="sm" />
            <span className="text-charcoal/40 font-bold">→</span>
            <span className="text-charcoal/60">Nouveau statut :</span>
            <Badge status={toStatus} size="sm" />
          </div>

          {/* Specific Contextual Warnings */}
          {isShipment && (
            <div className="p-3.5 rounded bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Règle d'inventaire stricte (Déduction de stock)</span>
              </div>
              <p className="leading-relaxed text-amber-800">
                Le passage au statut <strong>Expédiée</strong> déclenche la déduction atomique immédiate des quantités d'articles commandés dans le grand livre des stocks.
              </p>
              <p className="text-[0.68rem] text-amber-700">
                Si les unités disponibles sont insuffisantes, la base de données rejettera la transition et la commande restera en préparation.
              </p>
            </div>
          )}

          {isDelivered && (
            <div className="p-3.5 rounded bg-blue-50 border border-blue-200 text-blue-950 text-xs space-y-1">
              <div className="flex items-center gap-2 font-semibold text-blue-900">
                <PackageCheck className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Livraison physique effectuée</span>
              </div>
              <p className="leading-relaxed text-blue-900">
                Cette transition certifie la remise du colis au destinataire par le transporteur.
                Conformément aux règles comptables, le règlement restera <strong>À encaisser (COD)</strong> jusqu’à la confirmation de versement des fonds par le transporteur.
              </p>
            </div>
          )}

          {isCancelled && (
            <div className="p-3.5 rounded bg-rose-soft/50 border border-rose/40 text-red-950 text-xs space-y-1">
              <div className="flex items-center gap-2 font-semibold text-red-900">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                <span>Action irréversible</span>
              </div>
              <p className="leading-relaxed text-red-900">
                L’annulation d’une commande est définitive. Une fois annulée, aucun autre changement d’état ne sera autorisé par le système.
              </p>
            </div>
          )}

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded bg-rose-soft/70 border border-red-300 text-red-950 text-xs space-y-1 animate-fade-in">
              <div className="flex items-center gap-2 font-semibold text-red-900">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                <span>Échec de la transition</span>
              </div>
              <p className="leading-relaxed text-red-900 font-sans">
                {errorMessage}
              </p>
            </div>
          )}

          {/* Note Input */}
          <div>
            <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
              Note d’audit ou référence (optionnel)
            </label>
            <textarea
              rows={2}
              value={transitionNotes}
              onChange={(e) => setTransitionNotes(e.target.value)}
              placeholder={
                isShipment
                  ? 'Ex: N° de suivi Amana Express : AM20261103MA...'
                  : isCancelled
                  ? 'Ex: Motif de l’annulation : Demande client par téléphone...'
                  : 'Note interne enregistrée dans l’historique d’audit...'
              }
              className="w-full px-3 py-2 text-xs border border-sand-border rounded focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy resize-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-canvas border-t border-sand-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant={isCancelled ? 'danger' : 'primary'}
            size="sm"
            onClick={handleConfirm}
            disabled={isLoading}
            className="min-w-[140px]"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Traitement...
              </>
            ) : isShipment ? (
              'Valider l’expédition'
            ) : isDelivered ? (
              'Valider la livraison'
            ) : isCancelled ? (
              'Confirmer l’annulation'
            ) : (
              'Confirmer'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

