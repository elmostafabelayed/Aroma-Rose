-- ==============================================================================
-- Aroma Rose — Database Foundation Migration
-- File: supabase/migrations/20261103000100_initial_schema.sql
-- Description: Mission 02 Initial Schema: 10 Core Entities, Finite State Machine,
--              Atomic Inventory Deduction, RLS Policies & Security Hardening.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. EXTENSIONS & SUPABASE COMPATIBILITY LAYER
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Supabase auth schema and mock auth.users / auth.uid() if running outside Supabase cloud
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_schema = 'auth' AND routine_name = 'uid') THEN
        CREATE SCHEMA IF NOT EXISTS auth;
        CREATE TABLE IF NOT EXISTS auth.users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT UNIQUE,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now()
        );
        EXECUTE $fn$
            CREATE OR REPLACE FUNCTION auth.uid()
            RETURNS UUID
            LANGUAGE sql STABLE
            SET search_path = public, pg_temp
            AS $body$
                SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
            $body$;
        $fn$;
    END IF;
END $$;

-- Create standard Supabase roles if they do not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 1. ENUMS
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'staff');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_source') THEN
        CREATE TYPE order_source AS ENUM ('website', 'whatsapp');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE payment_method AS ENUM ('cod');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'refunded');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_movement_type') THEN
        CREATE TYPE inventory_movement_type AS ENUM ('order_shipment', 'manual_adjustment', 'restock', 'return_restock');
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. SEQUENCES
-- ------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1001;

-- ------------------------------------------------------------------------------
-- 3. CORE TABLES
-- ------------------------------------------------------------------------------

