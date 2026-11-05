import React from 'react';
import { Menu, LogOut, ChevronRight, User } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { formatUserRole } from '../../utils/formatters';

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  onOpenMobileNav?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title = 'Tableau de bord',
  subtitle,
  onOpenMobileNav,
}) => {
  const { user, logout, isLoading } = useAuth();

  return (
    <header className="h-20 bg-white border-b border-sand-border px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
      {/* Left Column: Mobile Hamburger + Breadcrumb + Title */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        {/* Mobile menu drawer trigger */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 -ml-2 rounded text-charcoal/70 hover:text-burgundy hover:bg-canvas transition-colors"
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col min-w-0">
          {/* Editorial Breadcrumbs */}
          <nav
            aria-label="Fil d'Ariane"
            className="flex items-center gap-1.5 text-[0.68rem] text-charcoal/50 font-sans uppercase tracking-editorial"
          >
            <span>Console</span>
            <ChevronRight className="w-3 h-3 text-sand" />
            <span className="text-burgundy font-semibold truncate">{title}</span>
          </nav>

          <h1 className="text-lg sm:text-xl font-serif font-medium text-charcoal tracking-wide truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden md:block text-xs text-charcoal/50 font-sans tracking-wide mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Column: User Identity + Logout Button */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Current user badge (hidden on small mobile screens to save space) */}
        <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded bg-canvas border border-sand-border/70 text-xs font-sans">
          <div className="w-6 h-6 rounded-full bg-burgundy/10 text-burgundy flex items-center justify-center font-medium text-[0.7rem]">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-charcoal max-w-[130px] truncate">
            {user?.full_name || 'Opérateur'}
          </span>
          <Badge
            variant={user?.role === 'admin' ? 'burgundy' : 'neutral'}
            size="sm"
            className="text-[0.6rem] px-1.5 py-0.2"
          >
            {formatUserRole(user?.role)}
          </Badge>
        </div>

        {/* Logout Action */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => logout()}
          isLoading={isLoading}
          leftIcon={<LogOut className="w-3.5 h-3.5 text-charcoal/70" />}
          className="text-xs hover:text-burgundy font-medium"
        >
          <span className="hidden sm:inline">Déconnexion</span>
        </Button>
      </div>
    </header>
  );
};
