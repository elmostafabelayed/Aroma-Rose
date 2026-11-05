import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  Plus,
  Trash2,
  ShoppingBag,
  MessageCircle,
  AlertCircle,
  Truck,
  User,
} from 'lucide-react';
import {
  createWhatsAppOrderSchema,
  type CreateWhatsAppOrderFormValues,
} from '../../schemas/admin-order.schema';
import { useCreateWhatsAppOrder } from '../../hooks/useAdminOrders';
import { useAdminProducts } from '../../hooks/useProducts';
import { formatMAD } from '../../utils/formatters';
import { Button } from '../common/Button';
import { Spinner } from '../common/Spinner';
import { useToast } from '../../context/ToastContext';

interface CreateWhatsAppOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (orderId: string) => void;
}

export const CreateWhatsAppOrderModal: React.FC<CreateWhatsAppOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const createMutation = useCreateWhatsAppOrder();
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Fetch available products
  const { data: productsData, isLoading: loadingProducts } = useAdminProducts({
    limit: 100,
  });
  const products = productsData?.products || [];

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateWhatsAppOrderFormValues>({
    resolver: zodResolver(createWhatsAppOrderSchema),
    defaultValues: {
      customer: {
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        city: '',
        address: '',
        postal_code: '',
        notes: '',
      },
      items: [{ product_id: '', quantity: 1 }],
      shipping_fee: 30,
      customer_notes: '',
      admin_notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = watch('items');
  const watchedShippingFee = watch('shipping_fee') || 0;

  // Calculate live financial summary based on selected products
  const calculatedSubtotal = watchedItems.reduce((acc, item) => {
    if (!item.product_id) return acc;
    const prod = products.find((p) => p.id === item.product_id);
    const price = prod ? (typeof prod.price === 'string' ? parseFloat(prod.price) : prod.price) : 0;
    const qty = Number(item.quantity) || 0;
    return acc + price * qty;
  }, 0);

  const calculatedTotal = calculatedSubtotal + Number(watchedShippingFee);

  const onSubmit = async (values: CreateWhatsAppOrderFormValues) => {
    setSubmissionError(null);
    try {
      const payload = {
        customer: {
          first_name: values.customer.first_name.trim(),
          last_name: values.customer.last_name.trim(),
          phone: values.customer.phone.trim(),
          email: values.customer.email?.trim() || null,
          city: values.customer.city.trim(),
          address: values.customer.address.trim(),
          postal_code: values.customer.postal_code?.trim() || null,
          notes: values.customer.notes?.trim() || null,
        },
        items: values.items.map((it) => ({
          product_id: it.product_id,
          quantity: Number(it.quantity),
        })),
        shipping_fee: Number(values.shipping_fee),
        customer_notes: values.customer_notes?.trim() || null,
        admin_notes: values.admin_notes?.trim() || 'Commande créée manuellement via WhatsApp',
      };

      const result = await createMutation.mutateAsync(payload);
      showSuccessToast(
        'Commande WhatsApp créée',
        `La commande ${result.order_number} a été enregistrée avec succès.`
      );
      reset();
      onClose();
      if (onSuccess) {
        onSuccess(result.id);
      }
    } catch (err: any) {
      const msg =
        err?.message ||
        'Une erreur est survenue lors de la création de la commande WhatsApp.';
      setSubmissionError(msg);
      showErrorToast('Erreur de création', msg);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded shadow-2xl border border-sand-border overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-canvas border-b border-sand-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-medium text-charcoal">
                Nouvelle Commande WhatsApp
              </h2>
              <p className="text-xs font-sans text-charcoal/60">
                Saisie manuelle pour une vente conclue par messagerie ou téléphone
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-charcoal/50 hover:text-charcoal hover:bg-white rounded transition-colors"
            aria-label="Fermer la boîte de dialogue"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {submissionError && (
            <div className="p-4 rounded bg-rose-soft/40 border border-rose/30 flex items-start gap-3 text-red-900 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Erreur lors de la validation</p>
                <p>{submissionError}</p>
              </div>
            </div>
          )}

          {/* Section 1: Informations Client */}
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-sand-border/50">
              <User className="w-4 h-4 text-burgundy" />
              <h3 className="text-xs font-sans font-semibold uppercase tracking-editorial text-charcoal">
                Informations du Destinataire
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Prénom */}
              <div>
                <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
                  Prénom <span className="text-burgundy">*</span>
                </label>
                <input
                  type="text"
                  {...register('customer.first_name')}
                  placeholder="Ex: Fatima"
                  className="w-full px-3 py-2 text-xs border border-sand-border rounded focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy"
                />
                {errors.customer?.first_name && (
                  <p className="mt-1 text-[0.7rem] text-red-700">
                    {errors.customer.first_name.message}
                  </p>
                )}
              </div>

              {/* Nom */}
              <div>
                <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
                  Nom <span className="text-burgundy">*</span>
                </label>
                <input
                  type="text"
                  {...register('customer.last_name')}
                  placeholder="Ex: Benali"
                  className="w-full px-3 py-2 text-xs border border-sand-border rounded focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy"
                />
                {errors.customer?.last_name && (
                  <p className="mt-1 text-[0.7rem] text-red-700">
                    {errors.customer.last_name.message}
                  </p>
                )}
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
                  Téléphone marocain (+212) <span className="text-burgundy">*</span>
                </label>
                <input
                  type="tel"
                  {...register('customer.phone')}
                  placeholder="Ex: 06 12 34 56 78"
                  className="w-full px-3 py-2 text-xs border border-sand-border rounded focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy"
                />
                {errors.customer?.phone && (
                  <p className="mt-1 text-[0.7rem] text-red-700">
                    {errors.customer.phone.message}
                  </p>
                )}
              </div>

              {/* Ville */}
              <div>
                <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
                  Ville de livraison <span className="text-burgundy">*</span>
                </label>
                <input
                  type="text"
                  {...register('customer.city')}
                  placeholder="Ex: Casablanca, Marrakech, Rabat..."
                  className="w-full px-3 py-2 text-xs border border-sand-border rounded focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy"
                />
                {errors.customer?.city && (
                  <p className="mt-1 text-[0.7rem] text-red-700">
                    {errors.customer.city.message}
                  </p>
                )}
              </div>

              {/* Adresse complète */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
                  Adresse de livraison complète <span className="text-burgundy">*</span>
                </label>
                <input
                  type="text"
                  {...register('customer.address')}
                  placeholder="Quartier, Rue, N° d'immeuble, Étage, Appartement..."
                  className="w-full px-3 py-2 text-xs border border-sand-border rounded focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy"
                />
                {errors.customer?.address && (
                  <p className="mt-1 text-[0.7rem] text-red-700">
                    {errors.customer.address.message}
                  </p>
                )}
              </div>

              {/* E-mail (optionnel) */}
              <div>
                <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
                  Adresse e-mail <span className="text-charcoal/40">(optionnel)</span>
                </label>
                <input
                  type="email"
                  {...register('customer.email')}
                  placeholder="client@domaine.ma"
                  className="w-full px-3 py-2 text-xs border border-sand-border rounded focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy"
                />
              </div>

              {/* Code postal */}
              <div>
                <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
                  Code postal <span className="text-charcoal/40">(optionnel)</span>
                </label>
                <input
                  type="text"
                  {...register('customer.postal_code')}
                  placeholder="20000"
                  className="w-full px-3 py-2 text-xs border border-sand-border rounded focus:outline-none focus:border-burgundy focus:ring-1 focus:ring-burgundy"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Articles Commandés */}
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-sand-border/50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-burgundy" />
                <h3 className="text-xs font-sans font-semibold uppercase tracking-editorial text-charcoal">
                  Sélection des Produits Botaniques
                </h3>
              </div>
              <button
                type="button"
                onClick={() => append({ product_id: '', quantity: 1 })}
                className="inline-flex items-center gap-1 text-xs font-sans text-burgundy hover:underline font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter un article
              </button>
            </div>

            {loadingProducts ? (
              <div className="py-6 flex items-center justify-center gap-2 text-xs text-charcoal/50">
                <Spinner size="sm" /> Chargement du catalogue...
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => {
                  const selectedId = watchedItems[index]?.product_id;
                  const selectedProd = products.find((p) => p.id === selectedId);
                  const unitPrice = selectedProd
                    ? typeof selectedProd.price === 'string'
                      ? parseFloat(selectedProd.price)
                      : selectedProd.price
                    : 0;
                  const qty = Number(watchedItems[index]?.quantity) || 1;
                  const lineTotal = unitPrice * qty;

                  return (
                    <div
                      key={field.id}
                      className="p-3 bg-canvas/40 rounded border border-sand-border/70 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                    >
                      {/* Product Selector */}
                      <div className="flex-1">
                        <label className="block text-[0.65rem] uppercase font-semibold text-charcoal/60 mb-1">
                          Produit #{index + 1}
                        </label>
                        <select
                          {...register(`items.${index}.product_id`)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-sand-border rounded focus:outline-none focus:border-burgundy"
                        >
                          <option value="">Sélectionner un produit...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                              {p.name} — {formatMAD(p.price)} (Stock: {p.stock_quantity})
                            </option>
                          ))}
                        </select>
                        {errors.items?.[index]?.product_id && (
                          <p className="mt-1 text-[0.65rem] text-red-700">
                            {errors.items[index]?.product_id?.message}
                          </p>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="w-24">
                        <label className="block text-[0.65rem] uppercase font-semibold text-charcoal/60 mb-1">
                          Quantité
                        </label>
                        <input
                          type="number"
                          min="1"
                          {...register(`items.${index}.quantity`, {
                            valueAsNumber: true,
                          })}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-sand-border rounded focus:outline-none focus:border-burgundy"
                        />
                      </div>

                      {/* Line Subtotal */}
                      <div className="w-28 text-right sm:self-center pt-2 sm:pt-4">
                        <span className="text-[0.65rem] uppercase tracking-editorial text-charcoal/50 block">
                          Total
                        </span>
                        <span className="font-serif text-xs font-semibold text-burgundy">
                          {formatMAD(lineTotal)}
                        </span>
                      </div>

                      {/* Remove Button */}
                      {fields.length > 1 && (
                        <div className="sm:self-center pt-2 sm:pt-4">
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="p-1.5 text-charcoal/40 hover:text-red-700 hover:bg-white rounded transition-colors"
                            title="Supprimer la ligne"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {errors.items && !Array.isArray(errors.items) && (
              <p className="mt-2 text-xs text-red-700">
                {(errors.items as any)?.message}
              </p>
            )}
          </div>

          {/* Section 3: Frais & Remarques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-sans font-medium text-charcoal/80 mb-1">
                <Truck className="w-3.5 h-3.5 text-burgundy" />
                Frais d’expédition (MAD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('shipping_fee', { valueAsNumber: true })}
                className="w-full px-3 py-2 text-xs border border-sand-border rounded focus:outline-none focus:border-burgundy"
              />
              <p className="text-[0.65rem] text-charcoal/50 mt-1">
                Par défaut 30.00 MAD (offerts ou ajustables selon négociation WhatsApp)
              </p>
            </div>

            <div>
              <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
                Note de livraison client
              </label>
              <input
                type="text"
                {...register('customer_notes')}
                placeholder="Ex: Livrer après 16h au bureau..."
                className="w-full px-3 py-2 text-xs border border-sand-border rounded focus:outline-none focus:border-burgundy"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
                Note interne d’administration
              </label>
              <textarea
                rows={2}
                {...register('admin_notes')}
                placeholder="Ex: Commande passée sur WhatsApp avec Fatima, promesse d'échantillon rose musquée..."
                className="w-full px-3 py-2 text-xs border border-sand-border rounded focus:outline-none focus:border-burgundy resize-none"
              />
            </div>
          </div>

          {/* Live Summary Bar */}
          <div className="p-4 bg-sand/20 rounded border border-sand-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 text-xs font-sans text-charcoal/70">
              <div className="flex gap-4">
                <span>Sous-total articles :</span>
                <span className="font-serif font-medium text-charcoal">
                  {formatMAD(calculatedSubtotal)}
                </span>
              </div>
              <div className="flex gap-4">
                <span>Frais de port :</span>
                <span className="font-serif font-medium text-charcoal">
                  {formatMAD(watchedShippingFee)}
                </span>
              </div>
              <div className="text-[0.68rem] text-charcoal/50">
                Paiement à la livraison (Cash on Delivery)
              </div>
            </div>

            <div className="text-right border-t sm:border-t-0 pt-2 sm:pt-0">
              <span className="text-[0.65rem] uppercase tracking-editorial font-semibold text-charcoal/60 block">
                Total Commande
              </span>
              <span className="text-xl font-serif font-semibold text-burgundy">
                {formatMAD(calculatedTotal)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-sand-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting || createMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting || createMutation.isPending}
              className="min-w-[170px]"
            >
              {isSubmitting || createMutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Création en cours...
                </>
              ) : (
                'Enregistrer la commande'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

