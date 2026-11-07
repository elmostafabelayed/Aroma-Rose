import http from 'http';
import { createApp } from '../src/app.js';
import { setupTestDatabase } from './api/setup.js';
import { pool } from '../src/config/db.js';

let server: http.Server;

async function start() {
  console.log('[QA-SERVER] Seeding isolated test database fixtures...');
  const ctx = await setupTestDatabase();
  console.log('[QA-SERVER] Test fixtures seeded:');
  console.log(' - Admin User:', ctx.adminUser.email);
  console.log(' - Staff User:', ctx.staffUser.email);
  console.log(' - Active Product:', ctx.productInStock.name, `(${ctx.productInStock.slug})`);

  const app = createApp();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[QA-SERVER] Test API Server successfully running on http://127.0.0.1:${PORT}`);
    console.log(`[QA-SERVER] Healthcheck available at: http://127.0.0.1:${PORT}/health`);
  });
}

process.on('SIGTERM', async () => {
  console.log('[QA-SERVER] Shutting down...');
  if (server) server.close();
  await pool.end();
  process.exit(0);
});

start().catch((err) => {
  console.error('[QA-SERVER FATAL]', err);
  process.exit(1);
});
