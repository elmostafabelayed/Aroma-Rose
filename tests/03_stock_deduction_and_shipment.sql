-- ==============================================================================
-- Aroma Rose — Test Suite 03: Atomic Stock Deduction & Inventory Ledger
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
    v_mov_count INT;
    v_history_count INT;
    v_err_caught BOOLEAN;
BEGIN
    RAISE NOTICE '>>> TEST 03.1: Creating test customer and products with known stock levels...';
    INSERT INTO public.customers (first_name, last_name, phone, city, address)
    VALUES ('Amina', 'Benali', '+212600000003', 'Casablanca', 'Boulevard d''Anfa')
    RETURNING id INTO v_cust_id;

    INSERT INTO public.products (name, slug, price, stock_quantity)
    VALUES ('Organic Damask Rose Water 500ml', 'org-damask-rose-water-500ml', 120.00, 50)
    RETURNING id INTO v_prod1_id;

    INSERT INTO public.products (name, slug, price, stock_quantity)
    VALUES ('Pure Rose Essential Oil 5ml', 'pure-rose-essential-oil-5ml', 450.00, 20)
    RETURNING id INTO v_prod2_id;

    -- Create multi-product order: 5x Prod1 (600.00) + 3x Prod2 (1350.00) + shipping (50.00) = 2000.00
    INSERT INTO public.orders (
        order_number, customer_id, order_source, status,
        subtotal, shipping_fee, total_amount,
        shipping_city, shipping_address, shipping_phone
    ) VALUES (
        'ORD-TEST-SHIP-01', v_cust_id, 'website', 'pending',
        1950.00, 50.00, 2000.00,
        'Casablanca', 'Boulevard d''Anfa', '+212600000003'
    ) RETURNING id INTO v_order_id;

    INSERT INTO public.order_items (
        order_id, product_id, product_name_snapshot,
        unit_price_snapshot, quantity, total_price
    ) VALUES (
        v_order_id, v_prod1_id, 'Organic Damask Rose Water 500ml',
        120.00, 5, 600.00
    );

    INSERT INTO public.order_items (
        order_id, product_id, product_name_snapshot,
        unit_price_snapshot, quantity, total_price
    ) VALUES (
        v_order_id, v_prod2_id, 'Pure Rose Essential Oil 5ml',
        450.00, 3, 1350.00
    );

    RAISE NOTICE '>>> TEST 03.2: Transitioning order pending -> confirmed -> processing...';
    UPDATE public.orders SET status = 'confirmed' WHERE id = v_order_id;
    UPDATE public.orders SET status = 'processing' WHERE id = v_order_id;

    -- Verify stock remains completely untouched before shipment
    SELECT stock_quantity INTO v_p1 FROM public.products WHERE id = v_prod1_id;
    SELECT stock_quantity INTO v_p2 FROM public.products WHERE id = v_prod2_id;
    IF v_p1.stock_quantity != 50 OR v_p2.stock_quantity != 20 THEN
        RAISE EXCEPTION 'FAIL: Stock was altered prior to shipment! Prod1: %, Prod2: %', v_p1.stock_quantity, v_p2.stock_quantity;
    END IF;
    RAISE NOTICE 'PASS: Stock is NOT reserved or deducted before shipment (Prod1: 50, Prod2: 20).';

    RAISE NOTICE '>>> TEST 03.3: Transitioning order processing -> shipped (triggering atomic stock deduction)...';
    UPDATE public.orders SET status = 'shipped' WHERE id = v_order_id;

    -- Verify stock deductions
    SELECT stock_quantity INTO v_p1 FROM public.products WHERE id = v_prod1_id;
    SELECT stock_quantity INTO v_p2 FROM public.products WHERE id = v_prod2_id;

    IF v_p1.stock_quantity != 45 THEN
        RAISE EXCEPTION 'FAIL: Prod1 stock expected 45, got %', v_p1.stock_quantity;
    END IF;
    IF v_p2.stock_quantity != 17 THEN
        RAISE EXCEPTION 'FAIL: Prod2 stock expected 17, got %', v_p2.stock_quantity;
    END IF;
    RAISE NOTICE 'PASS: Stock deducted accurately (Prod1: 50->45, Prod2: 20->17).';

    RAISE NOTICE '>>> TEST 03.4: Verifying inventory_movements ledger entries...';
    SELECT COUNT(*) INTO v_mov_count
    FROM public.inventory_movements
    WHERE order_id = v_order_id AND movement_type = 'order_shipment';

    IF v_mov_count != 2 THEN
        RAISE EXCEPTION 'FAIL: Expected 2 inventory movement records, found %', v_mov_count;
    END IF;

    -- Check specific movement record values
    IF NOT EXISTS (
        SELECT 1 FROM public.inventory_movements
        WHERE order_id = v_order_id AND product_id = v_prod1_id
          AND quantity_change = -5 AND previous_stock = 50 AND new_stock = 45
    ) THEN
        RAISE EXCEPTION 'FAIL: Prod1 inventory movement ledger entry invalid!';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.inventory_movements
        WHERE order_id = v_order_id AND product_id = v_prod2_id
          AND quantity_change = -3 AND previous_stock = 20 AND new_stock = 17
    ) THEN
        RAISE EXCEPTION 'FAIL: Prod2 inventory movement ledger entry invalid!';
    END IF;
    RAISE NOTICE 'PASS: Immutable inventory movement records match exact stock delta.';

    RAISE NOTICE '>>> TEST 03.5: Verifying order_status_history audit trail...';
    SELECT COUNT(*) INTO v_history_count FROM public.order_status_history WHERE order_id = v_order_id;
    -- Initial insert (pending) + 3 transitions (confirmed, processing, shipped) = 4 records
    IF v_history_count != 4 THEN
        RAISE EXCEPTION 'FAIL: Expected 4 status history records, got %', v_history_count;
    END IF;
    RAISE NOTICE 'PASS: order_status_history accurately recorded all 4 lifecycle states.';

    RAISE NOTICE '>>> TEST 03.6: Verifying idempotency: duplicate shipment movement index prevents duplicate deduction...';
    v_err_caught := false;
    BEGIN
        INSERT INTO public.inventory_movements (
            product_id, order_id, movement_type,
            quantity_change, previous_stock, new_stock
        ) VALUES (
            v_prod1_id, v_order_id, 'order_shipment',
            -5, 45, 40
        );
    EXCEPTION WHEN unique_violation THEN
        v_err_caught := true;
        RAISE NOTICE 'PASS: Unique partial index blocked duplicate shipment deduction record.';
    END;
    IF NOT v_err_caught THEN
        RAISE EXCEPTION 'FAIL: Duplicate shipment movement was allowed!';
    END IF;

    RAISE NOTICE '>>> ALL TEST SUITE 03 ASSERTIONS PASSED SUCCESSFULLY.';
END $$;

ROLLBACK;
