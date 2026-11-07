import test from 'node:test';
import assert from 'node:assert';
import { envSchema } from '../src/config/env.js';

const VALID_BASE_ENV = {
  PORT: '5000',
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/test_db',
};

test('Aroma Rose — Pre-Release Environment Security & JWT_SECRET Suite', async (t) => {
  await t.test('1. Rejects missing JWT_SECRET in any environment', () => {
    const raw = { ...VALID_BASE_ENV, NODE_ENV: 'production' };
    const res = envSchema.safeParse(raw);
    assert.strictEqual(res.success, false);
    if (!res.success) {
      const issue = res.error.issues.find((i) => i.path.includes('JWT_SECRET'));
      assert.ok(issue, 'Expected issue on JWT_SECRET');
      assert.ok(issue.code === 'invalid_type' || issue.message.includes('expected string') || issue.message.includes('required'));
    }
  });

  await t.test('2. Rejects weak JWT_SECRET (< 32 characters)', () => {
    const raw = {
      ...VALID_BASE_ENV,
      NODE_ENV: 'production',
      JWT_SECRET: 'short-secret-123',
    };
    const res = envSchema.safeParse(raw);
    assert.strictEqual(res.success, false);
    if (!res.success) {
      const issue = res.error.issues.find((i) => i.path.includes('JWT_SECRET'));
      assert.ok(issue, 'Expected issue on JWT_SECRET');
      assert.strictEqual(issue.message, 'JWT_SECRET must be at least 32 characters long.');
    }
  });

  await t.test('3. Rejects known insecure default/placeholder secret in production', () => {
    const raw = {
      ...VALID_BASE_ENV,
      NODE_ENV: 'production',
      JWT_SECRET: 'aroma-rose-default-jwt-secret-min-32-chars-long',
    };
    const res = envSchema.safeParse(raw);
    assert.strictEqual(res.success, false);
    if (!res.success) {
      const issue = res.error.issues.find((i) => i.path.includes('JWT_SECRET'));
      assert.ok(issue, 'Expected issue on JWT_SECRET');
      assert.match(issue.message, /unique, secure secret in production/i);
    }
  });

  await t.test('4. Rejects dev-only placeholder secret in production', () => {
    const raw = {
      ...VALID_BASE_ENV,
      NODE_ENV: 'production',
      JWT_SECRET: 'super-secret-jwt-token-key-for-aroma-rose-dev-only-min-32-chars',
    };
    const res = envSchema.safeParse(raw);
    assert.strictEqual(res.success, false);
    if (!res.success) {
      const issue = res.error.issues.find((i) => i.path.includes('JWT_SECRET'));
      assert.ok(issue, 'Expected issue on JWT_SECRET');
      assert.match(issue.message, /unique, secure secret in production/i);
    }
  });

  await t.test('5. Accepts valid unique production JWT_SECRET (>= 32 chars)', () => {
    const raw = {
      ...VALID_BASE_ENV,
      NODE_ENV: 'production',
      JWT_SECRET: 'c9f8a3e7b2d14a689f0e1c3b5a7d9e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4e',
    };
    const res = envSchema.safeParse(raw);
    assert.strictEqual(res.success, true);
    if (res.success) {
      assert.strictEqual(res.data.JWT_SECRET, raw.JWT_SECRET);
      assert.strictEqual(res.data.NODE_ENV, 'production');
    }
  });

  await t.test('6. Supports Railway numeric or string PORT variables', () => {
    const fromString = envSchema.safeParse({
      ...VALID_BASE_ENV,
      PORT: '8080',
      JWT_SECRET: 'c9f8a3e7b2d14a689f0e1c3b5a7d9e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4e',
    });
    assert.strictEqual(fromString.success, true);
    if (fromString.success) {
      assert.strictEqual(fromString.data.PORT, 8080);
    }

    const fromNumber = envSchema.safeParse({
      ...VALID_BASE_ENV,
      PORT: 3000,
      JWT_SECRET: 'c9f8a3e7b2d14a689f0e1c3b5a7d9e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4e',
    });
    assert.strictEqual(fromNumber.success, true);
    if (fromNumber.success) {
      assert.strictEqual(fromNumber.data.PORT, 3000);
    }
  });

  await t.test('7. Defaults SUPABASE_STORAGE_BUCKET safely to product-images', () => {
    const res = envSchema.safeParse({
      ...VALID_BASE_ENV,
      JWT_SECRET: 'c9f8a3e7b2d14a689f0e1c3b5a7d9e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4e',
    });
    assert.strictEqual(res.success, true);
    if (res.success) {
      assert.strictEqual(res.data.SUPABASE_STORAGE_BUCKET, 'product-images');
    }
  });
});
