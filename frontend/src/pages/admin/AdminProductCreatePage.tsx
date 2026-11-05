import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Package,
  Coins,
  ImageIcon,
  AlertCircle,
  Save,
} from 'lucide-react';
import { useCreateProduct } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import {
  productFormSchema,
  type ProductFormValues,
} from '../../schemas/product.schema';
import { ProductImageManager } from '../../components/admin/ProductImageManager';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { useToast } from '../../context/ToastContext';

export const AdminProductCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const createMutation = useCreateProduct();

  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Fetch real categories
  const { data: categories = [], isLoading: loadingCategories } = useCategories();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
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

  const watchedName = watch('name');

  // Slug auto-generation helper
  const handleAutoSlug = () => {
    if (!watchedName) return;
    const generated = watchedName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // strip accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setValue('slug', generated, { shouldValidate: true });
  };

  const onSubmit = async (values: ProductFormValues) => {
    setSubmissionError(null);
    try {
      const payload = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        sku: values.sku?.trim() || undefined,
        category_id: values.category_id || null,
        description: values.description?.trim() || undefined,
        price: Number(values.price),
        compare_at_price: values.compare_at_price !== null && values.compare_at_price !== undefined ? Number(values.compare_at_price) : null,
        cost_price: values.cost_price !== null && values.cost_price !== undefined ? Number(values.cost_price) : null,
        stock_quantity: Number(values.stock_quantity) || 0,
        is_active: Boolean(values.is_active),
        images: values.images?.map((img, idx) => ({
          storage_path: img.storage_path,
          alt_text: img.alt_text || null,
          display_order: idx,
          is_primary: Boolean(img.is_primary),
        })),
      };

      const newProduct = await createMutation.mutateAsync(payload);
      showSuccessToast(
        'Produit créé avec succès',
        `Le produit "${newProduct.name}" a été ajouté au catalogue.`
      );
      navigate('/admin/products');
    } catch (err: any) {
      const msg =
        err?.message ||
        'Une erreur est survenue lors de la création du produit. Vérifiez l’unicité du SKU et du slug.';
      setSubmissionError(msg);
      showErrorToast('Erreur de création', msg);
    }
  };

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
          <span className="text-burgundy font-medium">Nouveau produit</span>
        </nav>

        <div className="flex items-center justify-between gap-4">
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
              <h1 className="text-2xl font-serif font-medium text-charcoal tracking-tight">
                Ajouter un produit
              </h1>
              <p className="text-xs font-sans text-charcoal/60 mt-0.5">
                Création d’une nouvelle référence cosmétique dans la base de données.
              </p>
            </div>
          </div>
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
                placeholder="Ex: Huile Précieuse de Rose de Damas 50ml"
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
                  Générer automatiquement
                </button>
              </div>
              <input
                type="text"
                {...register('slug')}
                placeholder="huile-precieuse-rose-damas"
                className="w-full px-3 py-2 text-xs font-mono border border-sand-border rounded focus:outline-none focus:border-burgundy"
              />
              {errors.slug && (
                <p className="mt-1 text-[0.7rem] text-red-700">{errors.slug.message}</p>
              )}
            </div>

            {/* SKU */}
            <div>
              <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
                SKU / Référence unique
              </label>
              <input
                type="text"
                {...register('sku')}
                placeholder="AR-ROSE-050"
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
                id="is_active_checkbox"
                {...register('is_active')}
                className="rounded text-burgundy focus:ring-burgundy"
              />
              <label htmlFor="is_active_checkbox" className="text-xs font-sans text-charcoal cursor-pointer">
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
                placeholder="Histoire de la récolte, terroir de Kelaat M'Gouna, conseils d'application..."
                className="w-full p-3 text-xs border border-sand-border rounded focus:outline-none focus:border-burgundy resize-none"
              />
            </div>
          </div>
        </Card>

        {/* Card 2: Tarification & Stock initial */}
        <Card className="p-6">
          <div className="mb-4 pb-3 border-b border-sand-border/60 flex items-center gap-2">
            <Coins className="w-4 h-4 text-burgundy" />
            <h2 className="text-sm font-serif font-medium text-charcoal">
              Tarification & Stock Initial
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

            {/* Prix comparatif (barré) */}
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
                placeholder="Ex: 220.00"
                className="w-full px-3 py-2 text-xs border border-sand-border rounded focus:outline-none focus:border-burgundy"
              />
              {errors.compare_at_price && (
                <p className="mt-1 text-[0.7rem] text-red-700">{errors.compare_at_price.message}</p>
              )}
            </div>

            {/* Coût d'achat */}
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
                placeholder="Ex: 65.00"
                className="w-full px-3 py-2 text-xs border border-sand-border rounded focus:outline-none focus:border-burgundy"
              />
            </div>

            {/* Stock Initial */}
            <div className="sm:col-span-3 pt-2">
              <label className="block text-xs font-sans font-medium text-charcoal/80 mb-1">
                Quantité en stock initiale
              </label>
              <input
                type="number"
                min="0"
                {...register('stock_quantity', { valueAsNumber: true })}
                className="w-48 px-3 py-2 text-xs border border-sand-border rounded focus:outline-none focus:border-burgundy"
              />
              <p className="text-[0.65rem] text-charcoal/50 mt-1">
                Les ajustements de stock ultérieurs s'effectueront via le module « Gestion du stock ».
              </p>
              {errors.stock_quantity && (
                <p className="mt-1 text-[0.7rem] text-red-700">{errors.stock_quantity.message}</p>
              )}
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
              L’image marquée d’une étoile est l’image principale
            </span>
          </div>

          <Controller
            control={control}
            name="images"
            render={({ field }) => (
              <ProductImageManager
                images={field.value || []}
                onChange={field.onChange}
                disabled={isSubmitting || createMutation.isPending}
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
                <Spinner size="sm" className="mr-2 border-white" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                <span>Créer le produit</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
