import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ShoppingBag, Search, Menu, X, MessageCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export const StorefrontHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Catalogue', to: '/products' },
    { label: 'Notre Histoire', to: '/about' },
    { label: 'Le Terroir de Kelaat M’Gouna', to: '/terroir' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-sand-border">
      {/* Editorial Announcement Bar */}
      <div className="bg-burgundy text-white py-1.5 px-4 text-center">
        <p className="text-[0.68rem] uppercase tracking-editorial font-medium">
          Livraison offerte partout au Maroc à partir de 300 MAD • Paiement à la livraison
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
              href="https://wa.me/212600000000?text=Bonjour,%20je%20souhaite%20commander%20des%20produits%20Aroma%20Rose"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-[0.68rem] tracking-editorial font-semibold uppercase px-3 py-1.5 rounded border border-sand-border text-charcoal hover:text-burgundy hover:border-burgundy transition-colors"
              title="Commander directement sur WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>WhatsApp</span>
            </a>

            {/* Search Icon */}
            <button
              type="button"
              className="p-2 text-charcoal/80 hover:text-burgundy transition-colors"
              aria-label="Rechercher un soin"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Shopping Bag */}
            <Link
              to="/cart"
              className="relative p-2 text-charcoal/80 hover:text-burgundy transition-colors"
              aria-label="Panier d'achat"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-burgundy text-white text-[0.6rem] font-sans font-semibold flex items-center justify-center">
                0
              </span>
            </Link>
          </div>
        </div>
      </div>

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
              href="https://wa.me/212600000000"
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
