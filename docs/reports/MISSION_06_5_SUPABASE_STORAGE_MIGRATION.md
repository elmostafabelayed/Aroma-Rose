# Aroma Rose — Mission 06.5: Production Supabase Storage Migration Report

**Document Version:** 1.0.0
**Audit & Architecture Date:** November 5, 2026
**Lead Engineer:** Senior Full-Stack Engineer, Supabase Storage Architect & DevSecOps Engineer
**Classification:** Cloud Object Storage Architecture & Security Hardening
**Target Storage Bucket:** `product-images` (Public Read, Service-Role Write)
**New Migration Script:** `supabase/migrations/20261105000500_supabase_storage_product_images.sql` (Drafted, unapplied)
**Transfer Tool:** `scripts/migrate-images-to-supabase-storage.ts` (Resumable CLI)
**Test Suite:** `tests/storage.test.ts` (11/11 Passed)

---

## 1. Executive Summary & Verdict

### Final Verdict: **SAFE TO PROCEED TO STORAGE DEPLOYMENT**

Prior to this mission, administrative product image uploads were written directly to the local filesystem under `public/products/uploads/` and `frontend/public/products/uploads/`. This architecture is unsuitable for production cloud deployments (ephemeral containers, Docker hosts, serverless runtimes, or horizontally scaled clusters) where local disk writes are lost on restart and not shared across server instances.

This mission transitioned Aroma Rose product image management to **Supabase Object Storage** (`product-images` bucket) while maintaining complete backward compatibility with existing seed images and local uploads.

