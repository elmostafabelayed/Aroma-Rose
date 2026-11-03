# Aroma Rose — Catalog & Initial Seeding Plan

**Document:** Catalog Seeding Specification  
**Reference Store:** [Rosa M'Goun](https://www.rosamgoun.ma/) (Kelaat M'Gouna, Morocco)  
**Database Targets:** `categories`, `products`, `product_images`, `profiles`  

---

## 1. Overview & Principles

The seeding process populates the Aroma Rose database foundation with production-ready structural categories, authentic Moroccan rose product models, and foundational administrative roles.

### Ground Rules
1. **No Invented Customer Data:** Customer records must never be seeded into production databases.
2. **Deterministic Foreign Keys:** Seed products must link to established category slugs.
3. **Storage Path Convention:** Product images must follow the bucket directory pattern:
   `catalog/{category-slug}/{product-slug}-{order}.webp`
4. **Price Snapshot Integrity:** Base retail prices and compare-at prices must be defined in Moroccan Dirhams (`MAD`) with two-digit decimal precision (`NUMERIC(12, 2)`).

---

## 2. Product Categories Taxonomy

Based on the reference artisanal boutique (Rosa M'Goun, Valley of the Roses):

| Category Name | Slug | Description | Display Order |
| :--- | :--- | :--- | :--- |
| **Eaux Florales & Hydrolats** | `eaux-florales` | Pure distilled Damask rose water (Eau de Rose de Kelaat M'Gouna). | 1 |
| **Huiles & Sérums Précieux** | `huiles-serums` | Pure rose essential oil, rosehip seed oils, and restorative facial serums. | 2 |
| **Soins du Visage** | `soins-visage` | Natural creams, rose petal masks, and cleansing milks. | 3 |
| **Soins du Corps & Bain** | `soins-corps` | Traditional rose scrubs, body lotions, and artisanal rose soaps. | 4 |
| **Parfums d'Ambiance & Bien-être** | `bien-etre-ambiance` | Rose room diffusers, candles, and aromatic sprays. | 5 |

---

## 3. Product Catalog Archetypes

The seed script will provide standard archetypes reflecting the artisanal luxury rose product line:

### 3.1. Eaux Florales & Hydrolats
- **Eau de Rose Distillée de Kelaat M'Gouna (250ml)**
  - Slug: `eau-de-rose-distillee-250ml`
  - SKU: `ROSE-WAT-250`
  - Indicative Price: `75.00 MAD` (Compare at: `90.00 MAD`)
  - Initial Stock: `150 units`
- **Hydrolat de Rose Damascena Bio (500ml - Flacon Verre)**
  - Slug: `hydrolat-rose-damascena-bio-500ml`
  - SKU: `ROSE-WAT-500`
  - Indicative Price: `130.00 MAD`
  - Initial Stock: `80 units`

### 3.2. Huiles & Sérums Précieux
- **Huile Essentielle de Rose Damascena Pure (5ml)**
  - Slug: `huile-essentielle-rose-damascena-5ml`
  - SKU: `ROSE-OIL-005`
  - Indicative Price: `450.00 MAD` (Compare at: `520.00 MAD`)
  - Initial Stock: `25 units`
- **Sérum Régénérant à la Rose & Argan (30ml)**
  - Slug: `serum-rose-argan-30ml`
  - SKU: `ROSE-SER-030`
  - Indicative Price: `220.00 MAD`
  - Initial Stock: `60 units`

### 3.3. Soins du Visage
- **Crème Visage Hydratante aux Pétales de Rose (50ml)**
  - Slug: `creme-visage-petales-rose-50ml`
  - SKU: `ROSE-CRM-050`
  - Indicative Price: `160.00 MAD`
  - Initial Stock: `75 units`
- **Masque à l'Argile Rose & Eau de Rose (100g)**
  - Slug: `masque-argile-rose-100g`
  - SKU: `ROSE-MSK-100`
  - Indicative Price: `110.00 MAD`
  - Initial Stock: `90 units`

### 3.4. Soins du Corps
- **Gommage Exfoliant aux Cristaux de Sucre & Rose (200g)**
  - Slug: `gommage-sucre-rose-200g`
  - SKU: `ROSE-SCR-200`
  - Indicative Price: `140.00 MAD`
  - Initial Stock: `50 units`
- **Savon Artisanal Surgras à la Rose (100g)**
  - Slug: `savon-artisanal-rose-100g`
  - SKU: `ROSE-SOAP-100`
  - Indicative Price: `35.00 MAD`
  - Initial Stock: `200 units`

---

## 4. Administrative Accounts Seeding Plan

In Supabase, admin accounts must be created through Supabase Auth (`auth.users`), followed by an entry in `public.profiles`.

### Seeding Procedure for Local / Staging:
```sql
-- 1. Create admin user in auth.users (handled via Supabase Auth API or CLI in production)
-- 2. Insert into public.profiles:
INSERT INTO public.profiles (id, full_name, role, is_active)
VALUES (
    '<user-uuid-from-auth>',
    'Directeur Général Aroma Rose',
    'admin',
    true
) ON CONFLICT (id) DO UPDATE SET role = 'admin', is_active = true;
```

---

## 5. Seed Execution Strategy

1. **Idempotency:** All seed insertions use `ON CONFLICT (slug) DO UPDATE` or `ON CONFLICT DO NOTHING` to allow multiple runs without duplicating entries.
2. **Environment Protection:** Seeding scripts must check `current_setting('app.environment') != 'production'` before seeding mock operational records or test balances.
3. **Storage Asset Upload:** Product image assets must be placed into the Supabase Storage bucket `public-catalog` with read-only public access enabled.
