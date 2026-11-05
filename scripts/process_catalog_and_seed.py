#!/usr/bin/env python3
"""
Aroma Rose — Mission 02.5: Image Processing & Database Seeding Automation
Author: Senior Backend Engineer & Database Architect

Automates:
1. Parsing product catalog markdown table from docs/catalogue_aroma_rose_premium_fr.md.
2. Processing raw image files from /home/elmostafa/Downloads/Work_cleaned:
   - Converting names into clean, SEO-friendly filenames (e.g., huile-essentielle-de-rose-flacon-decoratif.jpg).
   - Organizing into category subfolders in ./public/products/<category-slug>/ and ./frontend/public/products/<category-slug>/.
   - Gracefully handling duplicates and missing images.
3. Generating production-grade, idempotent PostgreSQL seed script in supabase/seed.sql:
   - Populating categories, products, and product_images tables.
   - Setting default stock_quantity = 100, is_active = true, formatted prices, and deterministic UUIDs.
"""

import os
import re
import unicodedata
import uuid
import shutil
from typing import List, Dict, Any

DOCS_CATALOG_PATH = os.path.abspath("docs/catalogue_aroma_rose_premium_fr.md")
SOURCE_IMAGES_DIR = "/home/elmostafa/Downloads/Work_cleaned"
PUBLIC_PRODUCTS_DIR = os.path.abspath("public/products")
FRONTEND_PRODUCTS_DIR = os.path.abspath("frontend/public/products")
SEED_SQL_PATH = os.path.abspath("supabase/seed.sql")

CATEGORY_CONFIG = {
    "parfums-et-deodorants": {
        "name": "Parfums et Déodorants",
        "description": "Fragrances raffinées, brumes d'ambiance et déodorants délicats à la rose et aux essences orientales.",
        "display_order": 1,
        "sku_code": "PRF"
    },
    "soins-du-visage": {
        "name": "Soins du Visage",
        "description": "Crèmes précieuses, sérums régénérants et masques purifiants inspirés des rituels de beauté marocains.",
        "display_order": 2,
        "sku_code": "VIS"
    },
    "soins-des-cheveux": {
        "name": "Soins des Cheveux",
        "description": "Shampooings fortifiants, masques nourrissants et sérums réparateurs aux extraits botaniques naturels.",
        "display_order": 3,
        "sku_code": "CHV"
    },
    "soins-du-corps": {
        "name": "Soins du Corps",
        "description": "Gels douche sensoriels, savons artisanaux et soins protecteurs pour une peau douce et soyeuse.",
        "display_order": 4,
        "sku_code": "CRP"
    },
    "eaux-et-huiles": {
        "name": "Eaux et Huiles",
        "description": "Eau de rose pure distillée de Kelaat M'Gouna, huiles précieuses et élixirs botaniques 100% purs.",
        "display_order": 5,
        "sku_code": "EAU"
    },
    "produits-bruts": {
        "name": "Produits Bruts",
        "description": "Boutons de roses séchées et trésors botaniques bruts récoltés au cœur de la Vallée des Roses.",
        "display_order": 6,
        "sku_code": "BRT"
    }
}

def slugify(text: str) -> str:
    """Generate a clean URL and filesystem safe kebab-case ASCII slug."""
    # Normalize unicode
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode('utf-8')
    text = text.lower()
    # Replace non-alphanumeric characters with hyphens
    text = re.sub(r'[^a-z0-9]+', '-', text)
    # Strip leading/trailing hyphens and collapse multiple
    text = re.sub(r'-+', '-', text).strip('-')
    return text

def escape_sql_literal(text: str) -> str:
    """Escapes single quotes for standard SQL literals."""
    if text is None:
        return "NULL"
    escaped = text.replace("'", "''")
    return f"'{escaped}'"

