/**
 * Job Helper Functions
 *
 * Convenient functions to enqueue background jobs from application code
 */

import {
  complianceQueue,
  expiryNotificationQueue,
  filingReminderQueue,
  emailQueue,
  JOB_NAMES,
} from './queues';
import { logger } from './logger';
import { Job } from 'bullmq';

/**
 * Enqueue a compliance refresh job
 *
 * @param tenantId - Optional tenant ID. If omitted, refreshes all tenants
 * @param options - Additional job options
 * @returns Job instance
 */
export async function enqueueComplianceRefresh(
  tenantId?: number,
  options: {
    priority?: number;
    delay?: number;
    triggeredBy?: string;
  } = {}
): Promise<Job> {
  try {
    const job = await complianceQueue.add(
      JOB_NAMES.COMPLIANCE_REFRESH,
      {
        tenantId,
        triggeredBy: options.triggeredBy || 'manual',
      },
      {
        priority: options.priority,
        delay: options.delay,
      }
    );

    logger.info('Compliance refresh job enqueued', {
      jobId: job.id,
      tenantId,
      triggeredBy: options.triggeredBy,
    });

    return job;
  } catch (error) {
    logger.error('Failed to enqueue compliance refresh', error as Error);
    throw error;
  }
}

/**
 * Enqueue an expiry check job
 *
 * @param tenantId - Optional tenant ID. If omitted, checks all tenants
 * @param options - Additional job options
 * @returns Job instance
 */
export async function enqueueExpiryCheck(
  tenantId?: number,
  options: {
    priority?: number;
    delay?: number;
    triggeredBy?: string;
  } = {}
): Promise<Job> {
  try {
    const job = await expiryNotificationQueue.add(
      JOB_NAMES.EXPIRY_CHECK,
      {
        tenantId,
        triggeredBy: options.triggeredBy || 'manual',
      },
      {
        priority: options.priority,
        delay: options.delay,
      }
    );

    logger.info('Expiry check job enqueued', {
      jobId: job.id,
      tenantId,
      triggeredBy: options.triggeredBy,
    });

    return job;
  } catch (error) {
    logger.error('Failed to enqueue expiry check', error as Error);
    throw error;
  }
}

/**
 * Enqueue a filing reminder check job
 *
 * @param tenantId - Optional tenant ID. If omitted, checks all tenants
 * @param options - Additional job options
 * @returns Job instance
 */
export async function enqueueFilingReminder(
  tenantId?: number,
  options: {
    priority?: number;
    delay?: number;
    triggeredBy?: string;
  } = {}
): Promise<Job> {
  try {
    const job = await filingReminderQueue.add(
      JOB_NAMES.FILING_REMINDER_CHECK,
      {
        tenantId,
        triggeredBy: options.triggeredBy || 'manual',
      },
      {
        priority: options.priority,
        delay: options.delay,
      }
    );

    logger.info('Filing reminder job enqueued', {
      jobId: job.id,
      tenantId,
      triggeredBy: options.triggeredBy,
    });

    return job;
  } catch (error) {
    logger.error('Failed to enqueue filing reminder', error as Error);
    throw error;
  }
}

/**
 * Enqueue an email job
 *
 * @param data - Email data
 * @param options - Additional job options
 * @returns Job instance
 */
export async function enqueueEmail(
  data: {
    recipientEmail: string;
    recipientName: string;
    subject: string;
    template: string;
    data: Record<string, any>;
    notificationId?: number;
    tenantId: number;
  },
  options: {
    priority?: number;
    delay?: number;
  } = {}
): Promise<Job> {
  try {
    const job = await emailQueue.add(
      JOB_NAMES.SEND_EMAIL,
      data,
      {
        priority: options.priority,
        delay: options.delay,
      }
    );

    logger.info('Email job enqueued', {
      jobId: job.id,
      recipientEmail: data.recipientEmail,
      subject: data.subject,
      template: data.template,
    });

    return job;
  } catch (error) {
    logger.error('Failed to enqueue email', error as Error);
    throw error;
  }
}

/**
 * Get queue statistics
 *
 * @param queueName - Name of the queue ('compliance', 'expiry-notification', 'filing-reminder', 'email')
 * @returns Queue statistics
 */
