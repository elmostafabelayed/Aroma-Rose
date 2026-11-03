-- ==============================================================================
-- Aroma Rose — Test Suite 04: Insufficient Stock & Full Transaction Rollback
-- ==============================================================================
\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
    v_cust_id UUID;
    v_prod1_id UUID;
    v_prod2_id UUID;
    v_order_id UUID;
    v_p1 RECORD;
    v_p2 RECORD;
    v_ord RECORD;
    v_mov_count INT;
    v_err_caught BOOLEAN := false;
BEGIN
    RAISE NOTICE '>>> TEST 04.1: Setting up multi-item order where one item has insufficient stock...';
    INSERT INTO public.customers (first_name, last_name, phone, city, address)
    VALUES ('Youssef', 'Mansouri', '+212600000004', 'Rabat', 'Agdal')
    RETURNING id INTO v_cust_id;

    -- Prod1: 10 in stock
    INSERT INTO public.products (name, slug, price, stock_quantity)
    VALUES ('Rose Night Serum 30ml', 'rose-night-serum-30ml', 250.00, 10)
    RETURNING id INTO v_prod1_id;

    -- Prod2: only 2 in stock
    INSERT INTO public.products (name, slug, price, stock_quantity)
    VALUES ('Rose Clay Mask 100g', 'rose-clay-mask-100g', 150.00, 2)
    RETURNING id INTO v_prod2_id;

    -- Order requests: 4x Prod1 (has 10) AND 5x Prod2 (only has 2!)
    INSERT INTO public.orders (
        order_number, customer_id, order_source, status,
        subtotal, shipping_fee, total_amount,
        shipping_city, shipping_address, shipping_phone
    ) VALUES (
        'ORD-TEST-ROLLBACK-01', v_cust_id, 'website', 'pending',
        1750.00, 0.00, 1750.00,
        'Rabat', 'Agdal', '+212600000004'
    ) RETURNING id INTO v_order_id;

    INSERT INTO public.order_items (
        order_id, product_id, product_name_snapshot,
        unit_price_snapshot, quantity, total_price
    ) VALUES (
        v_order_id, v_prod1_id, 'Rose Night Serum 30ml',
        250.00, 4, 1000.00
    );

    INSERT INTO public.order_items (
        order_id, product_id, product_name_snapshot,
        unit_price_snapshot, quantity, total_price
    ) VALUES (
        v_order_id, v_prod2_id, 'Rose Clay Mask 100g',
        150.00, 5, 750.00
    );

    UPDATE public.orders SET status = 'confirmed' WHERE id = v_order_id;
    UPDATE public.orders SET status = 'processing' WHERE id = v_order_id;

    RAISE NOTICE '>>> TEST 04.2: Attempting transition processing -> shipped with insufficient stock on Prod2...';
    BEGIN
        UPDATE public.orders SET status = 'shipped' WHERE id = v_order_id;
    EXCEPTION WHEN check_violation THEN
        v_err_caught := true;
        RAISE NOTICE 'PASS: Shipment rejected with check_violation exception as expected.';
    END;

    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'FAIL: Shipment update was permitted despite insufficient stock!';
    END IF;

    RAISE NOTICE '>>> TEST 04.3: Verifying full rollback: order status remains processing...';
    SELECT status, shipped_at INTO v_ord FROM public.orders WHERE id = v_order_id;
    IF v_ord.status != 'processing' THEN
        RAISE EXCEPTION 'FAIL: Order status changed to % despite shipment failure!', v_ord.status;
    END IF;
    IF v_ord.shipped_at IS NOT NULL THEN
        RAISE EXCEPTION 'FAIL: shipped_at was set on failed shipment!';
    END IF;
    RAISE NOTICE 'PASS: Order status remains processing, shipped_at remains NULL.';

    RAISE NOTICE '>>> TEST 04.4: Verifying full rollback: stock of ALL products remains unchanged...';
    SELECT stock_quantity INTO v_p1 FROM public.products WHERE id = v_prod1_id;
    SELECT stock_quantity INTO v_p2 FROM public.products WHERE id = v_prod2_id;

    IF v_p1.stock_quantity != 10 THEN
        RAISE EXCEPTION 'FAIL: Partial deduction occurred! Prod1 stock was deducted to % (expected 10)', v_p1.stock_quantity;
    END IF;
    IF v_p2.stock_quantity != 2 THEN
        RAISE EXCEPTION 'FAIL: Prod2 stock was altered to % (expected 2)', v_p2.stock_quantity;
    END IF;
    RAISE NOTICE 'PASS: Complete rollback verified. Prod1: 10/10, Prod2: 2/2. Zero stock deducted.';

    RAISE NOTICE '>>> TEST 04.5: Verifying zero inventory_movements were generated...';
    SELECT COUNT(*) INTO v_mov_count
    FROM public.inventory_movements
    WHERE order_id = v_order_id;

    IF v_mov_count != 0 THEN
        RAISE EXCEPTION 'FAIL: % inventory movements were recorded on failed shipment!', v_mov_count;
    END IF;
    RAISE NOTICE 'PASS: Exactly 0 inventory movements recorded on aborted shipment.';

    RAISE NOTICE '>>> ALL TEST SUITE 04 ASSERTIONS PASSED SUCCESSFULLY.';
END $$;

ROLLBACK;

