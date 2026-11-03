import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Users,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { Badge } from '../common/Badge';
import { cn } from '../../utils/cn';

export const AdminSidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { label: 'Vue d’ensemble', to: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Commandes', to: '/admin/orders', icon: ShoppingBag },
    { label: 'Produits', to: '/admin/products', icon: Package },
    { label: 'Inventaire', to: '/admin/inventory', icon: Layers },
    { label: 'Clients', to: '/admin/customers', icon: Users },
  ];

  return (
    <aside className="w-64 bg-white border-r border-sand-border flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-20 flex items-center gap-3 px-5 border-b border-sand-border">
        <img
          src="/images/logo.webp"
          alt="Aroma Rose"
          className="h-11 w-auto object-contain"
        />
        <div className="flex flex-col">
          <span className="font-serif text-sm tracking-[0.12em] font-medium text-burgundy">
            AROMA ROSE
          </span>
          <span className="text-[0.58rem] uppercase tracking-editorial text-charcoal/50 font-sans font-semibold">
            Console d’admin
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5">
        <span className="px-3 pb-2 text-[0.65rem] uppercase font-semibold tracking-editorial text-charcoal/40 font-sans">
          Menu Principal
        </span>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
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

      {/* External Link to Storefront */}
      <div className="px-4 py-3 border-t border-sand-border/70">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 text-xs font-sans text-charcoal/60 hover:text-burgundy transition-colors"
        >
          <span className="text-[0.68rem] uppercase tracking-editorial">Voir la boutique</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Operator User Profile Info */}
      <div className="p-4 border-t border-sand-border bg-canvas/60">
        <div className="flex items-center justify-between">
          <div className="flex flex-col truncate">
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
            className="shrink-0"
          >
            {user?.role}
          </Badge>
        </div>
      </div>
    </aside>
  );
};