export async function getQueueStats(
  queueName: 'compliance' | 'expiry-notification' | 'filing-reminder' | 'email'
) {
  try {
    let queue;
    switch (queueName) {
      case 'compliance':
        queue = complianceQueue;
        break;
      case 'expiry-notification':
        queue = expiryNotificationQueue;
        break;
      case 'filing-reminder':
        queue = filingReminderQueue;
        break;
      case 'email':
        queue = emailQueue;
        break;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  } catch (error) {
    logger.error('Failed to get queue stats', error as Error, { queueName });
    throw error;
  }
}

/**
 * Get all queue statistics
 *
 * @returns Statistics for all queues
 */
export async function getAllQueueStats() {
  try {
    const [compliance, expiry, filing, email] = await Promise.all([
      getQueueStats('compliance'),
      getQueueStats('expiry-notification'),
      getQueueStats('filing-reminder'),
      getQueueStats('email'),
    ]);

    return {
      compliance,
      'expiry-notification': expiry,
      'filing-reminder': filing,
      email,
    };
  } catch (error) {
    logger.error('Failed to get all queue stats', error as Error);
    throw error;
  }
}

/**
 * Clean up completed and failed jobs from a queue
 *
 * @param queueName - Name of the queue
 * @param options - Cleanup options
 */
export async function cleanupQueue(
  queueName: 'compliance' | 'expiry-notification' | 'filing-reminder' | 'email',
  options: {
    completedAge?: number; // Age in milliseconds
    failedAge?: number; // Age in milliseconds
    limit?: number; // Max number of jobs to clean
  } = {}
) {
  try {
    let queue;
    switch (queueName) {
      case 'compliance':
        queue = complianceQueue;
        break;
      case 'expiry-notification':
        queue = expiryNotificationQueue;
        break;
      case 'filing-reminder':
        queue = filingReminderQueue;
        break;
      case 'email':
        queue = emailQueue;
        break;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }

    // Default: remove jobs older than 7 days
    const completedAge = options.completedAge || 7 * 24 * 60 * 60 * 1000;
    const failedAge = options.failedAge || 7 * 24 * 60 * 60 * 1000;
    const limit = options.limit || 1000;

    const [completedCleaned, failedCleaned] = await Promise.all([
      queue.clean(completedAge, limit, 'completed'),
      queue.clean(failedAge, limit, 'failed'),
    ]);

    logger.info('Queue cleaned', {
      queueName,
      completedCleaned: completedCleaned.length,
      failedCleaned: failedCleaned.length,
    });

    return {
      queueName,
      completedCleaned: completedCleaned.length,
      failedCleaned: failedCleaned.length,
    };
  } catch (error) {
    logger.error('Failed to cleanup queue', error as Error, { queueName });
    throw error;
  }
}

/**
 * Pause a queue (stop processing jobs)
 *
 * @param queueName - Name of the queue
 */
export async function pauseQueue(
  queueName: 'compliance' | 'expiry-notification' | 'filing-reminder' | 'email'
) {
  try {
    let queue;
    switch (queueName) {
      case 'compliance':
        queue = complianceQueue;
        break;
      case 'expiry-notification':
        queue = expiryNotificationQueue;
        break;
      case 'filing-reminder':
        queue = filingReminderQueue;
        break;
      case 'email':
        queue = emailQueue;
        break;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }

    await queue.pause();
    logger.info('Queue paused', { queueName });
  } catch (error) {
    logger.error('Failed to pause queue', error as Error, { queueName });
    throw error;
  }
}

/**
 * Resume a paused queue
 *
 * @param queueName - Name of the queue
 */
export async function resumeQueue(
  queueName: 'compliance' | 'expiry-notification' | 'filing-reminder' | 'email'
) {
  try {
    let queue;
    switch (queueName) {
      case 'compliance':
        queue = complianceQueue;
        break;
      case 'expiry-notification':
        queue = expiryNotificationQueue;
        break;
      case 'filing-reminder':
        queue = filingReminderQueue;
        break;
      case 'email':
        queue = emailQueue;
        break;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }

    await queue.resume();
    logger.info('Queue resumed', { queueName });
  } catch (error) {
    logger.error('Failed to resume queue', error as Error, { queueName });
    throw error;
  }
}

// Export all functions
export default {
  enqueueComplianceRefresh,
  enqueueExpiryCheck,
  enqueueFilingReminder,
  enqueueEmail,
  getQueueStats,
  getAllQueueStats,
  cleanupQueue,
  pauseQueue,
  resumeQueue,
};
