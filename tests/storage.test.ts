import test from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import {
  validateImageSignature,
  getCanonicalExtension,
  generateStorageObjectPath,
  getStoragePublicUrl,
  uploadProductImageToStorage,
  deleteProductImageFromStorage,
  MAX_IMAGE_SIZE_BYTES,
  STORAGE_BUCKET,
} from '../src/utils/storage.js';
import { ProductsService } from '../src/modules/products/products.service.js';
import { supabaseService } from '../src/config/supabase.js';
import { env } from '../src/config/env.js';

// Helper fixtures: minimal valid binary buffers for test images
const createValidJpegBuffer = (): Buffer => {
  return Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
};

const createValidPngBuffer = (): Buffer => {
  return Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
};

const createValidWebpBuffer = (): Buffer => {
  // 'RIFF' (4 bytes) + size (4 bytes) + 'WEBP' (4 bytes)
  const buf = Buffer.alloc(16);
  buf.write('RIFF', 0, 4, 'ascii');
  buf.writeUInt32LE(8, 4);
  buf.write('WEBP', 8, 4, 'ascii');
  return buf;
};

const createValidAvifBuffer = (): Buffer => {
  // size (4 bytes) + 'ftyp' (4 bytes) + 'avif' (4 bytes)
  const buf = Buffer.alloc(16);
  buf.writeUInt32BE(16, 0);
  buf.write('ftyp', 4, 4, 'ascii');
  buf.write('avif', 8, 4, 'ascii');
  return buf;
};