-- 3.1. profiles (Admin and Staff linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'staff',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.2. customers (Guest Checkout Customer Information)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    postal_code TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.3. categories (Product Categories)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.4. products (Product Catalog & Inventory)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    sku TEXT UNIQUE,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    compare_at_price NUMERIC(12, 2) CHECK (compare_at_price IS NULL OR compare_at_price >= price),
    cost_price NUMERIC(12, 2) CHECK (cost_price IS NULL OR cost_price >= 0),
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.5. product_images (Image Metadata referencing Supabase Storage)
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    alt_text TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.6. orders (Centralized Website and WhatsApp Orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    order_source order_source NOT NULL DEFAULT 'website',
    status order_status NOT NULL DEFAULT 'pending',
    payment_method payment_method NOT NULL DEFAULT 'cod',
    payment_status payment_status NOT NULL DEFAULT 'unpaid',
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    shipping_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (shipping_fee >= 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    shipping_city TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    shipping_phone TEXT NOT NULL,
    customer_notes TEXT,
    admin_notes TEXT,
    created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Critical business constraints:
    CONSTRAINT chk_order_total_match CHECK (total_amount = subtotal + shipping_fee),
    CONSTRAINT chk_whatsapp_order_creator CHECK (order_source != 'whatsapp' OR created_by_profile_id IS NOT NULL)
);

-- 3.7. order_items (Product & Price Snapshots)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name_snapshot TEXT NOT NULL,
    product_sku_snapshot TEXT,
    unit_price_snapshot NUMERIC(12, 2) NOT NULL CHECK (unit_price_snapshot >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_order_item_total CHECK (total_price = unit_price_snapshot * quantity)
);

-- 3.8. order_status_history (Audit Trail of Order Lifecycle)
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    from_status order_status,
    to_status order_status NOT NULL,
    changed_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.9. inventory_movements (Stock Movement Ledger)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    movement_type inventory_movement_type NOT NULL,
    quantity_change INT NOT NULL CHECK (quantity_change != 0),
    previous_stock INT NOT NULL CHECK (previous_stock >= 0),
    new_stock INT NOT NULL CHECK (new_stock >= 0),
    performed_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.10. audit_logs (Administrative Action Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 4. INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_primary_product_image ON public.product_images(product_id) WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders(order_source);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_order_id ON public.inventory_movements(order_id);
-- Idempotency index: strictly prevents duplicate stock deductions for the same product in a shipped order
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_order_shipment_movement
ON public.inventory_movements(order_id, product_id)
WHERE movement_type = 'order_shipment';

CREATE INDEX IF NOT EXISTS idx_audit_logs_profile_id ON public.audit_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- ------------------------------------------------------------------------------
-- 5. BUSINESS LOGIC FUNCTIONS & TRIGGERS
-- ------------------------------------------------------------------------------

-- 5.1. Timestamp updater
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- 5.2. Auto Order Number Generator
CREATE OR REPLACE FUNCTION public.fn_generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := 'AR-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('order_number_seq')::text, 4, '0');
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_generate_order_number ON public.orders;
CREATE TRIGGER trg_orders_generate_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.fn_generate_order_number();

-- 5.3. Strict Order Lifecycle State Machine Validator
CREATE OR REPLACE FUNCTION public.fn_validate_order_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    -- No change in status
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Validate transition paths
    IF OLD.status = 'pending' AND NEW.status IN ('confirmed', 'cancelled') THEN
        NULL; -- Valid
    ELSIF OLD.status = 'confirmed' AND NEW.status IN ('processing', 'cancelled') THEN
        NULL; -- Valid
    ELSIF OLD.status = 'processing' AND NEW.status IN ('shipped', 'cancelled') THEN
        NULL; -- Valid
    ELSIF OLD.status = 'shipped' AND NEW.status = 'delivered' THEN
        NULL; -- Valid
    ELSE
        RAISE EXCEPTION 'Invalid order status transition from "%" to "%". Allowed paths: pending->(confirmed|cancelled), confirmed->(processing|cancelled), processing->(shipped|cancelled), shipped->delivered.',
            OLD.status, NEW.status
            USING ERRCODE = 'check_violation';
    END IF;

    -- Update timestamp markers
    IF NEW.status = 'delivered' THEN
        NEW.delivered_at := COALESCE(NEW.delivered_at, now());
    ELSIF NEW.status = 'cancelled' THEN
        NEW.cancelled_at := COALESCE(NEW.cancelled_at, now());
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_01_validate_status_transition ON public.orders;
DROP TRIGGER IF EXISTS trg_orders_validate_status_transition ON public.orders;
CREATE TRIGGER trg_orders_01_validate_status_transition
BEFORE UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.fn_validate_order_status_transition();

-- 5.4. Atomic Stock Deduction on Shipment
CREATE OR REPLACE FUNCTION public.fn_handle_order_shipment_and_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_item RECORD;
BEGIN
    -- Only trigger when status is changing into 'shipped'
    IF OLD.status != 'shipped' AND NEW.status = 'shipped' THEN

        -- Verify order has items
        IF NOT EXISTS (SELECT 1 FROM public.order_items WHERE order_id = NEW.id) THEN
            RAISE EXCEPTION 'Cannot ship order % because it contains no order items.', NEW.order_number
                USING ERRCODE = 'check_violation';
        END IF;

        -- Step 1: Explicitly lock affected product rows in deterministic ascending ID sequence
        -- to prevent deadlocks and concurrent race conditions
        PERFORM 1
        FROM public.products
        WHERE id IN (SELECT product_id FROM public.order_items WHERE order_id = NEW.id)
        ORDER BY id ASC
        FOR UPDATE;

        -- Step 2: Verify stock sufficiency for all products (aggregated by product_id)
        FOR v_item IN
            SELECT
                oi.product_id,
                SUM(oi.quantity)::INT AS total_quantity,
                p.name AS live_product_name,
                p.stock_quantity
            FROM public.order_items oi
            JOIN public.products p ON p.id = oi.product_id
            WHERE oi.order_id = NEW.id
            GROUP BY oi.product_id, p.name, p.stock_quantity, p.id
            ORDER BY p.id ASC
        LOOP
            IF v_item.stock_quantity < v_item.total_quantity THEN
                RAISE EXCEPTION 'Insufficient stock for product "%" (ID: %). Requested: %, Available: %',
                    v_item.live_product_name, v_item.product_id, v_item.total_quantity, v_item.stock_quantity
                    USING ERRCODE = 'check_violation';
            END IF;
        END LOOP;

        -- Step 3: Deduct stock and record immutable inventory movement entries
        FOR v_item IN
            SELECT
                oi.product_id,
                SUM(oi.quantity)::INT AS total_quantity,
                p.stock_quantity
            FROM public.order_items oi
            JOIN public.products p ON p.id = oi.product_id
            WHERE oi.order_id = NEW.id
            GROUP BY oi.product_id, p.stock_quantity, p.id
            ORDER BY p.id ASC
        LOOP
            -- Atomic deduction
            UPDATE public.products
            SET stock_quantity = stock_quantity - v_item.total_quantity,
                updated_at = now()
            WHERE id = v_item.product_id;

            -- Record stock movement
            INSERT INTO public.inventory_movements (
                product_id,
                order_id,
                movement_type,
                quantity_change,
                previous_stock,
                new_stock,
                performed_by_profile_id,
                notes
            ) VALUES (
                v_item.product_id,
                NEW.id,
                'order_shipment',
                -v_item.total_quantity,
                v_item.stock_quantity,
                v_item.stock_quantity - v_item.total_quantity,
                NEW.created_by_profile_id,
                'Automated stock deduction for shipment of order ' || NEW.order_number
            );
        END LOOP;

        NEW.shipped_at := COALESCE(NEW.shipped_at, now());
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_02_handle_shipment ON public.orders;
DROP TRIGGER IF EXISTS trg_orders_handle_shipment ON public.orders;
CREATE TRIGGER trg_orders_02_handle_shipment
BEFORE UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.fn_handle_order_shipment_and_stock();

-- 5.5. Historical Integrity: Prevent Modification or Deletion of Shipped Order Items
CREATE OR REPLACE FUNCTION public.fn_prevent_shipped_order_items_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_status order_status;
    v_target_order_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_target_order_id := OLD.order_id;
    ELSE
        v_target_order_id := NEW.order_id;
    END IF;

    SELECT status INTO v_order_status FROM public.orders WHERE id = v_target_order_id;

    IF v_order_status IN ('shipped', 'delivered', 'cancelled') THEN
        RAISE EXCEPTION 'Historical integrity violation: Cannot % order item for an order currently in "%" status.',
            TG_OP, v_order_status
            USING ERRCODE = 'check_violation';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_items_prevent_shipped_mod ON public.order_items;
CREATE TRIGGER trg_order_items_prevent_shipped_mod
BEFORE INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_shipped_order_items_modification();

-- 5.6. Order Status History Automatic Audit Trigger
CREATE OR REPLACE FUNCTION public.fn_log_order_status_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.order_status_history (
            order_id,
            from_status,
            to_status,
            changed_by_profile_id,
            notes
        ) VALUES (
            NEW.id,
            NULL,
            NEW.status,
            NEW.created_by_profile_id,
            'Order created via ' || NEW.order_source::text
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.order_status_history (
            order_id,
            from_status,
            to_status,
            changed_by_profile_id,
            notes
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            NEW.created_by_profile_id,
            'Order status transitioned from ' || OLD.status::text || ' to ' || NEW.status::text
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_log_status_history ON public.orders;
CREATE TRIGGER trg_orders_log_status_history
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.fn_log_order_status_history();

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES & GRANTS
-- ------------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is an active admin or staff
CREATE OR REPLACE FUNCTION public.fn_is_admin_or_staff()
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND is_active = true
          AND role IN ('admin', 'staff')
    );
$$;

CREATE OR REPLACE FUNCTION public.fn_is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND is_active = true
          AND role = 'admin'
    );
$$;

-- 6.1. categories Policies
-- Public (anon) and authenticated can view active categories
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories"
ON public.categories FOR SELECT
USING (is_active = true);

-- Staff/Admin can view all categories
DROP POLICY IF EXISTS "Staff can view all categories" ON public.categories;
CREATE POLICY "Staff can view all categories"
ON public.categories FOR SELECT
TO authenticated
USING (public.fn_is_admin_or_staff());

-- Staff/Admin can manage categories
DROP POLICY IF EXISTS "Staff can insert categories" ON public.categories;
CREATE POLICY "Staff can insert categories"
ON public.categories FOR INSERT
TO authenticated
WITH CHECK (public.fn_is_admin_or_staff());

DROP POLICY IF EXISTS "Staff can update categories" ON public.categories;
CREATE POLICY "Staff can update categories"
ON public.categories FOR UPDATE
TO authenticated
USING (public.fn_is_admin_or_staff())
WITH CHECK (public.fn_is_admin_or_staff());

-- 6.2. products Policies
-- Public can view active products
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products"
ON public.products FOR SELECT
USING (is_active = true);

-- Staff/Admin can view all products
DROP POLICY IF EXISTS "Staff can view all products" ON public.products;
CREATE POLICY "Staff can view all products"
ON public.products FOR SELECT
TO authenticated
USING (public.fn_is_admin_or_staff());

-- Staff/Admin can insert and update products
DROP POLICY IF EXISTS "Staff can insert products" ON public.products;
CREATE POLICY "Staff can insert products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (public.fn_is_admin_or_staff());

DROP POLICY IF EXISTS "Staff can update products" ON public.products;
CREATE POLICY "Staff can update products"
ON public.products FOR UPDATE
TO authenticated
USING (public.fn_is_admin_or_staff())
WITH CHECK (public.fn_is_admin_or_staff());

-- 6.3. product_images Policies
-- Public can view images for active products
DROP POLICY IF EXISTS "Public can view images of active products" ON public.product_images;
CREATE POLICY "Public can view images of active products"
ON public.product_images FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = product_images.product_id
          AND p.is_active = true
    )
);

-- Staff/Admin can view all product images
DROP POLICY IF EXISTS "Staff can view all product images" ON public.product_images;
CREATE POLICY "Staff can view all product images"
ON public.product_images FOR SELECT
TO authenticated
USING (public.fn_is_admin_or_staff());

-- Staff/Admin can manage product images
DROP POLICY IF EXISTS "Staff can manage product images" ON public.product_images;
CREATE POLICY "Staff can manage product images"
ON public.product_images FOR ALL
TO authenticated
USING (public.fn_is_admin_or_staff())
WITH CHECK (public.fn_is_admin_or_staff());

-- 6.4. profiles Policies
-- Authenticated users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Admin can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.fn_is_admin());

