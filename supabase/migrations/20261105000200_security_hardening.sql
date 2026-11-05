-- ==============================================================================
-- Aroma Rose — Mission 06 Security Hardening Migration
-- Migration: 20261105000200_security_hardening.sql
-- ==============================================================================

-- 1. Ensure auth.users has encrypted_password for secure local credential validation
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS encrypted_password TEXT;

-- 2. Align database RLS with RBAC: Only Admins (not staff) may insert manual inventory adjustments
DROP POLICY IF EXISTS "Staff can insert manual inventory adjustments" ON public.inventory_movements;
DROP POLICY IF EXISTS "Admins can insert manual inventory adjustments" ON public.inventory_movements;

CREATE POLICY "Admins can insert manual inventory adjustments"
ON public.inventory_movements FOR INSERT
TO authenticated
WITH CHECK (public.fn_is_admin() AND movement_type = 'manual_adjustment');
