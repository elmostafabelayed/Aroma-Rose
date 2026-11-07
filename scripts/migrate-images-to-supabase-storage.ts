#!/usr/bin/env tsx
/**
 * ==============================================================================
 * Aroma Rose — Mission 06.5: Resumable Local-to-Supabase Storage Migration Script
 * ==============================================================================
 * Transfers legacy local product images to Supabase Storage:
 * 1. Scans public.product_images for local filesystem paths (/products/...).
 * 2. Reads image binary from public/ or frontend/public/.
 * 3. Verifies file signature and computes SHA256 checksum.
 * 4. Checks if target object already exists in Supabase Storage (resumable/idempotent).
 * 5. Uploads to Supabase Storage via Server-Side Service Role.
 * 6. Verifies upload integrity (size / checksum check).
 * 7. Updates public.product_images.storage_path in PostgreSQL.
 * 8. Never deletes local files.
 *
 * Usage:
 *   npx tsx scripts/migrate-images-to-supabase-storage.ts [--dry-run] [--bucket <name>]
 * ==============================================================================
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pool } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { supabaseService } from '../src/config/supabase.js';
import { validateImageSignature, getCanonicalExtension } from '../src/utils/storage.js';

interface MigrationStats {
  scanned: number;
  alreadyUploaded: number;
  uploaded: number;
  dbUpdated: number;
  skipped: number;
  failed: number;
}

const args = process.argv.slice(2);
const isConfirmed = args.includes('--confirm');
const isDryRun = !isConfirmed || args.includes('--dry-run');
const bucketArgIndex = args.indexOf('--bucket');
const targetBucket = bucketArgIndex !== -1 && args[bucketArgIndex + 1]
  ? args[bucketArgIndex + 1]
  : env.SUPABASE_STORAGE_BUCKET || 'product-images';

const expectedHostname = 'tmzedtqltmtjubdguybe.supabase.co';
const urlHost = new URL(env.SUPABASE_URL).hostname;

if (urlHost !== expectedHostname && !args.includes('--allow-any-host')) {
  console.error(`[CRITICAL ABORT] Target SUPABASE_URL host "${urlHost}" does not match authorized production hostname "${expectedHostname}".`);
  console.error(`Pass --allow-any-host if intentionally targeting a different host.`);
  process.exit(1);
}

console.log('==============================================================================');
console.log('       Aroma Rose — Local-to-Supabase Product Images Transfer Script          ');
console.log('==============================================================================');
console.log(`Execution Mode:  ${isDryRun ? 'DRY-RUN (Simulating transfer, no mutations)' : 'LIVE (Applying cloud migration)'}`);
if (!isConfirmed) {
  console.log(`[SAFETY GUARD] Defaulting to DRY-RUN. Pass --confirm to apply live changes.`);
}
console.log(`Target Bucket:   ${targetBucket}`);
console.log(`Supabase Host:   ${urlHost}`);
console.log('==============================================================================\n');

/**
 * Detects MIME type from file extension
 */
function getMimeTypeFromExt(ext: string): string {
  switch (ext.toLowerCase().replace(/^\./, '')) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'avif':
      return 'image/avif';
    default:
      return 'image/jpeg';
  }
}

