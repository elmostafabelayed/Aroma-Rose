import React from 'react';
import { Outlet } from 'react-router-dom';
import { StorefrontHeader } from '../components/layout/StorefrontHeader';
import { StorefrontFooter } from '../components/layout/StorefrontFooter';

export const StorefrontLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-charcoal">
      <StorefrontHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <StorefrontFooter />
    </div>
  );
};
