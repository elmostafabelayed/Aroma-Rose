# Aroma Rose — Complete QA Test Inventory (Mission 07)

**Application:** Aroma Rose (E-Commerce Web Application)
**Architecture:** React 18 (Vite SPA) + Node.js Express REST API + PostgreSQL 16 / Supabase Cloud
**Audit Date:** 2026-11-07
**Lead QA:** Principal Application Security Engineer & Lead Full-Stack QA Engineer

---

## 1. Application Architecture & Inventory Overview

The Aroma Rose application is composed of two primary subsystems:
1. **Storefront (Customer Journey):** High-touch luxury Moroccan Rose e-commerce catalog, responsive storytelling, persistent local cart, and frictionless guest Cash on Delivery (COD) checkout.
2. **Back-Office / Admin Portal (Operator Journey):** Executive KPIs, order lifecycle management, manual phone/WhatsApp order intake, COD remittance reconciliation, inventory ledger movements, catalog & product media manager, customer analytics, Moroccan tax/timezone reports, and store configuration.

---

## 2. Frontend Routes Inventory

| Route | Page Component | Access Level | Layout | Primary Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `HomePage` | Public | `StorefrontLayout` | Brand Hero, Terroir highlights, featured products, benefit badges |
| `/shop` | `ShopPage` | Public | `StorefrontLayout` | Full product catalog with category pills filter and empty state |
| `/products` | `ShopPage` | Public | `StorefrontLayout` | Alias route for `/shop` |
| `/shop/:slug` | `ProductDetailPage` | Public | `StorefrontLayout` | Product details, gallery switching, stock badge, quantity selector, add to cart |
| `/products/:slug` | `ProductDetailPage` | Public | `StorefrontLayout` | Alias route for `/shop/:slug` |
| `/cart` | `CartPage` | Public | `StorefrontLayout` | Cart item management, price subtotal, free shipping threshold bar, checkout CTA |
| `/checkout` | `CheckoutPage` | Public | `StorefrontLayout` | Guest checkout form, Moroccan phone validation, city & address, COD explanation |
| `/order-confirmation/:orderId` | `OrderConfirmationPage` | Public | `StorefrontLayout` | Order success, order reference `AR-YYYYMMDD-XXXX`, WhatsApp confirmation button |
| `/about` | `AboutPage` | Public | `StorefrontLayout` | Brand heritage, artisan distillery story from Kelaat M'Gouna |
| `/terroir` | `TerroirPage` | Public | `StorefrontLayout` | Valley of Roses geographical and botanical terroir information |
| `/distillation` | `DistillationPage` | Public | `StorefrontLayout` | Steam distillation artisan process documentation |
| `/contact` | `ContactPage` | Public | `StorefrontLayout` | Customer care contacts, WhatsApp link, physical address |
| `/shipping` | `ShippingPolicyPage` | Public | `StorefrontLayout` | Delivery timelines (24-48h Morocco), flat fee (30 MAD), free shipping threshold (300 MAD) |
| `/terms` | `TermsPage` | Public | `StorefrontLayout` | Legal terms of service and Cash on Delivery purchase terms |
| `/privacy` | `PrivacyPage` | Public | `StorefrontLayout` | Privacy policy and personal data protection principles |
| `/404` | `NotFoundPage` | Public | `StorefrontLayout` | Custom luxury 404 error page with return to home CTA |
| `/admin/login` | `AdminLoginPage` | Public (Unauth) | Independent | Admin/Staff credentials form with token assignment |
| `/admin` | `AdminDashboardPage` | Protected (`admin`, `staff`) | `AdminLayout` | Executive summary, sales KPI cards, orders breakdown, low stock alerts |
| `/admin/orders` | `AdminOrdersListPage` | Protected (`admin`, `staff`) | `AdminLayout` | Paginated orders table, status filters, search by phone/number, WhatsApp modal |
| `/admin/orders/:id` | `AdminOrderDetailPage` | Protected (`admin`, `staff`) | `AdminLayout` | Order detail, customer history, status transition modal, COD payment reconciliation |
| `/admin/products` | `AdminProductsListPage` | Protected (`admin`, `staff`) | `AdminLayout` | Product catalog management, active/draft toggle, SKU, stock indicator, create CTA |
| `/admin/products/new` | `AdminProductCreatePage` | Protected (`admin`, `staff`) | `AdminLayout` | Create product form, category assignment, price, stock, image upload gallery |
| `/admin/products/:id` | `AdminProductEditPage` | Protected (`admin`, `staff`) | `AdminLayout` | Update product, change price/stock, add/delete/reorder images, archive product |
| `/admin/inventory` | `AdminInventoryOverviewPage` | Protected (`admin`, `staff`) | `AdminLayout` | Stock levels, threshold alerts (<10 units), manual adjustment modal (Admin only) |
| `/admin/inventory/movements` | `AdminInventoryMovementsPage` | Protected (`admin`, `staff`) | `AdminLayout` | Immutable audit ledger of all stock additions, deductions, shipments |
| `/admin/customers` | `AdminCustomersPage` | Protected (`admin`, `staff`) | `AdminLayout` | Customer directory, total spent, order counts, VIP/Repeat badges |
| `/admin/customers/:id` | `AdminCustomerDetailPage` | Protected (`admin`, `staff`) | `AdminLayout` | Customer profile, contact information, lifetime order history, order linking |
| `/admin/reports` | `AdminReportsPage` | Protected (`admin` only) | `AdminLayout` | Business intelligence, sales timelines, COD remittance reports, CSV export |
| `/admin/settings` | `AdminSettingsPage` | Protected (`admin`, `staff` read-only) | `AdminLayout` | Store name, shipping fees, free shipping threshold, COD toggle, store status |
| `/admin/unauthorized` | `AdminUnauthorizedPage` | Protected (Logged-in) | `AdminLayout` | Access denied 403 page when staff accesses admin-only areas |

