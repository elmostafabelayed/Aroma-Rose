# Aroma Rose — Mission 06.5A: Independent Supabase Storage Security & Migration Review

**Document Version:** 1.0.0
**Audit Date:** November 6, 2026
**Auditor:** Independent Principal Security Engineer & Supabase Storage Reviewer
**Classification:** Independent DevSecOps & Cloud Storage Security Audit
**Target Migration:** `supabase/migrations/20261105000500_supabase_storage_product_images.sql` (Unapplied)
**Transfer Tool:** `scripts/migrate-images-to-supabase-storage.ts`
**Test Suite:** `tests/storage.test.ts` (12/12 Tests Passing)
**HEAD Commit:** `12fef0a` (Clean Working Tree Verified)

---

## 1. Executive Summary & Verdict

### Final Verdict: **SAFE AFTER FIXES**

Following an independent, zero-trust security and data-integrity audit of the implementation from Mission 06.5, three security/integrity vulnerabilities and one operational risk were identified and remediated in the codebase.

With all remediations implemented, verified by automated unit tests (`tests/storage.test.ts`), and confirmed across full frontend and backend builds, the Supabase Storage architecture is certified as **SAFE AFTER FIXES** for deployment when authorized.

---

## 2. Findings Matrix & Remediations Applied

| Finding ID | Title | Component | Severity | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Unreferenced Check Missing During Creation Failure Rollback | `products.service.ts` | **HIGH** | **REMEDIATED** |
| **SEC-02** | Actively Referenced Image Deletion Vulnerability | `products.service.ts` | **HIGH** | **REMEDIATED** |
| **SEC-03** | Path Traversal Vulnerability via Double Dots / Backslashes | `storage.ts` | **MEDIUM** | **REMEDIATED** |
| **OPS-01** | Migration Script Lacked Remote Confirmation & Post-Upload Size Check | `migrate-images-to-supabase-storage.ts` | **MEDIUM** | **REMEDIATED** |
| **COMPAT-01**| Root-Relative URL Over-Restriction in `getStoragePublicUrl` | `storage.ts` | **LOW** | **REMEDIATED** |

---

## 3. Detailed Security Findings

### 3.1 SEC-01: Shared Image Deletion on Failed Transaction Rollback
- **Severity:** HIGH
- **Location:** `src/modules/products/products.service.ts` (`createAdminProduct` catch block)
- **Evidence:**
  The rollback catch block previously iterated `data.images` and unconditionally called `deleteProductImageFromStorage(img.storage_path)`. If an operator created a product reusing an existing image already attached to another catalog item, a failure in product insertion would permanently delete the image from Supabase Storage, corrupting the other active product.
- **Impact:** Permanent loss of shared catalog images and broken storefront image rendering.
- **Remediation:**
  Added a database referential check before executing storage deletion:
  ```typescript
  const refCheck = await query(
    'SELECT 1 FROM public.product_images WHERE storage_path = $1 LIMIT 1',
    [img.storage_path]
  );
  if (refCheck.rows.length === 0) {
    await deleteProductImageFromStorage(img.storage_path);
  } else {
    console.info(`[STORAGE CLEANUP] Preserving "${img.storage_path}" as it is still referenced by other products.`);
  }
  ```

---

### 3.2 SEC-02: Actively Referenced Image Deletion via Admin API
- **Severity:** HIGH
- **Location:** `src/modules/products/products.service.ts` (`deleteProductImage`)
- **Evidence:**
  `deleteProductImage` previously deleted any object matching `products/*` from Supabase Storage without verifying whether any live product in `public.product_images` was actively referencing it.
- **Impact:** Operators could delete images in use, resulting in storefront 404s and broken user experience.
- **Remediation:**
  Enforced a catalog referential check. The endpoint now queries `public.product_images` and rejects deletion with HTTP 409 (`ConflictError`) if the image is still associated with any product:
  ```typescript
  const refCheck = await query(
    'SELECT product_id FROM public.product_images WHERE storage_path = $1 LIMIT 1',
    [storagePath]
  );
  if (refCheck.rows.length > 0) {
    throw new ConflictError(
      `Cannot delete image: storage_path "${storagePath}" is actively referenced by product ${refCheck.rows[0].product_id}. Remove it from the product first.`
    );
  }
  ```

