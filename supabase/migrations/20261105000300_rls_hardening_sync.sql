-- ==============================================================================
-- Aroma Rose — Mission 06.3A.1: RLS Hardening & Privilege Synchronization
-- Migration: 20261105000300_rls_hardening_sync.sql
-- ==============================================================================
-- Persists security hardening already applied to the remote Supabase database:
-- 1. Replaces broad public SELECT on public.store_settings with authenticated
--    Admin & Staff read policy.
-- 2. Preserves the existing Admin-only update policy on public.store_settings.
-- 3. Enforces backend-mediated access by revoking direct table privileges on
--    public.store_settings from anon and authenticated.
-- 4. Revokes TRUNCATE, REFERENCES, and TRIGGER permissions on all public tables
--    from anon and authenticated roles.
-- 5. Enforces ALTER DEFAULT PRIVILEGES for future tables in schema public for the
--    migration execution role (postgres).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. STORE SETTINGS ROW LEVEL SECURITY (RLS) HARDENING
-- ------------------------------------------------------------------------------

-- Ensure RLS is active on store_settings
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Drop legacy broad read policy if present
DROP POLICY IF EXISTS "Allow read access to store settings" ON public.store_settings;

-- Idempotently drop and recreate the hardened Admin/Staff SELECT policy
DROP POLICY IF EXISTS "Allow admin and staff to read store settings" ON public.store_settings;
CREATE POLICY "Allow admin and staff to read store settings"
ON public.store_settings
FOR SELECT
TO authenticated
USING (public.fn_is_admin_or_staff());

-- Ensure the existing admin-only update policy remains preserved
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'store_settings'
          AND policyname = 'Allow admin to update store settings'
    ) THEN
        CREATE POLICY "Allow admin to update store settings"
        ON public.store_settings
        FOR ALL
        TO authenticated
        USING (public.fn_is_admin())
        WITH CHECK (public.fn_is_admin());
    END IF;
END $$;

-- Preserve backend-mediated access model:
-- The application accesses store_settings exclusively via the backend Express
-- service (pg.Pool). Direct PostgREST access is not required by frontend or guest users.
-- Revoke all table-level privileges from client roles (anon, authenticated).
REVOKE ALL ON public.store_settings FROM anon, authenticated;

-- ------------------------------------------------------------------------------
-- 2. REVOKE TRUNCATE, REFERENCES & TRIGGER PRIVILEGES ON EXISTING TABLES
-- ------------------------------------------------------------------------------
-- Prevent untrusted client roles from executing TRUNCATE, defining foreign keys,
-- or creating triggers on any existing tables in the public schema.

REVOKE TRUNCATE, REFERENCES, TRIGGER
ON ALL TABLES IN SCHEMA public
FROM anon, authenticated;

-- ------------------------------------------------------------------------------
-- 3. DEFAULT PRIVILEGES FOR FUTURE TABLES
-- ------------------------------------------------------------------------------
-- In PostgreSQL, ALTER DEFAULT PRIVILEGES is strictly role-specific (applies to
-- objects created by a designated role). Omitting FOR ROLE binds to the current
-- role executing this migration (e.g., postgres).

ALTER DEFAULT PRIVILEGES IN SCHEMA public
REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM anon, authenticated;

-- Explicitly configure for role 'postgres' if the executing session user is a member
-- of 'postgres'. Roles that the current user does not belong to (e.g. supabase_admin)
-- cannot be altered in PostgreSQL and must be configured under their own session.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres')
       AND pg_has_role('postgres', 'MEMBER') THEN
        ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
        REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM anon, authenticated;
    END IF;
END $$;
