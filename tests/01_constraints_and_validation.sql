-- ==============================================================================
-- Aroma Rose — Test Suite 01: Constraints and Basic Validation
-- ==============================================================================
\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
    v_admin_id UUID := gen_random_uuid();
    v_cust_id UUID;
    v_cat_id UUID;
    v_prod_id UUID;
    v_order_id UUID;
    v_err_caught BOOLEAN := false;
BEGIN
    RAISE NOTICE '>>> TEST 01.1: Setting up mock admin profile...';
    INSERT INTO auth.users (id, email) VALUES (v_admin_id, 'admin_test@aromarose.local');
    INSERT INTO public.profiles (id, full_name, role) VALUES (v_admin_id, 'Test Admin', 'admin');

    RAISE NOTICE '>>> TEST 01.2: Verifying product stock_quantity cannot be negative...';
    v_err_caught := false;
    BEGIN
        INSERT INTO public.products (name, slug, price, stock_quantity)
        VALUES ('Negative Stock Rose Water', 'neg-stock-rose-water', 150.00, -5);
    EXCEPTION WHEN check_violation THEN
        v_err_caught := true;
        RAISE NOTICE 'PASS: Negative stock_quantity was rejected by CHECK constraint.';
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'FAIL: Negative stock_quantity was accepted!';
    END IF;

    RAISE NOTICE '>>> TEST 01.3: Verifying product compare_at_price constraint...';
    v_err_caught := false;
    BEGIN
        -- compare_at_price must be >= price
        INSERT INTO public.products (name, slug, price, compare_at_price, stock_quantity)
        VALUES ('Invalid Compare Rose Water', 'inv-comp-rose-water', 150.00, 100.00, 10);
    EXCEPTION WHEN check_violation THEN
        v_err_caught := true;
        RAISE NOTICE 'PASS: compare_at_price < price was rejected by CHECK constraint.';
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'FAIL: compare_at_price < price was accepted!';
    END IF;

    RAISE NOTICE '>>> TEST 01.4: Verifying order total_amount = subtotal + shipping_fee constraint...';
    INSERT INTO public.customers (first_name, last_name, phone, city, address)
    VALUES ('Fatima', 'Zahra', '+212600000001', 'Kelaat M''Gouna', 'Avenue Mohammed V')
    RETURNING id INTO v_cust_id;

    v_err_caught := false;
    BEGIN
        -- Mismatched total (subtotal 200 + shipping 30 != 250)
        INSERT INTO public.orders (
            order_number, customer_id, order_source, status,
            subtotal, shipping_fee, total_amount,
            shipping_city, shipping_address, shipping_phone
        ) VALUES (
            'TEST-ORD-MISMATCH', v_cust_id, 'website', 'pending',
            200.00, 30.00, 250.00,
            'Kelaat M''Gouna', 'Avenue Mohammed V', '+212600000001'
        );
    EXCEPTION WHEN check_violation THEN
        v_err_caught := true;
        RAISE NOTICE 'PASS: Mismatched total_amount was rejected by CHECK constraint.';
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'FAIL: Mismatched total_amount was accepted!';
    END IF;

    RAISE NOTICE '>>> TEST 01.5: Verifying WhatsApp order MUST record authenticated creator...';
    v_err_caught := false;
    BEGIN
        -- WhatsApp order with created_by_profile_id = NULL
        INSERT INTO public.orders (
            order_number, customer_id, order_source, status,
            subtotal, shipping_fee, total_amount,
            shipping_city, shipping_address, shipping_phone,
            created_by_profile_id
        ) VALUES (
            'TEST-ORD-WA-NOCREATOR', v_cust_id, 'whatsapp', 'pending',
            200.00, 30.00, 230.00,
            'Kelaat M''Gouna', 'Avenue Mohammed V', '+212600000001',
            NULL
        );
    EXCEPTION WHEN check_violation THEN
        v_err_caught := true;
        RAISE NOTICE 'PASS: WhatsApp order without created_by_profile_id was rejected.';
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'FAIL: WhatsApp order without creator was accepted!';
    END IF;

    -- Valid WhatsApp order with creator succeeds
    INSERT INTO public.orders (
        order_number, customer_id, order_source, status,
        subtotal, shipping_fee, total_amount,
        shipping_city, shipping_address, shipping_phone,
        created_by_profile_id
    ) VALUES (
        'TEST-ORD-WA-VALID', v_cust_id, 'whatsapp', 'pending',
        200.00, 30.00, 230.00,
        'Kelaat M''Gouna', 'Avenue Mohammed V', '+212600000001',
        v_admin_id
    ) RETURNING id INTO v_order_id;
    RAISE NOTICE 'PASS: WhatsApp order with valid admin profile succeeded (Order ID: %).', v_order_id;

    RAISE NOTICE '>>> TEST 01.6: Verifying order_item total_price constraint...';
    INSERT INTO public.products (name, slug, price, stock_quantity)
    VALUES ('Pure Rose Water 250ml', 'pure-rose-water-250ml', 100.00, 20)
    RETURNING id INTO v_prod_id;

    v_err_caught := false;
    BEGIN
        -- Mismatched item total: 2 units * 100 != 250
        INSERT INTO public.order_items (
            order_id, product_id, product_name_snapshot,
            unit_price_snapshot, quantity, total_price
        ) VALUES (
            v_order_id, v_prod_id, 'Pure Rose Water 250ml',
            100.00, 2, 250.00
        );
    EXCEPTION WHEN check_violation THEN
        v_err_caught := true;
        RAISE NOTICE 'PASS: Incorrect order_item total_price was rejected by CHECK constraint.';
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'FAIL: Incorrect order_item total_price was accepted!';
    END IF;

    RAISE NOTICE '>>> ALL TEST SUITE 01 ASSERTIONS PASSED SUCCESSFULLY.';
END $$;

ROLLBACK;

