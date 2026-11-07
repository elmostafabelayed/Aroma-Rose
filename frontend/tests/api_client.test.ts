import test from 'node:test';
import assert from 'node:assert';
import { ApiClient } from '../src/api/client.js';

test('Aroma Rose — Mission 06.7: Frontend ApiClient URL Construction & Environment Suite', async (t) => {
  await t.test('1. Relative base URL standard construction', () => {
    const client = new ApiClient('/api/v1');
    const url = client.buildUrl('/products');
    assert.strictEqual(url, '/api/v1/products');
  });

  await t.test('2. Relative base URL with trailing slash deduplication', () => {
    const client = new ApiClient('/api/v1/');
    const url = client.buildUrl('/products');
    assert.strictEqual(url, '/api/v1/products');
  });

  await t.test('3. Relative base URL without leading slash normalization', () => {
    const client = new ApiClient('api/v1');
    const url = client.buildUrl('products');
    assert.strictEqual(url, '/api/v1/products');
  });

  await t.test('4. Absolute HTTPS API base URL construction', () => {
    const client = new ApiClient('https://api.aromarose.ma/api/v1');
    const url = client.buildUrl('/store/settings');
    assert.strictEqual(url, 'https://api.aromarose.ma/api/v1/store/settings');
  });

  await t.test('5. Absolute HTTPS API base URL with trailing slash deduplication', () => {
    const client = new ApiClient('https://api.aromarose.ma/api/v1/');
    const url = client.buildUrl('/admin/products');
    assert.strictEqual(url, 'https://api.aromarose.ma/api/v1/admin/products');
  });

  await t.test('6. Query parameters preservation and encoding in relative URL', () => {
    const client = new ApiClient('/api/v1');
    const url = client.buildUrl('/products', {
      category: 'soins-visage',
      page: 2,
      limit: 10,
      empty: '',
      nullVal: null,
      undefVal: undefined,
    });
    assert.strictEqual(url, '/api/v1/products?category=soins-visage&page=2&limit=10');
  });

  await t.test('7. Query parameters preservation in absolute HTTPS URL', () => {
    const client = new ApiClient('https://api.aromarose.ma/api/v1');
    const url = client.buildUrl('/admin/orders', {
      status: 'pending',
      sort: 'created_at:desc',
    });
    assert.strictEqual(url, 'https://api.aromarose.ma/api/v1/admin/orders?status=pending&sort=created_at%3Adesc');
  });

  await t.test('8. Safe execution when window is undefined (SSR / test runner)', () => {
    // In node test environment, window is undefined
    assert.strictEqual(typeof window, 'undefined');
    const client = new ApiClient('/api/v1');
    const url = client.buildUrl('/health');
    assert.strictEqual(url, '/api/v1/health');
  });
});
