-- ==============================================================================
-- Aroma Rose — Test Suite 05: Historical Integrity (Shipped Order Items Immutability)
-- ==============================================================================
\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
    v_cust_id UUID;
    v_prod_id UUID;
    v_order_id UUID;
    v_item_id UUID;
    v_err_caught BOOLEAN;
BEGIN
    RAISE NOTICE '>>> TEST 05.1: Creating test order and item...';
    INSERT INTO public.customers (first_name, last_name, phone, city, address)
    VALUES ('Tariq', 'Ibrahimi', '+212600000005', 'Fes', 'Medina')
    RETURNING id INTO v_cust_id;

    INSERT INTO public.products (name, slug, price, stock_quantity)
    VALUES ('Rose Petal Body Scrub 200ml', 'rose-petal-body-scrub-200ml', 140.00, 30)
    RETURNING id INTO v_prod_id;

    INSERT INTO public.orders (
        order_number, customer_id, order_source, status,
        subtotal, shipping_fee, total_amount,
        shipping_city, shipping_address, shipping_phone
    ) VALUES (
        'ORD-TEST-IMMUT-01', v_cust_id, 'website', 'pending',
        140.00, 30.00, 170.00,
        'Fes', 'Medina', '+212600000005'
    ) RETURNING id INTO v_order_id;

    INSERT INTO public.order_items (
        order_id, product_id, product_name_snapshot,
        unit_price_snapshot, quantity, total_price
    ) VALUES (
        v_order_id, v_prod_id, 'Rose Petal Body Scrub 200ml',
        140.00, 1, 140.00
    ) RETURNING id INTO v_item_id;

    RAISE NOTICE '>>> TEST 05.2: Verifying modification IS permitted while order is pending/processing...';
    UPDATE public.order_items
    SET quantity = 2, total_price = 280.00
    WHERE id = v_item_id;
    -- Revert total back to match order total check
    UPDATE public.orders SET subtotal = 280.00, total_amount = 310.00 WHERE id = v_order_id;
    RAISE NOTICE 'PASS: Item modification allowed while order is in pending status.';

    RAISE NOTICE '>>> TEST 05.3: Advancing order to shipped status...';
    UPDATE public.orders SET status = 'confirmed' WHERE id = v_order_id;
    UPDATE public.orders SET status = 'processing' WHERE id = v_order_id;
    UPDATE public.orders SET status = 'shipped' WHERE id = v_order_id;

    RAISE NOTICE '>>> TEST 05.4: Verifying UPDATE on shipped order item is strictly prohibited...';
    v_err_caught := false;
    BEGIN
        UPDATE public.order_items
        SET quantity = 1, total_price = 140.00
        WHERE id = v_item_id;
    EXCEPTION WHEN check_violation THEN
        v_err_caught := true;
        RAISE NOTICE 'PASS: UPDATE on shipped order item was blocked by integrity trigger.';
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'FAIL: UPDATE was allowed on shipped order item!';
    END IF;

    RAISE NOTICE '>>> TEST 05.5: Verifying DELETE on shipped order item is strictly prohibited...';
    v_err_caught := false;
    BEGIN
        DELETE FROM public.order_items WHERE id = v_item_id;
    EXCEPTION WHEN check_violation THEN
        v_err_caught := true;
        RAISE NOTICE 'PASS: DELETE on shipped order item was blocked by integrity trigger.';
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'FAIL: DELETE was allowed on shipped order item!';
    END IF;

    RAISE NOTICE '>>> TEST 05.6: Verifying INSERT into shipped order is strictly prohibited...';
    v_err_caught := false;
    BEGIN
        INSERT INTO public.order_items (
            order_id, product_id, product_name_snapshot,
            unit_price_snapshot, quantity, total_price
        ) VALUES (
            v_order_id, v_prod_id, 'Extra Scrub',
            140.00, 1, 140.00
        );
    EXCEPTION WHEN check_violation THEN
        v_err_caught := true;
        RAISE NOTICE 'PASS: INSERT into shipped order was blocked by integrity trigger.';
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'FAIL: INSERT into shipped order was allowed!';
    END IF;

    RAISE NOTICE '>>> ALL TEST SUITE 05 ASSERTIONS PASSED SUCCESSFULLY.';
END $$;

ROLLBACK;

