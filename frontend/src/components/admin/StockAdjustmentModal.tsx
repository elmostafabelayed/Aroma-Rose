import React, { useState } from 'react';
import {
  X,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertCircle,
  Save,
} from 'lucide-react';
import { useStockAdjustment } from '../../hooks/useInventory';
import { useToast } from '../../context/ToastContext';
import { Button } from '../common/Button';
import { Spinner } from '../common/Spinner';
import type { InventoryItem } from '../../types/inventory.types';
import { cn } from '../../utils/cn';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  product: InventoryItem | null;
  onClose: () => void;
  onSuccess?: () => void;
}

type AdjustmentMode = 'in' | 'out' | 'set';

const AUDIT_REASONS = [
  'Réception fournisseur',
  'Produit endommagé / perte',
  'Erreur d’inventaire',
  'Retour client',
  'Correction manuelle',
  'Autre',
];

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  product,
  onClose,
  onSuccess,
}) => {
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const adjustmentMutation = useStockAdjustment();

  const [mode, setMode] = useState<AdjustmentMode>('in');
  const [quantityInput, setQuantityInput] = useState<number | ''>(1);
  const [selectedReason, setSelectedReason] = useState<string>(AUDIT_REASONS[0]);
  const [notesInput, setNotesInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const currentStock = product.stock_quantity;
  const numQuantity = typeof quantityInput === 'number' ? quantityInput : 0;

  // Calculate delta based on mode
  let delta = 0;
  if (mode === 'in') {
    delta = Math.abs(numQuantity);
  } else if (mode === 'out') {
    delta = -Math.abs(numQuantity);
  } else if (mode === 'set') {
    // Setting target stock: delta is target - current
    delta = Math.max(0, numQuantity) - currentStock;
  }

  const projectedStock = currentStock + delta;
  const isNegativeStock = projectedStock < 0;
  const isZeroDelta = delta === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isZeroDelta) {
      setErrorMessage('La variation de stock ne peut pas être nulle.');
      return;
    }

    if (isNegativeStock) {
      setErrorMessage(
        `Ajustement impossible : le stock ne peut pas être inférieur à 0 (stock actuel : ${currentStock}, retrait demandé : ${Math.abs(delta)}).`
      );
      return;
    }

    const compiledNotes = `${selectedReason}${notesInput.trim() ? ` — ${notesInput.trim()}` : ''}`;
    if (compiledNotes.trim().length < 2) {
      setErrorMessage('Un motif explicite est obligatoire pour tracer l’ajustement.');
      return;
    }

    try {
      await adjustmentMutation.mutateAsync({
        product_id: product.id,
        quantity_change: delta,
        notes: compiledNotes,
      });

      showSuccessToast(
        'Stock ajusté avec succès',
        `Le stock de "${product.name}" est désormais de ${projectedStock} unités (${delta > 0 ? `+${delta}` : delta}).`
      );

      // Reset state & close
      setQuantityInput(1);
      setNotesInput('');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg =
        err?.message ||
        'Une erreur est survenue lors de l’ajustement de stock.';
      setErrorMessage(msg);
      showErrorToast('Échec de l’ajustement', msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded shadow-2xl border border-sand-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-canvas border-b border-sand-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-burgundy/10 text-burgundy flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-medium text-charcoal">
                Ajuster le Stock
              </h2>
              <span className="text-xs font-mono text-charcoal/60">
                {product.name} {product.sku && `(${product.sku})`}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={adjustmentMutation.isPending}
            className="p-1.5 text-charcoal/50 hover:text-charcoal hover:bg-white rounded transition-colors"
            aria-label="Fermer la boîte de dialogue"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Stock Projection Card */}
          <div className="p-4 bg-canvas/60 rounded border border-sand-border flex items-center justify-between text-center text-xs font-sans">
            <div>
              <span className="text-charcoal/50 block text-[0.68rem] uppercase tracking-editorial">
                Stock actuel
              </span>
              <span className="text-lg font-serif font-semibold text-charcoal">
                {currentStock}
              </span>
            </div>

            <div className="text-charcoal/40 font-mono text-base">
              {delta > 0 ? `+${delta}` : delta < 0 ? delta : '0'}
            </div>

            <div>
              <span className="text-charcoal/50 block text-[0.68rem] uppercase tracking-editorial">
                Nouveau stock
              </span>
              <span
                className={cn(
                  'text-lg font-serif font-semibold',
                  isNegativeStock
                    ? 'text-red-700 underline'
                    : projectedStock === 0
                    ? 'text-red-700'
                    : projectedStock <= 10
                    ? 'text-amber-800'
                    : 'text-emerald-800'
                )}
              >
                {projectedStock}
              </span>
            </div>
          </div>

          {/* Mode Selector (Tabs) */}
          <div>
            <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1.5">
              Type d'ajustement
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Entrée */}
              <button
                type="button"
                onClick={() => setMode('in')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-2 px-3 rounded text-xs font-sans font-medium border transition-all',
                  mode === 'in'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300 ring-1 ring-emerald-300'
                    : 'bg-white text-charcoal/70 border-sand-border hover:bg-canvas'
                )}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-700" />
                <span>Entrée (+)</span>
              </button>

              {/* Sortie */}
              <button
                type="button"
                onClick={() => setMode('out')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-2 px-3 rounded text-xs font-sans font-medium border transition-all',
                  mode === 'out'
                    ? 'bg-rose-soft text-red-900 border-red-300 ring-1 ring-red-300'
                    : 'bg-white text-charcoal/70 border-sand-border hover:bg-canvas'
                )}
              >
                <ArrowDownRight className="w-3.5 h-3.5 text-red-700" />
                <span>Sortie (-)</span>
              </button>

              {/* Correction Cible */}
              <button
                type="button"
                onClick={() => setMode('set')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-2 px-3 rounded text-xs font-sans font-medium border transition-all',
                  mode === 'set'
                    ? 'bg-sand/30 text-charcoal border-burgundy/40 ring-1 ring-burgundy/30'
                    : 'bg-white text-charcoal/70 border-sand-border hover:bg-canvas'
                )}
              >
                <RefreshCw className="w-3 h-3 text-burgundy" />
                <span>Correction (=)</span>
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
              {mode === 'set'
                ? 'Nouveau niveau de stock cible (unités)'
                : 'Quantité d’unités à ajuster'}
            </label>
            <input
              type="number"
              min={mode === 'set' ? '0' : '1'}
              value={quantityInput}
              onChange={(e) => {
                const val = e.target.value;
                setQuantityInput(val === '' ? '' : Math.max(0, parseInt(val, 10) || 0));
              }}
              className="w-full px-3 py-2 text-xs border border-sand-border rounded focus:outline-none focus:border-burgundy font-mono"
            />
          </div>

          {/* Reason Select */}
          <div>
            <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
              Motif de l’opération <span className="text-burgundy">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-sand-border rounded focus:outline-none focus:border-burgundy"
            >
              {AUDIT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
              Note d’audit ou référence (optionnel)
            </label>
            <textarea
              rows={2}
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Ex: N° bon de livraison BL-2026-44, flacon cassé en réserve..."
              className="w-full p-2.5 text-xs border border-sand-border rounded focus:outline-none focus:border-burgundy resize-none"
            />
          </div>

          {/* Error Message Alert */}
          {(errorMessage || isNegativeStock) && (
            <div className="p-3.5 rounded bg-rose-soft/70 border border-red-300 text-red-950 text-xs flex items-start gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Règle d’inventaire stricte</p>
                <p>
                  {isNegativeStock
                    ? `Impossible de réduire le stock sous 0. Stock actuel : ${currentStock}, retrait demandé : ${Math.abs(delta)}.`
                    : errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-sand-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={adjustmentMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={
                adjustmentMutation.isPending || isNegativeStock || isZeroDelta
              }
              className="min-w-[170px]"
            >
              {adjustmentMutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2 border-white" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  <span>Enregistrer l’ajustement</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
