import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from '../common/Button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Aucun élément trouvé',
  description = 'Il n’y a aucun contenu à afficher pour le moment.',
  icon,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-sand-border rounded max-w-lg mx-auto">
      <div className="w-14 h-14 rounded-full bg-sand/30 flex items-center justify-center text-charcoal/50 mb-4">
        {icon || <PackageOpen className="w-7 h-7" />}
      </div>
      <h3 className="text-lg font-serif font-medium text-charcoal mb-1.5">{title}</h3>
      <p className="text-sm font-sans text-charcoal/60 mb-6 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

