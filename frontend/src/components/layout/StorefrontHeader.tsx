import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, MessageCircle } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useStoreSettings } from '../../hooks/useStoreSettings';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { cn } from '../../utils/cn';

export const StorefrontHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const { totalItems } = useCart();
  const { data: storeSettings } = useStoreSettings();

  const freeThreshold = storeSettings?.shipping?.free_shipping_threshold || 300;
  const whatsappUrl = buildWhatsAppUrl(
    storeSettings?.channels?.whatsapp_number,
    'Bonjour Aroma Rose, je souhaite avoir des conseils ou passer une commande.'
  );

  const navLinks = [
    { label: 'Boutique', to: '/shop' },
    { label: 'Notre Histoire', to: '/about' },
    { label: 'Le Terroir de Kelaat M’Gouna', to: '/terroir' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-sand-border">
      {/* Editorial Announcement Bar */}
      <div className="bg-burgundy text-white py-1.5 px-4 text-center">
        <p className="text-[0.68rem] uppercase tracking-editorial font-medium">
          Livraison offerte au Maroc dès {freeThreshold} MAD • Paiement à la livraison (COD) • Soins 100% Naturels de Kelaat M’Gouna
        </p>
      </div>

      {/* Main Header Container */}
      <div className="container-editorial">
        <div className="flex items-center justify-between h-20 md:h-24 gap-4">
          {/* Far Left: Official Brand Logo */}
          <div className="flex items-center justify-start shrink-0">
            <Link
              to="/"
              className="group relative flex items-center focus:outline-none"
              aria-label="Aroma Rose — Accueil"
            >
              <img
                src="/images/logo.webp"
                alt="Aroma Rose — Soin Naturel"
                className="h-14 sm:h-16 md:h-18 lg:h-20 w-auto max-w-[170px] sm:max-w-[210px] object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-300 ease-out group-hover:scale-[1.04] group-hover:drop-shadow-[0_4px_16px_rgba(107,24,56,0.22)] active:scale-95"
              />
            </Link>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center justify-center gap-8 xl:gap-10">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'text-[0.74rem] xl:text-[0.78rem] uppercase font-sans font-medium tracking-editorial transition-colors duration-150 whitespace-nowrap',
                    isActive
                      ? 'text-burgundy border-b-2 border-burgundy pb-0.5 font-semibold'
                      : 'text-charcoal/80 hover:text-burgundy'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Far Right: Actions (WhatsApp, Search, Cart, Mobile Menu) */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 md:gap-5 shrink-0">
            {/* WhatsApp Direct Order Shortcut */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-[0.68rem] tracking-editorial font-semibold uppercase px-3 py-1.5 rounded border border-sand-border text-charcoal hover:text-burgundy hover:border-burgundy transition-colors"
              title="Conseil & commande par WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-sage" />
              <span>WhatsApp</span>
            </a>

            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-charcoal/80 hover:text-burgundy transition-colors"
              aria-label="Rechercher un soin"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Shopping Bag with live count badge */}
            <Link
              to="/cart"
              className="relative p-2 text-charcoal/80 hover:text-burgundy transition-colors"
              aria-label={`Panier d'achat avec ${totalItems} article${totalItems > 1 ? 's' : ''}`}
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-burgundy text-white text-[0.6rem] font-sans font-semibold flex items-center justify-center animate-in zoom-in-75 duration-150">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Mobile Hamburger Trigger (positioned at far right on mobile) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-charcoal hover:text-burgundy focus:outline-none transition-colors lg:hidden -mr-1"
              aria-label="Ouvrir le menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Search Input Bar */}
      {searchOpen && (
        <div className="border-t border-sand-border bg-canvas/90 px-4 py-3">
          <div className="container-editorial">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-xl mx-auto">
              <input
                type="search"
                placeholder="Rechercher un rituel, eau de rose, sérum..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full text-xs font-sans py-2 px-3.5 bg-white border border-sand-border rounded focus:outline-none focus:border-burgundy"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-burgundy text-white text-[0.68rem] uppercase font-semibold tracking-editorial rounded hover:bg-burgundy-deep transition-colors shrink-0"
              >
                Chercher
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-2 text-charcoal/50 hover:text-charcoal"
                aria-label="Fermer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-sand-border bg-white px-6 py-6 flex flex-col gap-5 animate-in fade-in duration-150 shadow-md">
          <div className="flex justify-center pb-3 border-b border-sand-border/70">
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
              <img
                src="/images/logo.webp"
                alt="Aroma Rose"
                className="h-14 w-auto object-contain"
              />
            </Link>
          </div>
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm uppercase font-sans font-medium tracking-editorial text-charcoal hover:text-burgundy py-1"
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="pt-4 border-t border-sand-border flex flex-col gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded border border-sand-border text-xs uppercase tracking-editorial font-semibold text-charcoal"
            >
              <MessageCircle className="w-4 h-4 text-sage" />
              <span>Commander par WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
