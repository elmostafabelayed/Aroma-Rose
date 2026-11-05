import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Package,
  Coins,
  ImageIcon,
  Archive,
  Save,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import {
  useAdminProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useAuth } from '../../auth/useAuth';
import {
  productFormSchema,
  type ProductFormValues,
} from '../../schemas/product.schema';
import { ProductImageManager } from '../../components/admin/ProductImageManager';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { ErrorState } from '../../components/feedback/ErrorState';
import { useToast } from '../../context/ToastContext';
import { formatDateTime } from '../../utils/formatters';

export const AdminProductEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const {
    data: product,
    isLoading,
    error,
    refetch,
  } = useAdminProduct(id);

  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  // Fetch real categories
  const { data: categories = [], isLoading: loadingCategories } = useCategories();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      sku: '',
      category_id: '',
      description: '',
      price: 0,
      compare_at_price: null,
      cost_price: null,
      stock_quantity: 0,
      is_active: true,
      images: [],
    },
  });

  // Rehydrate form when product data loads
  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        slug: product.slug,
        sku: product.sku || '',
        category_id: product.category?.id || (product as any).category_id || '',
        description: product.description || '',
        price: typeof product.price === 'string' ? parseFloat(product.price) : Number(product.price),
        compare_at_price:
          product.compare_at_price !== null && product.compare_at_price !== undefined
            ? typeof product.compare_at_price === 'string'
              ? parseFloat(product.compare_at_price)
              : Number(product.compare_at_price)
            : null,
        cost_price:
          product.cost_price !== null && product.cost_price !== undefined
            ? typeof product.cost_price === 'string'
              ? parseFloat(product.cost_price)
              : Number(product.cost_price)
            : null,
        stock_quantity: product.stock_quantity,
        is_active: product.is_active,
        images: product.images || [],
      });
    }
  }, [product, reset]);

  const watchedName = watch('name');

  const handleAutoSlug = () => {
    if (!watchedName) return;
    const generated = watchedName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setValue('slug', generated, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (values: ProductFormValues) => {
    if (!id) return;
    setSubmissionError(null);

    try {
      const payload = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        sku: values.sku?.trim() || undefined,
        category_id: values.category_id || null,
        description: values.description?.trim() || undefined,
        price: Number(values.price),
        compare_at_price:
          values.compare_at_price !== null && values.compare_at_price !== undefined
            ? Number(values.compare_at_price)
            : null,
        cost_price:
          values.cost_price !== null && values.cost_price !== undefined
            ? Number(values.cost_price)
            : null,
        // Note: stock_quantity is governed strictly by the Inventory module
        is_active: Boolean(values.is_active),
        images: values.images?.map((img, idx) => ({
          storage_path: img.storage_path,
          alt_text: img.alt_text || null,
          display_order: idx,
          is_primary: Boolean(img.is_primary),
        })),
      };

      const updated = await updateMutation.mutateAsync({ id, payload });
      showSuccessToast(
        'Modifications enregistrées',
        `La fiche du produit "${updated.name}" a été mise à jour.`
      );
    } catch (err: any) {
      const msg =
        err?.message ||
        'Une erreur est survenue lors de la mise à jour du produit.';
      setSubmissionError(msg);
      showErrorToast('Erreur de mise à jour', msg);
    }
  };

  const handleConfirmArchive = async () => {
    if (!id || !product) return;
    try {
      await deleteMutation.mutateAsync(id);
      showSuccessToast(
        'Produit archivé',
        `Le produit "${product.name}" a été désactivé du catalogue.`
      );
      setShowArchiveModal(false);
      navigate('/admin/products');
    } catch (err: any) {
      showErrorToast('Erreur d’archivage', err?.message || 'Action non autorisée.');
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-xs font-sans text-charcoal/60">
          Chargement de la fiche produit...
        </p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <ErrorState
          title="Produit introuvable"
          message="Impossible de charger ce produit. Il a peut-être été supprimé ou l’identifiant est invalide."
          onRetry={() => refetch()}
        />
        <div className="mt-6 text-center">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/products')}>
            ← Retour à la liste des produits
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-16">
      {/* Header & Breadcrumb */}
      <div>
        <nav
          aria-label="Fil d'Ariane"
          className="flex items-center gap-1.5 text-xs text-charcoal/50 mb-3 font-sans"
        >
          <Link to="/admin" className="hover:text-burgundy">
            Console
          </Link>
          <span>/</span>
          <Link to="/admin/products" className="hover:text-burgundy">
            Catalogue
          </Link>
          <span>/</span>
          <span className="text-burgundy font-medium truncate max-w-xs">
            {product.name}
          </span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/products')}
              className="p-2 text-charcoal/60 hover:text-burgundy"
              title="Retour aux produits"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-serif font-medium text-charcoal tracking-tight">
                  {product.name}
                </h1>
                <Badge variant={product.is_active ? 'sage' : 'neutral'} size="sm">
                  {product.is_active ? 'Actif' : 'Inactif'}
                </Badge>
                {product.sku && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-sand/30 border border-sand-border text-charcoal/70">
                    {product.sku}
                  </span>
                )}
              </div>
              <p className="text-xs font-sans text-charcoal/50 mt-1">
                Dernière modification le {formatDateTime(product.updated_at || product.created_at)}
              </p>
            </div>
          </div>

          {/* Quick storefront link & Archive button */}
          <div className="flex items-center gap-2">
            <a
              href={`/shop/${product.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-sans text-charcoal/70 hover:text-burgundy border border-sand-border rounded bg-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Voir sur la boutique</span>
            </a>

            {isAdmin && product.is_active && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowArchiveModal(true)}
                className="text-red-700 hover:bg-rose-soft/40 border-red-200 text-xs"
              >
                <Archive className="w-3.5 h-3.5 mr-1" />
                <span>Archiver</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Historical Order Integrity Guarantee Banner */}
      <div className="p-3.5 rounded bg-sand/20 border border-sand-border flex items-start gap-3 text-xs text-charcoal/70">
        <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <p className="font-semibold text-charcoal">
            Intégrité historique garantie
          </p>
          <p>
            Les modifications apportées au prix, au nom ou au SKU de ce produit s’appliquent uniquement aux ventes futures. Les instantanés de toutes les commandes passées demeurent strictement immuables.
          </p>
        </div>
      </div>

      {submissionError && (
        <div className="p-4 rounded bg-rose-soft/60 border border-rose/40 text-red-900 text-xs flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Erreur de validation serveur</p>
            <p>{submissionError}</p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Card 1: Identité du Produit */}
        <Card className="p-6">
          <div className="mb-4 pb-3 border-b border-sand-border/60 flex items-center gap-2">
            <Package className="w-4 h-4 text-burgundy" />
            <h2 className="text-sm font-serif font-medium text-charcoal">
              Informations Principales
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nom */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
                Nom du produit <span className="text-burgundy">*</span>
              </label>
              <input
                type="text"
                {...register('name')}
                className="w-full px-3 py-2 text-xs border border-sand-border rounded focus:outline-none focus:border-burgundy"
              />
              {errors.name && (
                <p className="mt-1 text-[0.7rem] text-red-700">{errors.name.message}</p>
              )}
            </div>

            {/* Slug */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-sans font-medium text-charcoal/80">
                  Slug URL <span className="text-burgundy">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAutoSlug}
                  className="text-[0.65rem] text-burgundy hover:underline font-sans font-medium"
                >
                  Regénérer
                </button>
              </div>
              <input
                type="text"
                {...register('slug')}
                className="w-full px-3 py-2 text-xs font-mono border border-sand-border rounded focus:outline-none focus:border-burgundy"
              />
              {errors.slug && (
                <p className="mt-1 text-[0.7rem] text-red-700">{errors.slug.message}</p>
              )}
            </div>

            {/* SKU */}
            <div>
              <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
                SKU / Référence
              </label>
              <input
                type="text"
                {...register('sku')}
                className="w-full px-3 py-2 text-xs font-mono border border-sand-border rounded focus:outline-none focus:border-burgundy"
              />
              {errors.sku && (
                <p className="mt-1 text-[0.7rem] text-red-700">{errors.sku.message}</p>
              )}
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
                Catégorie botanique
              </label>
              <select
                {...register('category_id')}
                disabled={loadingCategories}
                className="w-full px-3 py-2 text-xs bg-white border border-sand-border rounded focus:outline-none focus:border-burgundy"
              >
                <option value="">Sélectionner une catégorie...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="mt-1 text-[0.7rem] text-red-700">{errors.category_id.message}</p>
              )}
            </div>

            {/* Statut actif */}
            <div className="flex items-center gap-2 self-center pt-4">
              <input
                type="checkbox"
                id="is_active_checkbox_edit"
                {...register('is_active')}
                className="rounded text-burgundy focus:ring-burgundy"
              />
              <label htmlFor="is_active_checkbox_edit" className="text-xs font-sans text-charcoal cursor-pointer">
                Produit actif (visible sur la boutique en ligne)
              </label>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
                Description & Vertus Botaniques
              </label>
              <textarea
                rows={4}
                {...register('description')}
                className="w-full p-3 text-xs border border-sand-border rounded focus:outline-none focus:border-burgundy resize-none"
              />
            </div>
          </div>
        </Card>

        {/* Card 2: Tarification & Stock Boundary */}
        <Card className="p-6">
          <div className="mb-4 pb-3 border-b border-sand-border/60 flex items-center gap-2">
            <Coins className="w-4 h-4 text-burgundy" />
            <h2 className="text-sm font-serif font-medium text-charcoal">
              Tarification & Niveau de Stock
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Prix de vente */}
            <div>
              <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
                Prix de vente (MAD) <span className="text-burgundy">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('price', { valueAsNumber: true })}
                className="w-full px-3 py-2 text-xs border border-sand-border rounded focus:outline-none focus:border-burgundy"
              />
              {errors.price && (
                <p className="mt-1 text-[0.7rem] text-red-700">{errors.price.message}</p>
              )}
            </div>

            {/* Prix barré */}
            <div>
              <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
                Prix d'origine barré (MAD) <span className="text-charcoal/40">(optionnel)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('compare_at_price', {
                  setValueAs: (v) => (v === '' || isNaN(v) ? null : parseFloat(v)),
                })}
                className="w-full px-3 py-2 text-xs border border-sand-border rounded focus:outline-none focus:border-burgundy"
              />
              {errors.compare_at_price && (
                <p className="mt-1 text-[0.7rem] text-red-700">{errors.compare_at_price.message}</p>
              )}
            </div>

            {/* Coût interne */}
            <div>
              <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
                Coût de revient (MAD) <span className="text-charcoal/40">(interne)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('cost_price', {
                  setValueAs: (v) => (v === '' || isNaN(v) ? null : parseFloat(v)),
                })}
                className="w-full px-3 py-2 text-xs border border-sand-border rounded focus:outline-none focus:border-burgundy"
              />
            </div>

            {/* Stock Boundary Callout (Phase 4F Rule) */}
            <div className="sm:col-span-3 pt-3 border-t border-sand-border/50">
              <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
                Stock actuel disponible
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={`${product.stock_quantity} unité(s)`}
                  className="w-48 px-3 py-2 text-xs bg-canvas/60 border border-sand-border rounded text-charcoal/70 font-mono cursor-not-allowed select-none"
                />
                <span className="text-xs font-sans text-charcoal/60 italic">
                  Gestion du stock disponible dans le module « Gestion du stock ».
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 3: Images du Produit */}
        <Card className="p-6">
          <div className="mb-4 pb-3 border-b border-sand-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-burgundy" />
              <h2 className="text-sm font-serif font-medium text-charcoal">
                Galerie d'Images du Produit
              </h2>
            </div>
            <span className="text-xs text-charcoal/50 font-sans">
              Glissez ou réorganisez l'ordre d'affichage
            </span>
          </div>

          <Controller
            control={control}
            name="images"
            render={({ field }) => (
              <ProductImageManager
                images={field.value || []}
                onChange={field.onChange}
                disabled={isSubmitting || updateMutation.isPending}
              />
            )}
          />
        </Card>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-sand-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/products')}
            disabled={isSubmitting || updateMutation.isPending}
          >
            Annuler
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting || updateMutation.isPending || !isDirty}
            className="min-w-[170px]"
          >
            {isSubmitting || updateMutation.isPending ? (
              <>
                <Spinner size="sm" className="mr-2 border-white" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                <span>Enregistrer les modifications</span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Confirmation Modal: Archiver Produit */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded shadow-2xl border border-sand-border max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-900">
              <div className="w-10 h-10 rounded-full bg-rose-soft flex items-center justify-center shrink-0">
                <Archive className="w-5 h-5 text-red-700" />
              </div>
              <div>
                <h3 className="font-serif font-medium text-base text-charcoal">
                  Archiver ce produit ?
                </h3>
                <p className="text-xs text-charcoal/60">
                  {product.name}
                </p>
              </div>
            </div>

            <p className="text-xs font-sans text-charcoal/80 leading-relaxed">
              Le produit sera retiré du catalogue public en ligne. L’historique des commandes et les fiches instantanées d’achats antérieurs ne seront aucunement altérés.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowArchiveModal(false)}
                disabled={deleteMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmArchive}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Archivage...' : 'Confirmer l’archivage'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
