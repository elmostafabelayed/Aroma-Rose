import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Store,
  Truck,
  CreditCard,
  Coins,
  Power,
  Bell,
  Layers,
  Save,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
  Lock,
} from 'lucide-react';
import { useAdminSettings, useUpdateAdminSettings } from '../../hooks/useSettings';
import { useAuth } from '../../auth/useAuth';
import { useToast } from '../../context/ToastContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { ErrorState } from '../../components/feedback/ErrorState';
import type { UpdateStoreSettingsInput } from '../../types/settings.types';
import { formatDateTime } from '../../utils/formatters';

type SettingsTab =
  | 'identity'
  | 'shipping'
  | 'payment'
  | 'availability'
  | 'inventory'
  | 'notifications';

export const AdminSettingsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { success, error: toastError, info } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('identity');

  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useAdminSettings();

  const updateMutation = useUpdateAdminSettings();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty, errors, isSubmitting },
  } = useForm<UpdateStoreSettingsInput>({
    defaultValues: settings || {},
  });

  // Re-sync form when data arrives
  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const watchedStoreStatus = watch('store_status');
  const watchedFreeShippingEnabled = watch('free_shipping_enabled');
  const watchedShippingEnabled = watch('shipping_enabled');
  const watchedCodEnabled = watch('cod_enabled');

  const onSubmit = async (values: UpdateStoreSettingsInput) => {
    if (!isAdmin) {
      toastError('Action non autorisée', 'Seul un administrateur peut modifier la configuration.');
      return;
    }

    try {
      await updateMutation.mutateAsync(values);
      success('Configuration enregistrée', 'Les paramètres du magasin ont été mis à jour avec succès.');
    } catch (err: any) {
      const msg = err?.message || 'Erreur lors de l’enregistrement de la configuration.';
      toastError('Erreur d’enregistrement', msg);
    }
  };

  const handleResetForm = () => {
    if (settings) {
      reset(settings);
      info('Réinitialisation', 'Modifications réinitialisées aux valeurs sauvegardées.');
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <Spinner size="lg" className="text-burgundy" />
        <span className="text-sm text-charcoal/60 font-sans mt-3">
          Chargement de la configuration du magasin…
        </span>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="py-12 max-w-lg mx-auto">
        <ErrorState
          title="Erreur de configuration"
          message="Impossible d'accéder aux paramètres du magasin depuis la base de données."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const isSaving = updateMutation.isPending || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-fade-in pb-16">
      {/* =========================================================================
          1. Editorial Header
         ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-sand-light/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="label-editorial text-burgundy">Administration</span>
            <span className="text-charcoal/30">•</span>
            <Badge
              variant={settings.store_status === 'open' ? 'sage' : 'danger'}
              size="sm"
            >
              {settings.store_status === 'open' ? 'Boutique Ouverte' : 'Boutique Fermée'}
            </Badge>
          </div>
          <h1 className="text-3xl font-serif text-charcoal font-normal mt-1">
            Paramètres du magasin
          </h1>
          <p className="text-sm text-charcoal/60 font-sans mt-1">
            Gérez la configuration globale, la livraison, le paiement COD et les règles opérationnelles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isDirty && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetForm}
              disabled={isSaving}
              className="text-xs text-charcoal border-sand-light hover:bg-warm-cream"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>Annuler</span>
            </Button>
          )}

          {isAdmin ? (
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSaving || !isDirty}
              className="flex items-center gap-2 bg-burgundy hover:bg-burgundy/90 text-white min-w-[120px] justify-center"
            >
              {isSaving ? (
                <Spinner size="sm" className="text-white" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Enregistrer</span>
                </>
              )}
            </Button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-sand-light/30 text-xs text-charcoal/60">
              <Lock className="w-3.5 h-3.5 text-charcoal/40" />
              <span>Lecture seule (Staff)</span>
            </div>
          )}
        </div>
      </div>

      {/* Staff Restriction Notice */}
      {!isAdmin && (
        <div className="flex items-start gap-3 p-4 bg-amber-50/60 border border-amber-200/60 rounded text-amber-900 text-xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-medium">Accès restreint en lecture seule :</span> Vous
            pouvez consulter la configuration actuelle du magasin. Seul un administrateur
            authentifié dispose des droits pour enregistrer des modifications.
          </div>
        </div>
      )}

      {/* Unsaved Changes Banner */}
      {isDirty && isAdmin && (
        <div className="flex items-center justify-between p-3.5 bg-burgundy/5 border border-burgundy/20 rounded text-burgundy text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-burgundy shrink-0" />
            <span className="font-medium">Modifications non enregistrées en attente.</span>
          </div>
          <span className="text-charcoal/50 text-[11px]">
            N’oubliez pas d’enregistrer avant de quitter la page.
          </span>
        </div>
      )}

      {/* =========================================================================
          2. Tab Navigation & Content Layout
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setActiveTab('identity')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-sans font-medium text-left transition-colors ${
              activeTab === 'identity'
                ? 'bg-burgundy text-white shadow-xs'
                : 'text-charcoal/70 hover:bg-sand-light/40 hover:text-charcoal'
            }`}
          >
            <Store className="w-4 h-4 shrink-0" />
            <span>Informations du magasin</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shipping')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-sans font-medium text-left transition-colors ${
              activeTab === 'shipping'
                ? 'bg-burgundy text-white shadow-xs'
                : 'text-charcoal/70 hover:bg-sand-light/40 hover:text-charcoal'
            }`}
          >
            <Truck className="w-4 h-4 shrink-0" />
            <span>Livraison & Expéditions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payment')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-sans font-medium text-left transition-colors ${
              activeTab === 'payment'
                ? 'bg-burgundy text-white shadow-xs'
                : 'text-charcoal/70 hover:bg-sand-light/40 hover:text-charcoal'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Paiement à la livraison</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('availability')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-sans font-medium text-left transition-colors ${
              activeTab === 'availability'
                ? 'bg-burgundy text-white shadow-xs'
                : 'text-charcoal/70 hover:bg-sand-light/40 hover:text-charcoal'
            }`}
          >
            <Power className="w-4 h-4 shrink-0" />
            <span>Disponibilité du magasin</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-sans font-medium text-left transition-colors ${
              activeTab === 'inventory'
                ? 'bg-burgundy text-white shadow-xs'
                : 'text-charcoal/70 hover:bg-sand-light/40 hover:text-charcoal'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Seuils d'inventaire</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-sans font-medium text-left transition-colors ${
              activeTab === 'notifications'
                ? 'bg-burgundy text-white shadow-xs'
                : 'text-charcoal/70 hover:bg-sand-light/40 hover:text-charcoal'
            }`}
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span>Notifications visuelles</span>
          </button>

          {/* Audit Attribution Stamp */}
          {settings.updated_at && (
            <div className="pt-6 text-[11px] text-charcoal/40 font-sans space-y-1 px-3">
              <div>Dernière modification :</div>
              <div className="font-mono text-charcoal/60">
                {formatDateTime(settings.updated_at)}
              </div>
            </div>
          )}
        </div>

        {/* Tab Content Cards */}
        <div className="md:col-span-3">
          {/* TAB 1: STORE IDENTITY */}
          {activeTab === 'identity' && (
            <Card className="p-6 border-sand-light bg-white shadow-xs space-y-6">
              <div className="border-b border-sand-light/60 pb-4">
                <h2 className="text-lg font-serif text-charcoal font-medium">
                  Informations de la marque
                </h2>
                <p className="text-xs text-charcoal/60 font-sans mt-0.5">
                  Coordonnées officielles visibles sur la boutique publique et les factures.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-sans">
                {/* Store Name */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-charcoal block">
                    Nom de la boutique <span className="text-burgundy">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin || isSaving}
                    {...register('store_name', { required: true })}
                    className="w-full px-3.5 py-2 bg-warm-cream/20 border border-sand-light rounded focus:border-burgundy focus:ring-1 focus:ring-burgundy text-sm text-charcoal disabled:opacity-60"
                  />
                  {errors.store_name && (
                    <span className="text-xs text-rose-600">Le nom est requis.</span>
                  )}
                </div>

                {/* Description */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-charcoal block">
                    Slogan / Description courte
                  </label>
                  <textarea
                    rows={2}
                    disabled={!isAdmin || isSaving}
                    {...register('store_description')}
                    className="w-full px-3.5 py-2 bg-warm-cream/20 border border-sand-light rounded focus:border-burgundy focus:ring-1 focus:ring-burgundy text-sm text-charcoal disabled:opacity-60"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-charcoal block">
                    Adresse physique
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin || isSaving}
                    {...register('store_address')}
                    className="w-full px-3.5 py-2 bg-warm-cream/20 border border-sand-light rounded focus:border-burgundy focus:ring-1 focus:ring-burgundy text-sm text-charcoal disabled:opacity-60"
                  />
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-charcoal block">
                    Ville du terroir
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin || isSaving}
                    {...register('store_city')}
                    className="w-full px-3.5 py-2 bg-warm-cream/20 border border-sand-light rounded focus:border-burgundy focus:ring-1 focus:ring-burgundy text-sm text-charcoal disabled:opacity-60"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-charcoal block">
                    Téléphone fixe service client
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin || isSaving}
                    {...register('store_phone')}
                    className="w-full px-3.5 py-2 bg-warm-cream/20 border border-sand-light rounded focus:border-burgundy focus:ring-1 focus:ring-burgundy text-sm text-charcoal disabled:opacity-60"
                  />
                </div>

                {/* Contact Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-charcoal block">
                    Email de contact
                  </label>
                  <input
                    type="email"
                    disabled={!isAdmin || isSaving}
                    {...register('store_email')}
                    className="w-full px-3.5 py-2 bg-warm-cream/20 border border-sand-light rounded focus:border-burgundy focus:ring-1 focus:ring-burgundy text-sm text-charcoal disabled:opacity-60"
                  />
                </div>

                {/* WhatsApp Number */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-medium text-charcoal block">
                    Numéro WhatsApp officiel pour commandes
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin || isSaving}
                    {...register('whatsapp_number')}
                    className="w-full px-3.5 py-2 bg-warm-cream/20 border border-sand-light rounded focus:border-burgundy focus:ring-1 focus:ring-burgundy text-sm text-charcoal font-mono disabled:opacity-60"
                    placeholder="+212600000000"
                  />
                  <p className="text-[11px] text-charcoal/50">
                    Utilisé pour les liens directs de commande WhatsApp sur la boutique publique.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* TAB 2: SHIPPING */}
          {activeTab === 'shipping' && (
            <Card className="p-6 border-sand-light bg-white shadow-xs space-y-6">
              <div className="border-b border-sand-light/60 pb-4">
                <h2 className="text-lg font-serif text-charcoal font-medium">
                  Livraison & Tarification
                </h2>
                <p className="text-xs text-charcoal/60 font-sans mt-0.5">
                  Définissez les frais de livraison standard et le seuil de gratuité pour le Maroc.
                </p>
              </div>

              <div className="space-y-5 text-sm font-sans">
                {/* Global Shipping Toggle */}
                <div className="flex items-center justify-between p-3.5 bg-warm-cream/30 border border-sand-light/60 rounded">
                  <div>
                    <span className="font-medium text-charcoal block">
                      Livraison active sur la boutique
                    </span>
                    <span className="text-xs text-charcoal/60">
                      Autorise les expéditions à travers toutes les villes du Maroc.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin || isSaving}
                      {...register('shipping_enabled')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-sand-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-sand-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-burgundy"></div>
                  </label>
                </div>

                {/* Standard Fee */}
                <div className="space-y-1.5 max-w-sm">
                  <label className="text-xs font-medium text-charcoal block">
                    Frais de livraison standard (MAD) <span className="text-burgundy">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      disabled={!isAdmin || isSaving || !watchedShippingEnabled}
                      {...register('shipping_standard_fee', { min: 0, required: true })}
                      className="w-full px-3.5 py-2 bg-warm-cream/20 border border-sand-light rounded focus:border-burgundy focus:ring-1 focus:ring-burgundy text-sm text-charcoal font-mono disabled:opacity-60"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-charcoal/40 font-mono">
                      MAD
                    </span>
                  </div>
                </div>

                {/* Free Shipping Toggle */}
                <div className="flex items-center justify-between p-3.5 bg-warm-cream/30 border border-sand-light/60 rounded">
                  <div>
                    <span className="font-medium text-charcoal block">
                      Livraison gratuite au-delà d’un seuil
                    </span>
                    <span className="text-xs text-charcoal/60">
                      Offre les frais de port lorsque le sous-total atteint ou dépasse le montant configuré.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin || isSaving || !watchedShippingEnabled}
                      {...register('free_shipping_enabled')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-sand-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-sand-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-burgundy"></div>
                  </label>
                </div>

                {/* Free Shipping Threshold */}
                {watchedFreeShippingEnabled && (
                  <div className="space-y-1.5 max-w-sm pl-4 border-l-2 border-burgundy">
                    <label className="text-xs font-medium text-charcoal block">
                      Seuil de livraison gratuite (MAD) <span className="text-burgundy">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={!isAdmin || isSaving || !watchedShippingEnabled}
                        {...register('shipping_free_threshold', { min: 0, required: true })}
                        className="w-full px-3.5 py-2 bg-warm-cream/20 border border-sand-light rounded focus:border-burgundy focus:ring-1 focus:ring-burgundy text-sm text-charcoal font-mono disabled:opacity-60"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-charcoal/40 font-mono">
                        MAD
                      </span>
                    </div>
                  </div>
                )}

                {/* Estimated Delivery Time */}
                <div className="space-y-1.5 max-w-md">
                  <label className="text-xs font-medium text-charcoal block">
                    Délai indicatif de livraison affiché
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin || isSaving}
                    {...register('estimated_delivery_days')}
                    className="w-full px-3.5 py-2 bg-warm-cream/20 border border-sand-light rounded focus:border-burgundy focus:ring-1 focus:ring-burgundy text-sm text-charcoal disabled:opacity-60"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* TAB 3: PAYMENT */}
          {activeTab === 'payment' && (
            <Card className="p-6 border-sand-light bg-white shadow-xs space-y-6">
              <div className="border-b border-sand-light/60 pb-4">
                <h2 className="text-lg font-serif text-charcoal font-medium">
                  Mode de Paiement & Devise
                </h2>
                <p className="text-xs text-charcoal/60 font-sans mt-0.5">
                  Gestion du paiement à la livraison (Cash on Delivery) et verrouillage de la devise marocaine.
                </p>
              </div>

              <div className="space-y-5 text-sm font-sans">
                {/* COD Toggle */}
                <div className="flex items-center justify-between p-4 bg-warm-cream/30 border border-sand-light/60 rounded">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-charcoal">
                        Paiement à la livraison (Cash on Delivery)
                      </span>
                      <Badge variant={watchedCodEnabled ? 'sage' : 'danger'} size="sm">
                        {watchedCodEnabled ? 'Disponible' : 'Désactivé'}
                      </Badge>
                    </div>
                    <p className="text-xs text-charcoal/60 max-w-lg leading-relaxed">
                      Permet aux clients de régler le montant de leur commande en espèces auprès du transporteur lors de la remise du colis.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      disabled={!isAdmin || isSaving}
                      {...register('cod_enabled')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-sand-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-sand-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-burgundy"></div>
                  </label>
                </div>

                {/* Locked Currency notice */}
                <div className="p-4 bg-sand-light/20 border border-sand-light/60 rounded space-y-2">
                  <div className="flex items-center gap-2 text-charcoal">
                    <Coins className="w-4 h-4 text-burgundy" />
                    <span className="font-medium text-xs">
                      Devise officielle de transaction : MAD (Dirham marocain)
                    </span>
                  </div>
                  <p className="text-xs text-charcoal/60 leading-relaxed">
                    La boutique opère exclusivement en Dirhams Marocains (DH / MAD). Conformément aux règles de sécurité financière, les montants des commandes existantes ne sont jamais recalculés ou altérés.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* TAB 4: STORE AVAILABILITY */}
          {activeTab === 'availability' && (
            <Card className="p-6 border-sand-light bg-white shadow-xs space-y-6">
              <div className="border-b border-sand-light/60 pb-4">
                <h2 className="text-lg font-serif text-charcoal font-medium">
                  Disponibilité du Magasin
                </h2>
                <p className="text-xs text-charcoal/60 font-sans mt-0.5">
                  Ouvrez ou fermez temporairement la boutique aux nouvelles commandes.
                </p>
              </div>

              <div className="space-y-5 text-sm font-sans">
                {/* Store Status Toggle */}
                <div className="flex items-center justify-between p-4 bg-warm-cream/30 border border-sand-light/60 rounded">
                  <div>
                    <span className="font-medium text-charcoal block">
                      État d'ouverture du magasin
                    </span>
                    <span className="text-xs text-charcoal/60">
                      {watchedStoreStatus === 'open'
                        ? 'Le magasin accepte les commandes en ligne.'
                        : 'Le magasin est temporairement fermé aux nouvelles commandes.'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!isAdmin || isSaving}
                      onClick={() => setValue('store_status', 'open', { shouldDirty: true })}
                      className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${
                        watchedStoreStatus === 'open'
                          ? 'bg-sage text-white shadow-xs'
                          : 'bg-warm-cream/60 text-charcoal/60 hover:bg-sand-light/50'
                      }`}
                    >
                      Ouvert
                    </button>
                    <button
                      type="button"
                      disabled={!isAdmin || isSaving}
                      onClick={() => setValue('store_status', 'closed', { shouldDirty: true })}
                      className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${
                        watchedStoreStatus === 'closed'
                          ? 'bg-rose-700 text-white shadow-xs'
                          : 'bg-warm-cream/60 text-charcoal/60 hover:bg-sand-light/50'
                      }`}
                    >
                      Fermé
                    </button>
                  </div>
                </div>

                {/* Closure Message */}
                {watchedStoreStatus === 'closed' && (
                  <div className="space-y-2 p-4 bg-rose-50/50 border border-rose-200/60 rounded">
                    <label className="text-xs font-medium text-rose-900 block">
                      Message public affiché aux clients sur la boutique
                    </label>
                    <textarea
                      rows={3}
                      disabled={!isAdmin || isSaving}
                      {...register('store_closure_message')}
                      className="w-full px-3.5 py-2 bg-white border border-rose-200 rounded focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm text-charcoal"
                      placeholder="Notre boutique en ligne est temporairement fermée..."
                    />
                    <p className="text-[11px] text-rose-800/70">
                      L'accès à l'administration reste actif pour traiter les commandes déjà reçues.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* TAB 5: INVENTORY */}
          {activeTab === 'inventory' && (
            <Card className="p-6 border-sand-light bg-white shadow-xs space-y-6">
              <div className="border-b border-sand-light/60 pb-4">
                <h2 className="text-lg font-serif text-charcoal font-medium">
                  Seuil d'Alerte de Stock
                </h2>
                <p className="text-xs text-charcoal/60 font-sans mt-0.5">
                  Définissez la limite sous laquelle un produit est classifié en « Stock faible ».
                </p>
              </div>

              <div className="space-y-4 text-sm font-sans max-w-sm">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-charcoal block">
                    Seuil de stock faible (unités) <span className="text-burgundy">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    disabled={!isAdmin || isSaving}
                    {...register('low_stock_threshold', { min: 0, required: true })}
                    className="w-full px-3.5 py-2 bg-warm-cream/20 border border-sand-light rounded focus:border-burgundy focus:ring-1 focus:ring-burgundy text-sm text-charcoal font-mono"
                  />
                  <p className="text-[11px] text-charcoal/50 leading-relaxed">
                    Par défaut : 10 unités. Les produits ayant un stock compris entre 1 et ce seuil affichent le badge d’alerte « Stock faible ».
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* TAB 6: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <Card className="p-6 border-sand-light bg-white shadow-xs space-y-6">
              <div className="border-b border-sand-light/60 pb-4">
                <h2 className="text-lg font-serif text-charcoal font-medium">
                  Préférences de Notifications Visuelles
                </h2>
                <p className="text-xs text-charcoal/60 font-sans mt-0.5">
                  Gérez les indicateurs et pastilles d'alerte dans l'interface d'administration.
                </p>
              </div>

              <div className="space-y-4 text-sm font-sans">
                {/* Low Stock Badges */}
                <div className="flex items-center justify-between p-3.5 bg-warm-cream/30 border border-sand-light/60 rounded">
                  <div>
                    <span className="font-medium text-charcoal block">
                      Pastilles d'alerte de stock faible
                    </span>
                    <span className="text-xs text-charcoal/60">
                      Affiche les alertes sur le tableau de bord et dans la gestion de stock.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin || isSaving}
                      {...register('low_stock_alert_enabled')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-sand-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-sand-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-burgundy"></div>
                  </label>
                </div>

                {/* New Orders Badges */}
                <div className="flex items-center justify-between p-3.5 bg-warm-cream/30 border border-sand-light/60 rounded">
                  <div>
                    <span className="font-medium text-charcoal block">
                      Badges de nouvelles commandes en attente
                    </span>
                    <span className="text-xs text-charcoal/60">
                      Met en surbrillance les commandes nécessitant confirmation.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!isAdmin || isSaving}
                      {...register('new_order_notification_enabled')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-sand-light peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-sand-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-burgundy"></div>
                  </label>
                </div>

                <div className="flex items-center gap-2 p-3 bg-sand-light/20 rounded text-xs text-charcoal/60">
                  <HelpCircle className="w-4 h-4 text-charcoal/40 shrink-0" />
                  <span>
                    Note : Les passerelles d'envoi automatique d'emails/SMS marketing ne sont pas connectées dans cette phase.
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </form>
  );
};