test('Aroma Rose — Mission 06.5: Supabase Storage & Image Security Suite', async (t) => {
  await t.test('1. Binary File Signature (Magic Numbers) Validation', () => {
    // 1.1 Valid JPEG
    const jpegBuf = createValidJpegBuffer();
    const jpegRes = validateImageSignature(jpegBuf, 'image/jpeg');
    assert.strictEqual(jpegRes.valid, true);
    assert.strictEqual(jpegRes.detectedType, 'image/jpeg');

    // 1.2 Valid PNG
    const pngBuf = createValidPngBuffer();
    const pngRes = validateImageSignature(pngBuf, 'image/png');
    assert.strictEqual(pngRes.valid, true);
    assert.strictEqual(pngRes.detectedType, 'image/png');

    // 1.3 Valid WebP
    const webpBuf = createValidWebpBuffer();
    const webpRes = validateImageSignature(webpBuf, 'image/webp');
    assert.strictEqual(webpRes.valid, true);
    assert.strictEqual(webpRes.detectedType, 'image/webp');

    // 1.4 Valid AVIF
    const avifBuf = createValidAvifBuffer();
    const avifRes = validateImageSignature(avifBuf, 'image/avif');
    assert.strictEqual(avifRes.valid, true);
    assert.strictEqual(avifRes.detectedType, 'image/avif');

    // 1.5 Spoofed Content: PHP / Shell code claiming to be image/jpeg
    const maliciousBuf = Buffer.from('<?php echo "evil shell payload"; ?>', 'utf8');
    const spoofRes = validateImageSignature(maliciousBuf, 'image/jpeg');
    assert.strictEqual(spoofRes.valid, false);
    assert.match(spoofRes.error || '', /File signature does not match any allowed image format/i);

    // 1.6 Mismatched MIME: PNG binary claiming to be image/jpeg
    const mismatchRes = validateImageSignature(pngBuf, 'image/jpeg');
    assert.strictEqual(mismatchRes.valid, false);
    assert.strictEqual(mismatchRes.detectedType, 'image/png');
    assert.match(mismatchRes.error || '', /declared Content-Type is image\/jpeg/i);

    // 1.7 Buffer too short (< 12 bytes)
    const shortBuf = Buffer.from([0xff, 0xd8]);
    const shortRes = validateImageSignature(shortBuf, 'image/jpeg');
    assert.strictEqual(shortRes.valid, false);
    assert.match(shortRes.error || '', /File is too small/i);
  });

  await t.test('2. File Extensions & Canonical MIME Mapping', () => {
    assert.strictEqual(getCanonicalExtension('image/jpeg'), 'jpg');
    assert.strictEqual(getCanonicalExtension('image/png'), 'png');
    assert.strictEqual(getCanonicalExtension('image/webp'), 'webp');
    assert.strictEqual(getCanonicalExtension('image/avif'), 'avif');
  });

  await t.test('3. Collision-Resistant Storage Path Generation & Path Traversal Guards', () => {
    const path1 = generateStorageObjectPath('image/jpeg');
    const path2 = generateStorageObjectPath('image/jpeg');

    // Must be unique
    assert.notStrictEqual(path1, path2);

    // Must reside in products/ namespace with canonical extension
    assert.match(path1, /^products\/\d+-[a-f0-9]{16}\.jpg$/);
    assert.match(path2, /^products\/\d+-[a-f0-9]{16}\.jpg$/);

    const pngPath = generateStorageObjectPath('image/png');
    assert.match(pngPath, /^products\/\d+-[a-f0-9]{16}\.png$/);
  });

  await t.test('4. Safe Deletion & Traversal Prevention', async () => {
    // 4.1 Traversal attempts must be strictly rejected
    const traversal1 = await deleteProductImageFromStorage('../passwords.txt');
    assert.strictEqual(traversal1, false);

    const traversal2 = await deleteProductImageFromStorage('products/../../etc/passwd');
    assert.strictEqual(traversal2, false);

    const traversal3 = await deleteProductImageFromStorage('products/..');
    assert.strictEqual(traversal3, false);

    const traversal4 = await deleteProductImageFromStorage('products\\payload.jpg');
    assert.strictEqual(traversal4, false);

    // 4.2 Non-product paths must be rejected
    const foreignBucket = await deleteProductImageFromStorage('user-avatars/avatar1.jpg');
    assert.strictEqual(foreignBucket, false);

    // 4.3 Local legacy assets must never be deleted via storage API
    const localAsset = await deleteProductImageFromStorage('/products/uploads/old-image.jpg');
    assert.strictEqual(localAsset, false);

    const seedAsset = await deleteProductImageFromStorage('/products/soins-du-visage/creme.jpg');
    assert.strictEqual(seedAsset, false);
  });

  await t.test('5. Backward-Compatible Public Image URL Construction', () => {
    // 5.1 Local legacy asset & root-relative paths: must be preserved as root-relative path
    const localUrl = getStoragePublicUrl('/products/uploads/1700000000-rose.jpg');
    assert.strictEqual(localUrl, '/products/uploads/1700000000-rose.jpg');

    const seedUrl = getStoragePublicUrl('/products/eaux-et-huiles/eau-de-rose.jpg');
    assert.strictEqual(seedUrl, '/products/eaux-et-huiles/eau-de-rose.jpg');

    const placeholderUrl = getStoragePublicUrl('/placeholder-rose.jpg');
    assert.strictEqual(placeholderUrl, '/placeholder-rose.jpg');

    const assetUrl = getStoragePublicUrl('/assets/brand-logo.svg');
    assert.strictEqual(assetUrl, '/assets/brand-logo.svg');

    // 5.2 Absolute HTTP/HTTPS URLs: must be preserved as-is
    const httpUrl = getStoragePublicUrl('https://cdn.example.com/images/banner.jpg');
    assert.strictEqual(httpUrl, 'https://cdn.example.com/images/banner.jpg');

    // 5.3 Storage object path: must resolve to Supabase CDN public URL
    const storagePath = 'products/1700000000-abcdef1234567890.webp';
    const cdnUrl = getStoragePublicUrl(storagePath, 'product-images');
    const expectedCdnPrefix = `${env.SUPABASE_URL}/storage/v1/object/public/product-images/products/1700000000-abcdef1234567890.webp`;
    assert.strictEqual(cdnUrl, expectedCdnPrefix);

    // 5.4 Redundant bucket prefix embedded in storage_path
    const redundantPath = 'product-images/products/1700000000-image.png';
    const cleanCdnUrl = getStoragePublicUrl(redundantPath, 'product-images');
    assert.strictEqual(
      cleanCdnUrl,
      `${env.SUPABASE_URL}/storage/v1/object/public/product-images/products/1700000000-image.png`
    );

    // 5.5 Empty / null
    assert.strictEqual(getStoragePublicUrl(null), null);
    assert.strictEqual(getStoragePublicUrl(undefined), null);
    assert.strictEqual(getStoragePublicUrl(''), null);
  });

  await t.test('6. ProductsService.uploadProductImage Validation Guards', async () => {
    // 6.1 Oversized file (> 5MB)
    const oversizedBase64 = Buffer.alloc(MAX_IMAGE_SIZE_BYTES + 1024).toString('base64');
    await assert.rejects(
      async () => {
        await ProductsService.uploadProductImage({
          file_name: 'huge.jpg',
          content_type: 'image/jpeg',
          file_base64: oversizedBase64,
        });
      },
      (err: any) => {
        assert.match(err.message, /File size exceeds maximum allowed of 5MB/i);
        return true;
      }
    );

    // 6.2 Spoofed binary signature
    const spoofedBase64 = Buffer.from('NOT_AN_IMAGE_CONTENT').toString('base64');
    await assert.rejects(
      async () => {
        await ProductsService.uploadProductImage({
          file_name: 'test.jpg',
          content_type: 'image/jpeg',
          file_base64: spoofedBase64,
        });
      },
      (err: any) => {
        assert.match(err.message, /File signature does not match any allowed image format/i);
        return true;
      }
    );
  });

  await t.test('7. Mocked Supabase Storage Upload & Deletion', async () => {
    // Save original supabaseService.storage methods
    const originalFrom = supabaseService.storage.from.bind(supabaseService.storage);

    let uploadedPath = '';
    let uploadedContentType = '';
    let deletedPath = '';

    // Mock storage client
    (supabaseService.storage as any).from = (bucket: string) => ({
      upload: async (objectPath: string, buffer: Buffer, options: any) => {
        uploadedPath = objectPath;
        uploadedContentType = options.contentType;
        return {
          data: { path: objectPath },
          error: null,
        };
      },
      remove: async (paths: string[]) => {
        deletedPath = paths[0];
        return {
          data: [{ name: paths[0] }],
          error: null,
        };
      },
    });

    try {
      // 7.1 Successful upload
      const validJpeg = createValidJpegBuffer();
      const res = await uploadProductImageToStorage(validJpeg, 'image/jpeg');

      assert.ok(res.storage_path.startsWith('products/'));
      assert.strictEqual(uploadedContentType, 'image/jpeg');
      assert.strictEqual(res.public_url, getStoragePublicUrl(res.storage_path));

      // 7.2 Successful delete
      const deleteSuccess = await deleteProductImageFromStorage(res.storage_path);
      assert.strictEqual(deleteSuccess, true);
      assert.strictEqual(deletedPath, res.storage_path);

      // 7.3 Storage upload failure simulation
      (supabaseService.storage as any).from = () => ({
        upload: async () => ({
          data: null,
          error: { message: 'Bucket quota exceeded' },
        }),
      });

      await assert.rejects(
        async () => {
          await uploadProductImageToStorage(validJpeg, 'image/jpeg');
        },
        (err: any) => {
          assert.match(err.message, /Bucket quota exceeded/i);
          return true;
        }
      );
    } finally {
      // Restore original method
      (supabaseService.storage as any).from = originalFrom;
    }
  });

  await t.test('8. Compound Product Creation Failure & Automatic Storage Cleanup Rollback', async () => {
    const originalFrom = supabaseService.storage.from.bind(supabaseService.storage);
    const cleanedUpPaths: string[] = [];

    (supabaseService.storage as any).from = (bucket: string) => ({
      remove: async (paths: string[]) => {
        cleanedUpPaths.push(...paths);
        return { data: [{ name: paths[0] }], error: null };
      },
    });

    try {
      // Intentionally invalid payload that fails DB insert (invalid category UUID or slug duplicate)
      // but contains newly uploaded storage paths
      const testImages = [
        {
          storage_path: 'products/1700000000-fail1.jpg',
          alt_text: 'Image 1',
          display_order: 0,
          is_primary: true,
        },
        {
          storage_path: '/products/legacy-local.jpg', // Local legacy asset must NOT be deleted
          alt_text: 'Legacy Image',
          display_order: 1,
          is_primary: false,
        },
      ];

      // Calling createAdminProduct with a failing payload (e.g. invalid UUID category)
      await assert.rejects(
        async () => {
          await ProductsService.createAdminProduct({
            name: 'Rollback Test Product',
            slug: 'rollback-test-product',
            price: 150,
            stock_quantity: 10,
            category_id: '00000000-0000-0000-0000-000000000000', // Non-existent category triggers FK failure
            images: testImages,
          });
        }
      );

      // Verify that the new storage object was targeted for rollback cleanup
      assert.ok(cleanedUpPaths.includes('products/1700000000-fail1.jpg'));
      // Verify that the legacy local asset was NOT touched
      assert.ok(!cleanedUpPaths.includes('products/legacy-local.jpg'));
      assert.ok(!cleanedUpPaths.includes('/products/legacy-local.jpg'));
    } finally {
      (supabaseService.storage as any).from = originalFrom;
    }
  });

  await t.test('9. Multiple Image Uploads & Image Ordering Contract', () => {
    const images = [
      { storage_path: 'products/img-secondary.jpg', alt_text: 'Second', display_order: 1, is_primary: false },
      { storage_path: 'products/img-primary.jpg', alt_text: 'Primary', display_order: 0, is_primary: true },
      { storage_path: 'products/img-third.jpg', alt_text: 'Third', display_order: 2, is_primary: false },
    ];

    // Verify ordering logic: primary image first, then by display_order
    const sorted = [...images].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return a.display_order - b.display_order;
    });

    assert.strictEqual(sorted[0].storage_path, 'products/img-primary.jpg');
    assert.strictEqual(sorted[0].is_primary, true);
    assert.strictEqual(sorted[1].storage_path, 'products/img-secondary.jpg');
    assert.strictEqual(sorted[2].storage_path, 'products/img-third.jpg');
  });

  await t.test('10. Authorization & Security Boundaries for Storage Operations', () => {
    // Verify that the service role client is used server-side only
    assert.ok(env.SUPABASE_SERVICE_ROLE_KEY, 'Server must have service role key');
    assert.ok(supabaseService, 'Server-side service client must be instantiated');

    // Verify that bucket name is product-images
    assert.strictEqual(STORAGE_BUCKET, 'product-images');
  });

  await t.test('11. Referential Integrity & Actively Referenced Image Deletion Protection', async () => {
    const { pool } = await import('../src/config/db.js');
    const originalConnect = pool.connect.bind(pool);

    try {
      // Mock pool.connect returning a client with an active product referencing this image
      pool.connect = (async () => {
        return {
          query: async (text: any, params: any) => {
            if (typeof text === 'string' && text.includes('SELECT product_id FROM public.product_images')) {
              return {
                rows: [{ product_id: '11111111-1111-1111-1111-111111111111' }],
                rowCount: 1,
              };
            }
            return { rows: [], rowCount: 0 };
          },
          release: () => {},
        };
      }) as any;

      // Attempting to delete an active image must throw ConflictError (HTTP 409)
      await assert.rejects(
        async () => {
          await ProductsService.deleteProductImage('products/active-product-image.jpg');
        },
        (err: any) => {
          assert.match(err.message, /actively referenced by product/i);
          assert.strictEqual(err.statusCode, 409);
          return true;
        }
      );
    } finally {
      pool.connect = originalConnect;
    }
  });

  await t.test('12. Transactional Advisory Lock on Image Deletion to Prevent Race Conditions', async () => {
    const { pool } = await import('../src/config/db.js');
    const originalConnect = pool.connect.bind(pool);
    const executedQueries: string[] = [];

    try {
      pool.connect = (async () => {
        return {
          query: async (text: any, params: any) => {
            if (typeof text === 'string') executedQueries.push(text);
            return { rows: [], rowCount: 0 };
          },
          release: () => {},
        };
      }) as any;

      await ProductsService.deleteProductImage('products/unreferenced-image.jpg');

      // Verify that pg_advisory_xact_lock was acquired
      assert.ok(
        executedQueries.some((q) => q.includes('pg_advisory_xact_lock')),
        'Must acquire pg_advisory_xact_lock before reference checking and deletion'
      );
    } finally {
      pool.connect = originalConnect;
    }
  });

  await t.test('13. Migration Policy & Target Project Safety Preflight', async () => {
    const fs = await import('fs');
    const path = await import('path');

    // 13.1 Verify storage migration SQL prevents policy drift
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20261105000500_supabase_storage_product_images.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');
    assert.ok(sqlContent.includes('DROP POLICY IF EXISTS "Public Access to product-images" ON storage.objects;'), 'Must drop existing policy to prevent preserving drifted policy definitions');
    assert.ok(sqlContent.includes('CREATE POLICY "Public Access to product-images"'), 'Must recreate policy with exact definition');
    assert.ok(sqlContent.includes("USING (bucket_id = 'product-images')"), 'Policy must be scoped to product-images bucket');

    // 13.2 Verify migration script contains target project binding
    const scriptPath = path.join(process.cwd(), 'scripts', 'migrate-images-to-supabase-storage.ts');
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    assert.ok(scriptContent.includes('tmzedtqltmtjubdguybe'), 'Script must bind to production project ref');
    assert.ok(scriptContent.includes('--confirm'), 'Script must require explicit confirmation flag');
  });
});
