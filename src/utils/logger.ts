import { env } from '../config/env.js';

const sanitize = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  const copy = Array.isArray(data) ? [...data] : { ...data };
  for (const key of Object.keys(copy)) {
    if (['password', 'token', 'authorization', 'secret', 'key'].some((k) => key.toLowerCase().includes(k))) {
      copy[key] = '***REDACTED***';
    } else if (typeof copy[key] === 'object') {
      copy[key] = sanitize(copy[key]);
    }
  }
  return copy;
};

export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta ? sanitize(meta) : '');
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta ? sanitize(meta) : '');
  },
  error: (message: string, error?: any) => {
    if (env.NODE_ENV === 'production') {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error?.message || error);
    } else {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
    }
  },
};