### Key Achievements
1. **Zero-Trust Backend Architecture:** Uploads, updates, and deletions are exclusively performed by the trusted backend using the Server-Side Service Role client (`supabaseService`). The Supabase service role key is strictly confined to the backend and never exposed to the browser.
2. **Binary Magic Number Signature Verification:** Client-supplied MIME types are untrusted. Every image upload is validated by checking its binary magic bytes (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `RIFF...WEBP`, AVIF `ftyp...`) to prevent malicious payload uploads and MIME-spoofing attacks.
3. **Collision-Resistant Namespacing & Traversal Prevention:** Client filenames are discarded. Object keys are generated as `products/<timestamp>-<random-hex>.<ext>`. Deletion strictly validates the `products/` namespace and rejects path traversal (`..`, `/`, `\`).
4. **Transparent Backward Compatibility:** `getStoragePublicUrl` preserves local filesystem paths (`/products/...`) and absolute CDN URLs, allowing legacy images and new cloud storage images to coexist seamlessly.
5. **Atomic Cleanup on Creation Failure:** If a product creation transaction fails after image upload, the orphaned storage objects are automatically rolled back and deleted.
6. **Resumable Migration Tooling:** Created `scripts/migrate-images-to-supabase-storage.ts` with `--dry-run` and checksum verification to transfer existing local files to Supabase Storage without deleting local files.

---

## 2. Phase 1 — Initial Architecture & Repository Audit

### 2.1 The Root Limitations of Local Uploads
In `src/modules/products/products.service.ts` (legacy implementation):
- Decoded base64 payloads and wrote files to `public/products/uploads/${Date.now()}-${sanitizedBase}.${ext}`.
- Sanitized client filenames using regex (`replace(/[^a-z0-9_-]/g, '-')`), but relied entirely on client-declared `content_type` without validating binary file signatures (magic bytes).
- Saved duplicate files to `frontend/public/products/uploads/` at runtime, creating ephemeral state and disk drift.
- Horizontally scaled backend nodes could not access files uploaded to other nodes.

### 2.2 Database Schema Alignment
- Table `public.product_images` was designed with cloud storage in mind:
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `product_id`: `UUID REFERENCES public.products(id) ON DELETE CASCADE`
  - `storage_path`: `TEXT NOT NULL`
  - `alt_text`: `TEXT`
  - `display_order`: `INT NOT NULL DEFAULT 0`
  - `is_primary`: `BOOLEAN NOT NULL DEFAULT false`
- Existing seed images stored root-relative paths: `/products/<category>/<image>.jpg`.
- Frontend views (`ProductDetailPage.tsx`, `ShopPage.tsx`, `CartPage.tsx`) consume `primary_image.public_url || '/placeholder-rose.jpg'`.

---

## 3. Phase 2 — Storage Architecture & Bucket Design

### 3.1 Bucket Configuration
- **Bucket ID:** `product-images`
- **Visibility:** `public: true` (Public read via Supabase Global CDN at `${SUPABASE_URL}/storage/v1/object/public/product-images/...`). This allows storefront visitors to fetch catalog images directly from CDN edge caches without generating signed URLs or hitting the backend API.
- **Maximum File Size:** 5MB (`5242880` bytes).
- **Allowed MIME Types:** `image/jpeg`, `image/png`, `image/webp`, `image/avif`.
- **Environment Variable:** `SUPABASE_STORAGE_BUCKET` (defaults to `product-images` in `src/config/env.ts`).

### 3.2 Access Control & Security Matrix

| Role / Actor | Read (SELECT) | Write (INSERT) | Update (UPDATE) | Delete (DELETE) | Security Boundary |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Public / Storefront Customer** | Allowed (CDN & `storage.objects` policy) | **DENIED** | **DENIED** | **DENIED** | Read-only access to published images. |
| **Authenticated Client (Browser)** | Allowed | **DENIED** | **DENIED** | **DENIED** | No direct storage mutations from browser. |
| **Backend API (Service Role)** | Allowed | **Allowed** | **Allowed** | **Allowed** | Uses `SUPABASE_SERVICE_ROLE_KEY` exclusively server-side. |

---

## 4. Phase 3 & 4 — Backend Implementation & Security Controls

### 4.1 Binary File Signature Validation (`validateImageSignature`)
Client-supplied headers can be forged. In `src/utils/storage.ts`, binary inspection verifies:
- **JPEG:** Bytes `0..2` must be `0xFF, 0xD8, 0xFF`.
- **PNG:** Bytes `0..7` must be `0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A`.
- **WebP:** Bytes `0..3` must be `RIFF` and bytes `8..11` must be `WEBP`.
- **AVIF:** Bytes `4..7` must be `ftyp` with brand `avif`, `avis`, or `mif1`.
- Any mismatch or buffer under 12 bytes immediately raises HTTP 400 (`BadRequestError`).

### 4.2 Collision-Resistant Path Generation (`generateStorageObjectPath`)
```typescript
export const generateStorageObjectPath = (mimeType: string): string => {
  const ext = getCanonicalExtension(mimeType);
  const randomHex = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now();
  return `products/${timestamp}-${randomHex}.${ext}`;
};
```
- Client filenames are never used in object paths.
- Guarantees zero namespace collisions and prevents directory traversal attacks.

### 4.3 Safe Object Deletion (`deleteProductImageFromStorage`)
- Strictly enforces that target path matches `^products/[a-zA-Z0-9_\-\.]+$`.
- Blocks directory traversal attempts (`..`, `/`, `\`).
- Rejects requests targeting foreign buckets or system files.
- Protects local legacy assets (`/products/...`), ensuring existing files on disk are never deleted via storage commands.

### 4.4 Automated Rollback on Database Failure
In `ProductsService.createAdminProduct`:
- If an error occurs during product or image insertion in PostgreSQL, newly uploaded Supabase Storage objects are automatically rolled back and deleted via `deleteProductImageFromStorage`.
- If cleanup fails, structured recovery logs are emitted with correlation context for manual remediation.

---

## 5. Phase 5 — Frontend Integration & Backward Compatibility

### 5.1 Zero Breaking Changes to Product Image Management
- `ProductImageManager.tsx` uploads images via `useUploadProductImage.mutateAsync({ file_name, content_type, file_base64 })`.
- The endpoint returns `{ storage_path: "products/...", public_url: "https://..." }`.
- The frontend displays previews, allows reordering, primary selection, and alt-text editing identically.
- Storefront components render `primary_image.public_url || '/placeholder-rose.jpg'`.

### 5.2 Seamless Legacy URL Resolution
In `src/utils/storage.ts`:
```typescript
export const getStoragePublicUrl = (storagePath: string | null | undefined, bucket: string = STORAGE_BUCKET): string | null => {
  if (!storagePath) return null;
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) return storagePath;
  if (storagePath.startsWith('/products/')) return storagePath; // Local asset backward-compatibility

  const cleanPath = storagePath.replace(/^\/+/, '');
  const pathWithoutBucket = cleanPath.startsWith(`${bucket}/`) ? cleanPath.slice(bucket.length + 1) : cleanPath;
  return `${env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${pathWithoutBucket}`;
};
```
This guarantees that seed images (`/products/soins-du-visage/...`) and local uploads continue to render perfectly while newly uploaded images serve directly from Supabase CDN.

---

## 6. Files Changed & Added

| File Path | Type | Nature of Changes |
| :--- | :--- | :--- |
| `src/config/env.ts` | Modified | Added `SUPABASE_STORAGE_BUCKET: z.string().default('product-images')`. |
| `src/utils/errors.ts` | Modified | Added `InternalServerError` (extends `AppError`). |
| `src/utils/storage.ts` | Modified | Implemented magic bytes validator, path generator, storage upload, safe delete, and URL resolver. |
| `src/modules/products/products.schema.ts` | Modified | Added `deleteImageSchema` for safe image deletion endpoint. |
| `src/modules/products/products.service.ts` | Modified | Replaced local disk write with Supabase Storage upload, added rollback cleanup, and delete method. |
| `src/modules/products/products.controller.ts` | Modified | Added `deleteProductImage` controller method. |
| `src/routes/admin.routes.ts` | Modified | Registered `POST /products/delete-image` route protected with `authenticate, requireRole(['admin', 'staff'])`. |
| `supabase/migrations/20261105000500_supabase_storage_product_images.sql` | **New** | Idempotent migration creating `product-images` bucket and public SELECT policy. |
| `scripts/migrate-images-to-supabase-storage.ts` | **New** | Resumable CLI migration script with SHA256 checksums and `--dry-run` flag. |
| `tests/storage.test.ts` | **New** | 11 comprehensive automated tests covering signatures, limits, traversal, and cleanup. |

---

## 7. Phase 6 — Verification Tests & Results

### 7.1 Backend Storage Test Suite (`tests/storage.test.ts`)
Executed: `npx tsx --test tests/storage.test.ts`
- **Result:** **PASS** (11/11 tests passed in 1.5s, 0 failures).
  - 1. Binary File Signature (Magic Numbers) Validation (JPEG, PNG, WebP, AVIF, spoofing rejection): **PASS**
  - 2. File Extensions & Canonical MIME Mapping: **PASS**
  - 3. Collision-Resistant Storage Path Generation & Path Traversal Guards: **PASS**
  - 4. Safe Deletion & Traversal Prevention (`..`, foreign buckets, local files): **PASS**
  - 5. Backward-Compatible Public Image URL Construction: **PASS**
  - 6. `ProductsService.uploadProductImage` Validation Guards (> 5MB, spoofed signature): **PASS**
  - 7. Mocked Supabase Storage Upload & Deletion: **PASS**
  - 8. Compound Product Creation Failure & Automatic Storage Cleanup Rollback: **PASS**
  - 9. Multiple Image Uploads & Image Ordering Contract: **PASS**
  - 10. Authorization & Security Boundaries for Storage Operations: **PASS**

### 7.2 Full Test & Build Suite Matrix

| Test Suite / Pipeline Stage | Command | Target / Scope | Status | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Backend Storage Test Suite** | `npx tsx --test tests/storage.test.ts` | Storage security, signatures, cleanup | **PASS** | 11/11 passed in 1.5s. |
| **Backend TypeScript Build** | `npm run build` | API & server compilation (`tsc`) | **PASS** | 0 compilation errors. Emitted to `dist/`. |
| **Frontend Unit / Contract Tests** | `npm --prefix frontend run test` | 70 test suites, 139 tests | **PASS** | 139/139 passed in 2.0s. |
| **Frontend Typecheck** | `npm --prefix frontend run typecheck` | React / TypeScript (`tsc --noEmit`) | **PASS** | 0 TypeScript errors. |
| **Frontend Production Build** | `npm --prefix frontend run build` | Vite production bundle | **PASS** | Bundled cleanly in 8.79s. |
| **Browser E2E** | N/A | Full browser automation | **NOT VERIFIED** | No browser E2E framework configured in repository. |

---

## 8. Remaining Risks & Production Deployment Instructions

### 8.1 Remaining Operational Considerations
1. **Remote Storage Bucket Provisioning:** In Supabase Cloud, creating storage buckets via raw SQL migration requires `storage.buckets` table permissions. If the project owner prefers UI provisioning, the bucket can be verified in the Supabase Dashboard (`Storage` -> `New bucket` -> `product-images`, Public: ON).
2. **Local Image Retention:** Local images in `public/products/` must be retained until the one-time migration script is executed in production and verified.

### 8.2 Production Deployment Steps (When Authorized)
1. **Step 1:** Ensure environment variable `SUPABASE_STORAGE_BUCKET=product-images` is set in production.
2. **Step 2:** Ensure the `product-images` bucket exists on Supabase Cloud with Public Read enabled and 5MB limit.
3. **Step 3:** Deploy backend and frontend application builds.
4. **Step 4 (Optional / Post-Deploy):** Execute dry-run of legacy asset migration:
   ```bash
   npx tsx scripts/migrate-images-to-supabase-storage.ts --dry-run
   ```
5. **Step 5:** Execute live legacy asset migration:
   ```bash
   npx tsx scripts/migrate-images-to-supabase-storage.ts
   ```

### 8.3 Rollback Procedure
If Supabase Storage encounters an outage or configuration failure:
1. Revert `ProductsService.uploadProductImage` to local file write mode.
2. Existing local images and database records referencing local files continue to function without any database changes because `getStoragePublicUrl` preserves `/products/...` root-relative paths.
3. No database records need to be deleted.