---

## 3. Reusable UI Components & Interactivity Inventory

### 3.1 Common Primitives
- **`Button` (`components/common/Button.tsx`):**
  - Variants: `primary` (emerald-900), `secondary`, `outline`, `ghost`, `danger`.
  - Sizes: `sm`, `md`, `lg`.
  - States: `loading` (with inline Spinner), `disabled`, interactive hover/focus rings.
- **`Input` (`components/common/Input.tsx`):**
  - Standard text input, phone, number, email with error label and helper text.
- **`Card` (`components/common/Card.tsx`):**
  - Container with luxury borders, padding, hover transitions.
- **`Badge` (`components/common/Badge.tsx`):**
  - French status translations with dedicated color coding (Pending: Amber, Confirmed: Blue, Processing: Indigo, Shipped: Purple, Delivered: Emerald, Cancelled: Rose).
- **`Spinner` (`components/common/Spinner.tsx`):**
  - SVG loading indicator.

### 3.2 Feedback & State Components
- **`EmptyState` (`components/feedback/EmptyState.tsx`):** Illustrated empty states for catalog, cart, orders, and search results.
- **`ErrorState` (`components/feedback/ErrorState.tsx`):** Recovery state with retry action button.
- **`ToastContext` (`context/ToastContext.tsx`):** Flash notification toasts for success, error, info across storefront and admin.

### 3.3 Interactive Modals & Dialogs
- **`CreateWhatsAppOrderModal`:** Manual order entry by admin/staff with phone normalization and instant item price calculation.
- **`OrderStatusTransitionModal`:** Enforces the strict valid state machine (e.g. Blocks `pending -> shipped`, permits `processing -> shipped`).
- **`StockAdjustmentModal`:** Admin-only manual inventory correction modal with reasons and positive/negative delta inputs.
- **`ProductImageManager`:** Multi-image file uploader, drag-to-order, primary badge toggle, and safe deletion.

---

