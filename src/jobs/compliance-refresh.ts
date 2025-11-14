/**
 * Compliance Refresh Worker
 *
 * Runs nightly to calculate and update compliance scores for all clients
 * across all tenants. Uses the compliance engine to perform calculations.
 */

import { Worker, Job } from 'bullmq';
import { redis } from '@/lib/redis';
import { QUEUE_NAMES, JOB_NAMES } from '@/lib/queues';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { refreshTenantCompliance } from '@/lib/compliance-engine';

interface ComplianceRefreshJobData {
  tenantId?: number; // If provided, only refresh this tenant
  triggeredBy?: string; // 'cron' | 'manual' | 'event'
}

interface ComplianceRefreshResult {
  tenantsProcessed: number;
  clientsUpdated: number;
  errors: Array<{ tenantId: number; error: string }>;
  duration: number;
}

/**
 * Process compliance refresh job
 */
async function processComplianceRefresh(
  job: Job<ComplianceRefreshJobData>
): Promise<ComplianceRefreshResult> {
  const startTime = Date.now();
  const { tenantId, triggeredBy = 'cron' } = job.data;

  logger.info('Starting compliance refresh', {
    jobId: job.id,
    tenantId,
    triggeredBy,
  });

  const result: ComplianceRefreshResult = {
    tenantsProcessed: 0,
    clientsUpdated: 0,
    errors: [],
    duration: 0,
  };

  try {
    // Get tenants to process
    let tenants;
    if (tenantId) {
      tenants = await prisma.tenant.findMany({
        where: { id: tenantId },
        select: { id: true, name: true },
      });
    } else {
      tenants = await prisma.tenant.findMany({
        select: { id: true, name: true },
      });
    }

    logger.info(`Processing compliance for ${tenants.length} tenant(s)`);

    // Process each tenant
    for (const tenant of tenants) {
      try {
        await job.updateProgress({
          current: result.tenantsProcessed + 1,
          total: tenants.length,
          tenantId: tenant.id,
          tenantName: tenant.name,
        });

        logger.info(`Refreshing compliance for tenant: ${tenant.name}`, {
          tenantId: tenant.id,
        });

        // Use the compliance engine to refresh all clients for this tenant
        const clientsUpdated = await refreshTenantCompliance(tenant.id);

        result.clientsUpdated += clientsUpdated;
        result.tenantsProcessed++;

        logger.info(`Tenant ${tenant.name} compliance refreshed`, {
          tenantId: tenant.id,
          clientsUpdated,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to refresh compliance for tenant ${tenant.id}`, error as Error);

        result.errors.push({
          tenantId: tenant.id,
          error: errorMessage,
        });

        // Continue with other tenants even if one fails
      }
    }

    result.duration = Date.now() - startTime;

    logger.info('Compliance refresh completed', {
      jobId: job.id,
      ...result,
    });

    return result;
  } catch (error) {
    logger.error('Compliance refresh job failed', error as Error);
    throw error;
  }
}

/**
 * Create and start the compliance refresh worker
 */
export function createComplianceRefreshWorker() {
  const worker = new Worker<ComplianceRefreshJobData, ComplianceRefreshResult>(
    QUEUE_NAMES.COMPLIANCE,
    processComplianceRefresh,
    {
      connection: redis,
      concurrency: 1, // Process one tenant at a time to avoid DB overload
      limiter: {
        max: 5, // Max 5 jobs per duration
        duration: 60000, // Per minute
      },
    }
  );

  worker.on('completed', (job: Job, result: ComplianceRefreshResult) => {
    logger.info('Compliance refresh job completed', {
      jobId: job.id,
      tenantsProcessed: result.tenantsProcessed,
      clientsUpdated: result.clientsUpdated,
      duration: result.duration,
      errors: result.errors.length,
    });
  });

  worker.on('failed', (job: Job | undefined, error: Error) => {
    logger.error('Compliance refresh job failed', error, {
      jobId: job?.id,
      jobData: job?.data,
    });
  });

  worker.on('error', (error: Error) => {
    logger.error('Compliance refresh worker error', error);
  });

  logger.info('Compliance refresh worker started');

  return worker;
}

export default createComplianceRefreshWorker;
