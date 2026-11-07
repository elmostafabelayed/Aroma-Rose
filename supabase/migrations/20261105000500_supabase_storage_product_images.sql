-- ==============================================================================
-- Aroma Rose — Mission 06.5: Supabase Storage Configuration for Product Images
-- Migration: 20261105000500_supabase_storage_product_images.sql
-- ==============================================================================
-- Purpose:
-- 1. Creates/Configures the public read bucket 'product-images' in storage.buckets.
-- 2. Restricts max file size to 5MB (5242880 bytes).
-- 3. Whitelists permitted image MIME types: jpeg, png, webp, avif.
-- 4. Establishes public read-only RLS policy on storage.objects for CDN caching.
-- 5. Restricts all mutating operations (INSERT, UPDATE, DELETE) to the trusted backend
--    service role (no anon or authenticated client write policies).
-- ==============================================================================

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
-- Drop any existing policy with the same name to guarantee the exact authoritative definition
-- is applied and prevent silently preserving unsafe or drifted policy definitions.
DROP POLICY IF EXISTS "Public Access to product-images" ON storage.objects;

CREATE POLICY "Public Access to product-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');
