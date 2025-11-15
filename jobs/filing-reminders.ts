/**
 * Filing Reminders Worker
 *
 * Runs daily to find filings due in the next 3, 7, or 14 days
 * and creates notifications and reminders for assigned users.
 */

import { Worker, Job } from 'bullmq';
import { redis } from '@/lib/redis';
import { QUEUE_NAMES, JOB_NAMES, emailQueue } from '@/lib/queues';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

interface FilingReminderJobData {
  tenantId?: number; // If provided, only check this tenant
  triggeredBy?: string;
}

interface FilingReminderResult {
  tenantsProcessed: number;
  filingsChecked: number;
  notificationsCreated: number;
  emailsQueued: number;
  urgentFilingsMarked: number;
  errors: Array<{ tenantId: number; error: string }>;
  duration: number;
}

interface FilingInfo {
  filingId: number;
  filingType: string;
  clientId: number;
  clientName: string;
  periodEnd: Date;
  daysUntilDue: number;
  status: string;
  tenantId: number;
  periodLabel: string | null;
}

/**
 * Calculate days until due
 */
function getDaysUntilDue(dueDate: Date): number {
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Process filing reminder job
 */
async function processFilingReminders(
  job: Job<FilingReminderJobData>
): Promise<FilingReminderResult> {
  const startTime = Date.now();
  const { tenantId, triggeredBy = 'cron' } = job.data;

  logger.info('Starting filing reminders check', {
    jobId: job.id,
    tenantId,
    triggeredBy,
  });

  const result: FilingReminderResult = {
    tenantsProcessed: 0,
    filingsChecked: 0,
    notificationsCreated: 0,
    emailsQueued: 0,
    urgentFilingsMarked: 0,
    errors: [],
    duration: 0,
  };

  try {
    // Get tenants to process
    const tenants = await prisma.tenant.findMany({
      where: tenantId ? { id: tenantId } : {},
      select: { id: true, name: true },
    });

    logger.info(`Checking filing reminders for ${tenants.length} tenant(s)`);

    // Define reminder thresholds (3, 7, 14 days)
    const now = new Date();
    const thresholds = [3, 7, 14];
    const maxDaysAhead = Math.max(...thresholds);
    const endDate = new Date(now.getTime() + maxDaysAhead * 24 * 60 * 60 * 1000);

    for (const tenant of tenants) {
      try {
        await job.updateProgress({
          current: result.tenantsProcessed + 1,
          total: tenants.length,
          tenantId: tenant.id,
        });

        // Find filings due within the next 14 days
        // Status: draft, prepared (not yet submitted)
        const upcomingFilings = await prisma.filing.findMany({
          where: {
            tenantId: tenant.id,
            status: {
              in: ['draft', 'prepared'],
            },
            periodEnd: {
              gte: now,
              lte: endDate,
            },
          },
          include: {
            client: {
              select: {
                id: true,
                name: true,
              },
            },
            filingType: {
              select: {
                name: true,
                code: true,
                authority: true,
              },
            },
          },
        });

        result.filingsChecked += upcomingFilings.length;

        logger.info(`Found ${upcomingFilings.length} upcoming filings for tenant ${tenant.name}`);

        // Group filings by days until due
        const filingsByDaysUntilDue: Map<number, FilingInfo[]> = new Map();

        for (const filing of upcomingFilings) {
          if (!filing.periodEnd) continue;

          const daysUntilDue = getDaysUntilDue(filing.periodEnd);

          // Check if this is a reminder threshold
          if (thresholds.includes(daysUntilDue)) {
            if (!filingsByDaysUntilDue.has(daysUntilDue)) {
              filingsByDaysUntilDue.set(daysUntilDue, []);
            }

            filingsByDaysUntilDue.get(daysUntilDue)!.push({
              filingId: filing.id,
              filingType: filing.filingType.name,
              clientId: filing.client.id,
              clientName: filing.client.name,
              periodEnd: filing.periodEnd,
              daysUntilDue,
              status: filing.status,
              tenantId: tenant.id,
              periodLabel: filing.periodLabel,
            });

            // Mark urgent filings (3 days or less)
            if (daysUntilDue <= 3 && filing.status !== 'overdue') {
              await prisma.filing.update({
                where: { id: filing.id },
                data: {
                  internalNotes: filing.internalNotes
                    ? `${filing.internalNotes}\n[URGENT] Due in ${daysUntilDue} days - automated flag`
                    : `[URGENT] Due in ${daysUntilDue} days - automated flag`,
                },
              });
              result.urgentFilingsMarked++;
            }
          }
        }

        // Get tenant users to notify
        const tenantUsers = await prisma.tenantUser.findMany({
          where: {
            tenantId: tenant.id,
            role: {
              name: {
                in: ['admin', 'manager', 'tax_preparer', 'compliance_officer'],
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

        // Also get task assignees for specific filings
        const filingIds = upcomingFilings.map((f) => f.id);
        const taskAssignees = await prisma.task.findMany({
          where: {
            filingId: { in: filingIds },
            assignedToId: { not: null },
          },
          select: {
            filingId: true,
            assignedTo: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        });

        // Create a map of filing ID to assignees
        const filingAssignees: Map<number, typeof taskAssignees[0]['assignedTo'][]> = new Map();
        for (const task of taskAssignees) {
          if (!task.assignedTo || !task.filingId) continue;
          if (!filingAssignees.has(task.filingId)) {
            filingAssignees.set(task.filingId, []);
          }
          filingAssignees.get(task.filingId)!.push(task.assignedTo);
        }

        // Create notifications for each threshold
        for (const [daysUntilDue, filings] of filingsByDaysUntilDue) {
          for (const filingInfo of filings) {
            const urgencyLevel = daysUntilDue <= 3 ? 'URGENT' : daysUntilDue <= 7 ? 'HIGH' : 'NORMAL';
            const message = `${urgencyLevel}: Filing "${filingInfo.filingType}" for client ${filingInfo.clientName} due in ${daysUntilDue} day(s)`;

            // Get recipients: tenant users + specific assignees
            const recipients = new Map<number, { id: number; email: string; name: string }>();

            // Add tenant-wide users
            for (const tu of tenantUsers) {
              recipients.set(tu.user.id, tu.user);
            }

            // Add specific assignees for this filing
            const assignees = filingAssignees.get(filingInfo.filingId) || [];
            for (const assignee of assignees) {
              if (!assignee) continue;
              recipients.set(assignee.id, assignee);
            }

            // Create notifications for each recipient
            for (const recipient of recipients.values()) {
              // Create in-app notification
              const notification = await prisma.notification.create({
                data: {
                  tenantId: tenant.id,
                  recipientUserId: recipient.id,
                  type: 'in_app',
                  channelStatus: 'sent',
                  message,
                  metadata: {
                    filingId: filingInfo.filingId,
                    clientId: filingInfo.clientId,
                    periodEnd: filingInfo.periodEnd.toISOString(),
                    daysUntilDue,
                    urgencyLevel,
                    filingType: filingInfo.filingType,
                  },
                },
              });

              result.notificationsCreated++;

              // Queue email notification
              await emailQueue.add(JOB_NAMES.SEND_EMAIL, {
                recipientEmail: recipient.email,
                recipientName: recipient.name,
                subject: `${urgencyLevel}: Filing Deadline Approaching`,
                template: 'filing-reminder',
                data: {
                  filingType: filingInfo.filingType,
                  clientName: filingInfo.clientName,
                  periodEnd: filingInfo.periodEnd.toISOString(),
                  periodLabel: filingInfo.periodLabel,
                  daysUntilDue,
                  urgencyLevel,
                  status: filingInfo.status,
                },
                notificationId: notification.id,
                tenantId: tenant.id,
              });

              result.emailsQueued++;
            }
          }
        }

        result.tenantsProcessed++;

        logger.info(`Filing reminders created for tenant ${tenant.name}`, {
          tenantId: tenant.id,
          filingsChecked: upcomingFilings.length,
          notificationsCreated: result.notificationsCreated,
          urgentFilingsMarked: result.urgentFilingsMarked,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to process filing reminders for tenant ${tenant.id}`, error as Error);

        result.errors.push({
          tenantId: tenant.id,
          error: errorMessage,
        });
      }
    }

    result.duration = Date.now() - startTime;

    logger.info('Filing reminders check completed', {
      jobId: job.id,
      ...result,
    });

    return result;
  } catch (error) {
    logger.error('Filing reminders job failed', error as Error);
    throw error;
  }
}

/**
 * Create and start the filing reminders worker
 */
export function createFilingRemindersWorker() {
  const worker = new Worker<FilingReminderJobData, FilingReminderResult>(
    QUEUE_NAMES.FILING_REMINDER,
    processFilingReminders,
    {
      connection: redis,
      concurrency: 2,
    }
  );

  worker.on('completed', (job: Job, result: FilingReminderResult) => {
    logger.info('Filing reminders job completed', {
      jobId: job.id,
      tenantsProcessed: result.tenantsProcessed,
      filingsChecked: result.filingsChecked,
      notificationsCreated: result.notificationsCreated,
      emailsQueued: result.emailsQueued,
      urgentFilingsMarked: result.urgentFilingsMarked,
      duration: result.duration,
    });
  });

  worker.on('failed', (job: Job | undefined, error: Error) => {
    logger.error('Filing reminders job failed', error, {
      jobId: job?.id,
    });
  });

  worker.on('error', (error: Error) => {
    logger.error('Filing reminders worker error', error);
  });

  logger.info('Filing reminders worker started');

  return worker;
}

export default createFilingRemindersWorker;
