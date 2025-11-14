import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
    };
    redis: {
      status: 'up' | 'down' | 'not_configured';
      responseTime?: number;
    };
    storage: {
      status: 'up' | 'down' | 'not_configured';
      responseTime?: number;
    };
  };
  version?: string;
  uptime?: number;
}

async function checkDatabase(): Promise<{ status: 'up' | 'down'; responseTime?: number }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'up',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    logger.error('Database health check failed', error as Error);
    return { status: 'down' };
  }
}

async function checkRedis(): Promise<{ status: 'up' | 'down' | 'not_configured'; responseTime?: number }> {
  // Redis check - optional since it's for queue/cache only
  if (!process.env.REDIS_URL || process.env.REDIS_URL === '') {
    return { status: 'not_configured' };
  }

  const start = Date.now();
  try {
    // Try to import and check Redis if available
    // For now, return not_configured if Redis is optional
    return {
      status: 'not_configured',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    logger.warn('Redis health check failed', { error: (error as Error).message });
    return { status: 'down' };
  }
}

async function checkStorage(): Promise<{ status: 'up' | 'down' | 'not_configured'; responseTime?: number }> {
  // MinIO/S3 check - optional
  if (!process.env.MINIO_ENDPOINT) {
    return { status: 'not_configured' };
  }

  const start = Date.now();
  try {
    // Minimal check - just verify env vars are set
    // Full connectivity check would require MinIO client ping
    return {
      status: 'not_configured', // Conservative - don't claim 'up' without actual check
      responseTime: Date.now() - start,
    };
  } catch (error) {
    logger.warn('Storage health check failed', { error: (error as Error).message });
    return { status: 'down' };
  }
}

export async function GET() {
  const startTime = Date.now();

  try {
    // Run all health checks in parallel
    const [database, redis, storage] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      checkStorage(),
    ]);

    const checks = { database, redis, storage };

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    
    if (database.status === 'down') {
      status = 'unhealthy';
    } else if (redis.status === 'down' || storage.status === 'down') {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    const response: HealthCheck = {
      status,
      timestamp: new Date().toISOString(),
      checks,
      version: process.env.APP_VERSION || 'unknown',
      uptime: process.uptime(),
    };

    const statusCode = status === 'unhealthy' ? 503 : status === 'degraded' ? 200 : 200;

    if (status !== 'healthy') {
      logger.warn('Health check returned non-healthy status', { status, checks });
    }

    return NextResponse.json(response, { status: statusCode });
  } catch (error) {
    logger.error('Health check endpoint failed', error as Error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: 'down' as const },
        redis: { status: 'down' as const },
        storage: { status: 'down' as const },
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 503 });
  }
}