---

### 3.3 SEC-03: Path Traversal Vulnerability via Double Dots / Backslashes
- **Severity:** MEDIUM
- **Location:** `src/utils/storage.ts` (`deleteProductImageFromStorage`)
- **Evidence:**
  The regex `^products\/[a-zA-Z0-9_\-\.]+$` allowed consecutive dots (e.g. `products/..` or `products/..hidden`), and did not guard against Windows-style backslashes (`products\payload`).
- **Impact:** Potential traversal or unexpected storage deletion payloads.
- **Remediation:**
  Added explicit traversal guards and tightened the regex to require standard filename extensions:
  ```typescript
  if (objectPath.includes('..') || objectPath.includes('\\')) {
    console.warn(`[STORAGE SECURITY] Rejected deletion of traversal path: "${storagePath}"`);
    return false;
  }
  if (!/^products\/[a-zA-Z0-9_\-]+(\.[a-zA-Z0-9]+)+$/.test(objectPath)) {
    console.warn(`[STORAGE SECURITY] Rejected deletion of unauthorized storage path: "${storagePath}"`);
    return false;
  }
  ```

---

### 3.4 OPS-01: Migration Script Safety Guard & Upload Verification
- **Severity:** MEDIUM
- **Location:** `scripts/migrate-images-to-supabase-storage.ts`
- **Evidence:**
  1. The transfer script defaulted to LIVE execution if run without `--dry-run`, risking accidental cloud mutations.
  2. The script computed SHA256 checksums but did not verify the uploaded object's size against Supabase Storage before updating the PostgreSQL record.
- **Impact:** Accidental live runs and potential database updates on truncated or incomplete uploads.
- **Remediation:**
  1. Inverted default: script strictly defaults to `--dry-run` unless `--confirm` is explicitly supplied.
  2. Added post-upload verification: queries storage metadata and verifies remote byte size equals local byte size before issuing `UPDATE public.product_images`.

---

### 3.5 COMPAT-01: Root-Relative URL Over-Restriction
- **Severity:** LOW
- **Location:** `src/utils/storage.ts` (`getStoragePublicUrl`)
- **Evidence:**
  `getStoragePublicUrl` previously checked `if (storagePath.startsWith('/products/')) return storagePath;`. Any other root-relative path (e.g. `/placeholder-rose.jpg` or `/assets/logo.svg`) was incorrectly stripped and prefixed with the Supabase CDN host.
- **Impact:** Broken storefront placeholders and asset links.
- **Remediation:**
  Updated to preserve all root-relative local paths: `if (storagePath.startsWith('/')) return storagePath;`.

---

## 4. Comprehensive Security Review Checklist

### 4.1 Bucket Idempotency & Public Visibility
- **Audit:** Migration `20261105000500_supabase_storage_product_images.sql` uses `INSERT INTO storage.buckets ... ON CONFLICT (id) DO UPDATE SET ...`.
- **Verdict:** **PASS**. Re-running migration updates existing bucket properties without error or data loss.

### 4.2 Public Read vs. Public Write Isolation
- **Audit:** `storage.objects` has `rowsecurity = true`. The only policy created is:
  ```sql
  CREATE POLICY "Public Access to product-images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');
  ```
  Zero policies exist for INSERT, UPDATE, or DELETE for `public`, `anon`, or `authenticated` roles.
- **Verdict:** **PASS**. In PostgreSQL, operations lacking an explicit granting policy are denied by default under RLS. Anonymous and authenticated users cannot mutate bucket contents.

### 4.3 Service Role Isolation
- **Audit:** Inspected `src/config/supabase.ts`, `src/config/env.ts`, `frontend/`, and `frontend/dist/`.
- **Verdict:** **PASS**. `SUPABASE_SERVICE_ROLE_KEY` is loaded exclusively by the Node.js backend. Zero references exist in frontend client bundles.

