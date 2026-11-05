import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Users,
  ExternalLink,
  X,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { Badge } from '../common/Badge';
import { formatUserRole } from '../../utils/formatters';
import { cn } from '../../utils/cn';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen = false, onClose }) => {
  const { user } = useAuth();

  const navItems = [
    {
      label: 'Tableau de bord',
      to: '/admin',
      icon: LayoutDashboard,
      exact: true,
      active: true,
    },
    {
      label: 'Commandes',
      to: '/admin/orders',
      icon: ShoppingBag,
      active: true,
    },
    {
      label: 'Produits',
      to: '/admin/products',
      icon: Package,
      active: true,
    },
    {
      label: 'Gestion du stock',
      to: '/admin/inventory',
      icon: Layers,
      active: true,
    },
    {
      label: 'Clients',
      to: '/admin/customers',
      icon: Users,
      active: false,
      badgeText: 'Phase 3',
    },
  ];

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-sand-border flex flex-col shrink-0 select-none transition-transform duration-300 ease-in-out',
        'lg:static lg:w-64 lg:translate-x-0',
        isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      )}
      aria-label="Navigation latérale d'administration"
    >
      {/* Brand & Mobile Close Header */}
      <div className="h-20 flex items-center justify-between px-5 border-b border-sand-border">
        <div className="flex items-center gap-3">
          <img
            src="/images/logo.webp"
            alt="Aroma Rose"
            className="h-10 w-auto object-contain"
          />
          <div className="flex flex-col">
            <span className="font-serif text-sm tracking-[0.14em] font-medium text-burgundy">
              AROMA ROSE
            </span>
            <span className="text-[0.6rem] uppercase tracking-editorial text-charcoal/50 font-sans font-semibold">
              Console d’administration
            </span>
          </div>
        </div>

        {/* Mobile close drawer button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 rounded text-charcoal/60 hover:text-burgundy hover:bg-canvas transition-colors"
            aria-label="Fermer le menu de navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
        <span className="px-3 pb-2 text-[0.65rem] uppercase font-semibold tracking-editorial text-charcoal/40 font-sans">
          Menu Principal
        </span>

        {navItems.map((item) => {
          const Icon = item.icon;

          if (!item.active) {
            // Disabled nav item for modules coming in later phases
            return (
              <div
                key={item.label}
                className="flex items-center justify-between px-3 py-2.5 rounded text-xs font-sans font-medium uppercase tracking-editorial text-charcoal/40 bg-transparent cursor-not-allowed select-none group"
                title={`${item.label} — Prévu pour les phases ultérieures`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0 opacity-40" />
                  <span>{item.label}</span>
                </div>
                {item.badgeText && (
                  <span className="text-[0.58rem] tracking-wide px-1.5 py-0.5 rounded bg-sand/30 text-charcoal/60 border border-sand-border/50 font-semibold lowercase first-letter:uppercase flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5 opacity-60" />
                    {item.badgeText}
                  </span>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={() => onClose?.()}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded text-xs font-sans font-medium uppercase tracking-editorial transition-colors',
                  isActive
                    ? 'bg-rose-soft text-burgundy font-semibold border-l-2 border-burgundy'
                    : 'text-charcoal/70 hover:bg-canvas hover:text-burgundy'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* External Link to Public Storefront */}
      <div className="px-4 py-3 border-t border-sand-border/70">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 text-xs font-sans text-charcoal/60 hover:text-burgundy hover:bg-canvas rounded transition-colors"
        >
          <span className="text-[0.68rem] uppercase tracking-editorial font-medium">
            Voir la boutique
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-charcoal/40" />
        </a>
      </div>

      {/* Operator User Profile Info */}
      <div className="p-4 border-t border-sand-border bg-canvas/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-burgundy/10 border border-burgundy/20 text-burgundy font-serif font-semibold text-xs flex items-center justify-center shrink-0">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-charcoal truncate font-sans">
              {user?.full_name || 'Opérateur'}
            </span>
            <span className="text-[0.65rem] text-charcoal/50 truncate font-sans">
              {user?.email}
            </span>
          </div>
          <Badge
            variant={user?.role === 'admin' ? 'burgundy' : 'neutral'}
            size="sm"
            className="shrink-0 text-[0.6rem] px-2 py-0.5"
          >
            {formatUserRole(user?.role)}
          </Badge>
        </div>
      </div>
    </aside>
  );
};
