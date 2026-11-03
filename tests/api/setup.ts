import jwt from 'jsonwebtoken';
import { query } from '../../src/config/db.js';
import { env } from '../../src/config/env.js';

export interface TestContext {
  adminUser: { id: string; email: string; token: string; role: 'admin' };
  staffUser: { id: string; email: string; token: string; role: 'staff' };
  inactiveUser: { id: string; email: string; token: string; role: 'staff' };
  category: { id: string; name: string; slug: string };
  productInStock: { id: string; name: string; slug: string; price: number; stock: number };
  productLowStock: { id: string; name: string; slug: string; price: number; stock: number };
  productInactive: { id: string; name: string; slug: string; price: number; stock: number };
}

export const setupTestDatabase = async (): Promise<TestContext> => {
  // Ensure roles exist
  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
    END $$;
  `);

  const adminId = 'a0000000-0000-0000-0000-000000000001';
  const staffId = 'a0000000-0000-0000-0000-000000000002';
  const inactiveId = 'a0000000-0000-0000-0000-000000000003';

  // 1. Clean test tables
  await query(`
    SET session_replication_role = 'replica';
    DELETE FROM public.audit_logs;
    DELETE FROM public.inventory_movements;
    DELETE FROM public.order_status_history;
    DELETE FROM public.order_items;
    DELETE FROM public.orders;
    DELETE FROM public.customers;
    DELETE FROM public.product_images;
    DELETE FROM public.products;
    DELETE FROM public.categories;
    DELETE FROM public.profiles;
    DELETE FROM auth.users WHERE id IN ('${adminId}', '${staffId}', '${inactiveId}');
    SET session_replication_role = 'origin';
  `);

  // 2. Insert test users & profiles
  await query(
    `INSERT INTO auth.users (id, email) VALUES
       ($1, 'admin@aromarose.local'),
       ($2, 'staff@aromarose.local'),
       ($3, 'inactive@aromarose.local')`,
    [adminId, staffId, inactiveId]
  );

  await query(
    `INSERT INTO public.profiles (id, full_name, role, is_active) VALUES
       ($1, 'Directeur Test Admin', 'admin', true),
       ($2, 'Adjoint Test Staff', 'staff', true),
       ($3, 'Ancien Staff Deactive', 'staff', false)`,
    [adminId, staffId, inactiveId]
  );

  const adminToken = jwt.sign({ sub: adminId, email: 'admin@aromarose.local', role: 'admin' }, env.JWT_SECRET, { expiresIn: '1h' });
  const staffToken = jwt.sign({ sub: staffId, email: 'staff@aromarose.local', role: 'staff' }, env.JWT_SECRET, { expiresIn: '1h' });
  const inactiveToken = jwt.sign({ sub: inactiveId, email: 'inactive@aromarose.local', role: 'staff' }, env.JWT_SECRET, { expiresIn: '1h' });

  // 3. Insert test category
  const catRes = await query(
    `INSERT INTO public.categories (name, slug, description, display_order, is_active)
     VALUES ('Eaux Florales', 'eaux-florales', 'Eaux florales pures de Kelaat MGouna', 1, true)
     RETURNING id, name, slug`
  );
  const category = catRes.rows[0];

  // Inactive category
  await query(
    `INSERT INTO public.categories (name, slug, description, display_order, is_active)
     VALUES ('Categorie Cachee', 'cat-cachee', 'Categorie non publiee', 2, false)`
  );

  // 4. Insert test products
  const p1Res = await query(
    `INSERT INTO public.products (category_id, name, slug, sku, price, compare_at_price, cost_price, stock_quantity, is_active)
     VALUES ($1, 'Eau de Rose Distillee 250ml', 'eau-de-rose-distillee-250ml', 'ROSE-WAT-250', 75.00, 90.00, 30.00, 50, true)
     RETURNING id, name, slug, price, stock_quantity`,
    [category.id]
  );
  const productInStock = {
    id: p1Res.rows[0].id,
    name: p1Res.rows[0].name,
    slug: p1Res.rows[0].slug,
    price: parseFloat(p1Res.rows[0].price),
    stock: p1Res.rows[0].stock_quantity,
  };

  const p2Res = await query(
    `INSERT INTO public.products (category_id, name, slug, sku, price, compare_at_price, cost_price, stock_quantity, is_active)
     VALUES ($1, 'Huile Essentielle de Rose 5ml', 'huile-essentielle-rose-5ml', 'ROSE-OIL-005', 450.00, 500.00, 200.00, 2, true)
     RETURNING id, name, slug, price, stock_quantity`,
    [category.id]
  );
  const productLowStock = {
    id: p2Res.rows[0].id,
    name: p2Res.rows[0].name,
    slug: p2Res.rows[0].slug,
    price: parseFloat(p2Res.rows[0].price),
    stock: p2Res.rows[0].stock_quantity,
  };

  const p3Res = await query(
    `INSERT INTO public.products (category_id, name, slug, sku, price, stock_quantity, is_active)
     VALUES ($1, 'Produit Brouillon Non Publie', 'produit-brouillon', 'DRAFT-001', 120.00, 10, false)
     RETURNING id, name, slug, price, stock_quantity`,
    [category.id]
  );
  const productInactive = {
    id: p3Res.rows[0].id,
    name: p3Res.rows[0].name,
    slug: p3Res.rows[0].slug,
    price: parseFloat(p3Res.rows[0].price),
    stock: p3Res.rows[0].stock_quantity,
  };

  // Insert image for p1
  await query(
    `INSERT INTO public.product_images (product_id, storage_path, alt_text, display_order, is_primary)
     VALUES ($1, 'catalog/eaux-florales/rose-water-250.webp', 'Flacon Eau de Rose 250ml', 1, true)`,
    [productInStock.id]
  );

  return {
    adminUser: { id: adminId, email: 'admin@aromarose.local', token: adminToken, role: 'admin' },
    staffUser: { id: staffId, email: 'staff@aromarose.local', token: staffToken, role: 'staff' },
    inactiveUser: { id: inactiveId, email: 'inactive@aromarose.local', token: inactiveToken, role: 'staff' },
    category,
    productInStock,
    productLowStock,
    productInactive,
  };
};
