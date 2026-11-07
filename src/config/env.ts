import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

export const KNOWN_INSECURE_JWT_SECRETS = new Set([
  'aroma-rose-default-jwt-secret-min-32-chars-long',
  'super-secret-jwt-token-key-for-aroma-rose-dev-only-min-32-chars',
  'change-me-to-a-secure-random-32-character-secret',
  'replace-with-a-real-secret-key-min-32-chars',
  'your-32-character-jwt-secret-goes-here',
  'default-jwt-secret-must-be-changed-in-production',
  'secret',
  'jwt_secret',
  'changeme',
]);

export const envSchema = z
  .object({
    PORT: z
      .union([z.string(), z.number()])
      .default('5000')
      .transform((val) => (typeof val === 'number' ? val : parseInt(val, 10)))
      .refine((val) => !isNaN(val) && val > 0 && val <= 65535, {
        message: 'PORT must be a valid port number between 1 and 65535.',
      }),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    CORS_ORIGIN: z.string().default('*'),
    SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
    SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
    SUPABASE_STORAGE_BUCKET: z.string().default('product-images'),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: z
      .string()
      .min(32, 'JWT_SECRET must be at least 32 characters long.'),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      const normalized = (data.JWT_SECRET || '').trim().toLowerCase();
      const isPlaceholder =
        KNOWN_INSECURE_JWT_SECRETS.has(normalized) ||
        normalized.includes('default') ||
        normalized.includes('dev-only') ||
        normalized.includes('placeholder') ||
        normalized.includes('change-me');

      if (isPlaceholder) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'JWT_SECRET must be explicitly set to a unique, secure secret in production (known defaults and dev placeholders rejected).',
          path: ['JWT_SECRET'],
        });
      }
    }
  });

export const parseEnv = (customEnv: Record<string, any> = process.env) => {
  const result = envSchema.safeParse(customEnv);
  if (!result.success) {
    const errorDetails = result.error.issues.map((i) => ` - ${i.path.join('.')}: ${i.message}`).join('\n');
    console.error('CRITICAL: Environment validation failed:\n' + errorDetails);
    throw new Error('Environment configuration error. Check .env variables.');
  }
  return result.data;
};

export const env = parseEnv();
export type Environment = z.infer<typeof envSchema>;