def parse_catalog(catalog_path: str) -> List[Dict[str, Any]]:
    """Parse products markdown table from catalogue file."""
    if not os.path.exists(catalog_path):
        raise FileNotFoundError(f"Catalog file not found: {catalog_path}")

    with open(catalog_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    section_map = {
        "Parfums et Déodorants": "parfums-et-deodorants",
        "Soins du Visage": "soins-du-visage",
        "Soins des Cheveux": "soins-des-cheveux",
        "Produits Bruts": "produits-bruts",
        "Soins du Corps": "soins-du-corps",
        "Eaux et Huiles": "eaux-et-huiles"
    }

    current_category_slug = None
    products = []

    for line in lines:
        line = line.strip()
        if line.startswith("## "):
            header = line[3:].strip()
            found_slug = None
            for key, slug in section_map.items():
                if header.startswith(key):
                    found_slug = slug
                    break
            if found_slug:
                current_category_slug = found_slug
            continue

        if line.startswith("|") and not line.startswith("| #") and not line.startswith("|---"):
            cols = [c.strip() for c in line.split("|")]
            if len(cols) >= 7:
                item_num_str = cols[1].strip()
                if not item_num_str.isdigit():
                    continue
                item_num = int(item_num_str)
                raw_name = cols[2].strip()
                # Clean markdown bold **...**
                name = re.sub(r'^\*\*(.*?)\*\*$', r'\1', raw_name).strip()
                name = name.replace("**", "").strip()

                desc = cols[3].strip()
                price_str = cols[4].strip()
                price = float(price_str)

                raw_img = cols[5].strip()
                img_ref = re.sub(r'^`(.*?)`$', r'\1', raw_img).strip()

                raw_ar = cols[6].strip()

                products.append({
                    "item_num": item_num,
                    "name": name,
                    "description": desc,
                    "price": price,
                    "image_ref": img_ref,
                    "arabic_name": raw_ar,
                    "category_slug": current_category_slug
                })

    return products

def process_catalog_items(raw_products: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Assign globally unique slugs, SKUs, and SEO filenames."""
    processed = []
    seen_slugs = {}
    seen_filenames_per_cat = {cat: {} for cat in CATEGORY_CONFIG}

    for p in raw_products:
        base_slug = slugify(p["name"])
        if not base_slug:
            base_slug = f"produit-{p['item_num']}"

        # Global product slug uniqueness
        if base_slug not in seen_slugs:
            seen_slugs[base_slug] = 1
            final_slug = base_slug
        else:
            seen_slugs[base_slug] += 1
            final_slug = f"{base_slug}-{seen_slugs[base_slug]}"

        # Category-scoped SEO image filename
        cat = p["category_slug"]
        if base_slug not in seen_filenames_per_cat[cat]:
            seen_filenames_per_cat[cat][base_slug] = 1
            seo_filename = f"{base_slug}.jpg"
        else:
            seen_filenames_per_cat[cat][base_slug] += 1
            seo_filename = f"{base_slug}-{seen_filenames_per_cat[cat][base_slug]}.jpg"

        # Unique SKU: AR-<CATEGORY_CODE>-<ITEM_NUM:03d>
        sku_code = CATEGORY_CONFIG[cat]["sku_code"]
        sku = f"AR-{sku_code}-{p['item_num']:03d}"

        # Deterministic UUIDs for idempotent seeding
        product_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"aroma-rose-prod-{final_slug}"))
        image_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"aroma-rose-img-{final_slug}"))

        storage_path = f"/products/{cat}/{seo_filename}"

        processed.append({
            **p,
            "product_id": product_uuid,
            "image_id": image_uuid,
            "slug": final_slug,
            "sku": sku,
            "seo_filename": seo_filename,
            "storage_path": storage_path
        })

    return processed

def copy_product_images(items: List[Dict[str, Any]]) -> int:
    """Copy raw images to organized SEO destinations in both project and frontend public folders."""
    copied_count = 0
    missing_count = 0

    for item in items:
        source_path = os.path.join(SOURCE_IMAGES_DIR, item["image_ref"])
        cat = item["category_slug"]
        seo_filename = item["seo_filename"]

        target_dir_public = os.path.join(PUBLIC_PRODUCTS_DIR, cat)
        target_dir_frontend = os.path.join(FRONTEND_PRODUCTS_DIR, cat)

        os.makedirs(target_dir_public, exist_ok=True)
        os.makedirs(target_dir_frontend, exist_ok=True)

        target_file_public = os.path.join(target_dir_public, seo_filename)
        target_file_frontend = os.path.join(target_dir_frontend, seo_filename)

        if not os.path.exists(source_path):
            print(f"[WARN] Source image missing: {source_path} for product #{item['item_num']} ({item['name']})")
            missing_count += 1
            continue

        shutil.copy2(source_path, target_file_public)
        shutil.copy2(source_path, target_file_frontend)
        copied_count += 1

    print(f"[INFO] Images processed: {copied_count} copied successfully, {missing_count} missing.")
    return copied_count

def generate_seed_sql(items: List[Dict[str, Any]], output_path: str):
    """Generate production-ready idempotent SQL script."""
    lines = [
        "-- ==============================================================================",
        "-- Aroma Rose — Official Catalog Database Seed",
        "-- Generated automatically from docs/catalogue_aroma_rose_premium_fr.md",
        "-- Total products: 72 items across 6 botanical categories",
        "-- ==============================================================================",
        "",
        "BEGIN;",
        "",
        "-- 1. Seed Categories",
    ]

    for cat_slug, meta in CATEGORY_CONFIG.items():
        cat_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"aroma-rose-cat-{cat_slug}"))
        name_esc = escape_sql_literal(meta["name"])
        desc_esc = escape_sql_literal(meta["description"])
        lines.append(
            f"INSERT INTO public.categories (id, name, slug, description, display_order, is_active)\n"
            f"VALUES ('{cat_uuid}', {name_esc}, '{cat_slug}', {desc_esc}, {meta['display_order']}, true)\n"
            f"ON CONFLICT (slug) DO UPDATE SET\n"
            f"    name = EXCLUDED.name,\n"
            f"    description = EXCLUDED.description,\n"
            f"    display_order = EXCLUDED.display_order,\n"
            f"    is_active = true,\n"
            f"    updated_at = now();"
        )

    lines.append("")
    lines.append("-- 2. Seed Products")

    for item in items:
        name_esc = escape_sql_literal(item["name"])
        desc_esc = escape_sql_literal(item["description"])
        price_val = f"{item['price']:.2f}"
        cat_slug = item["category_slug"]

        lines.append(
            f"INSERT INTO public.products (\n"
            f"    id, category_id, name, slug, sku, description, price, compare_at_price, cost_price, stock_quantity, is_active\n"
            f") VALUES (\n"
            f"    '{item['product_id']}',\n"
            f"    (SELECT id FROM public.categories WHERE slug = '{cat_slug}'),\n"
            f"    {name_esc},\n"
            f"    '{item['slug']}',\n"
            f"    '{item['sku']}',\n"
            f"    {desc_esc},\n"
            f"    {price_val},\n"
            f"    NULL,\n"
            f"    NULL,\n"
            f"    100,\n"
            f"    true\n"
            f")\n"
            f"ON CONFLICT (slug) DO UPDATE SET\n"
            f"    category_id = EXCLUDED.category_id,\n"
            f"    name = EXCLUDED.name,\n"
            f"    sku = EXCLUDED.sku,\n"
            f"    description = EXCLUDED.description,\n"
            f"    price = EXCLUDED.price,\n"
            f"    stock_quantity = EXCLUDED.stock_quantity,\n"
            f"    is_active = true,\n"
            f"    updated_at = now();"
        )

    lines.append("")
    lines.append("-- 3. Seed Primary Product Images")
    lines.append("-- Clean existing primary images for these products to avoid partial index collision")
    lines.append(
        "DELETE FROM public.product_images WHERE product_id IN (\n"
        "    SELECT id FROM public.products WHERE sku LIKE 'AR-%'\n"
        ");"
    )

    for item in items:
        alt_esc = escape_sql_literal(item["name"])
        storage_esc = escape_sql_literal(item["storage_path"])

        lines.append(
            f"INSERT INTO public.product_images (\n"
            f"    id, product_id, storage_path, alt_text, display_order, is_primary\n"
            f") VALUES (\n"
            f"    '{item['image_id']}',\n"
            f"    '{item['product_id']}',\n"
            f"    {storage_esc},\n"
            f"    {alt_esc},\n"
            f"    1,\n"
            f"    true\n"
            f");"
        )

    lines.append("")
    lines.append("COMMIT;")
    lines.append("")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(lines))

    print(f"[INFO] SQL seed script generated successfully at: {output_path}")

def main():
    print("=" * 70)
    print("Aroma Rose — Mission 02.5: Image Processing & Seeding Automation")
    print("=" * 70)

    # 1. Parse Catalog
    print("[STEP 1/3] Parsing Markdown Catalog...")
    raw_products = parse_catalog(DOCS_CATALOG_PATH)
    print(f"-> Parsed {len(raw_products)} products from {DOCS_CATALOG_PATH}")

    # Process items (assign SEO slugs, unique SKUs)
    items = process_catalog_items(raw_products)

    # 2. Process & Copy Images
    print("\n[STEP 2/3] Processing and organizing product images...")
    copy_product_images(items)

    # 3. Generate Database Seed Script
    print("\n[STEP 3/3] Generating PostgreSQL Seed Script...")
    generate_seed_sql(items, SEED_SQL_PATH)

    print("\n" + "=" * 70)
    print("Seeding Automation Completed Successfully!")
    print(f"Products: {len(items)}")
    print(f"Seed SQL: {SEED_SQL_PATH}")
    print("=" * 70)

if __name__ == "__main__":
    main()
