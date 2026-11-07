# Aroma Rose — Mission 06.5E: Production Storefront & Admin Storage Acceptance Report

**Document Version:** 1.0.0
**Acceptance Date:** November 6, 2026
**Lead Auditor:** Principal QA Engineer, Senior Full-Stack Engineer & Production Reliability Specialist
**Classification:** Production Acceptance Audit, Security Boundary Validation & Reliability Gate
**Target Storage Bucket:** `product-images` (Public Read, Server-Side Service-Role Write)
**Target Supabase Project:** `tmzedtqltmtjubdguybe` (`tmzedtqltmtjubdguybe.supabase.co`, Region: `eu-north-1`)
**Git HEAD:** `12fef0a`

---

## 1. Executive Summary & Verdict

### Final Verdict: **ACCEPTED WITH LIMITATIONS**

The production Supabase Storage infrastructure, security policies, backend service methods, and frontend integration components for Aroma Rose have undergone a comprehensive QA acceptance review.

The cloud storage layer (`product-images` bucket on Supabase Cloud `tmzedtqltmtjubdguybe`) is fully provisioned, secured with PostgreSQL Row-Level Security (RLS), verified via CDN edge delivery (HTTP/2 200), and guarded by binary file signature (magic number) verification. All local unit and integration security suites passed with a 100% success rate (14/14 storage security tests, 139/139 frontend tests).

However, in accordance with the strict factual criteria of Mission 06.5E:
1. **Browser E2E is NOT VERIFIED:** No browser automation test framework (such as Playwright, Cypress, or Puppeteer) is installed in the repository. Browser E2E pass cannot and must not be simulated or claimed.
2. **Production Application Hosting is Unconfigured:** While the Supabase Cloud database and storage bucket are live, the Express REST API backend and React/Vite frontend have not yet been deployed to a remote production hosting platform (e.g. Railway, Vercel, Render, or AWS). Only local production builds exist.
3. **Production Catalog Seed Data Remains Unmigrated:** The live database currently contains 0 rows in `public.product_images` (preserving the strict "Do NOT seed products" directive from Mission 06.4B). The 72 local catalog images remain supported via the backward-compatible `/products/...` fallback mechanism, but have not yet been migrated to cloud storage object keys.

---

## 2. Actual Deployment & Environment Status

To ensure absolute transparency between source code, local builds, and live infrastructure:

| Architectural Tier | Current State | Verification Evidence | Operational Status |
| :--- | :--- | :--- | :--- |
| **Local Source Code** | Up-to-date at Git HEAD `12fef0a` | `git status` clean with respect to tracked repository files. All storage utilities, schemas, and routes in place. | **READY** |
| **Local Production Builds** | Compiled & verified | `npm run build` emitted `dist/` (0 TS errors). `npm --prefix frontend run build` generated Vite bundles in 4.82s. | **VERIFIED** |
| **Supabase Remote Database** | Live & Synchronized | Project `tmzedtqltmtjubdguybe` has migrations `001`, `002`, `003`, `004`, and `005` applied. RLS enabled on all 11 tables and `storage.objects`. | **LIVE & HEALTHY** |
| **Supabase Remote Storage** | Live & Functional | Bucket `product-images` active (public read, 5MB limit, strict MIME whitelist). Anonymous upload rejected by RLS. | **LIVE & HEALTHY** |
| **Remote Backend API Hosting** | Not Deployed | No external production API URL or hosting provider (e.g., Railway, Fly.io, AWS) configured. API currently runs locally. | **LOCAL ONLY** |
| **Remote Frontend Web Hosting** | Not Deployed | No external production frontend URL or hosting provider (e.g., Vercel, Netlify, Cloudflare Pages) configured. Frontend runs locally. | **LOCAL ONLY** |

---

## 3. Admin Upload UI Verification

