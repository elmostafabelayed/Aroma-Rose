-- ==============================================================================
-- Aroma Rose — Mission 06 Security Hardening Migration
-- Migration: 20261105000200_security_hardening.sql
-- ==============================================================================

-- 1. Ensure auth.users has encrypted_password for secure local credential validation (skipped in cloud where native)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'encrypted_password'
    ) THEN
        BEGIN
            ALTER TABLE auth.users ADD COLUMN encrypted_password TEXT;
        EXCEPTION WHEN insufficient_privilege THEN
            NULL; -- Handled natively by Supabase Auth in cloud
        END;
    END IF;
END $$;

-- 2. Align database RLS with RBAC: Only Admins (not staff) may insert manual inventory adjustments
DROP POLICY IF EXISTS "Staff can insert manual inventory adjustments" ON public.inventory_movements;
DROP POLICY IF EXISTS "Admins can insert manual inventory adjustments" ON public.inventory_movements;

CREATE POLICY "Admins can insert manual inventory adjustments"
ON public.inventory_movements FOR INSERT
TO authenticated
WITH CHECK (public.fn_is_admin() AND movement_type = 'manual_adjustment');