-- Admin can manage all profiles
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
CREATE POLICY "Admins can manage profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.fn_is_admin())
WITH CHECK (public.fn_is_admin());

-- 6.5. customers Policies (No public access; only staff/admin and backend service_role)
DROP POLICY IF EXISTS "Staff can view customers" ON public.customers;
CREATE POLICY "Staff can view customers"
ON public.customers FOR SELECT
TO authenticated
USING (public.fn_is_admin_or_staff());

DROP POLICY IF EXISTS "Staff can update customers" ON public.customers;
CREATE POLICY "Staff can update customers"
ON public.customers FOR UPDATE
TO authenticated
USING (public.fn_is_admin_or_staff())
WITH CHECK (public.fn_is_admin_or_staff());

-- 6.6. orders Policies
DROP POLICY IF EXISTS "Staff can view orders" ON public.orders;
CREATE POLICY "Staff can view orders"
ON public.orders FOR SELECT
TO authenticated
USING (public.fn_is_admin_or_staff());

DROP POLICY IF EXISTS "Staff can create orders" ON public.orders;
CREATE POLICY "Staff can create orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (public.fn_is_admin_or_staff());

DROP POLICY IF EXISTS "Staff can update orders" ON public.orders;
CREATE POLICY "Staff can update orders"
ON public.orders FOR UPDATE
TO authenticated
USING (public.fn_is_admin_or_staff())
WITH CHECK (public.fn_is_admin_or_staff());

