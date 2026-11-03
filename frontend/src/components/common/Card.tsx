import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

export const Card: React.FC<CardProps> = ({ as: Component = 'div', className, children, ...props }) => {
  return (
    <Component
      className={cn(
        'bg-white border border-sand-border rounded p-6 shadow-subtle',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};
