import React from 'react';
import { cn } from '../../utils/cn';
import type { OrderStatus, PaymentStatus } from '../../types/order.types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'burgundy' | 'rose' | 'sand' | 'sage' | 'neutral' | 'success' | 'warning' | 'danger';
  status?: OrderStatus | PaymentStatus;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant,
  status,
  size = 'md',
  className,
  ...props
}) => {
  // If status is supplied, map to appropriate luxury styling
  let resolvedVariant = variant || 'default';
  let labelText = children;

  if (status) {
    switch (status) {
      case 'pending':
        resolvedVariant = 'sand';
        labelText = labelText || 'En attente';
        break;
      case 'confirmed':
        resolvedVariant = 'rose';
        labelText = labelText || 'Confirmée';
        break;
      case 'processing':
        resolvedVariant = 'neutral';
        labelText = labelText || 'En préparation';
        break;
      case 'shipped':
        resolvedVariant = 'burgundy';
        labelText = labelText || 'Expédiée';
        break;
      case 'delivered':
        resolvedVariant = 'sage';
        labelText = labelText || 'Livrée';
        break;
      case 'cancelled':
        resolvedVariant = 'danger';
        labelText = labelText || 'Annulée';
        break;
      case 'paid':
        resolvedVariant = 'sage';
        labelText = labelText || 'Payé (COD)';
        break;
      case 'failed':
        resolvedVariant = 'danger';
        labelText = labelText || 'Échoué';
        break;
      case 'refunded':
        resolvedVariant = 'neutral';
        labelText = labelText || 'Remboursé';
        break;
    }
  }

  const variantStyles = {
    default: 'bg-canvas text-charcoal border-sand-border',
    burgundy: 'bg-burgundy text-white border-burgundy',
    rose: 'bg-rose-soft text-burgundy border-rose/30',
    sand: 'bg-sand/30 text-charcoal border-sand-border',
    sage: 'bg-sage-soft text-sage-dark border-sage-border',
    neutral: 'bg-gray-100 text-charcoal/80 border-gray-200',
    success: 'bg-sage-soft text-sage-dark border-sage-border',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-soft text-red-900 border-red-200',
  };

  const sizeStyles = {
    sm: 'text-[0.62rem] px-2 py-0.5 tracking-editorial',
    md: 'text-[0.7rem] px-2.5 py-1 tracking-editorial',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-sans font-semibold uppercase rounded-sm border select-none',
        variantStyles[resolvedVariant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {labelText}
    </span>
  );
};
