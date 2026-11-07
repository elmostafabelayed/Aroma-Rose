# Aroma Rose — Mission 06.5B: Supabase Storage Deployment Readiness & Final Preflight

**Document Version:** 1.0.0
**Audit & Preflight Date:** November 6, 2026
**Auditor:** Principal Supabase Database Engineer & Production Security Engineer
**Classification:** Pre-Deployment Verification, Concurrency & Security Audit
**Target Migration:** `supabase/migrations/20261105000500_supabase_storage_product_images.sql` (Unapplied)
**Transfer Tool:** `scripts/migrate-images-to-supabase-storage.ts`
**Test Suite:** `tests/storage.test.ts` (13/13 Tests Passing)
**Target Supabase Project:** `tmzedtqltmtjubdguybe` (Production)
**Git HEAD:** `12fef0a` (Clean Working Tree Verified)

---

## 1. Executive Summary & Verdict

### Final Verdict: **READY FOR CONTROLLED PRODUCTION DEPLOYMENT**

Following a meticulous preflight review of the Supabase Storage architecture, database migration script, transfer utility, concurrency controls, and environment configuration:
1. All fixes from Mission 06.5A are physically verified in the codebase.
2. Image deletion race conditions are strictly eliminated via PostgreSQL transaction-level advisory locks (`pg_advisory_xact_lock`).
3. Actively referenced catalog images can never be deleted from cloud storage.
4. The migration script strictly enforces dry-run mode unless `--confirm` is provided, and validates remote upload byte sizes before updating database records.
5. Service-role credentials are strictly confined to the backend environment and completely absent from client bundles.
6. 100% of backend and frontend build, typecheck, and unit/contract test suites pass.

---

## 2. Re-Review of Applied Fixes & Concurrency / Race Condition Hardening

### 2.1 Concurrency & Deletion Race Condition Analysis
- **The Theoretical Race Condition:**
  In a high-concurrency administrative environment, a race condition could arise if Thread A (Product Creator) attempts to save a product referencing `products/img1.jpg`, while Thread B (Storage Administrator) calls `deleteProductImage('products/img1.jpg')`.
  If Thread B checks `SELECT product_id FROM public.product_images` before Thread A commits its insert, Thread B would observe 0 references, delete the object from Supabase Storage, and then Thread A would commit an insert referencing an object that no longer exists in cloud storage!
- **The Elimination Mechanism (`pg_advisory_xact_lock`):**
  In [`src/modules/products/products.service.ts`](file:///home/elmostafa/Documents/work/Aroma%20Rose/src/modules/products/products.service.ts), `createAdminProduct`, `updateAdminProduct`, and `deleteProductImage` all execute inside atomic transactions and acquire an exclusive transaction-level advisory lock on the hash of the storage path:
  ```sql
  SELECT pg_advisory_xact_lock(hashtext('storage_img:' || $1))
  ```
- **Serialization Guarantee:**
  1. If Thread A is inserting `products/img1.jpg`, it holds the advisory lock on `storage_img:products/img1.jpg`.
  2. If Thread B calls `deleteProductImage('products/img1.jpg')`, it immediately blocks at `SELECT pg_advisory_xact_lock(...)` until Thread A commits or rolls back.
  3. When Thread A commits, the lock is released. Thread B unblocks, re-evaluates `SELECT product_id FROM public.product_images WHERE storage_path = $1 LIMIT 1`, finds the committed product row, and immediately throws HTTP 409 (`ConflictError`), leaving the storage object untouched.
  4. If Thread A rolls back, Thread B unblocks, finds 0 references, and safely removes the unreferenced orphan from cloud storage.
- **Verification:** Unit test 12 in `tests/storage.test.ts` asserts that `pg_advisory_xact_lock` is acquired during image deletion operations.

### 2.2 Physical Code Verification of Applied Fixes

| Fix | File Location | Line / Scope | Verified Implementation |
| :--- | :--- | :--- | :--- |
| **Referential Check on Rollback** | `src/modules/products/products.service.ts` | L373-L395 | Queries `SELECT 1 FROM public.product_images WHERE storage_path = $1` before deleting orphaned uploads. If referenced elsewhere, deletion is skipped. |
| **Referential Check on Deletion** | `src/modules/products/products.service.ts` | L530-L555 | Queries `SELECT product_id FROM public.product_images WHERE storage_path = $1`. If referenced, throws HTTP 409 `ConflictError`. |
| **Advisory Locks** | `src/modules/products/products.service.ts` | L357, L461, L534 | Uses `SELECT pg_advisory_xact_lock(hashtext($1))` across create, update, and delete. |
| **Traversal & Backslash Guard** | `src/utils/storage.ts` | L211-L220 | Blocks `..` and `\`, and enforces `^products/[a-zA-Z0-9_\-]+(\.[a-zA-Z0-9]+)+$`. |
| **Root-Relative URL Compatibility** | `src/utils/storage.ts` | L135-L138 | `if (storagePath.startsWith('/')) return storagePath;` preserves all local relative URLs (`/products/...`, `/placeholder-rose.jpg`). |
| **Migration Script `--confirm`** | `scripts/migrate-images-to-supabase-storage.ts` | L38-L41 | `const isDryRun = !args.includes('--confirm') || args.includes('--dry-run');`. Defaults to dry-run. |
| **Migration Script Remote Size Check**| `scripts/migrate-images-to-supabase-storage.ts` | L180-L200 | Queries remote object metadata after upload; verifies remote size matches local buffer length before executing DB `UPDATE`. |

---

## 3. Migration Preflight (`20261105000500_supabase_storage_product_images.sql`)

### 3.1 SQL Content Review
```sql
-- 1. Create or configure the product-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[];

-- 2. Ensure RLS is active on storage.objects safely without failing if already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'storage' AND c.relname = 'objects' AND c.relrowsecurity = true
    ) THEN
        EXECUTE 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;';
    END IF;
