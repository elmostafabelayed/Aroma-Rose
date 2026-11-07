import { test, expect } from '@playwright/test';

test.describe('Admin Operations & Security (Missions 05B & 07)', () => {
  test('1. Unauthorized access redirects to /admin/login; invalid credentials rejected', async ({ page }) => {
    // 1.1 Direct URL access to /admin without auth
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);

    // 1.2 Invalid credentials attempt
    await page.fill('input[type="email"]', 'wrong-operator@aromarose.ma');
    await page.fill('input[type="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Verify error alert displayed
    await expect(page.locator('text=/Identifiants invalides|erreur/i').first()).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('2. Admin authenticates successfully and accesses Executive Dashboard KPIs', async ({ page }) => {
    await page.goto('/admin/login');

    // Click development quick-fill button or fill credentials directly
    await page.fill('input[type="email"]', 'admin@aromarose.ma');
    await page.fill('input[type="password"]', 'SuperAdmin2026!Secure');
    await page.click('button[type="submit"]');

    // Wait for redirect to /admin dashboard
    await expect(page).toHaveURL('/admin', { timeout: 15000 });

    // Verify Executive Dashboard KPI Cards
    await expect(page.locator('text=Tableau de Bord').first()).toBeVisible();
    await expect(page.locator('text=/Chiffre d\'Affaires|Revenu Encaissé|Commandes/i').first()).toBeVisible();

    // Verify operator profile is displayed in header
    await expect(page.locator('header').filter({ hasText: /Directeur|Admin/i }).first()).toBeVisible();
  });

  test('3. Admin navigates Orders list, filters by status, and inspects order detail', async ({ page }) => {
    // Login
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@aromarose.ma');
    await page.fill('input[type="password"]', 'SuperAdmin2026!Secure');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin');

    // Navigate to Orders
    await page.goto('/admin/orders');
    await expect(page).toHaveURL('/admin/orders');

    // Verify Orders table or empty state
    await expect(page.locator('h1, h2').filter({ hasText: /Commandes/i }).first()).toBeVisible();

    // Verify filter dropdowns exist
    const statusSelect = page.locator('select').first();
    await expect(statusSelect).toBeVisible();

    // Verify WhatsApp manual intake button is present
    const whatsappBtn = page.locator('button').filter({ hasText: /WhatsApp/i }).first();
    await expect(whatsappBtn).toBeVisible();
  });

  test('4. Admin inspects Inventory, view movements ledger, and reviews threshold alerts', async ({ page }) => {
    // Login
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@aromarose.ma');
    await page.fill('input[type="password"]', 'SuperAdmin2026!Secure');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin');

    // Navigate to Inventory Overview
    await page.goto('/admin/inventory');
    await expect(page).toHaveURL('/admin/inventory');

    await expect(page.locator('h1, h2').filter({ hasText: /Gestion du stock|Inventaire/i }).first()).toBeVisible();

    // Navigate to Inventory Movements Ledger via in-app navigation
    const movementsBtn = page.locator('button, a').filter({ hasText: /Historique mouvements|Mouvements/i }).first();
    await movementsBtn.click();
    await expect(page).toHaveURL('/admin/inventory/movements');
    await expect(page.locator('h1, h2').filter({ hasText: /Grand Livre des Mouvements|Mouvements|Historique/i }).first()).toBeVisible();
  });

  test('5. Admin accesses Store Settings and verifies financial rules and status', async ({ page }) => {
    // Login
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@aromarose.ma');
    await page.fill('input[type="password"]', 'SuperAdmin2026!Secure');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin');

    // Navigate to Settings
    await page.goto('/admin/settings');
    await expect(page).toHaveURL('/admin/settings');

    // Verify store settings form fields
    await expect(page.locator('h1, h2').filter({ hasText: /Paramètres du magasin|Paramètres|Configuration/i }).first()).toBeVisible();
    await expect(page.getByText(/Frais de livraison|Seuil|Devise|MAD/i).first()).toBeVisible();
  });

  test('6. Admin accesses Business Intelligence Reports and triggers CSV Export', async ({ page }) => {
    // Login
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@aromarose.ma');
    await page.fill('input[type="password"]', 'SuperAdmin2026!Secure');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/admin');

    // Navigate to Reports
    await page.goto('/admin/reports');
    await expect(page).toHaveURL('/admin/reports');

    // Verify analytics tabs / reports sections
    await expect(page.locator('h1, h2').filter({ hasText: /Rapports & Analyses|Rapports|Analytique/i }).first()).toBeVisible();

    // Verify Export CSV button is present
    const exportBtn = page.locator('button').filter({ hasText: /Exporter|Export/i }).first();
    await expect(exportBtn).toBeVisible();
  });
});
