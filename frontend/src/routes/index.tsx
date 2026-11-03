import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { StorefrontLayout } from '../layouts/StorefrontLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { ProtectedRoute } from '../auth/ProtectedRoute';

// Public Storefront Pages (Mission 05A)
import { HomePage } from '../pages/storefront/HomePage';
import { ShopPage } from '../pages/storefront/ShopPage';
import { ProductDetailPage } from '../pages/storefront/ProductDetailPage';
import { CartPage } from '../pages/storefront/CartPage';
import { CheckoutPage } from '../pages/storefront/CheckoutPage';
import { OrderConfirmationPage } from '../pages/storefront/OrderConfirmationPage';
import { AboutPage } from '../pages/storefront/AboutPage';
import { TerroirPage } from '../pages/storefront/TerroirPage';
import { DistillationPage } from '../pages/storefront/DistillationPage';
import { ContactPage } from '../pages/storefront/ContactPage';
import { ShippingPolicyPage } from '../pages/storefront/ShippingPolicyPage';
import { TermsPage } from '../pages/storefront/TermsPage';
import { PrivacyPage } from '../pages/storefront/PrivacyPage';
import { NotFoundPage } from '../pages/storefront/NotFoundPage';

// Admin Pages
import { AdminLoginPage } from '../pages/admin/AdminLoginPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminUnauthorizedPage } from '../pages/admin/AdminUnauthorizedPage';

// Mission 05B Admin Placeholder
const AdminMissionPlaceholder: React.FC<{ title: string; section: string }> = ({ title, section }) => (
  <div className="py-20 text-center max-w-md mx-auto">
    <span className="label-editorial text-burgundy mb-2">{section}</span>
    <h2 className="text-2xl font-serif text-charcoal mb-2">{title}</h2>
    <p className="text-xs text-charcoal/60 font-sans leading-relaxed">
      Cette interface d'administration sera finalisée dans la Mission 05B.
    </p>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* =========================================================================
          1. Public Storefront Routes (Customer Experience)
         ========================================================================= */}
      <Route path="/" element={<StorefrontLayout />}>
        <Route index element={<HomePage />} />
        
        {/* Catalog routes (supports both /shop and /products) */}
        <Route path="shop" element={<ShopPage />} />
        <Route path="products" element={<ShopPage />} />
        
        {/* Product Details */}
        <Route path="shop/:slug" element={<ProductDetailPage />} />
        <Route path="products/:slug" element={<ProductDetailPage />} />
        
        {/* Shopping Cart & Guest Checkout */}
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="order-confirmation/:orderId" element={<OrderConfirmationPage />} />
        
        {/* Brand & Terroir Storytelling */}
        <Route path="about" element={<AboutPage />} />
        <Route path="terroir" element={<TerroirPage />} />
        <Route path="distillation" element={<DistillationPage />} />
        <Route path="contact" element={<ContactPage />} />

        {/* Customer Service & Policies */}
        <Route path="shipping" element={<ShippingPolicyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        
        {/* Fallbacks */}
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
          element={<AdminMissionPlaceholder title="Gestion des Commandes & Expéditions" section="Commandes" />}
        />
        <Route
          path="products"
          element={<AdminMissionPlaceholder title="Gestion du Catalogue & Tarifs" section="Produits" />}
        />
        <Route
          path="inventory"
          element={<AdminMissionPlaceholder title="Mouvements de Stock & Ajustements" section="Inventaire" />}
        />
        <Route
          path="customers"
          element={<AdminMissionPlaceholder title="Répertoire Clients & Historique" section="Clients" />}
        />
        <Route path="unauthorized" element={<AdminUnauthorizedPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};
