/**
 * Worker Entry Point
 *
 * Main file to run all background job workers.
 * Run this with: tsx src/jobs/worker.ts
 */

import { scheduler } from './scheduler';
import { logger } from '@/lib/logger';

// Handle uncaught errors
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection', new Error(String(reason)));
  process.exit(1);
});

/**
 * Main function to start all workers
 */
async function main() {
  try {
    logger.info('======================================');
    logger.info('KGC Compliance Cloud - Job Workers');
    logger.info('======================================');
    logger.info('Environment:', { nodeEnv: process.env.NODE_ENV });
    logger.info('Redis URL:', { redisUrl: process.env.REDIS_URL || 'redis://localhost:6379' });
    logger.info('======================================');

    // Start the scheduler (which starts all workers and schedules)
    await scheduler.start();

    logger.info('======================================');
    logger.info('✅ All job workers started successfully');
    logger.info('Workers are now processing jobs...');
    logger.info('Press Ctrl+C to stop');
    logger.info('======================================');

    // Keep the process running
    process.stdin.resume();
  } catch (error) {
    logger.error('Failed to start workers', error as Error);
    process.exit(1);
  }
}

// Start the workers
main();
