// BullMQ job queue setup and configuration

import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from './logger';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Queue names
export const QUEUE_NAMES = {
  DOCUMENT_PROCESSING: 'document-processing',
  RECURRING_FILINGS: 'recurring-filings',
  NOTIFICATIONS: 'notifications',
  COMPLIANCE_SCORING: 'compliance-scoring',
} as const;

// Create queues
export const documentProcessingQueue = new Queue(QUEUE_NAMES.DOCUMENT_PROCESSING, { connection });
export const recurringFilingsQueue = new Queue(QUEUE_NAMES.RECURRING_FILINGS, { connection });
export const notificationsQueue = new Queue(QUEUE_NAMES.NOTIFICATIONS, { connection });
export const complianceScoringQueue = new Queue(QUEUE_NAMES.COMPLIANCE_SCORING, { connection });

// Job types
export interface DocumentProcessingJob {
  documentVersionId: number;
  tenantId: number;
  fileUrl: string;
}

export interface RecurringFilingJob {
  recurringFilingId: number;
  tenantId: number;
}

export interface NotificationJob {
  tenantId: number;
  recipientUserId: number;
  type: 'email' | 'in_app' | 'sms';
  message: string;
  metadata?: Record<string, any>;
}

export interface ComplianceScoringJob {
  clientId: number;
  tenantId: number;
}

// Add jobs to queues
export async function queueDocumentProcessing(job: DocumentProcessingJob) {
  await documentProcessingQueue.add('process-document', job, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
  logger.info('Queued document processing job', { documentVersionId: job.documentVersionId });
}

export async function queueRecurringFiling(job: RecurringFilingJob) {
  await recurringFilingsQueue.add('generate-filing', job, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  });
  logger.info('Queued recurring filing job', { recurringFilingId: job.recurringFilingId });
}

export async function queueNotification(job: NotificationJob) {
  await notificationsQueue.add('send-notification', job, {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });
  logger.info('Queued notification job', { recipientUserId: job.recipientUserId, type: job.type });
}

export async function queueComplianceScoring(job: ComplianceScoringJob) {
  await complianceScoringQueue.add('calculate-score', job, {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
  });
  logger.info('Queued compliance scoring job', { clientId: job.clientId });
}

// TODO: Implement workers in Phase 2-4
// Workers will be created in separate files under /src/workers/
