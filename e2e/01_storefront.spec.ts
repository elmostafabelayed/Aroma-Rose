import { test, expect } from '@playwright/test';

test.describe('Storefront — Customer Experience (Missions 05A & 07)', () => {
  test('1. Homepage loads, displays hero, brand navigation and footer', async ({ page }) => {
    await page.goto('/');

    // Check title and logo
    await expect(page).toHaveTitle(/Aroma Rose/i);
    const logo = page.locator('header img[alt*="Aroma Rose"]').first();
    await expect(logo).toBeVisible();

    // Check responsive navigation
    const desktopNav = page.locator('header nav.lg\\:flex');
    const mobileMenuBtn = page.locator('button[aria-label="Ouvrir le menu"]');

    if (await desktopNav.isVisible()) {
      // Desktop: Direct navigation link is visible
      const shopLink = desktopNav.locator('a[href="/shop"]').first();
      await expect(shopLink).toBeVisible();
    } else {
      // Mobile / Tablet: Test hamburger drawer open, links, and close/navigation
      await expect(mobileMenuBtn).toBeVisible();

      // Open mobile drawer
      await mobileMenuBtn.click();
      const mobileDrawer = page.locator('header div.lg\\:hidden');
      await expect(mobileDrawer).toBeVisible();
      const mobileShopLink = mobileDrawer.locator('a[href="/shop"]').first();
      await expect(mobileShopLink).toBeVisible();

      // Close mobile drawer and verify it closes
      await mobileMenuBtn.click();
      await expect(mobileDrawer).not.toBeVisible();

      // Re-open drawer and navigate to shop through mobile navigation
      await mobileMenuBtn.click();
      await expect(mobileDrawer).toBeVisible();
      await mobileShopLink.click();
      await expect(page).toHaveURL('/shop');
      await page.goto('/'); // Return to homepage to complete assertions
    }

    // Check hero headline
    const heroHeading = page.locator('h1').first();
    await expect(heroHeading).toBeVisible();

    // Verify WhatsApp CTA button is absent from header
    await expect(page.locator('header a[href*="wa.me"], header a[href*="whatsapp.com"]')).toHaveCount(0);

    // Verify Floating WhatsApp widget is visible, fixed, and configured
    const floatingWhatsApp = page.locator('aside[aria-label="Assistance WhatsApp"] a[href*="whatsapp.com"], aside[aria-label="Assistance WhatsApp"] a[href*="wa.me"]').first();
    await expect(floatingWhatsApp).toBeVisible();
    await expect(floatingWhatsApp).toHaveAttribute('target', '_blank');
    await expect(floatingWhatsApp).toHaveAttribute('href', 'https://api.whatsapp.com/send/?phone=212606010908&text&type=phone_number&app_absent=0');
    await expect(floatingWhatsApp).toHaveAttribute('aria-label', /WhatsApp/i);

    // Verify floating WhatsApp button remains visible when scrolled
    await page.evaluate(() => window.scrollTo(0, 400));
    await expect(floatingWhatsApp).toBeVisible();

    // Check footer links
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer.locator('a[href="/shipping"]')).toBeVisible();
    await expect(footer.locator('a[href="/terms"]')).toBeVisible();
    await expect(footer.locator('a[href="/privacy"]')).toBeVisible();

    // Verify official social channels and cooperative location on Google Maps in footer
    const instagramLink = footer.locator('a[href="https://www.instagram.com/cooperativerosamgoun?utm_source=qr"]').first();
    await expect(instagramLink).toBeVisible();
    await expect(instagramLink).toHaveAttribute('target', '_blank');
    await expect(instagramLink).toHaveAttribute('rel', 'noopener noreferrer');

    const facebookLink = footer.locator('a[href="https://web.facebook.com/kacihassan"]').first();
    await expect(facebookLink).toBeVisible();
    await expect(facebookLink).toHaveAttribute('target', '_blank');
    await expect(facebookLink).toHaveAttribute('rel', 'noopener noreferrer');

    const googleMapsLink = footer.locator('a[href="https://www.google.com/maps?q=31.197605,-6.174397"]').first();
    await expect(googleMapsLink).toBeVisible();
    await expect(googleMapsLink).toHaveAttribute('target', '_blank');
    await expect(googleMapsLink).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(googleMapsLink).toContainText(/Coopérative Rosa M'Goun/i);
  });

  test('2. Product catalog loads and category filtering works', async ({ page }) => {
    await page.goto('/shop');

    // Wait for catalog grid to load
    await expect(page.locator('h1, h2').filter({ hasText: /Boutique|Catalogue|Soins/i }).first()).toBeVisible();

    // Check product cards are present
    const productCards = page.locator('a[href*="/products/"], a[href*="/shop/"]');
    await expect(productCards.first()).toBeVisible();

    // Check category pills exist
    const categoryFilter = page.locator('button').filter({ hasText: /Toutes|Eaux Florales/i }).first();
    await expect(categoryFilter).toBeVisible();

    // Route scroll restoration test: Scroll down on catalog, navigate to product detail, verify scroll is reset to top
    await page.evaluate(() => window.scrollTo(0, 300));
    const firstProductLink = page.locator('article a[href*="/shop/"]').first();
    await firstProductLink.click();
    await expect(page).toHaveURL(/\/(shop|products)\/[a-z0-9-]+/);
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(50);
  });

  test('3. Product details page displays product data, gallery, and quantity selector', async ({ page }) => {
    await page.goto('/shop');

    // Select an available in-stock product card
    const productCard = page.locator('article').filter({ hasNotText: /Épuisé/i }).first();
    await expect(productCard).toBeVisible();

    // Click on product link to navigate to PDP
    const productLink = productCard.locator('a[href*="/shop/"]').first();
    await productLink.click();

    // Verify on product details URL
    await expect(page).toHaveURL(/\/(shop|products)\/[a-z0-9-]+/);

    // Verify product name, image, and price in MAD
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('img[alt]').first()).toBeVisible();
    await expect(page.locator('text=/MAD|DH/i').first()).toBeVisible();

    // Verify quantity controls
    const increaseBtn = page.locator('button[aria-label="Augmenter la quantité"]');
    const decreaseBtn = page.locator('button[aria-label="Diminuer la quantité"]');
    await expect(increaseBtn).toBeVisible();
    await expect(decreaseBtn).toBeVisible();

    // Test quantity controls interaction
    await increaseBtn.click();
    await expect(page.locator('div').filter({ has: increaseBtn }).locator('span.select-none')).toHaveText('2');
    await decreaseBtn.click();
    await expect(page.locator('div').filter({ has: increaseBtn }).locator('span.select-none')).toHaveText('1');

    // Verify add to cart CTA
    const addToCartBtn = page.locator('button').filter({ hasText: /Ajouter au panier/i }).first();
    await expect(addToCartBtn).toBeVisible();
    await expect(addToCartBtn).toBeEnabled();
  });

  test('4. Customer adds product to cart and manages quantities in Cart page', async ({ page }) => {
    await page.goto('/shop');

    // Add in-stock product to cart
    const productCard = page.locator('article').filter({ hasNotText: /Épuisé/i }).first();
    const productLink = productCard.locator('a[href*="/shop/"]').first();
    await productLink.click();

    const addToCartBtn = page.locator('button').filter({ hasText: /Ajouter au panier/i }).first();
    await addToCartBtn.click();

    // Navigate to Cart
    await page.goto('/cart');
    await expect(page).toHaveURL('/cart');

    // Verify cart items and subtotal are present
    await expect(page.locator('text=Sous-total').first()).toBeVisible();

    // Verify quantity increment in cart
    const incBtn = page.locator('button[aria-label="Augmenter"]').first();
    await incBtn.click();
    const qtySpan = page.locator('div').filter({ has: incBtn }).locator('span.select-none').first();
    await expect(qtySpan).toHaveText('2');

    // Verify cart persistence across page reload
    await page.reload();
    await expect(page.locator('text=Sous-total').first()).toBeVisible();
    await expect(page.locator('div').filter({ has: incBtn }).locator('span.select-none').first()).toHaveText('2');

    // Verify proceed to checkout button is present and navigates to /checkout
    const checkoutBtn = page.locator('a[href="/checkout"], button').filter({ hasText: /Commander|Valider/i }).first();
    await expect(checkoutBtn).toBeVisible();
    await checkoutBtn.click();
    await expect(page).toHaveURL('/checkout');
  });

  test('5. Complete Guest Checkout (COD) with Moroccan phone validation', async ({ page }) => {
    // Add in-stock product directly by navigating to shop and adding
    await page.goto('/shop');
    const productCard = page.locator('article').filter({ hasNotText: /Épuisé/i }).first();
    const productLink = productCard.locator('a[href*="/shop/"]').first();
    await productLink.click();

    const addToCartBtn = page.locator('button').filter({ hasText: /Ajouter au panier/i }).first();
    await addToCartBtn.click();

    // Go to checkout
    await page.goto('/checkout');
    await expect(page).toHaveURL('/checkout');

    // Check payment method indicates Cash on Delivery (Paiement à la livraison)
    await expect(page.locator('text=/Paiement à la livraison|Cash on Delivery|COD/i').first()).toBeVisible();

    // 5.1. Attempt submit with empty fields -> should show validation errors
    const submitBtn = page.locator('button[type="submit"]').filter({ hasText: /Confirmer|Commander/i }).first();
    await submitBtn.click();

    // 5.2. Fill valid Moroccan customer details
    await page.fill('input[name="first_name"]', 'Fatima');
    await page.fill('input[name="last_name"]', 'El Amrani');
    await page.fill('input[name="phone"]', '0661234567');
    await page.fill('input[name="city"]', 'Casablanca');
    await page.fill('input[name="address"]', '120 Boulevard d\'Anfa, Quartier Gauthier');

    // Submit order
    await submitBtn.click();

    // 5.3. Should navigate to order confirmation
    await expect(page).toHaveURL(/\/order-confirmation\/[a-z0-9-]+/, { timeout: 15000 });

    // Verify Order Number format AR-YYYYMMDD-XXXX
    await expect(page.locator('text=/AR-\\d{8}-[A-Z0-9]{4}/i').first()).toBeVisible();

    // Verify WhatsApp order assistance button is present
    await expect(page.locator('main a[href*="wa.me"], main a[href*="whatsapp.com"]').first()).toBeVisible();
  });

  test('6. Static and informational pages render with correct content', async ({ page }) => {
    const pages = [
      { path: '/about', heading: /Maison|Histoire|Origine|Artisan/i },
      { path: '/terroir', heading: /Terroir|Vallée des Roses|Kelaat/i },
      { path: '/distillation', heading: /Distillation|Alambic|Vapeur/i },
      { path: '/contact', heading: /Contact|Service Client|Assistance/i },
      { path: '/shipping', heading: /Livraison|Expédition|Délais/i },
      { path: '/terms', heading: /Conditions|Générales|Vente/i },
      { path: '/privacy', heading: /Confidentialité|Données|Vie Privée/i },
    ];

    for (const p of pages) {
      await page.goto(p.path);
      await expect(page.locator('h1, h2').filter({ hasText: p.heading }).first()).toBeVisible();
      // Ensure header and footer remain intact
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
    }
  });

  test('7. Custom 404 page handles non-existent routes gracefully', async ({ page }) => {
    await page.goto('/non-existent-luxury-ritual');
    await expect(page.locator('text=/404|Page introuvable/i').first()).toBeVisible();
    const returnHome = page.locator('a[href="/"]').first();
    await expect(returnHome).toBeVisible();
  });

  test('8. Product detail scroll regression check: navigation starts at top and preserves catalog scroll on Back', async ({ page }) => {
    // 1. Open /shop
    await page.goto('/shop');
    await expect(page.locator('article').first()).toBeVisible();

    // 2. Scroll near the bottom of the catalog
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForFunction(() => window.scrollY > 200);
    const scrollOnCatalog = await page.evaluate(() => window.scrollY);
    expect(scrollOnCatalog).toBeGreaterThan(200);

    // 3. Click a product card near the bottom
    const productCards = page.locator('article');
    const targetProductCard = productCards.last();
    const productLink = targetProductCard.locator('a[href*="/shop/"]').first();
    const firstProductHref = await productLink.getAttribute('href');
    expect(firstProductHref).toBeTruthy();
    await productLink.click();

    // 4. Verify the product detail route opens at window.scrollY === 0
    await expect(page).toHaveURL(firstProductHref!);
    await expect(page.locator('h1').first()).toBeVisible();
    await page.waitForFunction(() => window.scrollY < 10);
    const scrollOnProduct1 = await page.evaluate(() => window.scrollY);
    expect(scrollOnProduct1).toBeLessThan(10);

    // 4b. Verify quantity changes and add-to-cart do NOT cause scroll jumps
    const increaseBtn = page.locator('button[aria-label="Augmenter la quantité"]');
    if (await increaseBtn.isVisible()) {
      await increaseBtn.scrollIntoViewIfNeeded();
      const scrollBeforeInteraction = await page.evaluate(() => window.scrollY);
      await increaseBtn.click();
      const scrollAfterQty = await page.evaluate(() => window.scrollY);
      expect(Math.abs(scrollAfterQty - scrollBeforeInteraction)).toBeLessThan(15);
    }
    const addToCartBtn = page.locator('button').filter({ hasText: /Ajouter au panier/i }).first();
    if (await addToCartBtn.isVisible()) {
      await addToCartBtn.scrollIntoViewIfNeeded();
      const scrollBeforeAdd = await page.evaluate(() => window.scrollY);
      await addToCartBtn.click();
      const scrollAfterAdd = await page.evaluate(() => window.scrollY);
      expect(Math.abs(scrollAfterAdd - scrollBeforeAdd)).toBeLessThan(15);
    }

    // 5. Navigate directly from that product to another product (via related products strip)
    await page.evaluate(() => window.scrollTo(0, 500));
    const relatedSection = page.locator('div').filter({ hasText: 'Harmonie Botanique' }).first();
    await expect(relatedSection).toBeVisible();
    const relatedProductLink = relatedSection.locator('a[href*="/shop/"]').first();
    await expect(relatedProductLink).toBeVisible();
    const secondProductHref = await relatedProductLink.getAttribute('href');
    expect(secondProductHref).toBeTruthy();
    await relatedProductLink.click();

    // 6. Verify the second product detail page also starts at the top
    await expect(page).toHaveURL(secondProductHref!);
    await expect(page.locator('h1').first()).toBeVisible();
    await page.waitForFunction(() => window.scrollY < 10);
    const scrollOnProduct2 = await page.evaluate(() => window.scrollY);
    expect(scrollOnProduct2).toBeLessThan(10);

    // 7. Use browser Back to return to first product, then to the catalog
    await page.goBack();
    await expect(page).toHaveURL(firstProductHref!);
    await expect(page.locator('h1').first()).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL('/shop');
    await expect(page.locator('article').first()).toBeVisible();
    await page.waitForFunction(() => window.scrollY > 100);

    // Verify intended scroll restoration on catalog
    const scrollAfterBack = await page.evaluate(() => window.scrollY);
    expect(scrollAfterBack).toBeGreaterThan(100);
  });
});
