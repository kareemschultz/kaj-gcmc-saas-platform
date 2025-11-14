/**
 * Expiry Notifications Worker
 *
 * Runs daily to find documents expiring in 7, 14, or 30 days
 * and creates notifications for assigned users.
 */

import { Worker, Job } from 'bullmq';
import { redis } from '@/src/lib/redis';
import { QUEUE_NAMES, JOB_NAMES, emailQueue } from '@/src/lib/queues';
import { logger } from '@/src/lib/logger';
import { prisma } from '@/src/lib/prisma';

interface ExpiryNotificationJobData {
  tenantId?: number; // If provided, only check this tenant
  triggeredBy?: string;
}

interface ExpiryNotificationResult {
  tenantsProcessed: number;
  documentsChecked: number;
  notificationsCreated: number;
  emailsQueued: number;
  errors: Array<{ tenantId: number; error: string }>;
  duration: number;
}

interface DocumentExpiryInfo {
  documentId: number;
  documentTitle: string;
  clientId: number;
  clientName: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  documentType: string;
  tenantId: number;
}

/**
 * Calculate days until expiry
 */
function getDaysUntilExpiry(expiryDate: Date): number {
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Process expiry notification job
 */
async function processExpiryNotifications(
  job: Job<ExpiryNotificationJobData>
): Promise<ExpiryNotificationResult> {
  const startTime = Date.now();
  const { tenantId, triggeredBy = 'cron' } = job.data;

  logger.info('Starting expiry notifications check', {
    jobId: job.id,
    tenantId,
    triggeredBy,
  });

  const result: ExpiryNotificationResult = {
    tenantsProcessed: 0,
    documentsChecked: 0,
    notificationsCreated: 0,
    emailsQueued: 0,
    errors: [],
    duration: 0,
  };

  try {
    // Get tenants to process
    const tenants = await prisma.tenant.findMany({
      where: tenantId ? { id: tenantId } : {},
      select: { id: true, name: true },
    });

    logger.info(`Checking document expiries for ${tenants.length} tenant(s)`);

    // Define expiry thresholds (7, 14, 30 days)
    const now = new Date();
    const thresholds = [7, 14, 30];
    const maxDaysAhead = Math.max(...thresholds);
    const endDate = new Date(now.getTime() + maxDaysAhead * 24 * 60 * 60 * 1000);

    for (const tenant of tenants) {
      try {
        await job.updateProgress({
          current: result.tenantsProcessed + 1,
          total: tenants.length,
          tenantId: tenant.id,
        });

        // Find documents expiring within the next 30 days
        const expiringDocuments = await prisma.document.findMany({
          where: {
            tenantId: tenant.id,
            status: 'valid', // Only check valid documents
            latestVersion: {
              expiryDate: {
                gte: now,
                lte: endDate,
              },
            },
          },
          include: {
            client: {
              select: {
                id: true,
                name: true,
              },
            },
            documentType: {
              select: {
                name: true,
              },
            },
            latestVersion: {
              select: {
                expiryDate: true,
              },
            },
          },
        });

        result.documentsChecked += expiringDocuments.length;

        logger.info(`Found ${expiringDocuments.length} expiring documents for tenant ${tenant.name}`);

        // Group documents by days until expiry
        const documentsByDaysUntilExpiry: Map<number, DocumentExpiryInfo[]> = new Map();

        for (const doc of expiringDocuments) {
          if (!doc.latestVersion?.expiryDate) continue;

          const daysUntilExpiry = getDaysUntilExpiry(doc.latestVersion.expiryDate);

          // Check if this is a notification threshold
          if (thresholds.includes(daysUntilExpiry)) {
            if (!documentsByDaysUntilExpiry.has(daysUntilExpiry)) {
              documentsByDaysUntilExpiry.set(daysUntilExpiry, []);
            }

            documentsByDaysUntilExpiry.get(daysUntilExpiry)!.push({
              documentId: doc.id,
              documentTitle: doc.title,
              clientId: doc.client.id,
              clientName: doc.client.name,
              expiryDate: doc.latestVersion.expiryDate,
              daysUntilExpiry,
              documentType: doc.documentType.name,
              tenantId: tenant.id,
            });
          }
        }

        // Get tenant users to notify (e.g., admins and managers)
        const tenantUsers = await prisma.tenantUser.findMany({
          where: {
            tenantId: tenant.id,
            role: {
              name: {
                in: ['admin', 'manager', 'compliance_officer'],
              },
            },
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        });

        // Create notifications for each threshold
        for (const [daysUntilExpiry, documents] of documentsByDaysUntilExpiry) {
          for (const docInfo of documents) {
            // Create notifications for relevant users
            for (const tenantUser of tenantUsers) {
              const urgencyLevel = daysUntilExpiry <= 7 ? 'URGENT' : daysUntilExpiry <= 14 ? 'HIGH' : 'NORMAL';
              const message = `${urgencyLevel}: Document "${docInfo.documentTitle}" for client ${docInfo.clientName} expires in ${daysUntilExpiry} day(s)`;

              // Create in-app notification
              const notification = await prisma.notification.create({
                data: {
                  tenantId: tenant.id,
                  recipientUserId: tenantUser.user.id,
                  type: 'in_app',
                  channelStatus: 'sent',
                  message,
                  metadata: {
                    documentId: docInfo.documentId,
                    clientId: docInfo.clientId,
                    expiryDate: docInfo.expiryDate.toISOString(),
                    daysUntilExpiry,
                    urgencyLevel,
                  },
                },
              });

              result.notificationsCreated++;

              // Queue email notification
              await emailQueue.add(JOB_NAMES.SEND_EMAIL, {
                recipientEmail: tenantUser.user.email,
                recipientName: tenantUser.user.name,
                subject: `${urgencyLevel}: Document Expiring Soon`,
                template: 'document-expiry',
                data: {
                  documentTitle: docInfo.documentTitle,
                  clientName: docInfo.clientName,
                  expiryDate: docInfo.expiryDate.toISOString(),
                  daysUntilExpiry,
                  urgencyLevel,
                },
                notificationId: notification.id,
                tenantId: tenant.id,
              });

              result.emailsQueued++;
            }
          }
        }

        result.tenantsProcessed++;

        logger.info(`Expiry notifications created for tenant ${tenant.name}`, {
          tenantId: tenant.id,
          documentsChecked: expiringDocuments.length,
          notificationsCreated: result.notificationsCreated,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to process expiry notifications for tenant ${tenant.id}`, error as Error);

        result.errors.push({
          tenantId: tenant.id,
          error: errorMessage,
        });
      }
    }

    result.duration = Date.now() - startTime;

    logger.info('Expiry notifications check completed', {
      jobId: job.id,
      ...result,
    });

    return result;
  } catch (error) {
    logger.error('Expiry notifications job failed', error as Error);
    throw error;
  }
}

/**
 * Create and start the expiry notifications worker
 */
export function createExpiryNotificationsWorker() {
  const worker = new Worker<ExpiryNotificationJobData, ExpiryNotificationResult>(
    QUEUE_NAMES.EXPIRY_NOTIFICATION,
    processExpiryNotifications,
    {
      connection: redis,
      concurrency: 2,
    }
  );

  worker.on('completed', (job: Job, result: ExpiryNotificationResult) => {
    logger.info('Expiry notifications job completed', {
      jobId: job.id,
      tenantsProcessed: result.tenantsProcessed,
      documentsChecked: result.documentsChecked,
      notificationsCreated: result.notificationsCreated,
      emailsQueued: result.emailsQueued,
      duration: result.duration,
    });
  });

  worker.on('failed', (job: Job | undefined, error: Error) => {
    logger.error('Expiry notifications job failed', error, {
      jobId: job?.id,
    });
  });

  worker.on('error', (error: Error) => {
    logger.error('Expiry notifications worker error', error);
  });

  logger.info('Expiry notifications worker started');

  return worker;
}

export default createExpiryNotificationsWorker;