## 4. Backend REST API Endpoints Inventory

### 4.1 Public Storefront Endpoints (`/api/v1/`)
- `GET /health` — Liveness & readiness check (`status: healthy`, `timestamp`, `service`).
- `GET /store/settings` — Safe public store configuration (name, currency, shipping fees, COD status, open/closed).
- `GET /categories` — Active category taxonomy list.
- `GET /products` — Active product catalog list with search, category filtering, and pagination.
- `GET /products/:slug` — Single active product detail by slug with full CDN image gallery.
- `POST /orders` — Guest checkout Cash on Delivery order creation (rate-limited, server-side pricing).

### 4.2 Administrative Protected Endpoints (`/api/v1/admin/`)
- **Authentication:**
  - `POST /admin/auth/login` — Operator credentials login (rate-limited, issues JWT / Supabase session).
  - `POST /admin/auth/logout` — Invalidate current operator session.
  - `GET /admin/auth/me` — Resolve current operator profile and RBAC role (`admin` vs `staff`).
- **Products:**
  - `GET /admin/products` — Operator product listing (active and draft).
  - `POST /admin/products` — Create new catalog item.
  - `GET /admin/products/:id` — Product detail by UUID.
  - `PATCH /admin/products/:id` — Update product details, prices, stock, active status.
  - `POST /admin/products/upload-image` — Upload product photo (magic number verified, 5MB limit).
  - `POST /admin/products/delete-image` — Delete product photo from Supabase Storage.
  - `DELETE /admin/products/:id` — Admin-only product deletion/archive.
- **Orders:**
  - `GET /admin/orders` — Orders list with query filters (status, source, search, date range).
  - `GET /admin/orders/:id` — Order detail with items snapshot, payment status, history.
  - `POST /admin/orders` — Intake manual WhatsApp/phone orders (records operator creator).
  - `PATCH /admin/orders/:id/status` — State machine transition update.
  - `POST /admin/orders/:id/reconcile-payment` — Admin-only COD cash remittance reconciliation.
  - `PATCH /admin/orders/:id/notes` — Internal administrative order notes update.
  - `GET /admin/orders/:id/history` — Audit trail of order status changes.
- **Customers:**
  - `GET /admin/customers` — Customer directory with order counts and spent aggregation.
  - `GET /admin/customers/:id` — Single customer profile.
  - `GET /admin/customers/:id/orders` — Order history for specific customer.
- **Inventory:**
  - `GET /admin/inventory` — Stock levels, threshold indicators (< 10 units).
  - `GET /admin/inventory/movements` — Immutable inventory movements ledger.
  - `POST /admin/inventory/adjustments` — Admin-only manual inventory correction.
- **Dashboard:**
  - `GET /admin/dashboard/summary` — High-level sales, gross value, collected revenue, in-transit.
  - `GET /admin/dashboard/sales` — Daily sales time series (Admin only).
  - `GET /admin/dashboard/orders` — Orders breakdown by status and acquisition channel.
  - `GET /admin/dashboard/inventory` — Inventory status cards (healthy, low, out).
- **Settings:**
  - `GET /admin/settings` — Complete store settings (Admin and Staff).
  - `PUT /admin/settings` — Update store settings (Admin only).
- **Reports (Admin Only):**
  - `GET /admin/reports/summary` — BI executive summary.
  - `GET /admin/reports/sales` — Sales trends.
  - `GET /admin/reports/orders` — Order volume and cancellation rates.
  - `GET /admin/reports/products` — Product performance and volume.
  - `GET /admin/reports/categories` — Category attribution.
  - `GET /admin/reports/collections` — COD collection vs pending remittance audit.
  - `GET /admin/reports/customers` — New vs repeat customer acquisition.
  - `GET /admin/reports/delivery` — Delivery performance.
  - `GET /admin/reports/export` — Streamed CSV export of administrative reports.

---

## 5. Database Schema & Relational Model

