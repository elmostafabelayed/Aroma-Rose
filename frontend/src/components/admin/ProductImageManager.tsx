import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Star,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertCircle,
} from 'lucide-react';
import { useUploadProductImage } from '../../hooks/useProducts';
import { Button } from '../common/Button';
import { Spinner } from '../common/Spinner';
import type { ProductImage } from '../../types/product.types';
import { cn } from '../../utils/cn';

interface ProductImageManagerProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  disabled?: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const ProductImageManager: React.FC<ProductImageManagerProps> = ({
  images,
  onChange,
  disabled = false,
}) => {
  const uploadMutation = useUploadProductImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualPath, setManualPath] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // File selection & upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // 1. Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMessage('Format non supporté. Formats acceptés : JPEG, PNG, WebP, AVIF.');
      return;
    }

    // 2. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('Le fichier dépasse la taille maximale autorisée de 5 Mo.');
      return;
    }

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const res = await uploadMutation.mutateAsync({
            file_name: file.name,
            content_type: file.type,
            file_base64: base64,
          });

          // Add newly uploaded image
          const isFirst = images.length === 0;
          const newImage: ProductImage = {
            storage_path: res.storage_path,
            public_url: res.public_url,
            alt_text: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            display_order: images.length,
            is_primary: isFirst,
          };

          onChange([...images, newImage]);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err: any) {
          setErrorMessage(err?.message || 'Erreur lors du téléchargement de l’image.');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMessage('Impossible de lire le fichier sélectionné.');
    }
  };

  // Add manual image path
  const handleAddManualPath = () => {
    if (!manualPath.trim()) return;
    const isFirst = images.length === 0;
    const newImage: ProductImage = {
      storage_path: manualPath.trim(),
      public_url: manualPath.trim(),
      alt_text: 'Image produit',
      display_order: images.length,
      is_primary: isFirst,
    };
    onChange([...images, newImage]);
    setManualPath('');
    setShowManualInput(false);
  };

  // Set primary image
  const handleSetPrimary = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    onChange(updated);
  };

  // Remove image
  const handleRemove = (index: number) => {
    const removedWasPrimary = images[index]?.is_primary;
    const remaining = images.filter((_, i) => i !== index);

    // If removed was primary and other images exist, set the first as primary
    if (removedWasPrimary && remaining.length > 0) {
      remaining[0].is_primary = true;
    }

    // Recalculate display_order
    const updated = remaining.map((img, i) => ({
      ...img,
      display_order: i,
    }));

    onChange(updated);
  };

  // Move image position
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    const reordered = copy.map((img, i) => ({
      ...img,
      display_order: i,
    }));

    onChange(reordered);
  };

  // Update alt text
  const handleUpdateAltText = (index: number, alt: string) => {
    const updated = images.map((img, i) => (i === index ? { ...img, alt_text: alt } : img));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileChange}
          disabled={disabled || uploadMutation.isPending}
          className="hidden"
          id="product-image-upload-input"
        />

        {/* Primary Upload Button */}
        <label
          htmlFor="product-image-upload-input"
          className={cn(
            'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded border border-burgundy bg-burgundy text-white text-xs font-sans font-medium tracking-editorial uppercase hover:bg-burgundy/90 transition-colors cursor-pointer select-none',
            (disabled || uploadMutation.isPending) && 'opacity-60 cursor-not-allowed pointer-events-none'
          )}
        >
          {uploadMutation.isPending ? (
            <>
              <Spinner size="sm" className="border-white" />
              <span>Téléchargement...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Télécharger une image</span>
            </>
          )}
        </label>

        {/* Manual path button toggle */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowManualInput(!showManualInput)}
          disabled={disabled}
          className="text-xs"
        >
          {showManualInput ? 'Annuler la saisie manuelle' : 'Saisir un chemin d’image'}
        </Button>
      </div>

      {/* Manual path input row */}
      {showManualInput && (
        <div className="p-3 bg-canvas/40 border border-sand-border rounded flex items-center gap-2 animate-fade-in">
          <input
            type="text"
            value={manualPath}
            onChange={(e) => setManualPath(e.target.value)}
            placeholder="Ex: /products/soins-du-visage/creme-visage.jpg"
            className="flex-1 px-3 py-1.5 text-xs border border-sand-border rounded focus:outline-none focus:border-burgundy"
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleAddManualPath}
            disabled={!manualPath.trim() || disabled}
          >
            Ajouter
          </Button>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="p-3 rounded bg-rose-soft/60 border border-rose/40 text-red-900 text-xs flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Images List / Gallery */}
      {images.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-sand-border rounded text-center bg-canvas/20">
          <ImageIcon className="w-8 h-8 text-charcoal/30 mx-auto mb-2" />
          <p className="text-xs font-sans text-charcoal/60">
            Aucune image associée à ce produit.
          </p>
          <p className="text-[0.65rem] text-charcoal/40 mt-1">
            Formats acceptés : WebP, JPEG, PNG, AVIF (Max 5 Mo).
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {images.map((img, index) => {
            const url = img.public_url || img.storage_path;

            return (
              <div
                key={img.id || index}
                className={cn(
                  'p-3 bg-white border rounded flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-colors',
                  img.is_primary ? 'border-burgundy/60 bg-sand/10 ring-1 ring-burgundy/20' : 'border-sand-border'
                )}
              >
                {/* Left: Thumbnail and info */}
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded border border-sand-border bg-canvas overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={url}
                      alt={img.alt_text || 'Produit'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback icon if broken URL
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    {img.is_primary && (
                      <div className="absolute top-1 left-1 bg-burgundy text-white p-0.5 rounded-full" title="Image principale">
                        <Star className="w-2.5 h-2.5 fill-current" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-charcoal/80 truncate max-w-[200px] sm:max-w-xs" title={img.storage_path}>
                        {img.storage_path}
                      </span>
                      {img.is_primary ? (
                        <span className="text-[0.6rem] uppercase tracking-editorial font-semibold px-1.5 py-0.2 rounded bg-burgundy text-white">
                          Principale
                        </span>
                      ) : (
                        <span className="text-[0.6rem] text-charcoal/40 font-mono">
                          #{index + 1}
                        </span>
                      )}
                    </div>

                    {/* Alt text field */}
                    <input
                      type="text"
                      value={img.alt_text || ''}
                      onChange={(e) => handleUpdateAltText(index, e.target.value)}
                      placeholder="Texte alternatif (SEO)..."
                      disabled={disabled}
                      className="mt-1 w-full px-2 py-1 text-[0.7rem] border border-sand-border rounded bg-canvas/30 focus:bg-white focus:outline-none focus:border-burgundy"
                    />
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-sand-border/50">
                  {/* Primary button */}
                  {!img.is_primary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(index)}
                      disabled={disabled}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[0.65rem] text-charcoal/70 hover:text-burgundy hover:bg-canvas rounded border border-sand-border transition-colors"
                      title="Définir comme image principale"
                    >
                      <Star className="w-3 h-3" />
                      <span>Principale</span>
                    </button>
                  )}

                  {/* Reorder Buttons */}
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'up')}
                      disabled={disabled || index === 0}
                      className="p-1.5 text-charcoal/50 hover:text-charcoal disabled:opacity-30 rounded hover:bg-canvas"
                      title="Monter d'un rang"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'down')}
                      disabled={disabled || index === images.length - 1}
                      className="p-1.5 text-charcoal/50 hover:text-charcoal disabled:opacity-30 rounded hover:bg-canvas"
                      title="Descendre d'un rang"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    disabled={disabled}
                    className="p-1.5 text-charcoal/40 hover:text-red-700 hover:bg-rose-soft/40 rounded transition-colors"
                    title="Supprimer l'image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