### 4.4 File Signature & MIME Type Verification
- **Audit:** `validateImageSignature` checks binary magic numbers:
  - JPEG: `FF D8 FF`
  - PNG: `89 50 4E 47 0D 0A 1A 0A`
  - WebP: `RIFF` (0..3) + `WEBP` (8..11)
  - AVIF: `ftyp` (4..7) + `avif`/`avis`/`mif1` (8..11)
- **Verdict:** **PASS**. Spoofed scripts (e.g. PHP shell masquerading as JPEG) are rejected with HTTP 400.

### 4.5 Server-Side File Size Enforcement
- **Audit:** `MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024` (5MB). Enforced in `ProductsService.uploadProductImage` prior to storage upload.
- **Verdict:** **PASS**. Oversized payloads are rejected with HTTP 400.

### 4.6 Namespace Containment & Arbitrary Deletion Protection
- **Audit:** Object paths are generated as `products/<timestamp>-<hex>.<ext>`. Deletion requires matching `^products/[a-zA-Z0-9_\-]+(\.[a-zA-Z0-9]+)+$` and forbids `..` and `\`.
- **Verdict:** **PASS**. No file can escape `products/` or target unrelated buckets.

### 4.7 Storage Error Handling & Leakage Prevention
- **Audit:** `uploadProductImageToStorage` catches errors, logs structured diagnostics with bucket context, and throws sanitized `InternalServerError` without exposing API keys or credentials.
- **Verdict:** **PASS**.

---

## 5. Migration Script Audit (`migrate-images-to-supabase-storage.ts`)

| Criterion | Implementation Finding | Result |
| :--- | :--- | :--- |
| **Dry-Run Safety** | Defaults to dry-run; requires explicit `--confirm` flag to execute mutations. | **PASS** |
| **Checksum / Size Verification** | Remote object size is verified against local buffer before DB update. | **PASS** |
| **URL Preservation** | DB `UPDATE` runs only after upload and verification succeed. | **PASS** |
| **Resumability** | Checks if object exists in bucket before upload; filters out migrated paths. | **PASS** |
| **Zero Local Deletions** | No `fs.unlink` or deletion calls exist. All local files preserved. | **PASS** |
| **Scoped DB Updates** | Updates strictly target `WHERE id = $2` with record UUID primary key. | **PASS** |

---

## 6. Compatibility Review

1. **Existing `/products/...` URLs:** Preserved as root-relative URLs by `getStoragePublicUrl`.
2. **Existing Full External URLs:** `http://` and `https://` URLs return unchanged.
3. **No Double-Prefixing:** `pathWithoutBucket` strips redundant `product-images/` prefixes before generating CDN URLs.
4. **Image Ordering & Primary Flag:** Contract preserved across backend and frontend (`is_primary` first, then `display_order ASC`).

---

## 7. Verification Test Results

| Test Category | Command | Scope | Result | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Storage Security Suite** | `npx tsx --test tests/storage.test.ts` | 12 security test cases | **PASS** | Signatures, limits, traversal, cleanup, and referential guards verified. |
| **Backend TypeScript Build** | `npm run build` | API server compilation | **PASS** | 0 errors. Emitted to `dist/`. |
| **Frontend Tests** | `npm --prefix frontend run test` | 70 test suites, 139 tests | **PASS** | 100% test pass rate in 2.1s. |
| **Frontend Typecheck** | `npm --prefix frontend run typecheck` | React / TypeScript | **PASS** | 0 errors. |
| **Frontend Production Build** | `npm --prefix frontend run build` | Vite production bundle | **PASS** | Bundled cleanly in 8.16s. |

---

## 8. Final Certification

### Verdict: **SAFE AFTER FIXES**

All identified vulnerabilities have been remediated, verified, and locked in automated test suites.
No production migrations, bucket creations, or object modifications were executed during this audit.
