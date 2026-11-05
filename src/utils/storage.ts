import { env } from '../config/env.js';

export const STORAGE_BUCKET = 'catalog';
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Resolves a storage_path into a full public CDN URL
 */
export const getStoragePublicUrl = (storagePath: string | null | undefined): string | null => {
  if (!storagePath) return null;

  // If already an absolute HTTP(S) URL or root-relative local path, return directly
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://') || storagePath.startsWith('/')) {
    return storagePath;
  }

  // Clean leading slashes
  const cleanPath = storagePath.replace(/^\/+/, '');

  // Strip redundant bucket prefix if already embedded
  const pathWithoutBucket = cleanPath.startsWith(`${STORAGE_BUCKET}/`)
    ? cleanPath.slice(STORAGE_BUCKET.length + 1)
    : cleanPath;

  return `${env.SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${pathWithoutBucket}`;
};
