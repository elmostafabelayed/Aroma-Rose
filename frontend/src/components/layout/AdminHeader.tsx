import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { Button } from '../common/Button';

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title = 'Tableau de bord',
  subtitle,
}) => {
  const { logout, isLoading } = useAuth();

  return (
    <header className="h-20 bg-white border-b border-sand-border px-8 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-xl font-serif font-medium text-charcoal tracking-wide">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-charcoal/50 font-sans tracking-wide mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => logout()}
          isLoading={isLoading}
          leftIcon={<LogOut className="w-3.5 h-3.5 text-charcoal/70" />}
        >
          Déconnexion
        </Button>
      </div>
    </header>
  );
};

