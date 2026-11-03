-- ==============================================================================
-- Aroma Rose — Test Suite 02: Order Lifecycle Transitions
-- ==============================================================================
\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
    v_admin_id UUID := gen_random_uuid();
    v_cust_id UUID;
    v_prod_id UUID;
    v_order_id UUID;
    v_err_caught BOOLEAN;
    v_ord RECORD;
BEGIN
    -- Setup baseline records
    INSERT INTO auth.users (id, email) VALUES (v_admin_id, 'admin_transitions@aromarose.local');
    INSERT INTO public.profiles (id, full_name, role) VALUES (v_admin_id, 'Admin Transitions', 'admin');

    INSERT INTO public.customers (first_name, last_name, phone, city, address)
    VALUES ('Khadija', 'Alami', '+212600000002', 'Marrakech', 'Gueliz')
    RETURNING id INTO v_cust_id;

    INSERT INTO public.products (name, slug, price, stock_quantity)
    VALUES ('Rose Facial Mist 100ml', 'rose-facial-mist-100ml', 80.00, 50)
    RETURNING id INTO v_prod_id;

    -- Helper to create test order
    INSERT INTO public.orders (
        order_number, customer_id, order_source, status,
        subtotal, shipping_fee, total_amount,
        shipping_city, shipping_address, shipping_phone
    ) VALUES (
        'ORD-TEST-LIFECYCLE-01', v_cust_id, 'website', 'pending',
        80.00, 20.00, 100.00,
        'Marrakech', 'Gueliz', '+212600000002'
    ) RETURNING id INTO v_order_id;

    INSERT INTO public.order_items (
        order_id, product_id, product_name_snapshot,
        unit_price_snapshot, quantity, total_price
    ) VALUES (
        v_order_id, v_prod_id, 'Rose Facial Mist 100ml',
        80.00, 1, 80.00
    );

    RAISE NOTICE '>>> TEST 02.1: Verifying invalid transition pending -> shipped is blocked...';
    v_err_caught := false;
    BEGIN
        UPDATE public.orders SET status = 'shipped' WHERE id = v_order_id;
    EXCEPTION WHEN check_violation THEN
        v_err_caught := true;
        RAISE NOTICE 'PASS: pending -> shipped was blocked by transition state machine.';
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'FAIL: pending -> shipped was allowed!';
    END IF;

    RAISE NOTICE '>>> TEST 02.2: Verifying valid transition pending -> confirmed...';
    UPDATE public.orders SET status = 'confirmed' WHERE id = v_order_id;
    SELECT status INTO v_ord FROM public.orders WHERE id = v_order_id;
    IF v_ord.status != 'confirmed' THEN
        RAISE EXCEPTION 'FAIL: Status did not update to confirmed!';
    END IF;
    RAISE NOTICE 'PASS: pending -> confirmed succeeded.';

    RAISE NOTICE '>>> TEST 02.3: Verifying invalid transition confirmed -> delivered is blocked...';
    v_err_caught := false;
    BEGIN
        UPDATE public.orders SET status = 'delivered' WHERE id = v_order_id;
    EXCEPTION WHEN check_violation THEN
        v_err_caught := true;
        RAISE NOTICE 'PASS: confirmed -> delivered was blocked.';
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'FAIL: confirmed -> delivered was allowed!';
    END IF;

    RAISE NOTICE '>>> TEST 02.4: Verifying valid transition confirmed -> processing...';
    UPDATE public.orders SET status = 'processing' WHERE id = v_order_id;
    SELECT status INTO v_ord FROM public.orders WHERE id = v_order_id;
    IF v_ord.status != 'processing' THEN
        RAISE EXCEPTION 'FAIL: Status did not update to processing!';
    END IF;
    RAISE NOTICE 'PASS: confirmed -> processing succeeded.';

    RAISE NOTICE '>>> TEST 02.5: Verifying invalid transition processing -> delivered is blocked...';
    v_err_caught := false;
    BEGIN
        UPDATE public.orders SET status = 'delivered' WHERE id = v_order_id;
    EXCEPTION WHEN check_violation THEN
        v_err_caught := true;
        RAISE NOTICE 'PASS: processing -> delivered was blocked.';
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'FAIL: processing -> delivered was allowed!';
    END IF;

    RAISE NOTICE '>>> TEST 02.6: Verifying valid transition processing -> shipped...';
    UPDATE public.orders SET status = 'shipped' WHERE id = v_order_id;
    SELECT status, shipped_at INTO v_ord FROM public.orders WHERE id = v_order_id;
    IF v_ord.status != 'shipped' OR v_ord.shipped_at IS NULL THEN
        RAISE EXCEPTION 'FAIL: Status did not update to shipped or shipped_at timestamp missing!';
    END IF;
    RAISE NOTICE 'PASS: processing -> shipped succeeded with shipped_at = %.', v_ord.shipped_at;

    RAISE NOTICE '>>> TEST 02.7: Verifying cancellation of shipped order is blocked...';
    v_err_caught := false;
    BEGIN
        UPDATE public.orders SET status = 'cancelled' WHERE id = v_order_id;
    EXCEPTION WHEN check_violation THEN
        v_err_caught := true;
        RAISE NOTICE 'PASS: shipped -> cancelled was blocked (cancellation prohibited after shipment).';
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'FAIL: shipped -> cancelled was allowed!';
    END IF;

    RAISE NOTICE '>>> TEST 02.8: Verifying valid transition shipped -> delivered...';
    UPDATE public.orders SET status = 'delivered' WHERE id = v_order_id;
    SELECT status, delivered_at INTO v_ord FROM public.orders WHERE id = v_order_id;
    IF v_ord.status != 'delivered' OR v_ord.delivered_at IS NULL THEN
        RAISE EXCEPTION 'FAIL: Status did not update to delivered or delivered_at timestamp missing!';
    END IF;
    RAISE NOTICE 'PASS: shipped -> delivered succeeded with delivered_at = %.', v_ord.delivered_at;

    RAISE NOTICE '>>> TEST 02.9: Verifying terminal state: transition from delivered is blocked...';
    v_err_caught := false;
    BEGIN
        UPDATE public.orders SET status = 'cancelled' WHERE id = v_order_id;
    EXCEPTION WHEN check_violation THEN
        v_err_caught := true;
        RAISE NOTICE 'PASS: delivered -> cancelled was blocked (terminal state).';
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'FAIL: delivered -> cancelled was allowed!';
    END IF;

    RAISE NOTICE '>>> TEST 02.10: Verifying pre-shipment cancellations are allowed...';
    -- Create fresh order for cancellation test
    INSERT INTO public.orders (
        order_number, customer_id, order_source, status,
        subtotal, shipping_fee, total_amount,
        shipping_city, shipping_address, shipping_phone
    ) VALUES (
        'ORD-TEST-CANCEL-01', v_cust_id, 'website', 'pending',
        80.00, 20.00, 100.00,
        'Marrakech', 'Gueliz', '+212600000002'
    ) RETURNING id INTO v_order_id;

    -- pending -> cancelled
    UPDATE public.orders SET status = 'cancelled' WHERE id = v_order_id;
    SELECT status, cancelled_at INTO v_ord FROM public.orders WHERE id = v_order_id;
    IF v_ord.status != 'cancelled' OR v_ord.cancelled_at IS NULL THEN
        RAISE EXCEPTION 'FAIL: Order was not cancelled properly!';
    END IF;
    RAISE NOTICE 'PASS: pending -> cancelled succeeded with cancelled_at = %.', v_ord.cancelled_at;

    -- Verify cancelled order cannot be reactivated
    v_err_caught := false;
    BEGIN
        UPDATE public.orders SET status = 'pending' WHERE id = v_order_id;
    EXCEPTION WHEN check_violation THEN
        v_err_caught := true;
        RAISE NOTICE 'PASS: cancelled -> pending was blocked (cancelled is terminal).';
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'FAIL: cancelled -> pending was allowed!';
    END IF;

    RAISE NOTICE '>>> ALL TEST SUITE 02 ASSERTIONS PASSED SUCCESSFULLY.';
END $$;

ROLLBACK;
