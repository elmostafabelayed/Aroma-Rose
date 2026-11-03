import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Une erreur est survenue',
  message = "Nous n'avons pas pu charger les données. Veuillez réessayer ultérieurement.",
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-sand-border rounded max-w-lg mx-auto">
      <div className="w-12 h-12 rounded-full bg-rose-soft flex items-center justify-center text-burgundy mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-serif font-medium text-charcoal mb-2">{title}</h3>
      <p className="text-sm font-sans text-charcoal/70 mb-6">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Réessayer
        </Button>
      )}
    </div>
  );
};