```
 public.profiles (Admin/Staff operators)
       │
       ├─ (created_by_profile_id) ──────┐
       │                                ▼
 public.customers ──(customer_id)──► public.orders ◄──(order_id)── public.order_items
                                        │                           │
                                        ├─(order_id)                └─(product_id)──┐
                                        │      ▼                                    ▼
                                        ├─► public.order_status_history      public.products ◄──(category_id)── public.categories
                                        │                                           ▲
                                        └─► public.inventory_movements ─────────────┤
                                                                                    │
                                                                             public.product_images
```

### Table Relationships & Key Constraints:
1. `public.orders.chk_order_total_match`: `total_amount = (subtotal + shipping_fee)`.
2. `public.orders.chk_whatsapp_order_creator`: `order_source <> 'whatsapp' OR created_by_profile_id IS NOT NULL`.
3. `public.order_items.chk_order_item_total_match`: `total_price = (unit_price * quantity)`.
4. `public.products.chk_product_price_positive`: `price >= 0`, `compare_at_price >= price`.
5. `public.products.stock_quantity >= 0`: Enforces non-negative stock invariants.
6. `public.inventory_movements`: Immutable append-only ledger; updates and deletes prohibited.
7. `public.store_settings`: Single-key JSONB configuration store with RLS restrictions.

---

## 6. Security Boundaries & RBAC Matrix

| Capability / Resource | Anonymous Guest | Staff Role | Admin Role |
| :--- | :---: | :---: | :---: |
| Browse Catalog & Categories | Allowed | Allowed | Allowed |
| Place Guest COD Order | Allowed | Allowed | Allowed |
| View Public Store Settings | Allowed | Allowed | Allowed |
| Admin Login | Allowed | Allowed | Allowed |
| View Admin Dashboard Summary | Denied (401) | Allowed | Allowed |
| View Financial Sales Trends (`/dashboard/sales`) | Denied (401) | Denied (403) | Allowed |
| View Orders & Customer Details | Denied (401) | Allowed | Allowed |
| Update Order Lifecycle Status | Denied (401) | Allowed | Allowed |
| Reconcile COD Cash Remittance | Denied (401) | **Denied (403)** | **Allowed** |
| Create / Update Catalog Products | Denied (401) | Allowed | Allowed |
| Delete Catalog Products | Denied (401) | **Denied (403)** | **Allowed** |
| Adjust Inventory Quantities | Denied (401) | **Denied (403)** | **Allowed** |
| View Store Configuration | Denied (401) | Allowed | Allowed |
| Modify Store Configuration | Denied (401) | **Denied (403)** | **Allowed** |
| View Business Intelligence Reports | Denied (401) | **Denied (403)** | **Allowed** |
| Export Analytical CSV Reports | Denied (401) | **Denied (403)** | **Allowed** |

---

## 7. Known Automation Test Scope & Non-Blocking Limitations

The following administrative mutation workflows are fully covered and verified by the 15 backend API integration suites and PostgreSQL database constraint triggers, but are not automated as interactive browser E2E tests:

1. **Product Creation Form Submission (`/admin/products/new`):**
   - E2E Scope: Admin navigation to portal is automated; interactive form submission is verified via API Suite 10.
2. **Product Edit Form Submission (`/admin/products/:id`):**
   - E2E Scope: Catalog list view is verified in browser; edit form update is verified via API Suite 11.
3. **Stock Adjustment Modal Submission (`/admin/inventory`):**
   - E2E Scope: Inventory table and movements ledger navigation is verified in browser; modal submission is verified via API Suite 8.
4. **WhatsApp Manual Intake Modal Submission (`/admin/orders`):**
   - E2E Scope: Trigger button presence is verified in browser; modal order creation is verified via API Suite 5.
5. **Customer Detail Page (`/admin/customers/:id`):**
   - E2E Scope: Admin portal core pages (Dashboard, Orders, Inventory, Settings, Reports) are verified in browser; customer detail query is verified via API Suites 13 & 14.