END $$;

-- 3. Public Read Access Policy for CDN Image Delivery
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND policyname = 'Public Access to product-images'
    ) THEN
        CREATE POLICY "Public Access to product-images"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'product-images');
    END IF;
END $$;
```

### 3.2 Preflight Safety Assertions
- **Bucket ID and Name:** Verified as `'product-images'` (exact match with application code).
- **Public Read Intent:** Verified. Required for storefront CDN delivery without per-request signed URL generation.
- **Write Policy Isolation:** Verified. Zero INSERT, UPDATE, or DELETE policies exist for `public`, `anon`, or `authenticated`. All write operations are restricted to `service_role`.
- **Other Buckets:** Scoped strictly to `bucket_id = 'product-images'`.
- **Idempotency:** Guarded by `ON CONFLICT (id) DO UPDATE` and `IF NOT EXISTS` policy checks.
- **Destructive Operations:** Zero `DROP`, `TRUNCATE`, or `ALTER TABLE ... DROP`.
- **Local Assets:** 100% untouched.

---

## 4. Migration Script Preflight (`scripts/migrate-images-to-supabase-storage.ts`)

### 4.1 Safety Assertions Verified
1. **Default Mode:** Verified. Running without arguments defaults to DRY-RUN mode.
2. **Explicit Confirmation:** Verified. Applying cloud mutations requires `--confirm`.
3. **Target Project Binding:** Script validates `new URL(env.SUPABASE_URL).hostname`, ensuring it communicates with the configured Supabase host.
4. **Source Path Validation:** Validates file existence on disk (`public/` and `frontend/public/`), validates file size <= 5MB, and validates binary magic bytes via `validateImageSignature`.
5. **Post-Upload Verification:** After `storage.upload()`, lists the object in the bucket and confirms `remote.size === localBuffer.length`. Database `UPDATE` is aborted if remote verification fails.
6. **Scoped Database Updates:** Uses `UPDATE public.product_images SET storage_path = $1 WHERE id = $2` with the record's UUID primary key.
7. **Resumability:** Derives deterministic paths (`products/migrated-${img.id}-${basename}.${ext}`). Checks `list()` for existing objects; skips already-uploaded files. Database query filters `WHERE storage_path LIKE '/products/%'`, ignoring already-migrated rows.
8. **Zero Local Deletions:** Verified. Zero `fs.unlink` or deletion calls in the script.

---

## 5. Production Environment Preflight

### 5.1 Environment Variable Verification (No Secrets Printed)

| Variable | Scope | Status | Preflight Verification Finding |
| :--- | :--- | :--- | :--- |
| `PORT` | Backend | Configured | Default `5000` (or host assigned). |
| `NODE_ENV` | Backend | Configured | `production` mode validates JWT secret length. |
| `SUPABASE_URL` | Backend | Configured | Valid URL pointing to target project ref `tmzedtqltmtjubdguybe`. |
| `SUPABASE_ANON_KEY` | Backend | Configured | Valid JWT public anon key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend Only | Configured | Valid service role key. Strictly isolated to server runtime. |
| `SUPABASE_STORAGE_BUCKET` | Backend | Configured | Defaults to `product-images`. |
| `DATABASE_URL` | Backend Only | Configured | Valid connection string. |
| `VITE_SUPABASE_URL` | Frontend | Configured | Public URL pointing to `tmzedtqltmtjubdguybe`. |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Configured | Public anon key. |
| `VITE_SERVICE_ROLE_KEY` | Frontend | **ABSENT** | Confirmed 0 occurrences in client environment, source, or build bundles. |

### 5.2 Failure & Logging Safety
- Missing required environment variables trigger immediate fatal error in `src/config/env.ts` on startup, preventing booting in a broken state.
- Logging: Error handlers and storage service logs output correlation IDs and sanitized error messages. Secrets, JWTs, and service-role keys are never logged.

---

## 6. Verification Test Matrix

All automated test suites and builds were executed cleanly:

| Pipeline Stage | Command | Target / Scope | Result | Execution Details |
| :--- | :--- | :--- | :--- | :--- |
| **Storage Security Test Suite** | `npx tsx --test tests/storage.test.ts` | 13 security and concurrency cases | **PASS** | Magic numbers, limits, traversal, advisory locks, cleanup verified. |
| **Backend TypeScript Build** | `npm run build` | API server compilation (`tsc`) | **PASS** | 0 errors. Output emitted to `dist/`. |
| **Frontend Unit / Contract Tests** | `npm --prefix frontend run test` | 70 test suites, 139 tests | **PASS** | 139/139 passed in 2.3s. |
| **Frontend Typecheck** | `npm --prefix frontend run typecheck` | React / TypeScript (`tsc --noEmit`) | **PASS** | 0 errors. |
| **Frontend Production Build** | `npm --prefix frontend run build` | Vite production bundle | **PASS** | Bundled in 8.25s. |
| **Browser E2E** | N/A | Full browser automation | **NOT VERIFIED** | No browser framework configured in repository. |

---

## 7. Exact Ordered Deployment Plan

When authorized by the release coordinator, execute the deployment in the following 10 strict sequential stages:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 AROMA ROSE STORAGE DEPLOYMENT SEQUENCE                      │
└─────────────────────────────────────────────────────────────────────────────┘
  Stage 1: Apply Migration 20261105000500 on Supabase Cloud
     │
  Stage 2: Verify Bucket & Policies in Supabase Dashboard / SQL
     │
  Stage 3: Deploy Backend Code to Production Host
     │
  Stage 4: Test One Controlled Admin Upload via POST /upload-image
     │
  Stage 5: Verify Public CDN Retrieval of Newly Uploaded Image
     │
  Stage 6: Run Migration Script in DRY-RUN Mode
     │
  Stage 7: Review Scanned Counts, File Sizes & Target Paths
     │
  Stage 8: Execute Migration Script with LIVE Confirmation (--confirm)
     │
  Stage 9: Verify Migrated Image URLs & Storefront Page Rendering
     │
  Stage 10: Retain Local Images on Disk (Zero local deletions)
```