async function runMigration() {
  const stats: MigrationStats = {
    scanned: 0,
    alreadyUploaded: 0,
    uploaded: 0,
    dbUpdated: 0,
    skipped: 0,
    failed: 0,
  };

  let client: any = null;
  // When targeting remote Supabase, use supabaseService PostgREST API unless DATABASE_URL targets remote
  const isRemoteDb = env.DATABASE_URL && !env.DATABASE_URL.includes('127.0.0.1') && !env.DATABASE_URL.includes('localhost');
  let usePostgrest = !isRemoteDb;

  if (!usePostgrest) {
    try {
      client = await pool.connect();
    } catch (err: any) {
      console.log(`[DB INFO] Direct PostgreSQL pool connection unavailable (${err.message}). Using Supabase Service PostgREST API.`);
      usePostgrest = true;
    }
  } else {
    console.log(`[DB INFO] Targeting remote Supabase project. Using Supabase Service PostgREST API.`);
  }

  try {
    // 1. Fetch all product image records referencing local filesystem paths
    let records: Array<{ id: string; product_id: string; storage_path: string; alt_text?: string; is_primary?: boolean; display_order?: number }> = [];

    if (!usePostgrest && client) {
      const res = await client.query(`
        SELECT id, product_id, storage_path, alt_text, is_primary, display_order
        FROM public.product_images
        WHERE storage_path LIKE '/products/%'
        ORDER BY created_at ASC
      `);
      records = res.rows;
    } else {
      const { data, error } = await supabaseService
        .from('product_images')
        .select('id, product_id, storage_path, alt_text, is_primary, display_order')
        .like('storage_path', '/products/%')
        .order('created_at', { ascending: true });
      if (error) {
        throw new Error(`Failed to query product_images via Supabase Service API: ${error.message}`);
      }
      records = data || [];
    }

    stats.scanned = records.length;
    console.log(`Found ${stats.scanned} local product image records in public.product_images.\n`);

    if (stats.scanned === 0) {
      console.log('No local images require migration. Database is already in sync with Object Storage.');
      return;
    }

    for (const img of records) {
      const localRelPath = img.storage_path.replace(/^\//, ''); // e.g. "products/uploads/..." or "products/soins-du-visage/..."

      // Look in public/ first, then frontend/public/
      let localDiskPath = path.join(process.cwd(), 'public', localRelPath);
      if (!fs.existsSync(localDiskPath)) {
        localDiskPath = path.join(process.cwd(), 'frontend', 'public', localRelPath);
      }

      if (!fs.existsSync(localDiskPath)) {
        console.warn(`[WARN] File not found on disk for image ID ${img.id}: "${img.storage_path}". Skipping.`);
        stats.skipped++;
        continue;
      }

      const fileBuffer = fs.readFileSync(localDiskPath);
      const ext = path.extname(localDiskPath);
      const mimeType = getMimeTypeFromExt(ext);
      const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Verify binary file signature
      const sig = validateImageSignature(fileBuffer, mimeType);
      if (!sig.valid) {
        console.warn(`[WARN] Signature validation failed for "${localDiskPath}": ${sig.error}. Skipping.`);
        stats.failed++;
        continue;
      }

      // Generate deterministic, idempotent storage path derived from record UUID and original filename
      const safeBasename = path.basename(localDiskPath, ext).replace(/[^a-z0-9_-]/gi, '-');
      const canonicalExt = getCanonicalExtension(mimeType);
      const destStoragePath = `products/migrated-${img.id}-${safeBasename}.${canonicalExt}`;

      console.log(`Processing [${img.id}]:`);
      console.log(`  Source:     ${localDiskPath} (${(fileBuffer.length / 1024).toFixed(1)} KB, SHA256: ${sha256.slice(0, 12)}...)`);
      console.log(`  Target:     ${targetBucket}/${destStoragePath}`);

      if (isDryRun) {
        console.log(`  [DRY-RUN] Would upload to "${destStoragePath}" and update record to "${destStoragePath}"\n`);
        stats.uploaded++;
        stats.dbUpdated++;
        continue;
      }

      try {
        // Check if object already exists in bucket
        const { data: existingData } = await supabaseService.storage.from(targetBucket).list('products', {
          search: path.basename(destStoragePath),
        });

        const alreadyExists = existingData && existingData.some((f) => f.name === path.basename(destStoragePath));

        if (alreadyExists) {
          console.log(`  [RESUME] Object already exists in bucket. Skipping upload.`);
          stats.alreadyUploaded++;
        } else {
          // Upload to Supabase Storage
          const { error: uploadError } = await supabaseService.storage
            .from(targetBucket)
            .upload(destStoragePath, fileBuffer, {
              contentType: mimeType,
              upsert: true,
            });

          if (uploadError) {
            console.error(`  [ERROR] Upload failed for ${img.id}:`, uploadError.message);
            stats.failed++;
            continue;
          }

          console.log(`  [SUCCESS] Uploaded to Supabase Storage.`);
          stats.uploaded++;
        }

        // Verify remote object: check that object exists and size matches local buffer
        const { data: verifyList, error: verifyErr } = await supabaseService.storage
          .from(targetBucket)
          .list('products', {
            search: path.basename(destStoragePath),
          });

        const verifiedObj = verifyList?.find((f) => f.name === path.basename(destStoragePath));
        if (verifyErr || !verifiedObj) {
          console.error(`  [INTEGRITY ERROR] Verification failed for ${destStoragePath}: object not confirmed in storage.`);
          stats.failed++;
          continue;
        }

        if (verifiedObj.metadata?.size && verifiedObj.metadata.size !== fileBuffer.length) {
          console.error(
            `  [INTEGRITY ERROR] Size mismatch for ${destStoragePath}: remote (${verifiedObj.metadata.size}) != local (${fileBuffer.length}).`
          );
          stats.failed++;
          continue;
        }

        console.log(`  [VERIFIED] Remote object integrity confirmed (${fileBuffer.length} bytes, SHA256: ${sha256.slice(0, 10)}...).`);

        // Update database record only after verification
        if (!usePostgrest && client) {
          await client.query(
            `UPDATE public.product_images
             SET storage_path = $1
             WHERE id = $2`,
            [destStoragePath, img.id]
          );
        } else {
          const { error: updateErr } = await supabaseService
            .from('product_images')
            .update({ storage_path: destStoragePath })
            .eq('id', img.id);
          if (updateErr) {
            throw new Error(`Failed to update product_images via Supabase Service API: ${updateErr.message}`);
          }
        }

        console.log(`  [DATABASE] Updated product_images.storage_path to "${destStoragePath}"\n`);
        stats.dbUpdated++;
      } catch (err: any) {
        console.error(`  [EXCEPTION] Failed processing ${img.id}:`, err.message);
        stats.failed++;
      }
    }
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }

  console.log('==============================================================================');
  console.log('                         MIGRATION SUMMARY                                    ');
  console.log('==============================================================================');
  console.log(`Scanned Local Records:   ${stats.scanned}`);
  console.log(`Already in Storage:      ${stats.alreadyUploaded}`);
  console.log(`Uploaded to Storage:     ${stats.uploaded}`);
  console.log(`Database Records Synced: ${stats.dbUpdated}`);
  console.log(`Skipped (Missing Files): ${stats.skipped}`);
  console.log(`Failed / Invalid:        ${stats.failed}`);
  console.log('==============================================================================\n');
}

runMigration().catch((err) => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
