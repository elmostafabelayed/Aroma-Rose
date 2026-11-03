# Aroma Rose — Supabase Storage Architecture & Provisioning Guide

**Target Component:** Supabase Storage (`catalog` bucket)  
**Security Classification:** Public Read / Authorized Admin Write  

---

## 1. Storage Overview

The Aroma Rose product catalog requires storage for high-resolution imagery showcasing Moroccan Damask rose botanicals, oils, and skincare packaging.

The database stores metadata in [`public.product_images`](file:///home/elmostafa/Documents/work/Aroma%20Rose/docs/database.md#L35) pointing to storage paths (e.g. `catalog/eaux-florales/rose-water-250.webp`).

The backend API uses [`src/utils/storage.ts`](file:///home/elmostafa/Documents/work/Aroma%20Rose/src/utils/storage.ts) to automatically resolve storage paths into full public CDN URLs:
`${SUPABASE_URL}/storage/v1/object/public/catalog/${path}`

---

## 2. Bucket Provisioning Specification

When setting up Supabase Storage in Supabase Cloud or self-hosted Supabase:

1. **Bucket Identifier:** `catalog`
2. **Access Control:** Public (Objects are readable without authentication)
3. **Allowed MIME Types:**
   - `image/webp` (Preferred for speed and high quality)
   - `image/jpeg` / `image/jpg`
   - `image/png`
   - `image/avif`
4. **Maximum Upload Size Limit:** `5MB` (`5242880 bytes`)

---

## 3. Storage Security & Row Level Security (RLS) Policies

To protect the storage bucket from unauthorized uploads or deletions, execute the following SQL policies in Supabase:

```sql
-- 1. Ensure RLS is active on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Allow Public Anonymous and Authenticated users to view catalog images
CREATE POLICY "Public Read Catalog Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'catalog');

-- 3. Restrict Uploads to Authenticated Staff and Administrators
CREATE POLICY "Staff Can Upload Catalog Images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'catalog'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND is_active = true
          AND role IN ('admin', 'staff')
    )
);

-- 4. Restrict Updates and Replacements to Authenticated Staff and Administrators
CREATE POLICY "Staff Can Update Catalog Images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'catalog'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND is_active = true
          AND role IN ('admin', 'staff')
    )
);

-- 5. Restrict Deletions to Administrators Only
CREATE POLICY "Admins Can Delete Catalog Images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'catalog'
    AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND is_active = true
          AND role = 'admin'
    )
);
```

---

## 4. Directory Conventions & Image Optimization

Image files must be placed within logical category subfolders:

`catalog/{category-slug}/{product-slug}-{display_order}.webp`

Examples:
- `catalog/eaux-florales/eau-de-rose-distillee-250ml-1.webp`
- `catalog/huiles-serums/huile-essentielle-rose-5ml-1.webp`

### Image Standards
- Aspect Ratio: `1:1` (square product shot) or `4:5` (editorial vertical).
- Color Profile: sRGB.
- Modern WebP format with 85% compression quality for optimal page loading speeds.
