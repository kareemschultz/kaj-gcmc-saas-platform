/**
 * Job Scheduler
 *
 * Initializes all workers and sets up cron schedules for recurring jobs
 */

import { Worker } from 'bullmq';
import {
  complianceQueue,
  expiryNotificationQueue,
  filingReminderQueue,
  JOB_NAMES,
} from '@/src/lib/queues';
import { logger } from '@/src/lib/logger';
import { createComplianceRefreshWorker } from './compliance-refresh';
import { createExpiryNotificationsWorker } from './expiry-notifications';
import { createFilingRemindersWorker } from './filing-reminders';
import { createEmailDispatcherWorker } from './email-dispatcher';

// Store worker instances for graceful shutdown
const workers: Worker[] = [];

/**
 * Cron Schedules
 *
 * Cron format: minute hour day month dayOfWeek
 * Example: '0 2 * * *' = Every day at 2:00 AM
 */
const SCHEDULES = {
  // Compliance refresh: Daily at 2:00 AM
  COMPLIANCE_REFRESH: '0 2 * * *',

  // Expiry notifications: Daily at 8:00 AM
  EXPIRY_NOTIFICATIONS: '0 8 * * *',

  // Filing reminders: Daily at 8:00 AM
  FILING_REMINDERS: '0 8 * * *',

  // Email dispatcher runs continuously (no cron needed)
  // It processes emails from the queue as they arrive
} as const;

/**
 * Setup repeatable jobs with cron schedules
 */
async function setupScheduledJobs() {
  try {
    logger.info('Setting up scheduled jobs...');

    // 1. Compliance Refresh - Daily at 2 AM
    await complianceQueue.add(
      JOB_NAMES.COMPLIANCE_REFRESH,
      { triggeredBy: 'cron' },
      {
        repeat: {
          pattern: SCHEDULES.COMPLIANCE_REFRESH,
        },
        jobId: 'compliance-refresh-daily', // Prevent duplicates
      }
    );
    logger.info('Scheduled: Compliance Refresh (daily at 2 AM)');

    // 2. Expiry Notifications - Daily at 8 AM
    await expiryNotificationQueue.add(
      JOB_NAMES.EXPIRY_CHECK,
      { triggeredBy: 'cron' },
      {
        repeat: {
          pattern: SCHEDULES.EXPIRY_NOTIFICATIONS,
        },
        jobId: 'expiry-check-daily', // Prevent duplicates
      }
    );
    logger.info('Scheduled: Expiry Notifications (daily at 8 AM)');

    // 3. Filing Reminders - Daily at 8 AM
    await filingReminderQueue.add(
      JOB_NAMES.FILING_REMINDER_CHECK,
      { triggeredBy: 'cron' },
      {
        repeat: {
          pattern: SCHEDULES.FILING_REMINDERS,
        },
        jobId: 'filing-reminder-daily', // Prevent duplicates
      }
    );
    logger.info('Scheduled: Filing Reminders (daily at 8 AM)');

    logger.info('All scheduled jobs configured successfully');
  } catch (error) {
    logger.error('Failed to setup scheduled jobs', error as Error);
    throw error;
  }
}

/**
 * Start all workers
 */
async function startWorkers() {
  try {
    logger.info('Starting all job workers...');

    // Start compliance refresh worker
    const complianceWorker = createComplianceRefreshWorker();
    workers.push(complianceWorker);

    // Start expiry notifications worker
    const expiryWorker = createExpiryNotificationsWorker();
    workers.push(expiryWorker);

    // Start filing reminders worker
    const filingWorker = createFilingRemindersWorker();
    workers.push(filingWorker);

    // Start email dispatcher worker
    const emailWorker = createEmailDispatcherWorker();
    workers.push(emailWorker);

    logger.info(`All ${workers.length} workers started successfully`);
  } catch (error) {
    logger.error('Failed to start workers', error as Error);
    throw error;
  }
}

/**
 * Get existing scheduled jobs
 */
export async function getScheduledJobs() {
  try {
    const complianceJobs = await complianceQueue.getRepeatableJobs();
    const expiryJobs = await expiryNotificationQueue.getRepeatableJobs();
    const filingJobs = await filingReminderQueue.getRepeatableJobs();

    return {
      complianceRefresh: complianceJobs,
      expiryNotifications: expiryJobs,
      filingReminders: filingJobs,
    };
  } catch (error) {
    logger.error('Failed to get scheduled jobs', error as Error);
    throw error;
  }
}

/**
 * Clear all repeatable jobs (useful for cleanup or testing)
 */
export async function clearScheduledJobs() {
  try {
    logger.info('Clearing all scheduled jobs...');

    const complianceJobs = await complianceQueue.getRepeatableJobs();
    for (const job of complianceJobs) {
      await complianceQueue.removeRepeatableByKey(job.key);
    }

    const expiryJobs = await expiryNotificationQueue.getRepeatableJobs();
    for (const job of expiryJobs) {
      await expiryNotificationQueue.removeRepeatableByKey(job.key);
    }

    const filingJobs = await filingReminderQueue.getRepeatableJobs();
    for (const job of filingJobs) {
      await filingReminderQueue.removeRepeatableByKey(job.key);
    }

    logger.info('All scheduled jobs cleared');
  } catch (error) {
    logger.error('Failed to clear scheduled jobs', error as Error);
    throw error;
  }
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  logger.info('Shutting down workers...');

  try {
    // Close all workers
    await Promise.all(workers.map((worker) => worker.close()));
    logger.info('All workers closed successfully');

    // Exit process
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', error as Error);
    process.exit(1);
  }
}

/**
 * Handle shutdown signals
 */
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

/**
 * Main scheduler class
 */
class JobScheduler {
  private isRunning = false;

  async start() {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    try {
      logger.info('🚀 Starting Job Scheduler...');

      // Start all workers
      await startWorkers();

      // Setup cron schedules
      await setupScheduledJobs();

      this.isRunning = true;

      logger.info('✅ Job Scheduler started successfully');
      logger.info('Workers running:', {
        complianceRefresh: true,
        expiryNotifications: true,
        filingReminders: true,
        emailDispatcher: true,
      });
      logger.info('Scheduled jobs:', {
        complianceRefresh: SCHEDULES.COMPLIANCE_REFRESH,
        expiryNotifications: SCHEDULES.EXPIRY_NOTIFICATIONS,
        filingReminders: SCHEDULES.FILING_REMINDERS,
      });
    } catch (error) {
      logger.error('Failed to start Job Scheduler', error as Error);
      throw error;
    }
  }

  async stop() {
    if (!this.isRunning) {
      logger.warn('Scheduler is not running');
      return;
    }

    await shutdown();
    this.isRunning = false;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      workers: workers.length,
      schedules: SCHEDULES,
    };
  }
}

// Export singleton instance
export const scheduler = new JobScheduler();

export default scheduler;
