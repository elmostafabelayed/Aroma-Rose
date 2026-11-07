# Aroma Rose — Mission 07: Bug Register & Vulnerability Defect Log

**Date:** 2026-11-07
**Auditor:** Principal QA Automation & Application Security Lead
**Scope:** Storefront, Admin Console, Backend APIs, PostgreSQL Database, Security & Mobile Responsiveness
**Target Release:** Production Launch (Railway + Vercel + Supabase)

---

## 1. Executive Summary of Findings

During the complete end-to-end quality assurance audit of Aroma Rose, all application layers were systematically inspected, exercised with automated and manual test fixtures, and verified under real browser automation.

A total of **7 defects and operational findings** were cataloged, categorized by severity:
- **P0 (Critical):** 1 (Remediated before release)
- **P1 (High):** 2 (Remediated before release)
- **P2 (Medium):** 2 (Remediated / Configured)
- **P3 (Low / Operational):** 2 (Documented with launch recommendations)

---

## 2. Defect Matrix

| Bug ID | Severity | Area | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| **BUG-001** | **P0 (Critical)** | Security / Auth | Insecure default `JWT_SECRET` in `src/config/env.ts` | **RESOLVED & VERIFIED** |
| **BUG-002** | **P1 (High)** | Database / Orders | PostgreSQL transaction abort in `OrdersService.reconcileCodPayment` | **RESOLVED & VERIFIED** |
| **BUG-003** | **P1 (High)** | Backend / Auth | Local auth test fallback blocked when Supabase Cloud rejects test domain | **RESOLVED & VERIFIED** |
| **BUG-004** | **P2 (Medium)** | Frontend / API | Trailing slash duplication and SSR failure in `ApiClient.buildUrl` | **RESOLVED & VERIFIED** |
| **BUG-005** | **P2 (Medium)** | Middleware / Rate Limiter | IP rate limit exceeded during automated test runs | **RESOLVED & CONFIGURED** |
| **BUG-006** | **P3 (Low)** | Cloud Storage | Live image upload dependency on external Supabase network endpoint | **DOCUMENTED LIMITATION** |
| **BUG-007** | **P3 (Low)** | Performance / Bundle | Single vendor JS bundle exceeding 500 kB (749 kB uncompressed) | **OPTIMIZATION RECOMMENDATION** |

---

## 3. Detailed Bug Reports

### BUG-001: Insecure Hardcoded `JWT_SECRET` Default in Environment Schema
- **Severity:** P0 — Critical Security Vulnerability
- **Component:** `src/config/env.ts`, `src/middleware/auth.ts`
- **Discovered In:** Pre-Release Security Audit
- **Root Cause:**
  `src/config/env.ts` defined `JWT_SECRET: z.string().default('aroma-rose-default-jwt-secret-min-32-chars-long')`. If `JWT_SECRET` was omitted from production environment variables, the system would initialize using a known, publicly visible secret string.
- **Risk:**
  An attacker could forge valid JWT tokens bearing the `admin` role and gain unauthorized administrative control over the store, inventory, and orders.
- **Reproduction Steps:**
  1. Unset `JWT_SECRET` in environment.
  2. Call `src/config/env.ts`.
  3. Notice application boots with default key.
- **Remediation Implemented:**
  1. Removed `.default(...)` from `JWT_SECRET`.
  2. Enforced minimum 32 characters in schema.
  3. Added custom validation rejecting known placeholders (`default`, `placeholder`, `secret`, `changeme`, `aroma-rose-default-jwt-secret`).
  4. Added test suite `tests/env.test.ts` (8 assertions passing).
- **Verification:** Verified that omitting `JWT_SECRET` causes application startup to fail with an explicit validation error.

---

### BUG-002: PostgreSQL Transaction Abort (`25P02`) in COD Reconciliation
- **Severity:** P1 — High (Data Integrity & Transaction Safety)
- **Component:** `src/modules/orders/orders.service.ts`
- **Discovered In:** Integration Test Suite 6 & E2E Financial Reconciliations
- **Root Cause:**
  When executing `reconcileCodPayment`, the service attempted to update optional columns `paid_at` and `payment_collected_by`. If those columns were absent in earlier database schemas, PostgreSQL emitted error `42703 (undefined_column)`. Because this query executed inside a PostgreSQL transaction (`BEGIN ... COMMIT`), the error placed the entire transaction in an aborted state (`25P02: current transaction is aborted, commands ignored until end of transaction block`). Subsequent fallback queries inside the catch block failed immediately.
- **Remediation Implemented:**
  Wrapped the initial column update in a PostgreSQL `SAVEPOINT cod_reconcile_sp`:
  ```sql
  SAVEPOINT cod_reconcile_sp;
  -- attempt update with optional columns...
  -- if error 42703:
  ROLLBACK TO SAVEPOINT cod_reconcile_sp;
  -- fallback to primary update...
  RELEASE SAVEPOINT cod_reconcile_sp;
  ```
- **Verification:** Verified clean rollback to savepoint and successful order status transition to `delivered` with reconciled payment.

---

### BUG-003: Local Authentication Fallback Blocked on Supabase Cloud Error
- **Severity:** P1 — High (Testability & Offline Resilience)
- **Component:** `src/middleware/auth.ts`, `src/modules/auth/auth.service.ts`
- **Discovered In:** API Test Runner Suite 3 & E2E Admin Login
- **Root Cause:**
  `src/modules/auth/auth.service.ts` attempted to contact Supabase Cloud Auth. When provided a local test account (`admin@aromarose.local` or offline test database), Supabase Cloud returned HTTP 400 Bad Request. The service immediately threw `UnauthorizedError`, aborting execution before reaching the local password hash fallback for non-production environments.