The administrative product image upload workflow was audited across frontend component [`ProductImageManager.tsx`](file:///home/elmostafa/Documents/work/Aroma%20Rose/frontend/src/components/admin/ProductImageManager.tsx), schema validation [`uploadImageSchema`](file:///home/elmostafa/Documents/work/Aroma%20Rose/src/modules/products/products.schema.ts), and backend handler [`ProductsService.uploadProductImage`](file:///home/elmostafa/Documents/work/Aroma%20Rose/src/modules/products/products.service.ts).

### 3.1 Format & Signature Validation Matrix
| Input Type | Declared MIME | File Signature (Magic Bytes) | Frontend Action | Backend Action | Acceptance Result |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **JPEG** | `image/jpeg` | `FF D8 FF` | Permitted | Uploads to `products/<ts>-<hex>.jpg` | **ACCEPTED** |
| **PNG** | `image/png` | `89 50 4E 47 0D 0A 1A 0A` | Permitted | Uploads to `products/<ts>-<hex>.png` | **ACCEPTED** |
| **WebP** | `image/webp` | `RIFF....WEBP` | Permitted | Uploads to `products/<ts>-<hex>.webp` | **ACCEPTED** |
| **AVIF** | `image/avif` | `....ftypavif` | Permitted | Uploads to `products/<ts>-<hex>.avif` | **ACCEPTED** |
| **Oversized (> 5MB)** | `image/jpeg` | Valid JPEG | Intercepted with error prompt | Throws HTTP 400 (`File size exceeds maximum allowed of 5MB`) | **ACCEPTED** |
| **Extension Spoofing** | `image/jpeg` | `89 50 4E 47` (PNG) | Submits based on extension | Throws HTTP 400 (`File signature is PNG but declared Content-Type is image/jpeg`) | **ACCEPTED** |
| **Executable / Script** | `image/jpeg` | `7F 45 4C 46` or plain text | Submits based on extension | Throws HTTP 400 (`File signature does not match any allowed image format`) | **ACCEPTED** |
| **Unauthorized MIME** | `image/gif` | `47 49 46 38` | Blocked: "Format non supporté" | Throws HTTP 400 (Zod schema validation) | **ACCEPTED** |

### 3.2 UI Feedback & Lifecycle Consistency
- **Upload Progress:** `ProductImageManager.tsx` binds to `useUploadProductImage()`. While `isPending` is true, the button transitions to a disabled state with an inline spinner and label `"Téléchargement..."`.
- **Error Transparency:** Errors returned by the server or client validation trigger an alert banner displaying the exact French localized error message.
- **Return Contract:** Successful backend uploads return:
  ```json
  {
    "storage_path": "products/1793925747013-9081d8034ddc8483.jpg",
    "public_url": "https://tmzedtqltmtjubdguybe.supabase.co/storage/v1/object/public/product-images/products/1793925747013-9081d8034ddc8483.jpg"
  }
  ```
- **State Preservation:** Newly uploaded images are appended to the product's image array with `display_order` and `is_primary` tracking. When saved, the product record and image associations are stored transactionally in PostgreSQL and persisted across page refreshes.

---

## 4. Storefront Rendering Verification

Storefront image rendering was evaluated across [`ShopPage.tsx`](file:///home/elmostafa/Documents/work/Aroma%20Rose/frontend/src/pages/storefront/ShopPage.tsx), [`ProductDetailPage.tsx`](file:///home/elmostafa/Documents/work/Aroma%20Rose/frontend/src/pages/storefront/ProductDetailPage.tsx), and [`storage.ts`](file:///home/elmostafa/Documents/work/Aroma%20Rose/src/utils/storage.ts):

### 4.1 URL Resolution & Fallback Behavior
- **Legacy Local Paths (`/products/...`):**
  - Input: `/products/soins-du-visage/huile-de-rose-avec-pipette.jpg`
  - Output: `/products/soins-du-visage/huile-de-rose-avec-pipette.jpg`
  - Result: Served directly by local static asset middleware or Vite dev server without modification.
- **Supabase Cloud Paths (`products/...`):**
  - Input: `products/1700000000-abc12345.webp`
  - Output: `https://tmzedtqltmtjubdguybe.supabase.co/storage/v1/object/public/product-images/products/1700000000-abc12345.webp`
  - Result: Resolves directly to Supabase Global CDN edge nodes.
- **External Absolute URLs (`https://...`):**
  - Preserved verbatim without duplicate prefixing.

### 4.2 Graceful Error Handling & Broken Image Guards
- Both `ShopPage.tsx` and `ProductDetailPage.tsx` attach an `onError` handler to every `<img>` tag:
  ```tsx
  onError={(e) => {
    (e.currentTarget as HTMLImageElement).src =
      'data:image/svg+xml;utf8,<svg ...><text ...>Aroma Rose</text></svg>';
  }}
  ```
- If a remote asset is missing, corrupted, or unreachable due to network latency, the storefront never renders a browser broken-image icon. It falls back smoothly to an inline Moroccan Damask rose SVG placeholder.

---

## 5. Supabase Object Verification & Live CDN Delivery

### 5.1 Remote Bucket Catalog Configuration
Direct SQL inspection of `storage.buckets` on project `tmzedtqltmtjubdguybe`:
```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'product-images';
```
- **ID & Name:** `product-images`
- **Public:** `true` (enables global CDN read caching)
- **File Size Limit:** `5242880` bytes (5 MB)
- **Allowed MIME Types:** `['image/jpeg', 'image/png', 'image/webp', 'image/avif']`

### 5.2 Live Cloudflare CDN Edge Delivery Check
A verified JPEG product asset was uploaded to `products/e2e-verification-test.jpg` and inspected via `curl -I`:
```http
HTTP/2 200
date: Fri, 06 Nov 2026 00:40:16 GMT
content-type: image/jpeg
content-length: 160355
server: cloudflare
sb-gateway-mode: direct
sb-project-ref: tmzedtqltmtjubdguybe
access-control-allow-origin: *
etag: "46a3e8d1048baa946a8a47368122f55d"
```
- Confirmed `HTTP/2 200 OK` response directly from Cloudflare edge caches.
- Correct MIME type (`image/jpeg`) served without content re-encoding.
- The test object was cleanly deleted after verification.

---

## 6. Safe Deletion, Referential Integrity & Concurrency

### 6.1 Transaction-Scoped Advisory Locks
- In [`ProductsService.deleteProductImage`](file:///home/elmostafa/Documents/work/Aroma%20Rose/src/modules/products/products.service.ts), [`createAdminProduct`](file:///home/elmostafa/Documents/work/Aroma%20Rose/src/modules/products/products.service.ts), and [`updateAdminProduct`](file:///home/elmostafa/Documents/work/Aroma%20Rose/src/modules/products/products.service.ts), operations on an image path acquire a transaction-scoped PostgreSQL advisory lock:
  ```sql
  SELECT pg_advisory_xact_lock(hashtext('storage_img:' || $1))
  ```
- **Concurrency Protection:** Eliminates the race condition where Admin A deletes an unreferenced image while Admin B concurrently saves a product referencing that exact image path. The deletion transaction blocks until the product update commits, at which point the referential check discovers the row and aborts with HTTP 409.

### 6.2 Active Catalog Reference Protection
- `deleteProductImage` verifies `SELECT product_id FROM public.product_images WHERE storage_path = $1 LIMIT 1`.
- If actively referenced, the endpoint throws `ConflictError` (HTTP 409: `"Cannot delete image: storage_path ... is actively referenced by product ..."`).
- Cloud storage mutation is never invoked while any database row references the file.

### 6.3 Non-Destructive Product Archiving
- `deleteAdminProduct` performs a soft-archive:
  ```sql
  UPDATE public.products SET is_active = false, updated_at = now() WHERE id = $1
  ```
- No rows in `public.product_images` are removed, and no objects in Supabase Storage are deleted, ensuring auditability and historical order integrity.

### 6.4 Atomic Creation Rollback & Fail-Safe Cleanup
- If a product creation transaction rolls back after an image has been uploaded to Supabase Storage:
  - Catch block queries whether any other product references the uploaded path.
  - **Fail-Safe Behavior:** If database connectivity is compromised or the query fails, the system defaults to preserving the object in cloud storage rather than risking an erroneous deletion of an active asset.

---

## 7. Security & Access Boundary Verification

| Threat / Security Boundary | Control Mechanism | Verification Output | Status |
| :--- | :--- | :--- | :--- |
| **Service Role Secret Leakage** | Scan client assets (`frontend/dist/assets/*.js`) | 0 occurrences of `SUPABASE_SERVICE_ROLE_KEY` or service-role JWT tokens. | **VERIFIED** |
| **Direct Browser Storage Writes** | Supabase Storage RLS policies | Direct anonymous upload attempt rejected: `new row violates row-level security policy`. | **VERIFIED** |
| **Path Traversal in Deletion** | Regex check: `^products/[a-zA-Z0-9_\-]+(\.[a-zA-Z0-9]+)+$` | Rejects `../passwords.txt`, `products/../../etc/passwd`, `products\payload.jpg`. | **VERIFIED** |
| **Namespace Spoofing** | Strict `products/` prefix assertion | Rejects attempts to delete foreign bucket objects (e.g. `user-avatars/avatar1.jpg`). | **VERIFIED** |
| **Unauthenticated API Access** | `authenticate` JWT middleware | `POST /admin/products/upload-image` rejects unauthenticated callers with HTTP 401. | **VERIFIED** |
| **Customer Role API Access** | Database profile role check | Non-staff/customer JWT rejected by `requireRole(['admin', 'staff'])`. | **VERIFIED** |

---

## 8. Regression & Build Verification Results

### 8.1 Test Suites Execution Summary

```
==============================================================================
               Aroma Rose Full Regression & Verification Matrix
==============================================================================
1. Storage Security Suite:     14 Passed / 0 Failed (14 tests, 1.25s)
2. Backend TypeScript Build:    0 Errors (dist/ emitted cleanly)
3. Frontend Unit & Contract:  139 Passed / 0 Failed (70 suites, 1.38s)
4. Frontend Typecheck:          0 Errors (tsc --noEmit exited with 0)
5. Frontend Production Build:   0 Errors (Vite production bundle built in 4.82s)
==============================================================================
Total Automated Tests:         153 Passed / 0 Failed across all available suites
```

### 8.2 Breakdown of Verified Test Scenarios
- **Binary Magic Numbers:** JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), WebP (`RIFF...WEBP`), AVIF (`ftyp`).
- **Storage Limits:** 5MB payload cutoff and file extension canonicalization.
- **Path Generation:** Unpredictable `products/<timestamp>-<random-hex>.<ext>`.
- **Advisory Locks:** `pg_advisory_xact_lock` serialization.
- **Storefront Cart & Checkout:** Moroccan phone formatters, guest checkout contracts, and price immutability.
- **Admin Dashboard & Orders:** Moroccan COD financial reconciliation (`paid_at`, `payment_collected_by`).

---

## 9. Browser E2E Status

### Status: **NOT VERIFIED**

- **Root Cause:** No browser end-to-end testing framework (such as Playwright, Cypress, or Puppeteer) is installed in `package.json` or `frontend/package.json`.
- **Compliance Note:** In accordance with the explicit instructions of Mission 06.5E, browser E2E is formally reported as **NOT VERIFIED**. Browser test passes must not be simulated or claimed via unit or component test runners.
- **Remediation Recommendation:** Install `@playwright/test` and provision headless Chromium smoke tests covering the admin upload dropzone and storefront image gallery before the final customer launch.

---

## 10. Production Rollback Safety Review

A non-destructive rollback strategy is fully defined and ready in the event of an infrastructure incident:

### Invariant Rules for Rollback:
1. **Preserve Public Bucket:** The `product-images` bucket MUST remain `public: true`. Making the bucket private would break image rendering for all previously uploaded products.
2. **Preserve Cloud Objects:** Existing objects in Supabase Storage must NOT be deleted.
3. **Preserve Local Images:** All 72 local catalog images under `public/products/` and `frontend/public/products/` must remain in place.
4. **Preserve Public RLS Policy:** Do NOT drop the `Public Access to product-images` SELECT policy.

### Non-Destructive Rollback Procedure:
If a Supabase Storage outage occurs:
1. **Application-Level Reversion:** In `src/modules/products/products.service.ts`, toggle administrative uploads back to local filesystem write mode.
2. **Storefront Transparency:** The storefront resolver `getStoragePublicUrl` automatically handles both local paths (`/products/...`) and existing cloud URLs (`https://...`), allowing uninterrupted catalog browsing without requiring database updates.

---

## 11. Outstanding Risks & Next Recommended Actions

### Outstanding Risks
1. **Absence of Browser E2E Automation:** Manual browser testing is required to verify drag-and-drop interactions in Safari and mobile browsers until Playwright is integrated.
2. **Unseeded Remote Catalog Data:** The production Supabase database currently has 0 rows in `public.products` and `public.product_images`. While legacy images are preserved on disk, they cannot be served from the cloud storage bucket until catalog data is seeded and migrated.
3. **Application Hosting Deployment Pending:** The Node.js API and Vite frontend must be deployed to their production cloud hosting environments to enable full public traffic.

### Exact Next Recommended Actions
1. **Implement Playwright E2E Suite:** Add a minimal browser test covering image upload in `ProductImageManager` and thumbnail gallery navigation in `ProductDetailPage`.
2. **Author Controlled Catalog Seed & Cloud Migration:** When authorized by the product release gate, execute a controlled catalog seed into the production database and run `scripts/migrate-images-to-supabase-storage.ts --confirm` to upload all 72 catalog images to Supabase Storage.
3. **Deploy Backend & Frontend Services:** Configure production cloud deployment pipelines for the Express REST API and Vite SPA frontend.
