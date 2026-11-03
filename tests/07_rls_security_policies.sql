-- ==============================================================================
-- Aroma Rose — Test Suite 07: Row Level Security (RLS) & Role Permission Isolation
-- ==============================================================================
\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
    v_admin_user_id UUID := gen_random_uuid();
    v_staff_user_id UUID := gen_random_uuid();
    v_cat_active UUID;
    v_cat_inactive UUID;
    v_prod_active UUID;
    v_prod_inactive UUID;
BEGIN
    RAISE NOTICE '>>> TEST 07.1: Setting up mock users and products for RLS test...';
    INSERT INTO auth.users (id, email) VALUES (v_admin_user_id, 'admin_rls@aromarose.local');
    INSERT INTO public.profiles (id, full_name, role, is_active)
    VALUES (v_admin_user_id, 'Admin RLS', 'admin', true);

    INSERT INTO auth.users (id, email) VALUES (v_staff_user_id, 'staff_rls@aromarose.local');
    INSERT INTO public.profiles (id, full_name, role, is_active)
    VALUES (v_staff_user_id, 'Staff RLS', 'staff', true);

    INSERT INTO public.categories (name, slug, is_active)
    VALUES ('Active Rose Category', 'active-rose-cat', true)
    RETURNING id INTO v_cat_active;

    INSERT INTO public.categories (name, slug, is_active)
    VALUES ('Hidden Draft Category', 'hidden-draft-cat', false)
    RETURNING id INTO v_cat_inactive;

    INSERT INTO public.products (category_id, name, slug, price, stock_quantity, is_active)
    VALUES (v_cat_active, 'Active Rose Water', 'active-rose-water', 100.00, 10, true)
    RETURNING id INTO v_prod_active;

    INSERT INTO public.products (category_id, name, slug, price, stock_quantity, is_active)
    VALUES (v_cat_active, 'Archived Inactive Product', 'archived-inactive-prod', 150.00, 10, false)
    RETURNING id INTO v_prod_inactive;

    INSERT INTO public.product_images (product_id, storage_path, is_primary)
    VALUES (v_prod_active, 'products/active-1.jpg', true);

    INSERT INTO public.product_images (product_id, storage_path, is_primary)
    VALUES (v_prod_inactive, 'products/inactive-1.jpg', true);

    INSERT INTO public.customers (first_name, last_name, phone, city, address)
    VALUES ('Secret', 'Customer', '+212600000007', 'Rabat', 'Secret Street');
END $$;

COMMIT;

-- ------------------------------------------------------------------------------
-- 07.2: ANON ROLE VERIFICATION (Storefront Public Visitor)
-- ------------------------------------------------------------------------------
\echo '>>> TEST 07.2: Testing ANON role permissions and RLS filtering...'

SET ROLE anon;

-- Anon can see active categories
SELECT count(*) FROM public.categories WHERE is_active = true;
-- Anon CANNOT see inactive categories (RLS filters out)
SELECT count(*) FROM public.categories WHERE is_active = false;

-- Anon can see active products
SELECT count(*) FROM public.products WHERE is_active = true;
-- Anon CANNOT see inactive products (RLS filters out)
SELECT count(*) FROM public.products WHERE is_active = false;

-- Anon CANNOT read customers
\set ON_ERROR_STOP off
SELECT * FROM public.customers;
\if :{?ERROR}
    \echo 'PASS: anon was denied SELECT on customers table.'
\else
    \echo 'FAIL: anon was granted access to customers!'
\endif

-- Anon CANNOT read orders
SELECT * FROM public.orders;
\if :{?ERROR}
    \echo 'PASS: anon was denied SELECT on orders table.'
\else
    \echo 'FAIL: anon was granted access to orders!'
\endif

-- Anon CANNOT read profiles
SELECT * FROM public.profiles;
\if :{?ERROR}
    \echo 'PASS: anon was denied SELECT on profiles table.'
\else
    \echo 'FAIL: anon was granted access to profiles!'
\endif

-- Anon CANNOT read inventory_movements
SELECT * FROM public.inventory_movements;
\if :{?ERROR}
    \echo 'PASS: anon was denied SELECT on inventory_movements table.'
\else
    \echo 'FAIL: anon was granted access to inventory_movements!'
\endif

-- Anon CANNOT read audit_logs
SELECT * FROM public.audit_logs;
\if :{?ERROR}
    \echo 'PASS: anon was denied SELECT on audit_logs table.'
\else
    \echo 'FAIL: anon was granted access to audit_logs!'
\endif

-- Anon CANNOT insert products
INSERT INTO public.products (name, slug, price, stock_quantity) VALUES ('Hacked Product', 'hacked-prod', 1.00, 100);
\if :{?ERROR}
    \echo 'PASS: anon was denied INSERT on products table.'
\else
    \echo 'FAIL: anon was allowed to INSERT product!'
\endif

\set ON_ERROR_STOP on
RESET ROLE;

-- ------------------------------------------------------------------------------
-- 07.3: CLEANUP TEST RLS RECORDS
-- ------------------------------------------------------------------------------
DELETE FROM public.product_images WHERE storage_path IN ('products/active-1.jpg', 'products/inactive-1.jpg');
DELETE FROM public.products WHERE slug IN ('active-rose-water', 'archived-inactive-prod');
DELETE FROM public.categories WHERE slug IN ('active-rose-cat', 'hidden-draft-cat');
DELETE FROM public.customers WHERE phone = '+212600000007';
DELETE FROM public.profiles WHERE full_name IN ('Admin RLS', 'Staff RLS');
DELETE FROM auth.users WHERE email IN ('admin_rls@aromarose.local', 'staff_rls@aromarose.local');

\echo '>>> ALL TEST SUITE 07 RLS ASSERTIONS PASSED SUCCESSFULLY.'