- **Remediation Implemented:**
  Restricted immediate cloud rejection abort strictly to `env.NODE_ENV === 'production'`. In `test` or `development` modes, errors from cloud auth allow safe fallback to local bcrypt verification against `auth.users` and `public.profiles`.
- **Verification:** Verified both cloud auth path and local offline test path operate without conflicts.

---

### BUG-004: Trailing Slash Duplication and Non-Browser Crash in `ApiClient.buildUrl`
- **Severity:** P2 — Medium (API Client Reliability)
- **Component:** `frontend/src/api/client.ts`
- **Discovered In:** Pre-Release API Client Audit
- **Root Cause:**
  `buildUrl` used string concatenation: `const url = this.baseUrl + endpoint;`. If `baseUrl` had a trailing slash (e.g. `https://api.aromarose.ma/`) and `endpoint` had a leading slash (`/api/v1/orders`), duplicate slashes (`https://api.aromarose.ma//api/v1/orders`) were generated. Additionally, when executed in Node/SSR where `window` is undefined, `window.location.origin` caused a fatal `ReferenceError`.
- **Remediation Implemented:**
  Normalized URL resolution using safe prefix/suffix trimming and URL object resolution with fallback origin. Added unit test suite `frontend/tests/api_client.test.ts` (9 assertions passing).
- **Verification:** 9/9 unit tests passing across relative, absolute HTTPS, query params, and non-browser SSR contexts.

---

### BUG-005: IP Rate Limiting Tripping during Rapid Automated UI Test Sessions
- **Severity:** P2 — Medium (Test Stability)
- **Component:** `src/middleware/rateLimiter.ts`, `playwright.config.ts`
- **Discovered In:** E2E Playwright Suite Execution
- **Root Cause:**
  `apiLimiter` enforces a 100-request limit per 15-minute window for standard IP addresses in `development` mode. During full E2E execution, browser interactions and background polling from `127.0.0.1` exceeded 100 requests, returning HTTP 429 (`Too many requests from this IP. Please try again after 15 minutes.`).
- **Remediation Implemented:**
  Configured `playwright.config.ts` to launch `tests/qa-server.ts` with `NODE_ENV: 'test'`, which increases the rate limit threshold to 10,000 requests per 15-minute window.
- **Verification:** All 23 Playwright tests executed concurrently and sequentially without rate limit interruptions.

---

### BUG-006: Cloud Storage Upload Dependency on Live Supabase Network Endpoint
- **Severity:** P3 — Low (Operational / Environment Dependency)
- **Component:** `src/utils/storage.ts`, `src/modules/products/products.service.ts`
- **Discovered In:** API Suite 15 Image Upload Test
- **Root Cause:**
  `ProductsService.uploadProductImage` performs live HTTPS `POST` requests to `https://<project-ref>.supabase.co/storage/v1/object/...`. In an offline or network-isolated testing sandbox, this call fails with `fetch failed`.
- **Mitigation & Finding:**
  All pre-upload security invariants (binary magic number detection for JPEG/PNG/WebP/AVIF, path traversal sanitization, transactional advisory locks, and DB rollbacks) were tested and passed with 100% success in `tests/storage.test.ts`. Live upload requires valid cloud credentials and active internet connectivity.
- **Classification:** **Documented Operational Limitation**.

---

### BUG-007: Frontend Vendor Bundle Exceeds 500 kB
- **Severity:** P3 — Low (Performance Optimization)
- **Component:** `frontend/vite.config.ts`, `frontend/src/routes/index.tsx`
- **Discovered In:** Frontend Production Build (`npm run build`)
- **Root Cause:**
  Vite production bundle generated a single chunk `dist/assets/index-BQs9ZaCc.js` of 749.37 kB (187.13 kB gzipped). All admin dashboard components, Lucide icons, and customer storefront pages are compiled into one monolithic bundle.
- **Recommendation for Next Sprint:**
  Implement dynamic `React.lazy()` route splitting in `frontend/src/routes/index.tsx` for admin pages (`/admin/*`) and customer pages (`/shop`, `/checkout`, `/about`) to optimize First Contentful Paint (FCP) and Lighthouse scores on mobile networks.
- **Classification:** **Non-Blocking Post-Launch Enhancement**.

---

## 4. Known Non-Blocking Limitations (API Verified / E2E Pending)

The following administrative UI mutation workflows are fully verified and guarded at the backend API integration layer (Suites 5, 8, 10, 11, 13, 14, 15) and database constraint layer, but are not yet automated as browser-level Playwright UI tests:

1. **Product Creation Form Submission (`/admin/products/new`):**
   - Verified via backend API Suite 10 (`POST /api/v1/admin/products`).
   - Browser test covers navigation to admin portal, but interactive form filling is not automated in Playwright.
2. **Product Edit Form Submission (`/admin/products/:id`):**
   - Verified via backend API Suite 11 (`PUT /api/v1/admin/products/:id`).
   - Browser test covers list view, but editing form submit is not automated in Playwright.
3. **Stock Adjustment Modal Submission (`/admin/inventory`):**
   - Verified via backend API Suite 8 (`POST /api/v1/admin/inventory/adjustments`).
   - Browser test covers inventory table and movements ledger navigation, but modal form submit is not automated in Playwright.
4. **WhatsApp Manual Order Intake Modal Submission (`/admin/orders`):**
   - Verified via backend API Suite 5 (`POST /api/v1/admin/orders`).
   - Browser test verifies trigger button presence, but modal form submit is not automated in Playwright.
5. **Customer Detail Page Inspection (`/admin/customers/:id`):**
   - Verified via backend API Suites 13 & 14 (`GET /api/v1/admin/customers`).
   - Browser test covers dashboard, orders, inventory, settings, and reports; customer detail route is verified at API layer.
