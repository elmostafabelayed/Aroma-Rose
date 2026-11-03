import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { StorefrontLayout } from '../layouts/StorefrontLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { ProtectedRoute } from '../auth/ProtectedRoute';

// Public Pages
import { HomePage } from '../pages/storefront/HomePage';
import { NotFoundPage } from '../pages/storefront/NotFoundPage';

// Admin Pages
import { AdminLoginPage } from '../pages/admin/AdminLoginPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminUnauthorizedPage } from '../pages/admin/AdminUnauthorizedPage';

// Placeholder view for upcoming Mission 05 screens
const MissionPlaceholder: React.FC<{ title: string; mission: string }> = ({ title, mission }) => (
  <div className="py-20 text-center max-w-md mx-auto">
    <span className="label-editorial text-burgundy mb-2">{mission}</span>
    <h2 className="text-2xl font-serif text-charcoal mb-2">{title}</h2>
    <p className="text-xs text-charcoal/60 font-sans leading-relaxed">
      Cette interface sera pleinement développée dans la Mission 05 conformément à l'architecture établie.
    </p>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* =========================================================================
          1. Public Storefront Routes
         ========================================================================= */}
      <Route path="/" element={<StorefrontLayout />}>
        <Route index element={<HomePage />} />
        <Route
          path="products"
          element={<MissionPlaceholder title="Catalogue Botanique Complet" mission="Mission 05 — Storefront" />}
        />
        <Route
          path="products/:slug"
          element={<MissionPlaceholder title="Fiche Rituel & Détails Soin" mission="Mission 05 — Storefront" />}
        />
        <Route
          path="cart"
          element={<MissionPlaceholder title="Panier & Commande Express COD" mission="Mission 05 — Storefront" />}
        />
        <Route
          path="about"
          element={<MissionPlaceholder title="La Maison Aroma Rose" mission="Histoire & Savoir-faire" />}
        />
        <Route
          path="terroir"
          element={<MissionPlaceholder title="Le Terroir de Kelaat M'Gouna" mission="Origine &cueillette" />}
        />
        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* =========================================================================
          2. Admin Authentication Route
         ========================================================================= */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* =========================================================================
          3. Protected Admin Dashboard Routes
         ========================================================================= */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route
          path="orders"
          element={<MissionPlaceholder title="Gestion des Commandes & Expédition" mission="Mission 05 — Admin" />}
        />
        <Route
          path="products"
          element={<MissionPlaceholder title="Gestion du Catalogue & Tarifs" mission="Mission 05 — Admin" />}
        />
        <Route
          path="inventory"
          element={<MissionPlaceholder title="Mouvements de Stock & Ajustements" mission="Mission 05 — Admin" />}
        />
        <Route
          path="customers"
          element={<MissionPlaceholder title="Répertoire Clients & Historique" mission="Mission 05 — Admin" />}
        />
        <Route path="unauthorized" element={<AdminUnauthorizedPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};
