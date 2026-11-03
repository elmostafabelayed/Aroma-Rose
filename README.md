# Aroma Rose — Premium E-Commerce Platform

Aroma Rose is a luxury e-commerce platform dedicated to high-end Moroccan rose products, handcrafted and sourced from Kelaat M'Gouna (Valley of the Roses).

Reference: [Rosa M'Goun](https://www.rosamgoun.ma/)

---

## 1. Technical Stack

- **Database:** Supabase PostgreSQL (PostgreSQL 15+ / 16)
- **Backend:** Node.js (TypeScript) + Express.js (Mission 03)
- **Frontend:** React.js (Mission 04+)
- **Authentication:** Supabase Auth (for Admin and Staff dashboard operators)
- **Validation:** Zod Schema Validation
- **Storage:** Supabase Storage (for public product catalog images)
- **Payment Method in v1:** Cash on Delivery (COD)
- **Ordering Channels in v1:** Website Guest Checkout + Manual Admin WhatsApp Orders

---

## 2. Mission 02: Database Foundation

The database schema implements a high-integrity transactional ledger supporting 10 core entities, a finite state machine for order lifecycles, atomic inventory management, historical immutability, and zero-trust Row Level Security (RLS).

### Core Entities
1. `profiles`: Admin and staff accounts linked directly to Supabase Auth (`auth.users`).
2. `customers`: Customer contact and delivery records for Guest Checkout.
3. `categories`: Product categories with slugging and active status.
4. `products`: Catalog items with price, compare-at price, cost price, and live stock.
5. `product_images`: Image metadata pointing to Supabase Storage.
6. `orders`: Unified ledger for Website Guest Orders and WhatsApp Admin Orders.
7. `order_items`: Immutably snapshotted product and price records at order time.
8. `order_status_history`: Audit trail tracking every lifecycle transition.
9. `inventory_movements`: Stock journal recording every stock delta.
10. `audit_logs`: Administrative action audit log.

### Key Business & Security Invariants
- **No Stock Reservation Before Shipment:** Stock is deducted **only** when an order transitions to `shipped`.
- **Atomic Stock Deduction:** Sorted row-level locking (`FOR UPDATE`) prevents deadlocks and guarantees stock never goes negative under concurrent order shipments.
- **Full Rollback on Shortfall:** If any item in an order lacks sufficient stock during shipment, the entire transaction rolls back completely and the order remains in `processing`.
- **Shipped Item Immutability:** Order items for orders in `shipped`, `delivered`, or `cancelled` cannot be modified or deleted.
- **WhatsApp Order Attribution:** CHECK constraint guarantees that WhatsApp orders must record the authenticated admin/staff member who created them.
- **Row Level Security (RLS):** Enabled across all 10 tables. Public storefront visitors (`anon`) can only query active categories, active products, and active product images. All sensitive tables (`customers`, `orders`, `profiles`, `inventory`, `audit_logs`) are strictly inaccessible to `anon`.

---

## 3. Directory Layout

```
.
├── .env.example
├── .gitignore
├── README.md
├── docs/
│   ├── database.md         # Schema data dictionary, ERD, lifecycle, and security review
│   └── seed-plan.md        # Authentic Moroccan rose catalog taxonomy and seeding strategy
├── supabase/
│   └── migrations/
│       └── 20261103000100_initial_schema.sql  # Initial schema migration
└── tests/
    ├── 01_constraints_and_validation.sql      # Check constraints and validation tests
    ├── 02_order_lifecycle_transitions.sql     # State machine valid/invalid transitions
    ├── 03_stock_deduction_and_shipment.sql    # Atomic deduction and inventory movements
    ├── 04_insufficient_stock_rollback.sql     # Shortfall rejection and complete rollback
    ├── 05_shipped_order_items_immutability.sql# Shipped items update/delete prevention
    ├── 06_concurrency_stock_safety.sh         # Race condition and concurrency test
    ├── 07_rls_security_policies.sql           # Anonymous vs. Authenticated RLS isolation
    └── run_all_tests.sh                       # Automated test harness runner
```

---

## 4. Local Database Setup & Testing

### Prerequisites
- Docker or Supabase CLI
- bash & psql

### Step 1: Start PostgreSQL Test Instance
```bash
docker run -d \
  --name aroma_rose_test_db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=aroma_rose_test \
  -p 5433:5432 \
  postgres:16-alpine
```

### Step 2: Apply Database Migration
```bash
docker exec -i aroma_rose_test_db psql -U postgres -d aroma_rose_test -v ON_ERROR_STOP=1 < supabase/migrations/20261103000100_initial_schema.sql
```

### Step 3: Execute Automated Validation Test Suite
```bash
# 1. Run database foundation tests (Mission 02)
npm run test:db

# 2. Run API integration tests (Mission 03)
npm run test:api

# 3. Run all tests
npm test
```

### Step 4: Run the Backend Development Server
```bash
# Start server in watch mode with live reloading
npm run dev

# Or build and start production bundle
npm run build
npm start
```

---

## 6. REST API Endpoints Overview (/api/v1)

### Public Endpoints (Storefront)
| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health status check |
| `GET` | `/api/v1/products` | List active products (search, category, price, pagination) |
| `GET` | `/api/v1/products/:slug` | Single product details with image gallery |
| `GET` | `/api/v1/categories` | Active categories navigation tree |
| `POST` | `/api/v1/orders` | Guest checkout order placement (server-side price verification) |
| `GET` | `/api/v1/store/settings` | Store configuration, shipping rules, and payment methods |

### Admin Endpoints (Dashboard & Back-Office)
*All admin endpoints require `Authorization: Bearer <token>` and role check (`admin` or `staff`).*

| Method | Path | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/admin/auth/login` | Public | Staff & Admin authentication |
| `POST` | `/api/v1/admin/auth/logout` | Authenticated | Terminate session |
| `GET` | `/api/v1/admin/auth/me` | Authenticated | Current operator profile and role |
| `GET` | `/api/v1/admin/products` | Staff/Admin | Full catalog listing (active + drafts) |
| `POST` | `/api/v1/admin/products` | Staff/Admin | Create new catalog product |
| `GET` | `/api/v1/admin/products/:id` | Staff/Admin | Product details by UUID |
| `PATCH` | `/api/v1/admin/products/:id` | Staff/Admin | Update product fields |
| `DELETE` | `/api/v1/admin/products/:id` | Admin Only | Archive product (`is_active = false`) |
| `GET` | `/api/v1/admin/orders` | Staff/Admin | Filtered orders list (status, source, search) |
| `GET` | `/api/v1/admin/orders/:id` | Staff/Admin | Complete order details with items snapshot |
| `POST` | `/api/v1/admin/orders` | Staff/Admin | Create WhatsApp order manually |
| `PATCH` | `/api/v1/admin/orders/:id/status` | Staff/Admin | Advance order lifecycle (triggers stock deduction on `shipped`) |
| `PATCH` | `/api/v1/admin/orders/:id/notes` | Staff/Admin | Update administrative internal notes |
| `GET` | `/api/v1/admin/orders/:id/history` | Staff/Admin | Full chronological status change log |
| `GET` | `/api/v1/admin/customers` | Staff/Admin | Guest customers directory with spend metrics |
| `GET` | `/api/v1/admin/customers/:id` | Staff/Admin | Customer profile details |
| `GET` | `/api/v1/admin/customers/:id/orders` | Staff/Admin | Past order history for customer |
| `GET` | `/api/v1/admin/inventory` | Staff/Admin | Stock ledger and low-stock monitor |
| `GET` | `/api/v1/admin/inventory/movements` | Staff/Admin | Paginated immutable movement ledger |
| `POST` | `/api/v1/admin/inventory/adjustments` | Admin Only | Record manual stock adjustment |
| `GET` | `/api/v1/admin/dashboard/summary` | Staff/Admin | Revenue, active orders, and inventory KPIs |
| `GET` | `/api/v1/admin/dashboard/sales` | Admin Only | Daily/monthly revenue timeline & AOV |
| `GET` | `/api/v1/admin/dashboard/orders` | Staff/Admin | Orders distribution by status and source |
| `GET` | `/api/v1/admin/dashboard/inventory` | Staff/Admin | Critical low-stock & stockout alerts |

---

## 5. Security & Environment Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

> **CRITICAL SECURITY NOTE:**
> - `SUPABASE_ANON_KEY` is safe for browser exposure.
> - `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and must **NEVER** be exposed in the frontend or committed to source control. It is strictly reserved for the Node.js/Express backend server.

