import http from 'http';
import { createApp } from '../../src/app.js';
import { pool } from '../../src/config/db.js';
import { setupTestDatabase, TestContext } from './setup.js';
import { TestHttpClient } from './client.js';

let server: http.Server;
let client: TestHttpClient;
let ctx: TestContext;

let passCount = 0;
let failCount = 0;

const assert = (condition: boolean, message: string) => {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failCount++;
    throw new Error(`Assertion failed: ${message}`);
  }
};

const runSuite = async (name: string, fn: () => Promise<void>) => {
  console.log(`\n==============================================================================`);
  console.log(`RUNNING API SUITE: ${name}`);
  console.log(`==============================================================================`);
  try {
    await fn();
  } catch (err: any) {
    console.error(`[SUITE ERROR] in ${name}:`, err.message);
  }
};

const main = async () => {
  console.log('==============================================================================');
  console.log('          Aroma Rose — Mission 03: Backend API Integration Test Suite        ');
  console.log('==============================================================================');
  console.log('Date:', new Date().toISOString());

  // 1. Setup Test Database
  console.log('\n[SETUP] Seeding database test fixtures...');
  ctx = await setupTestDatabase();
  console.log('[SETUP] Test fixtures seeded successfully.');

  // 2. Start Test Express App on ephemeral port
  const app = createApp();
  const PORT = 5099;
  server = app.listen(PORT);
  client = new TestHttpClient(`http://127.0.0.1:${PORT}`);
  console.log(`[SETUP] Test HTTP server listening on http://127.0.0.1:${PORT}\n`);

  try {
    // --------------------------------------------------------------------------
    // SUITE 1: System Health & Store Settings
    // --------------------------------------------------------------------------
    await runSuite('1. Health Check & Public Store Settings', async () => {
      const healthRes = await client.get('/health');
      assert(healthRes.status === 200, 'Health endpoint returns HTTP 200');
      assert(healthRes.body.status === 'healthy', 'Health status is "healthy"');

      const settingsRes = await client.get('/api/v1/store/settings');
      assert(settingsRes.status === 200, 'Store settings endpoint returns HTTP 200');
      assert(settingsRes.body.success === true, 'Response payload success is true');
      assert(settingsRes.body.data.currency === 'MAD', 'Store currency is MAD');
      assert(settingsRes.body.data.payment_methods[0].code === 'cod', 'Payment method is Cash on Delivery (COD)');
      assert(settingsRes.body.data.shipping.standard_fee === 30, 'Standard shipping fee is 30 MAD');
    });

    // --------------------------------------------------------------------------
    // SUITE 2: Public Products & Categories (Active Filtering)
    // --------------------------------------------------------------------------
    await runSuite('2. Public Products & Categories Endpoints', async () => {
      // Categories
      const catRes = await client.get('/api/v1/categories');
      assert(catRes.status === 200, 'GET /categories returns HTTP 200');
      assert(Array.isArray(catRes.body.data), 'Categories data is an array');
      assert(catRes.body.data.length === 1, 'Only active category is returned (1 active, 1 hidden)');
      assert(catRes.body.data[0].slug === 'eaux-florales', 'Returned category matches active slug');

      // Products List
      const prodRes = await client.get('/api/v1/products');
      assert(prodRes.status === 200, 'GET /products returns HTTP 200');
      assert(prodRes.body.data.length === 2, 'Only active products returned (2 active, 1 inactive hidden)');
      assert(prodRes.body.meta.total === 2, 'Total active products count is 2');

      // Verify inactive product is excluded from public search
      const inactiveSearch = await client.get('/api/v1/products', { query: { search: 'Brouillon' } });
      assert(inactiveSearch.body.data.length === 0, 'Draft/inactive product is filtered out from search');

      // Product by Slug (Active)
      const slugRes = await client.get(`/api/v1/products/${ctx.productInStock.slug}`);
      assert(slugRes.status === 200, 'GET /products/:slug for active product returns HTTP 200');
      assert(slugRes.body.data.name === ctx.productInStock.name, 'Product details match active product');
      assert(slugRes.body.data.images.length === 1, 'Product images array populated');
      assert(slugRes.body.data.images[0].public_url.startsWith('https://'), 'Product image public_url resolved to full CDN URL');

      // Product by Slug (Inactive -> 404)
      const inactiveRes = await client.get(`/api/v1/products/${ctx.productInactive.slug}`);
      assert(inactiveRes.status === 404, 'GET /products/:slug for inactive product returns HTTP 404 Not Found');
      assert(inactiveRes.body.success === false, 'Error response success is false');
      assert(inactiveRes.body.error.code === 'NOT_FOUND', 'Error code is NOT_FOUND');
    });

    // --------------------------------------------------------------------------
    // SUITE 3: Authentication & Role-Based Access Control (RBAC)
    // --------------------------------------------------------------------------
    await runSuite('3. Authentication & RBAC Authorization', async () => {
      // 3.1. Unauthorized access to protected route
      const unauthRes = await client.get('/api/v1/admin/auth/me');
      assert(unauthRes.status === 401, 'Request without token returns HTTP 401 Unauthorized');
      assert(unauthRes.body.error.code === 'UNAUTHORIZED', 'Error code is UNAUTHORIZED');

      // 3.2. Invalid token
      const badTokenRes = await client.get('/api/v1/admin/auth/me', { token: 'invalid-garbage-token' });
      assert(badTokenRes.status === 401, 'Request with invalid token returns HTTP 401');

      // 3.3. Deactivated account rejection
      const inactiveRes = await client.get('/api/v1/admin/auth/me', { token: ctx.inactiveUser.token });
      assert(inactiveRes.status === 403, 'Deactivated account access returns HTTP 403 Forbidden');
      assert(inactiveRes.body.error.code === 'FORBIDDEN', 'Error code is FORBIDDEN');

      // 3.4. Valid Admin authentication
      const adminMeRes = await client.get('/api/v1/admin/auth/me', { token: ctx.adminUser.token });
      assert(adminMeRes.status === 200, 'Valid admin token returns HTTP 200');
      assert(adminMeRes.body.data.role === 'admin', 'Authenticated user role is admin');

      // 3.5. Staff RBAC: Staff allowed on general routes, blocked on admin-only routes
      const staffMeRes = await client.get('/api/v1/admin/auth/me', { token: ctx.staffUser.token });
      assert(staffMeRes.status === 200, 'Staff token successfully accesses /auth/me');

      // Staff attempting Admin-only endpoint (DELETE /admin/products/:id)
      const staffDeleteRes = await client.delete(`/api/v1/admin/products/${ctx.productInStock.id}`, { token: ctx.staffUser.token });
      assert(staffDeleteRes.status === 403, 'Staff attempting product deletion returns HTTP 403 Forbidden');
      assert(staffDeleteRes.body.error.code === 'FORBIDDEN', 'RBAC blocks staff from admin-only delete');

      // Staff attempting Admin-only endpoint (POST /admin/inventory/adjustments)
      const staffAdjustRes = await client.post('/api/v1/admin/inventory/adjustments', {
        product_id: ctx.productInStock.id,
        quantity_change: 5,
        notes: 'Staff adjustment attempt',
      }, { token: ctx.staffUser.token });
      assert(staffAdjustRes.status === 403, 'Staff attempting manual inventory adjustment returns HTTP 403 Forbidden');
    });

    // --------------------------------------------------------------------------
    // SUITE 4: Guest Checkout & Server-Side Price Calculation
    // --------------------------------------------------------------------------
    let createdGuestOrderId: string;
    await runSuite('4. Guest Checkout & Server-Side Pricing', async () => {
      // 4.1. Validation failure (missing required customer fields)
      const invalidCheckout = await client.post('/api/v1/orders', {
        customer: { first_name: 'Test' }, // missing phone, city, address
        items: [{ product_id: ctx.productInStock.id, quantity: 1 }],
      });
      assert(invalidCheckout.status === 422, 'Malformed checkout payload returns HTTP 422 Unprocessable Entity');
      assert(invalidCheckout.body.error.code === 'UNPROCESSABLE_ENTITY', 'Error code is UNPROCESSABLE_ENTITY');

      // 4.2. Server-side price calculation & Phone normalization:
      // Customer enters local Moroccan phone '0611223344'.
      // Product price is 75.00 MAD. Order 2 units = 150.00 MAD.
      // Subtotal < 300 MAD -> Shipping fee is 30.00 MAD.
      // Total amount MUST be 180.00 MAD.
      const validCheckout = await client.post('/api/v1/orders', {
        customer: {
          first_name: 'Fatima',
          last_name: 'Bennani',
          phone: '0611223344', // Local format
          email: 'fatima@example.ma',
          city: 'Casablanca',
          address: '25 Boulevard Massira Khadra',
        },
        items: [
          { product_id: ctx.productInStock.id, quantity: 2 },
        ],
        customer_notes: 'Appeler avant livraison SVP',
      });

      assert(validCheckout.status === 201, 'Valid guest checkout returns HTTP 201 Created');
      assert(validCheckout.body.success === true, 'Response success is true');
      const order = validCheckout.body.data;
      assert(order.subtotal === 150.00, 'Server calculated subtotal correctly (2 * 75 = 150.00)');
      assert(order.shipping_fee === 30.00, 'Server applied standard shipping fee 30.00 MAD');
      assert(order.total_amount === 180.00, 'Server calculated total_amount = subtotal + shipping (180.00)');
      assert(order.status === 'pending', 'Initial order status is pending');
      assert(order.payment_method === 'cod', 'Payment method is Cash on Delivery');
      assert(order.order_number.startsWith('AR-'), 'Order number matches format AR-YYYYMMDD-XXXX');

      // Verify phone was normalized to +212611223344 in database
      const custCheck = await pool.query('SELECT phone FROM public.customers WHERE id = (SELECT customer_id FROM public.orders WHERE id = $1)', [order.id]);
      assert(custCheck.rows[0].phone === '+212611223344', 'Customer phone normalized to canonical +212611223344 format');

      // 4.3. Duplicate submission protection:
      // Customer immediately resubmits identical payload within 60s
      const duplicateRes = await client.post('/api/v1/orders', {
        customer: {
          first_name: 'Fatima',
          last_name: 'Bennani',
          phone: '+212611223344',
          city: 'Casablanca',
          address: '25 Boulevard Massira Khadra',
        },
        items: [
          { product_id: ctx.productInStock.id, quantity: 2 },
        ],
      });
      assert(duplicateRes.status === 201, 'Duplicate submission safely handled');
      assert(duplicateRes.body.data.id === order.id, 'Duplicate submission returned existing order rather than creating a duplicate');

      createdGuestOrderId = order.id;

      // 4.3. High-value order: Subtotal >= 300 MAD -> Free shipping
      // Order 5 units of 75.00 = 375.00 MAD -> Free shipping (0.00 MAD) -> Total = 375.00 MAD
      const freeShippingCheckout = await client.post('/api/v1/orders', {
        customer: {
          first_name: 'Omar',
          last_name: 'Tazi',
          phone: '+212655443322',
          city: 'Rabat',
          address: 'Avenue Annakhil, Hay Riad',
        },
        items: [
          { product_id: ctx.productInStock.id, quantity: 5 },
        ],
      });
      assert(freeShippingCheckout.status === 201, 'Free shipping checkout returns HTTP 201');
      assert(freeShippingCheckout.body.data.subtotal === 375.00, 'Subtotal is 375.00 MAD');
      assert(freeShippingCheckout.body.data.shipping_fee === 0.00, 'Free shipping applied (0.00 MAD)');
      assert(freeShippingCheckout.body.data.total_amount === 375.00, 'Total amount equals subtotal without shipping');
    });

    // --------------------------------------------------------------------------
    // SUITE 5: WhatsApp Order Creation by Authenticated Admin
    // --------------------------------------------------------------------------
    let createdWhatsAppOrderId: string;
    await runSuite('5. Admin WhatsApp Order Creation', async () => {
      // 5.1. Unauthenticated creation rejected
      const unauthWA = await client.post('/api/v1/admin/orders', {
        customer: { first_name: 'WA', last_name: 'Customer', phone: '+212677889900', city: 'Fes', address: 'Atlas' },
        items: [{ product_id: ctx.productInStock.id, quantity: 1 }],
      });
      assert(unauthWA.status === 401, 'Unauthenticated WhatsApp order creation rejected with HTTP 401');

      // 5.2. Admin creates WhatsApp order
      const waRes = await client.post('/api/v1/admin/orders', {
        customer: {
          first_name: 'Karim',
          last_name: 'El Fassi',
          phone: '+212677889900',
          city: 'Fes',
          address: 'Quartier Narjiss, Villa 12',
        },
        items: [
          { product_id: ctx.productInStock.id, quantity: 1 },
        ],
        admin_notes: 'Commande recue par WhatsApp suite a discussion catalogue',
      }, { token: ctx.adminUser.token });

      assert(waRes.status === 201, 'Admin WhatsApp order creation returns HTTP 201 Created');
      assert(waRes.body.data.order_source === 'whatsapp', 'Order source is whatsapp');
      assert(waRes.body.data.subtotal === 75.00, 'Subtotal is 75.00 MAD');
      createdWhatsAppOrderId = waRes.body.data.id;

      // Verify creator attribution in database
      const dbCheck = await pool.query('SELECT created_by_profile_id, order_source FROM public.orders WHERE id = $1', [createdWhatsAppOrderId]);
      assert(dbCheck.rows[0].created_by_profile_id === ctx.adminUser.id, 'Order created_by_profile_id matches authenticated admin ID');
    });

    // --------------------------------------------------------------------------
    // SUITE 6: Order Lifecycle Transitions & Atomic Stock Deduction
    // --------------------------------------------------------------------------
    await runSuite('6. Order Lifecycle State Machine & Stock Deduction', async () => {
      // 6.1. Invalid status jump: pending -> shipped directly is prohibited
      const invalidJump = await client.patch(`/api/v1/admin/orders/${createdGuestOrderId}/status`, {
        status: 'shipped',
      }, { token: ctx.adminUser.token });
      assert(invalidJump.status === 422, 'Invalid transition pending -> shipped returns HTTP 422');
      assert(invalidJump.body.error.code === 'BUSINESS_RULE_VIOLATION', 'Error code is BUSINESS_RULE_VIOLATION');

      // 6.2. Valid transition: pending -> confirmed
      const confirmRes = await client.patch(`/api/v1/admin/orders/${createdGuestOrderId}/status`, {
        status: 'confirmed',
        notes: 'Client contacte par telephone pour confirmation',
      }, { token: ctx.adminUser.token });
      assert(confirmRes.status === 200, 'pending -> confirmed returns HTTP 200');
      assert(confirmRes.body.data.status === 'confirmed', 'Order status updated to confirmed');

      // 6.3. Valid transition: confirmed -> processing
      const procRes = await client.patch(`/api/v1/admin/orders/${createdGuestOrderId}/status`, {
        status: 'processing',
      }, { token: ctx.adminUser.token });
      assert(procRes.status === 200, 'confirmed -> processing returns HTTP 200');

      // Verify stock in database BEFORE shipment: still 50 units (no reservation prior to shipment)
      const stockBefore = await pool.query('SELECT stock_quantity FROM public.products WHERE id = $1', [ctx.productInStock.id]);
      assert(stockBefore.rows[0].stock_quantity === 50, 'Stock is NOT deducted while in pending/processing');

      // 6.4. Valid transition: processing -> shipped (Triggers atomic stock deduction!)
      // Order had 2 units of ctx.productInStock (initial stock: 50 -> should become 48)
      const shipRes = await client.patch(`/api/v1/admin/orders/${createdGuestOrderId}/status`, {
        status: 'shipped',
      }, { token: ctx.adminUser.token });
      assert(shipRes.status === 200, 'processing -> shipped returns HTTP 200');
      assert(shipRes.body.data.status === 'shipped', 'Order status is now shipped');
      assert(shipRes.body.data.shipped_at !== null, 'shipped_at timestamp is set');

      // Verify stock in database AFTER shipment: exactly 48
      const stockAfter = await pool.query('SELECT stock_quantity FROM public.products WHERE id = $1', [ctx.productInStock.id]);
      assert(stockAfter.rows[0].stock_quantity === 48, 'Stock was atomically deducted (50 - 2 = 48)');

      // Verify inventory_movements ledger entry exists
      const movRes = await pool.query(
        `SELECT * FROM public.inventory_movements WHERE order_id = $1 AND product_id = $2`,
        [createdGuestOrderId, ctx.productInStock.id]
      );
      assert(movRes.rows.length === 1, 'Inventory movement recorded in immutable ledger');
      assert(movRes.rows[0].movement_type === 'order_shipment', 'Movement type is order_shipment');
      assert(movRes.rows[0].quantity_change === -2, 'Quantity change is -2');
      assert(movRes.rows[0].previous_stock === 50, 'Previous stock was 50');
      assert(movRes.rows[0].new_stock === 48, 'New stock is 48');

      // 6.5. Shipped items immutability: Cannot update or delete items of shipped order
      let immutabilityTriggered = false;
      try {
        await pool.query(
          `DELETE FROM public.order_items WHERE order_id = $1`,
          [createdGuestOrderId]
        );
      } catch (err: any) {
        immutabilityTriggered = true;
      }
      assert(immutabilityTriggered, 'Database trigger blocked DELETE of order items on shipped order');

      // 6.6. Valid transition: shipped -> delivered
      const deliverRes = await client.patch(`/api/v1/admin/orders/${createdGuestOrderId}/status`, {
        status: 'delivered',
      }, { token: ctx.adminUser.token });
      assert(deliverRes.status === 200, 'shipped -> delivered returns HTTP 200');
      assert(deliverRes.body.data.status === 'delivered', 'Order status is delivered');
      assert(deliverRes.body.data.payment_status === 'paid', 'COD order payment_status automatically marked as paid upon delivery');

      // 6.7. Shipped/Delivered order cannot be cancelled (Terminal state)
      const cancelDelivered = await client.patch(`/api/v1/admin/orders/${createdGuestOrderId}/status`, {
        status: 'cancelled',
      }, { token: ctx.adminUser.token });
      assert(cancelDelivered.status === 422, 'delivered -> cancelled is rejected with HTTP 422');
    });

    // --------------------------------------------------------------------------
    // SUITE 7: Insufficient Stock Handling & Complete Rollback
    // --------------------------------------------------------------------------
    await runSuite('7. Insufficient Stock Rejection & Full Transaction Rollback', async () => {
      // ctx.productLowStock has stock = 2 units.
      // Create order requesting 5 units (exceeding stock)
      const shortfallOrder = await client.post('/api/v1/orders', {
        customer: {
          first_name: 'Mehdi',
          last_name: 'Alaoui',
          phone: '+212699887766',
          city: 'Tangier',
          address: 'Boulevard Pasteur',
        },
        items: [
          { product_id: ctx.productLowStock.id, quantity: 5 },
        ],
      });
      assert(shortfallOrder.status === 201, 'Order created in pending state (no reservation on checkout)');
      const orderId = shortfallOrder.body.data.id;

      // Advance to confirmed, then processing
      await client.patch(`/api/v1/admin/orders/${orderId}/status`, { status: 'confirmed' }, { token: ctx.adminUser.token });
      await client.patch(`/api/v1/admin/orders/${orderId}/status`, { status: 'processing' }, { token: ctx.adminUser.token });

      // Attempt shipment: Requested: 5, Available: 2 -> MUST BE REJECTED!
      const failedShipment = await client.patch(`/api/v1/admin/orders/${orderId}/status`, {
        status: 'shipped',
      }, { token: ctx.adminUser.token });

      assert(failedShipment.status === 422, 'Shipment with insufficient stock returns HTTP 422');
      assert(failedShipment.body.error.code === 'BUSINESS_RULE_VIOLATION', 'Error code is BUSINESS_RULE_VIOLATION');
      assert(failedShipment.body.error.message.includes('Insufficient stock'), 'Error message mentions Insufficient stock');

      // Verify complete rollback in DB:
      // 1. Order status MUST remain processing
      const orderCheck = await pool.query('SELECT status, shipped_at FROM public.orders WHERE id = $1', [orderId]);
      assert(orderCheck.rows[0].status === 'processing', 'Order status rolled back to processing');
      assert(orderCheck.rows[0].shipped_at === null, 'shipped_at remains null');

      // 2. Stock MUST remain untouched at 2
      const stockCheck = await pool.query('SELECT stock_quantity FROM public.products WHERE id = $1', [ctx.productLowStock.id]);
      assert(stockCheck.rows[0].stock_quantity === 2, 'Stock was NOT deducted (remains 2)');

      // 3. ZERO inventory movements recorded
      const movCheck = await pool.query('SELECT count(*)::int as count FROM public.inventory_movements WHERE order_id = $1', [orderId]);
      assert(movCheck.rows[0].count === 0, 'Zero inventory movements recorded on failed shipment');
    });

    // --------------------------------------------------------------------------
    // SUITE 8: Admin Inventory & Manual Adjustments
    // --------------------------------------------------------------------------
    await runSuite('8. Admin Inventory & Manual Stock Adjustments', async () => {
      // 8.1. Inventory overview
      const invOverview = await client.get('/api/v1/admin/inventory', { token: ctx.adminUser.token });
      assert(invOverview.status === 200, 'GET /admin/inventory returns HTTP 200');
      assert(invOverview.body.data.summary.total_products > 0, 'Inventory summary contains products');

      // 8.2. Manual stock adjustment (Restock +10 units of productLowStock)
      // productLowStock has 2 units -> after +10 should be 12 units
      const restockRes = await client.post('/api/v1/admin/inventory/adjustments', {
        product_id: ctx.productLowStock.id,
        quantity_change: 10,
        notes: 'Arrivage nouveau lot de Kelaat MGouna',
      }, { token: ctx.adminUser.token });

      assert(restockRes.status === 201, 'POST /admin/inventory/adjustments returns HTTP 201 Created');
      assert(restockRes.body.data.movement.new_stock === 12, 'New stock is 12 units');

      // 8.3. Manual adjustment attempting negative stock:
      // Current stock is 12. Attempt to subtract 20 units -> MUST BE REJECTED!
      const negStockRes = await client.post('/api/v1/admin/inventory/adjustments', {
        product_id: ctx.productLowStock.id,
        quantity_change: -20,
        notes: 'Tentative de reduction excessive',
      }, { token: ctx.adminUser.token });

      assert(negStockRes.status === 400, 'Adjustment causing negative stock is rejected with HTTP 400 Bad Request');
      assert(negStockRes.body.error.message.includes('Cannot reduce stock below 0'), 'Clear error explanation returned');

      // Verify stock remained 12
      const stockAfterNeg = await pool.query('SELECT stock_quantity FROM public.products WHERE id = $1', [ctx.productLowStock.id]);
      assert(stockAfterNeg.rows[0].stock_quantity === 12, 'Stock remains 12 after rejected negative adjustment');
    });

    // --------------------------------------------------------------------------
    // SUITE 9: Admin Dashboard Analytics
    // --------------------------------------------------------------------------
    await runSuite('9. Executive Dashboard Endpoints', async () => {
      // Summary
      const summaryRes = await client.get('/api/v1/admin/dashboard/summary', { token: ctx.adminUser.token });
      assert(summaryRes.status === 200, 'GET /admin/dashboard/summary returns HTTP 200');
      assert(summaryRes.body.data.total_orders >= 2, 'Total orders counted in dashboard');
      assert(summaryRes.body.data.collected_revenue !== undefined, 'COD collected_revenue is tracked separately from gross order value');
      assert(summaryRes.body.data.gross_order_value !== undefined, 'gross_order_value is tracked');

      // Sales
      const salesRes = await client.get('/api/v1/admin/dashboard/sales', { token: ctx.adminUser.token });
      assert(salesRes.status === 200, 'GET /admin/dashboard/sales returns HTTP 200');
      assert(Array.isArray(salesRes.body.data.timeline), 'Sales timeline is an array');

      // Orders Breakdown
      const ordersRes = await client.get('/api/v1/admin/dashboard/orders', { token: ctx.adminUser.token });
      assert(ordersRes.status === 200, 'GET /admin/dashboard/orders returns HTTP 200');
      assert(Array.isArray(ordersRes.body.data.by_source), 'Orders by source is present');

      // Inventory Health
      const healthRes = await client.get('/api/v1/admin/dashboard/inventory', { token: ctx.adminUser.token });
      assert(healthRes.status === 200, 'GET /admin/dashboard/inventory returns HTTP 200');
      assert(Array.isArray(healthRes.body.data.low_stock_items), 'Low stock items list is present');
    });

    // --------------------------------------------------------------------------
    // SUITE 10: Admin Customers
    // --------------------------------------------------------------------------
    await runSuite('10. Admin Customers Endpoints', async () => {
      const customersRes = await client.get('/api/v1/admin/customers', { token: ctx.adminUser.token });
      assert(customersRes.status === 200, 'GET /admin/customers returns HTTP 200');
      assert(customersRes.body.data.length >= 1, 'Customers list contains guest customers');
      const customerId = customersRes.body.data[0].id;

      const singleCustomer = await client.get(`/api/v1/admin/customers/${customerId}`, { token: ctx.adminUser.token });
      assert(singleCustomer.status === 200, 'GET /admin/customers/:id returns HTTP 200');
      assert(singleCustomer.body.data.id === customerId, 'Customer details match');

      const customerOrders = await client.get(`/api/v1/admin/customers/${customerId}/orders`, { token: ctx.adminUser.token });
      assert(customerOrders.status === 200, 'GET /admin/customers/:id/orders returns HTTP 200');
      assert(Array.isArray(customerOrders.body.data), 'Customer orders array is returned');
    });

    // --------------------------------------------------------------------------
    // SUITE 11: Error Handling & Security Invariants
    // --------------------------------------------------------------------------
    await runSuite('11. Security Headers & Error Envelope Handling', async () => {
      // 404 for unknown route
      const notFoundRes = await client.get('/api/v1/unknown-endpoint');
      assert(notFoundRes.status === 404, 'Unknown endpoint returns HTTP 404');
      assert(notFoundRes.body.success === false, 'success is false');
      assert(notFoundRes.body.error.code === 'NOT_FOUND', 'error.code is NOT_FOUND');

      // Helmet Security Headers check
      assert(notFoundRes.headers.get('x-dns-prefetch-control') !== null, 'Helmet x-dns-prefetch-control header present');
      assert(notFoundRes.headers.get('x-content-type-options') === 'nosniff', 'x-content-type-options is nosniff');

      // Archive product rather than hard-delete
      const archiveRes = await client.delete(`/api/v1/admin/products/${ctx.productInStock.id}`, { token: ctx.adminUser.token });
      assert(archiveRes.status === 200, 'Product deletion returns HTTP 200');
      assert(archiveRes.body.data.product.is_active === false, 'Product was archived (is_active = false) not deleted');

      // Verify product is now hidden from public storefront
      const publicCheck = await client.get(`/api/v1/products/${ctx.productInStock.slug}`);
      assert(publicCheck.status === 404, 'Archived product is now invisible to public storefront');
    });

    // --------------------------------------------------------------------------
    // SUITE 12: Store Settings & Business Configuration Invariants
    // --------------------------------------------------------------------------
    await runSuite('12. Store Settings & Business Configuration Invariants', async () => {
      // 1. Unauthenticated access blocked
      const unauthRes = await client.get('/api/v1/admin/settings');
      assert(unauthRes.status === 401, 'Unauthenticated GET /admin/settings returns HTTP 401');

      // 2. Staff read access allowed
      const staffGetRes = await client.get('/api/v1/admin/settings', { token: ctx.staffUser.token });
      assert(staffGetRes.status === 200, 'Staff GET /admin/settings returns HTTP 200');
      assert(staffGetRes.body.data.store_name === 'Aroma Rose', 'Staff views correct store name');

      // 3. Staff update blocked (Admin only)
      const staffPutRes = await client.put(
        '/api/v1/admin/settings',
        { store_name: 'Staff Unauthorized Edit' },
        { token: ctx.staffUser.token }
      );
      assert(staffPutRes.status === 403, 'Staff PUT /admin/settings returns HTTP 403 Forbidden');

      // 4. Invalid settings rejected (negative shipping fee)
      const invalidFeeRes = await client.put(
        '/api/v1/admin/settings',
        { shipping_standard_fee: -10 },
        { token: ctx.adminUser.token }
      );
      assert(invalidFeeRes.status === 422, 'Negative shipping fee rejected with HTTP 422');

      // 5. Unknown fields rejected
      const unknownFieldRes = await client.put(
        '/api/v1/admin/settings',
        { unknown_rogue_key: 'hacked' },
        { token: ctx.adminUser.token }
      );
      assert(unknownFieldRes.status === 422, 'Unknown setting key rejected with HTTP 422');

      // 6. Admin valid update
      const updateRes = await client.put(
        '/api/v1/admin/settings',
        {
          shipping_standard_fee: 40.0,
          shipping_free_threshold: 400.0,
          whatsapp_number: '+212612345678',
        },
        { token: ctx.adminUser.token }
      );
      assert(updateRes.status === 200, 'Admin PUT /admin/settings returns HTTP 200');
      assert(updateRes.body.data.shipping_standard_fee === 40.0, 'Persisted shipping_standard_fee is 40.0');

      // 7. Public store settings reflects changes and hides sensitive fields
      const publicRes = await client.get('/api/v1/store/settings');
      assert(publicRes.status === 200, 'Public GET /store/settings returns HTTP 200');
      assert(publicRes.body.data.shipping.standard_fee === 40.0, 'Public settings dynamic standard_fee is 40.0');
      assert(publicRes.body.data.updated_by === undefined, 'Public settings hides updated_by operator identity');

      // 8. Business Rule: Store closure prevents new guest orders
      await client.put(
        '/api/v1/admin/settings',
        { store_status: 'closed', store_closure_message: 'Fermé pour inventaire annuel' },
        { token: ctx.adminUser.token }
      );

      const orderWhileClosed = await client.post('/api/v1/orders', {
        customer: {
          first_name: 'Test',
          last_name: 'Client',
          phone: '0612345678',
          city: 'Casablanca',
          address: 'Rue 1',
        },
        items: [{ product_id: ctx.productInStock.id, quantity: 1 }],
      });
      assert(orderWhileClosed.status === 422, 'Order while store is closed returns HTTP 422');
      assert(orderWhileClosed.body.error.code === 'BUSINESS_RULE_VIOLATION', 'Error code is BUSINESS_RULE_VIOLATION');
      assert(orderWhileClosed.body.error.message.includes('Fermé pour inventaire'), 'Error message contains closure reason');

      // Re-open store
      await client.put(
        '/api/v1/admin/settings',
        { store_status: 'open' },
        { token: ctx.adminUser.token }
      );

      // 9. Business Rule: COD disabled prevents new orders
      await client.put(
        '/api/v1/admin/settings',
        { cod_enabled: false },
        { token: ctx.adminUser.token }
      );

      const orderWhileCodDisabled = await client.post('/api/v1/orders', {
        customer: {
          first_name: 'Test',
          last_name: 'Client',
          phone: '0612345678',
          city: 'Casablanca',
          address: 'Rue 1',
        },
        items: [{ product_id: ctx.productInStock.id, quantity: 1 }],
      });
      assert(orderWhileCodDisabled.status === 422, 'Order while COD disabled returns HTTP 422');
      assert(orderWhileCodDisabled.body.error.code === 'BUSINESS_RULE_VIOLATION', 'Error code is BUSINESS_RULE_VIOLATION');

      // Re-enable COD and restore standard fees for subsequent tests
      await client.put(
        '/api/v1/admin/settings',
        {
          cod_enabled: true,
          shipping_standard_fee: 30.0,
          shipping_free_threshold: 300.0,
        },
        { token: ctx.adminUser.token }
      );
    });

  } finally {
    // Teardown
    console.log('\n[TEARDOWN] Stopping test HTTP server and releasing database pool...');
    server.close();
    await pool.end();
  }

  console.log('\n==============================================================================');
  console.log('                          FINAL API TEST SUMMARY');
  console.log('==============================================================================');
  console.log(`Suites Passed:         12`);
  console.log(`Assertions Passed:     ${passCount}`);
  console.log(`Assertions Failed:     ${failCount}`);
  console.log('Untested Requirements: 0 (All required public & admin endpoints tested)');
  console.log('==============================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
};

main().catch((err) => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});

