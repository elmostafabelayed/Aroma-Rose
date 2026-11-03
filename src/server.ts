import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  try {
    // 1. Verify Database Connection
    const dbTest = await pool.query('SELECT now() as db_time, current_database() as db_name');
    logger.info(`Connected to PostgreSQL database: ${dbTest.rows[0].db_name} (Server time: ${dbTest.rows[0].db_time})`);

    // 2. Start Express HTTP Server
    const server = app.listen(env.PORT, () => {
      logger.info(`Aroma Rose Backend API listening on port ${env.PORT} [${env.NODE_ENV}]`);
      logger.info(`REST API Root: http://localhost:${env.PORT}/api/v1`);
      logger.info(`Health check: http://localhost:${env.PORT}/health`);
    });

    // 3. Graceful Shutdown Handlers
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        try {
          await pool.end();
          logger.info('PostgreSQL pool disconnected.');
          process.exit(0);
        } catch (err) {
          logger.error('Error during database disconnect', err);
          process.exit(1);
        }
      });

      // Force exit after 10s timeout
      setTimeout(() => {
        logger.error('Forceful shutdown timeout expired.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Fatal startup error in Aroma Rose Backend', error);
    process.exit(1);
  }
};

startServer();
