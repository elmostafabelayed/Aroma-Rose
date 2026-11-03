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
          Livraison offerte au Maroc dès {freeThreshold} MAD • Paiement à la livraison (COD)
        </p>
      </div>

      {/* Main Header Container */}
      <div className="container-editorial">
        <div className="flex items-center justify-between h-20 md:h-24">
          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-charcoal hover:text-burgundy focus:outline-none"
              aria-label="Ouvrir le menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Desktop Left Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    'text-[0.75rem] uppercase font-sans font-medium tracking-editorial transition-colors duration-150',
                    isActive ? 'text-burgundy border-b border-burgundy pb-0.5' : 'text-charcoal/80 hover:text-burgundy'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Center Brand Identity */}
          <div className="flex flex-col items-center justify-center text-center">
            <Link to="/" className="group flex flex-col items-center">
              <span className="font-serif text-2xl md:text-3xl tracking-[0.12em] font-medium text-burgundy transition-transform group-hover:scale-[1.01]">
                AROMA ROSE
              </span>
              <span className="text-[0.58rem] tracking-[0.25em] text-charcoal/60 uppercase font-sans -mt-0.5">
                Maison Botanique • Kelaat M'Gouna
              </span>
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* WhatsApp Direct Order Shortcut */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-[0.68rem] tracking-editorial font-semibold uppercase px-3 py-1.5 rounded border border-sand-border text-charcoal hover:text-burgundy hover:border-burgundy transition-colors"
              title="Conseil & commande par WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
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
        <div className="lg:hidden border-t border-sand-border bg-white px-6 py-6 flex flex-col gap-5 animate-in fade-in duration-150">
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
              <MessageCircle className="w-4 h-4 text-emerald-700" />
              <span>Commander par WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
