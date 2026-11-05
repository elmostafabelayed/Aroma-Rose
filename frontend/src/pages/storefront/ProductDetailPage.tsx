import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  MessageCircle,
  Truck,
  ShieldCheck,
  Sparkles,
  Plus,
  Minus,
} from 'lucide-react';
import { usePublicProductBySlug, usePublicProducts } from '../../hooks/useProducts';
import { useStoreSettings } from '../../hooks/useStoreSettings';
import { useCart } from '../../hooks/useCart';
import { useToast } from '../../context/ToastContext';
import { formatMAD } from '../../utils/formatters';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { ErrorState } from '../../components/feedback/ErrorState';
import { cn } from '../../utils/cn';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);

  const { addItem } = useCart();
  const { success } = useToast();
  const { data: storeSettings } = useStoreSettings();

  const {
    data: product,
    isLoading,
    error,
    refetch,
  } = usePublicProductBySlug(slug || '');

  // Fetch related products from the same category
  const { data: relatedData } = usePublicProducts(
    {
      category: product?.category?.slug || undefined,
      limit: 4,
    },
    { enabled: Boolean(product?.category?.slug) }
  );

  const relatedProducts = relatedData?.products.filter((p) => p.id !== product?.id).slice(0, 3) || [];

  if (isLoading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center bg-canvas min-h-screen">
        <Spinner size="lg" message="Révélation des vertus botaniques..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-24 container-editorial">
        <ErrorState
          title="Soin introuvable"
          message="Le soin demandé n'est plus disponible ou l'adresse est incorrecte."
          onRetry={() => refetch()}
        />
        <div className="text-center mt-6">
          <Link to="/shop">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Retourner au catalogue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product.primary_image
    ? [product.primary_image]
    : [];

  const currentImage = images[selectedImageIndex]?.public_url || '/placeholder-rose.jpg';
  const isOutOfStock = product.stock_quantity <= 0;
  const maxStock = Math.max(1, product.stock_quantity);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.min(maxStock, Math.max(1, prev + delta)));
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product.id, quantity);
    success(
      'Rituel ajouté au panier',
      `${quantity} flacon${quantity > 1 ? 's' : ''} de ${product.name} ajouté(s) à votre sélection.`
    );
  };

  const whatsappMessage = `Bonjour Aroma Rose, je souhaite commander le soin suivant :\n- ${product.name} (${formatMAD(product.price)})\n- Quantité : ${quantity}\nPouvez-vous me confirmer la disponibilité pour une livraison ? Merci !`;
  const whatsappUrl = buildWhatsAppUrl(storeSettings?.channels?.whatsapp_number, whatsappMessage);

  return (
    <div className="py-10 md:py-16 bg-canvas min-h-screen">
      <div className="container-editorial">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8 flex items-center gap-2 text-xs font-sans text-charcoal/60">
          <Link to="/" className="hover:text-burgundy transition-colors">Accueil</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-burgundy transition-colors">Boutique</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link to={`/shop?category=${product.category.slug}`} className="hover:text-burgundy transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-charcoal font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 pb-16 border-b border-sand-border">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Primary View */}
            <div className="relative aspect-[4/5] bg-white border border-sand-border rounded overflow-hidden flex items-center justify-center shadow-subtle">
              <img
                src={currentImage}
                alt={images[selectedImageIndex]?.alt_text || product.name}
                className="w-full h-full object-cover transition-opacity duration-300"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750" fill="%23F8F2EE"><rect width="600" height="750" fill="%23F8F2EE"/><text x="50%" y="50%" font-family="serif" font-size="24" fill="%23783747" dominant-baseline="middle" text-anchor="middle">Aroma Rose</text></svg>';
                }}
              />

              {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                <span className="absolute top-4 left-4 bg-rose text-white text-[0.68rem] uppercase tracking-editorial font-semibold px-3 py-1 rounded-sm shadow-subtle">
                  Édition Limitée
                </span>
              )}

              {isOutOfStock && (
                <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="bg-charcoal text-white text-xs uppercase tracking-editorial font-semibold px-4 py-2 rounded">
                    Actuellement Épuisé
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Row */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={cn(
                      'w-20 h-24 rounded border overflow-hidden shrink-0 transition-all duration-150',
                      selectedImageIndex === idx
                        ? 'border-burgundy ring-2 ring-burgundy/20'
                        : 'border-sand-border opacity-70 hover:opacity-100'
                    )}
                  >
                    <img
                      src={img.public_url || '/placeholder-rose.jpg'}
                      alt={img.alt_text || `Vue ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Narrative & Actions */}
          <div className="lg:col-span-6 flex flex-col justify-start">
            {product.category && (
              <span className="label-editorial text-burgundy mb-2">
                {product.category.name}
              </span>
            )}

            <h1 className="text-3xl sm:text-4xl font-serif text-charcoal font-normal leading-tight mb-4">
              {product.name}
            </h1>

            {/* Price Presentation */}
            <div className="flex items-baseline gap-3 mb-6 pb-6 border-b border-sand-border/70">
              <span className="font-serif text-3xl font-medium text-burgundy">
                {formatMAD(product.price)}
              </span>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <span className="text-base text-charcoal/40 line-through font-sans">
                  {formatMAD(product.compare_at_price)}
                </span>
              )}
              <span className="text-xs uppercase tracking-editorial text-charcoal/50 ml-auto font-sans">
                Paiement à la livraison (COD)
              </span>
            </div>

            {/* Stock Availability Indicator */}
            <div className="mb-6 flex items-center gap-2 text-xs font-sans">
              {isOutOfStock ? (
                <span className="text-red-700 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
                  Rupture de stock momentanée
                </span>
              ) : product.stock_quantity <= 5 ? (
                <span className="text-amber-800 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
                  Stock limité : plus que {product.stock_quantity} disponible(s)
                </span>
              ) : (
                <span className="text-sage-dark font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sage inline-block" />
                  En stock — Récolte Kelaat M’Gouna (Expédition sous 24-48h)
                </span>
              )}
            </div>

            {/* Product Description */}
            {product.description && (
              <div className="mb-8 prose prose-stone text-charcoal/75 text-sm leading-relaxed font-sans">
                <p>{product.description}</p>
              </div>
            )}

            {/* Quantity Selector & Add to Cart */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
              {/* Quantity Counter */}
              <div className="inline-flex items-center justify-between border border-sand-border rounded bg-white px-3 py-2 w-36 shrink-0">
                <button
                  type="button"
                  disabled={quantity <= 1 || isOutOfStock}
                  onClick={() => handleQuantityChange(-1)}
                  className="p-1 text-charcoal/60 hover:text-burgundy disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Diminuer la quantité"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-sans font-semibold text-charcoal select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= maxStock || isOutOfStock}
                  onClick={() => handleQuantityChange(1)}
                  className="p-1 text-charcoal/60 hover:text-burgundy disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Augmenter la quantité"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Add to Cart Button */}
              <Button
                size="lg"
                variant="primary"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className="flex-1"
                leftIcon={<ShoppingBag className="w-4 h-4" />}
              >
                {isOutOfStock ? 'Produit Épuisé' : 'Ajouter au Panier'}
              </Button>
            </div>

            {/* Direct WhatsApp Ordering Alternative */}
            <div className="mb-8 p-4 bg-sage-soft/70 border border-sage-border rounded">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-editorial text-sage-dark font-sans">
                    Commander directement par WhatsApp
                  </h4>
                  <p className="text-xs text-sage-dark/80 font-sans mt-0.5">
                    Échangez avec un conseiller qui enregistrera votre commande en quelques instants.
                  </p>
                </div>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-sage hover:bg-sage-dark text-white text-xs uppercase tracking-editorial font-semibold transition-colors shrink-0 shadow-subtle"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Service & Assurance Guarantee Strip */}
            <div className="pt-6 border-t border-sand-border/70 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans text-charcoal/70">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-burgundy shrink-0" />
                <span>Expédition 24/48h</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-burgundy shrink-0" />
                <span>Paiement à la livraison</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-burgundy shrink-0" />
                <span>Rosa Damascena pure</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Strip */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="mb-8 text-center max-w-xl mx-auto">
              <span className="label-editorial text-burgundy">Harmonie Botanique</span>
              <h3 className="text-2xl font-serif text-charcoal mt-1">
                À Associer Avec Ce Rituel
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {relatedProducts.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/shop/${rel.slug}`}
                  className="group bg-white border border-sand-border rounded p-4 flex flex-col hover:border-burgundy transition-all duration-200"
                >
                  <div className="aspect-[4/5] bg-sand/20 rounded overflow-hidden mb-3">
                    <img
                      src={rel.primary_image?.public_url || '/placeholder-rose.jpg'}
                      alt={rel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h4 className="font-serif text-base text-charcoal group-hover:text-burgundy transition-colors truncate">
                    {rel.name}
                  </h4>
                  <span className="font-serif text-sm font-medium text-burgundy mt-1">
                    {formatMAD(rel.price)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
