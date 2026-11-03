#!/usr/bin/env bash
# ==============================================================================
# Aroma Rose — Test Suite 06: Concurrency Stock Safety Under Race Conditions
# ==============================================================================
set -euo pipefail

DB_NAME="aroma_rose_test"
CONTAINER="aroma_rose_test_db"

echo ">>> TEST 06.1: Setting up race condition test harness..."

docker exec -i "$CONTAINER" psql -U postgres -d "$DB_NAME" -v ON_ERROR_STOP=1 << 'EOSQL'
BEGIN;

-- Clean any previous concurrent test data
SET session_replication_role = 'replica';
DELETE FROM public.inventory_movements WHERE product_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.order_status_history WHERE order_id IN ('22222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222');
DELETE FROM public.order_items WHERE order_id IN ('22222222-2222-2222-2222-222222222221', '22222222-2222-2222-2222-222222222222');
DELETE FROM public.orders WHERE order_number IN ('ORD-CONC-01', 'ORD-CONC-02');
DELETE FROM public.products WHERE id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.customers WHERE phone = '+212600000006';
SET session_replication_role = 'origin';

-- Create customer
INSERT INTO public.customers (first_name, last_name, phone, city, address)
VALUES ('Hassan', 'Idrissi', '+212600000006', 'Ouarzazate', 'Kasbah')
ON CONFLICT DO NOTHING;

-- Create product with limited stock: 5 units
INSERT INTO public.products (id, name, slug, price, stock_quantity)
VALUES ('11111111-1111-1111-1111-111111111111', 'Limited Damask Rose Oil 10ml', 'limited-damask-rose-oil-10ml', 500.00, 5);

-- Order 1 requests 4 units (Subtotal: 2000.00)
INSERT INTO public.orders (
    id, order_number, customer_id, order_source, status,
    subtotal, shipping_fee, total_amount,
    shipping_city, shipping_address, shipping_phone
) VALUES (
    '22222222-2222-2222-2222-222222222221', 'ORD-CONC-01',
    (SELECT id FROM public.customers WHERE phone = '+212600000006'),
    'website', 'processing',
    2000.00, 0.00, 2000.00,
    'Ouarzazate', 'Kasbah', '+212600000006'
);

INSERT INTO public.order_items (
    order_id, product_id, product_name_snapshot,
    unit_price_snapshot, quantity, total_price
) VALUES (
    '22222222-2222-2222-2222-222222222221',
    '11111111-1111-1111-1111-111111111111',
    'Limited Damask Rose Oil 10ml',
    500.00, 4, 2000.00
);

-- Order 2 requests 3 units (Subtotal: 1500.00)
INSERT INTO public.orders (
    id, order_number, customer_id, order_source, status,
    subtotal, shipping_fee, total_amount,
    shipping_city, shipping_address, shipping_phone
) VALUES (
    '22222222-2222-2222-2222-222222222222', 'ORD-CONC-02',
    (SELECT id FROM public.customers WHERE phone = '+212600000006'),
    'website', 'processing',
    1500.00, 0.00, 1500.00,
    'Ouarzazate', 'Kasbah', '+212600000006'
);

INSERT INTO public.order_items (
    order_id, product_id, product_name_snapshot,
    unit_price_snapshot, quantity, total_price
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Limited Damask Rose Oil 10ml',
    500.00, 3, 1500.00
);

COMMIT;
EOSQL

echo ">>> Initial stock: 5 units. Total competing orders request: 4 + 3 = 7 units."
echo ">>> TEST 06.2: Firing simultaneous concurrent shipment transactions..."

OUT1="/tmp/conc_ship_1.out"
OUT2="/tmp/conc_ship_2.out"
rm -f "$OUT1" "$OUT2"

# Execute two parallel database client connections competing to transition to shipped
docker exec aroma_rose_test_db psql -U postgres -d "$DB_NAME" -c "UPDATE public.orders SET status = 'shipped' WHERE order_number = 'ORD-CONC-01';" > "$OUT1" 2>&1 &
PID1=$!

docker exec aroma_rose_test_db psql -U postgres -d "$DB_NAME" -c "UPDATE public.orders SET status = 'shipped' WHERE order_number = 'ORD-CONC-02';" > "$OUT2" 2>&1 &
PID2=$!

EXIT1=0
EXIT2=0
wait "$PID1" || EXIT1=$?
wait "$PID2" || EXIT2=$?

echo "--- Result of Connection 1 (Exit code: $EXIT1) ---"
cat "$OUT1"
echo "--- Result of Connection 2 (Exit code: $EXIT2) ---"
cat "$OUT2"

echo ">>> TEST 06.3: Verifying that exactly one transaction succeeded and one failed..."
if [ "$EXIT1" -eq 0 ] && [ "$EXIT2" -ne 0 ]; then
    echo "PASS: Connection 1 succeeded and Connection 2 was rejected due to insufficient stock."
elif [ "$EXIT1" -ne 0 ] && [ "$EXIT2" -eq 0 ]; then
    echo "PASS: Connection 2 succeeded and Connection 1 was rejected due to insufficient stock."
else
    echo "FAIL: Unexpected concurrency outcome: Exit1=$EXIT1, Exit2=$EXIT2"
    exit 1
fi

echo ">>> TEST 06.4: Verifying final stock quantity in database is positive..."
docker exec -i "$CONTAINER" psql -U postgres -d "$DB_NAME" -t -A -c "
DO \$\$
DECLARE
    v_final_stock INT;
    v_movements_count INT;
BEGIN
    SELECT stock_quantity INTO v_final_stock
    FROM public.products
    WHERE id = '11111111-1111-1111-1111-111111111111';

    IF v_final_stock < 0 THEN
        RAISE EXCEPTION 'CRITICAL FAILURE: Stock quantity became negative: %', v_final_stock;
    END IF;

    RAISE NOTICE 'PASS: Final stock is strictly positive: % (never negative).', v_final_stock;

    SELECT COUNT(*) INTO v_movements_count
    FROM public.inventory_movements
    WHERE product_id = '11111111-1111-1111-1111-111111111111';

    IF v_movements_count != 1 THEN
        RAISE EXCEPTION 'CRITICAL FAILURE: Expected exactly 1 inventory movement, got %', v_movements_count;
    END IF;

    RAISE NOTICE 'PASS: Exactly 1 inventory movement recorded in ledger.';
END \$\$;
"

# Cleanup test records
docker exec -i "$CONTAINER" psql -U postgres -d "$DB_NAME" -c "
SET session_replication_role = 'replica';
DELETE FROM public.inventory_movements WHERE product_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.order_items WHERE product_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.orders WHERE order_number IN ('ORD-CONC-01', 'ORD-CONC-02');
DELETE FROM public.products WHERE id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.customers WHERE phone = '+212600000006';
SET session_replication_role = 'origin';
" > /dev/null

echo ">>> ALL TEST SUITE 06 CONCURRENCY ASSERTIONS PASSED SUCCESSFULLY."