### Detailed Steps:

1. **Stage 1 — Apply Storage Migration:**
   Execute database push to remote Supabase production:
   ```bash
   npx supabase db push --remote
   ```
2. **Stage 2 — Verify Bucket & Storage Policies:**
   Run read-only query to confirm bucket and policy creation:
   ```bash
   npx supabase db query --remote --read-only "SELECT id, name, public FROM storage.buckets WHERE id = 'product-images';"
   npx supabase db query --remote --read-only "SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND policyname = 'Public Access to product-images';"
   ```
3. **Stage 3 — Deploy Application Code:**
   Deploy updated backend API and frontend bundles to production hosting.
4. **Stage 4 — Controlled Admin Upload Test:**
   Log into admin panel (`/admin/products/new`) and upload one test image (JPEG, <= 5MB). Verify response contains `{ storage_path: "products/...", public_url: "https://..." }`.
5. **Stage 5 — Verify Public CDN Access:**
   Open the returned `public_url` in a browser window without authentication. Confirm HTTP 200 OK and valid image display.
6. **Stage 6 — Execute Migration Script in Dry-Run Mode:**
   ```bash
   npx tsx scripts/migrate-images-to-supabase-storage.ts --dry-run
   ```
7. **Stage 7 — Review Migration Counts:**
   Confirm scanned records match expected catalog image count. Verify 0 validation errors.
8. **Stage 8 — Execute Live Cloud Migration:**
   ```bash
   npx tsx scripts/migrate-images-to-supabase-storage.ts --confirm
   ```
9. **Stage 9 — Storefront Verification:**
   Inspect storefront pages (`/`, `/shop`, `/product/:slug`). Confirm images load cleanly via Supabase CDN.
10. **Stage 10 — Retain Local Image Assets:**
    Retain all images in `public/products/` on the server disk as immutable backup. Do not delete local assets.

---

## 8. Rollback Procedure

If Supabase Storage experiences an outage, service disruption, or configuration defect:

1. **Application Layer Rollback:**
   - In `src/modules/products/products.service.ts`, revert `uploadProductImage` to local file write mode.
   - Deploy backend hotfix.
2. **Database Integrity During Rollback:**
   - No database records need to be deleted or rewritten.
   - Any images with `storage_path` starting with `/` continue to serve locally via Express static handler.
   - Any images with cloud paths (`products/...`) continue to resolve via `getStoragePublicUrl`.
3. **Storage Bucket Rollback:**
   - If bucket needs to be disabled, set `public = false` in `storage.buckets` via Supabase Dashboard.
   - Local files remain 100% intact on disk, ensuring zero catalog data loss.

---

## 9. Final Preflight Release Status

### **READY FOR CONTROLLED PRODUCTION DEPLOYMENT**

All security controls, referential integrity guards, advisory locks, and test suites are verified.
No remote database, storage, or Git modifications have been performed.
