/**
 * BullMQ Queue Definitions
 *
 * Centralized queue configuration for background job processing
 */

import { Queue } from 'bullmq';
import { redis } from './redis';
import { logger } from './logger';

// Queue names
export const QUEUE_NAMES = {
  COMPLIANCE: 'compliance',
  EXPIRY_NOTIFICATION: 'expiry-notification',
  FILING_REMINDER: 'filing-reminder',
  EMAIL: 'email',
} as const;

// Job names
export const JOB_NAMES = {
  COMPLIANCE_REFRESH: 'compliance-refresh',
  EXPIRY_CHECK: 'expiry-check',
  FILING_REMINDER_CHECK: 'filing-reminder-check',
  SEND_EMAIL: 'send-email',
} as const;

// Default queue options
const defaultQueueOptions = {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
};

/**
 * Compliance Queue
 * Handles compliance score calculations and refreshes
 */
export const complianceQueue = new Queue(QUEUE_NAMES.COMPLIANCE, {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    attempts: 2, // Fewer retries for expensive operations
  },
});

/**
 * Expiry Notification Queue
 * Handles document expiry notifications
 */
export const expiryNotificationQueue = new Queue(QUEUE_NAMES.EXPIRY_NOTIFICATION, {
  ...defaultQueueOptions,
});

/**
 * Filing Reminder Queue
 * Handles filing deadline reminders
 */
export const filingReminderQueue = new Queue(QUEUE_NAMES.FILING_REMINDER, {
  ...defaultQueueOptions,
});

/**
 * Email Queue
 * Handles email dispatch (stub for MVP)
 */
export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, {
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    attempts: 5, // More retries for email delivery
    backoff: {
      type: 'exponential' as const,
      delay: 5000,
    },
  },
});

// Event listeners for monitoring
const setupQueueEvents = (queue: Queue, queueName: string) => {
  queue.on('error', (error: Error) => {
    logger.error(`Queue ${queueName} error`, error);
  });

  queue.on('waiting', (jobId: string) => {
    logger.debug(`Job ${jobId} waiting in ${queueName}`);
  });

  queue.on('active', (jobId: string) => {
    logger.debug(`Job ${jobId} active in ${queueName}`);
  });

  queue.on('completed', (jobId: string) => {
    logger.info(`Job ${jobId} completed in ${queueName}`);
  });

  queue.on('failed', (jobId: string, error: Error) => {
    logger.error(`Job ${jobId} failed in ${queueName}`, error);
  });
};

// Setup event listeners for all queues
setupQueueEvents(complianceQueue, QUEUE_NAMES.COMPLIANCE);
setupQueueEvents(expiryNotificationQueue, QUEUE_NAMES.EXPIRY_NOTIFICATION);
setupQueueEvents(filingReminderQueue, QUEUE_NAMES.FILING_REMINDER);
setupQueueEvents(emailQueue, QUEUE_NAMES.EMAIL);

logger.info('BullMQ queues initialized successfully');

export default {
  complianceQueue,
  expiryNotificationQueue,
  filingReminderQueue,
  emailQueue,
};