-- 6.7. order_items Policies
DROP POLICY IF EXISTS "Staff can view order items" ON public.order_items;
CREATE POLICY "Staff can view order items"
ON public.order_items FOR SELECT
TO authenticated
USING (public.fn_is_admin_or_staff());

DROP POLICY IF EXISTS "Staff can insert order items" ON public.order_items;
CREATE POLICY "Staff can insert order items"
ON public.order_items FOR INSERT
TO authenticated
WITH CHECK (public.fn_is_admin_or_staff());

-- 6.8. order_status_history Policies
DROP POLICY IF EXISTS "Staff can view order status history" ON public.order_status_history;
CREATE POLICY "Staff can view order status history"
ON public.order_status_history FOR SELECT
TO authenticated
USING (public.fn_is_admin_or_staff());

-- 6.9. inventory_movements Policies
DROP POLICY IF EXISTS "Staff can view inventory movements" ON public.inventory_movements;
CREATE POLICY "Staff can view inventory movements"
ON public.inventory_movements FOR SELECT
TO authenticated
USING (public.fn_is_admin_or_staff());

DROP POLICY IF EXISTS "Staff can insert manual inventory adjustments" ON public.inventory_movements;
CREATE POLICY "Staff can insert manual inventory adjustments"
ON public.inventory_movements FOR INSERT
TO authenticated
WITH CHECK (public.fn_is_admin_or_staff() AND movement_type = 'manual_adjustment');

-- 6.10. audit_logs Policies
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.fn_is_admin());

-- ------------------------------------------------------------------------------
-- 7. ROLE PERMISSIONS & GRANTS
-- ------------------------------------------------------------------------------
-- Revoke all public execution/access by default
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- Anon grants (Read-only catalog for storefront visitors)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.product_images TO anon;

-- Authenticated grants (Staff & Admin dashboard operators)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT SELECT ON public.order_status_history TO authenticated;
GRANT SELECT, INSERT ON public.inventory_movements TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.order_number_seq TO authenticated;

-- Service Role grants (Full trusted backend execution)
GRANT ALL ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant execution on safe helper functions
GRANT EXECUTE ON FUNCTION public.fn_is_admin_or_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_is_admin() TO authenticated;
