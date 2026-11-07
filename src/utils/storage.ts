import crypto from 'crypto';
import { env } from '../config/env.js';
import { supabaseService } from '../config/supabase.js';
import { BadRequestError, InternalServerError } from './errors.js';

export const STORAGE_BUCKET = env.SUPABASE_STORAGE_BUCKET || 'product-images';
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Validates that binary file signature (magic numbers) matches the declared MIME type.
 * Protects against MIME spoofing and arbitrary file upload exploits.
 */
export const validateImageSignature = (
  buffer: Buffer,
  declaredMimeType: string
): { valid: boolean; detectedType?: string; error?: string } => {
  if (!buffer || buffer.length < 12) {
    return { valid: false, error: 'File is too small to be a valid image.' };
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    if (declaredMimeType === 'image/jpeg') {
      return { valid: true, detectedType: 'image/jpeg' };
    }
    return {
      valid: false,
      detectedType: 'image/jpeg',
      error: `File signature is JPEG but declared Content-Type is ${declaredMimeType}.`,
    };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    if (declaredMimeType === 'image/png') {
      return { valid: true, detectedType: 'image/png' };
    }
    return {
      valid: false,
      detectedType: 'image/png',
      error: `File signature is PNG but declared Content-Type is ${declaredMimeType}.`,
    };
  }

  // 3. WebP: RIFF (bytes 0-3) + WEBP (bytes 8-11)
  const isRiff = buffer.subarray(0, 4).toString('ascii') === 'RIFF';
  const isWebp = buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  if (isRiff && isWebp) {
    if (declaredMimeType === 'image/webp') {
      return { valid: true, detectedType: 'image/webp' };
    }
    return {
      valid: false,
      detectedType: 'image/webp',
      error: `File signature is WebP but declared Content-Type is ${declaredMimeType}.`,
    };
  }

  // 4. AVIF: ISOBMFF ftyp box with 'avif', 'avis', or 'mif1' brand
  const isFtyp = buffer.subarray(4, 8).toString('ascii') === 'ftyp';
  const majorBrand = buffer.subarray(8, 12).toString('ascii');
  if (isFtyp && (majorBrand.startsWith('avif') || majorBrand.startsWith('avis') || majorBrand.startsWith('mif1'))) {
    if (declaredMimeType === 'image/avif') {
      return { valid: true, detectedType: 'image/avif' };
    }
    return {
      valid: false,
      detectedType: 'image/avif',
      error: `File signature is AVIF but declared Content-Type is ${declaredMimeType}.`,
    };
  }

  return {
    valid: false,
    error: `File signature does not match any allowed image format (JPEG, PNG, WebP, AVIF).`,
  };
};

/**
 * Returns canonical file extension for an allowed image MIME type.
 */
export const getCanonicalExtension = (mimeType: string): string => {
  switch (mimeType.toLowerCase()) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/avif':
      return 'avif';
    default:
      return 'jpg';
  }
};

/**
 * Generates an unpredictable, collision-resistant object path in the products namespace.
 * Prevents path traversal and directory spoofing.
 */
export const generateStorageObjectPath = (mimeType: string): string => {
  const ext = getCanonicalExtension(mimeType);
  const randomHex = crypto.randomBytes(8).toString('hex');
  const timestamp = Date.now();
  return `products/${timestamp}-${randomHex}.${ext}`;
};

/**
 * Resolves a storage_path into a full public CDN URL.
 * Preserves full backward-compatibility with existing local assets.
 */
export const getStoragePublicUrl = (
  storagePath: string | null | undefined,
  bucket: string = STORAGE_BUCKET
): string | null => {
  if (!storagePath) return null;

  // 1. If already an absolute HTTP(S) URL, return directly
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath;
  }

  // 2. If it is a local filesystem path starting with /, return as-is for local backward compatibility
  if (storagePath.startsWith('/')) {
    return storagePath;
  }

  // 3. Clean leading slashes
  const cleanPath = storagePath.replace(/^\/+/, '');

  // 4. Strip redundant bucket prefix if already embedded
  const pathWithoutBucket = cleanPath.startsWith(`${bucket}/`)
    ? cleanPath.slice(bucket.length + 1)
    : cleanPath;

  return `${env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${pathWithoutBucket}`;
};

/**
 * Uploads an image buffer to Supabase Storage using the server-side Service Role client.
 * Restricts privileged writes strictly to backend operations.
 */
export const uploadProductImageToStorage = async (
  buffer: Buffer,
  mimeType: string,
  options?: { bucket?: string; customPath?: string }
): Promise<{ storage_path: string; public_url: string }> => {
  const bucket = options?.bucket || STORAGE_BUCKET;
  const objectPath = options?.customPath || generateStorageObjectPath(mimeType);

  const { data, error } = await supabaseService.storage
    .from(bucket)
    .upload(objectPath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error || !data) {
    const errorMsg = error ? error.message : 'Unknown storage upload error';
    console.error(`[STORAGE ERROR] Failed to upload product image to bucket "${bucket}":`, errorMsg);
    throw new InternalServerError(`Failed to store image in object storage. ${errorMsg}`);
  }

  const storage_path = data.path || objectPath;
  const public_url = getStoragePublicUrl(storage_path, bucket);

  return {
    storage_path,
    public_url: public_url || '',
  };
};

/**
 * Deletes an image from Supabase Storage using the server-side Service Role client.
 * Enforces strict namespace boundary (must reside in products/ namespace) to prevent arbitrary deletion.
 */
export const deleteProductImageFromStorage = async (
  storagePath: string,
  bucket: string = STORAGE_BUCKET
): Promise<boolean> => {
  if (!storagePath) return false;

  // Local legacy assets are never deleted via storage API
  if (storagePath.startsWith('/products/')) {
    return false;
  }

  // Extract path from full Supabase CDN URL if provided
  let objectPath = storagePath;
  const publicUrlPrefix = `${env.SUPABASE_URL}/storage/v1/object/public/${bucket}/`;
  if (objectPath.startsWith(publicUrlPrefix)) {
    objectPath = objectPath.slice(publicUrlPrefix.length);
  }

  // Clean leading slashes and optional bucket prefix
  objectPath = objectPath.replace(/^\/+/, '');
  if (objectPath.startsWith(`${bucket}/`)) {
    objectPath = objectPath.slice(bucket.length + 1);
  }

  // Security Invariant 1: Strictly reject any directory traversal attempts (dots or slashes in filename)
  if (objectPath.includes('..') || objectPath.includes('\\')) {
    console.warn(`[STORAGE SECURITY] Rejected deletion of traversal path: "${storagePath}"`);
    return false;
  }

  // Security Invariant 2: Must strictly belong to the products/ namespace with a valid alphanumeric filename and extension
  if (!/^products\/[a-zA-Z0-9_\-]+(\.[a-zA-Z0-9]+)+$/.test(objectPath)) {
    console.warn(`[STORAGE SECURITY] Rejected deletion of unauthorized storage path: "${storagePath}"`);
    return false;
  }

  const { error } = await supabaseService.storage.from(bucket).remove([objectPath]);
  if (error) {
    console.error(`[STORAGE ERROR] Failed to delete object "${objectPath}" from bucket "${bucket}":`, error.message);
    return false;
  }

  return true;
};
