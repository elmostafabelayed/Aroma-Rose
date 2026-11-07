import { test, expect } from '@playwright/test';

test.describe('Responsive Design, Mobile Viewports & Security Invariants (Mission 07)', () => {
  const viewports = [
    { name: 'Mobile 320px (iPhone SE narrow)', width: 320, height: 568 },
    { name: 'Mobile 375px (iPhone standard)', width: 375, height: 667 },
    { name: 'Mobile 390px (iPhone 13/14)', width: 390, height: 844 },
    { name: 'Mobile 430px (iPhone Pro Max)', width: 430, height: 932 },
    { name: 'Tablet 768px (iPad portrait)', width: 768, height: 1024 },
    { name: 'Laptop 1024px (iPad landscape / small laptop)', width: 1024, height: 768 },
    { name: 'Desktop 1440px (Standard desktop)', width: 1440, height: 900 },
  ];

  const pagesToAudit = ['/', '/shop', '/cart', '/checkout', '/about', '/contact'];

  for (const vp of viewports) {
    test(`Responsive Audit: Zero horizontal overflow on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const route of pagesToAudit) {
        await page.goto(route);
        await page.waitForLoadState('domcontentloaded');

        // Check document overflow across the entire page
        const isOverflowing = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(isOverflowing, `Horizontal overflow detected on page ${route} at viewport ${vp.width}px`).toBe(false);
      }

      // Verify header and footer are visible without clipping
      await expect(page.locator('header').first()).toBeVisible();
      await expect(page.locator('footer').first()).toBeVisible();
    });
  }

  test('Security: Client-side price tampering is completely ignored by the backend', async ({ page, request }) => {
    // 1. Fetch real active product from public API
    const productsRes = await request.get('http://127.0.0.1:5000/api/v1/products');
    expect(productsRes.status()).toBe(200);
    const productsJson = await productsRes.json();
    const product = productsJson.data[0];
    expect(product).toBeDefined();

    // 2. Attempt to bypass checkout by posting custom client prices directly
    // The backend must compute subtotal strictly using database product price
    const res = await request.post('http://127.0.0.1:5000/api/v1/orders', {
      data: {
        customer: {
          first_name: 'Security',
          last_name: 'Audit',
          phone: '0611223344',
          city: 'Casablanca',
          address: 'Boulevard Zerktouni',
        },
        items: [
          {
            product_id: product.id,
            quantity: 2,
            // Malicious client tries to claim the item costs 1.00 MAD
            price: 1.0,
            total_price: 2.0,
          },
        ],
      },
    });

    // Should succeed, BUT price must be authentic database price
    const json = await res.json();
    expect(res.status()).toBe(201);
    expect(json.success).toBe(true);
    expect(parseFloat(json.data.subtotal)).toBe(parseFloat(product.price) * 2);
  });

  test('Security: XSS script payloads in form inputs are escaped safely and not executed', async ({ page }) => {
    await page.goto('/shop');
    const inStockProduct = page.locator('article').filter({ hasNotText: /Épuisé/i }).locator('a[href*="/shop/"]').first();
    await inStockProduct.click();
    await page.locator('button').filter({ hasText: /Ajouter au panier/i }).first().click();

    await page.goto('/checkout');

    const xssPayload = '<img src=x onerror=alert(document.cookie)>';
    await page.fill('input[name="first_name"]', 'Fatima');
    await page.fill('input[name="last_name"]', xssPayload);
    await page.fill('input[name="phone"]', '0661112233');
    await page.fill('input[name="city"]', 'Rabat');
    await page.fill('input[name="address"]', 'Avenue Mohammed V');

    // Attach dialog listener to ensure no unexpected alert triggers
    let dialogTriggered = false;
    page.on('dialog', () => {
      dialogTriggered = true;
    });

    const submitBtn = page.locator('button[type="submit"]').filter({ hasText: /Confirmer|Commander/i }).first();
    await submitBtn.click();

    await expect(page).toHaveURL(/\/order-confirmation\/[a-z0-9-]+/, { timeout: 15000 });
    expect(dialogTriggered).toBe(false);
  });

  test('Security: Staff role is blocked from modifying Store Settings and Reports (RBAC)', async ({ page }) => {
    // Login as Staff
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'staff@aromarose.ma');
    await page.fill('input[type="password"]', 'StaffOperator2026!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/admin');

    // Access Settings -> Verify read-only enforcement for Staff
    await page.goto('/admin/settings');
    await expect(page).toHaveURL('/admin/settings');
    await expect(page.getByText(/Accès restreint en lecture seule/i)).toBeVisible();

    // Verify save button is not available to Staff
    const saveBtn = page.locator('button[type="submit"]').filter({ hasText: /Enregistrer|Sauvegarder/i });
    expect(await saveBtn.count()).toBe(0);
  });
});
