// MinIO Client Configuration for Secure Document Storage
// Uses tenant-isolated bucket naming: tenant-{tenantId}-documents

import { Client } from 'minio';
import { logger } from './logger';

// Initialize MinIO client with environment variables
export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  region: process.env.MINIO_REGION || 'us-east-1',
});

// Default expiry times for presigned URLs
export const UPLOAD_URL_EXPIRY = 15 * 60; // 15 minutes in seconds
export const DOWNLOAD_URL_EXPIRY = 60 * 60; // 1 hour in seconds

/**
 * Generate bucket name for a tenant
 * Format: tenant-{tenantId}-documents
 */
export function getTenantBucketName(tenantId: number): string {
  return `tenant-${tenantId}-documents`;
}

/**
 * Verify MinIO connection
 */
export async function verifyMinioConnection(): Promise<boolean> {
  try {
    await minioClient.listBuckets();
    logger.info('MinIO connection verified');
    return true;
  } catch (error) {
    logger.error('MinIO connection failed', error as Error);
    return false;
  }
}

/**
 * Health check for MinIO service
 */
export async function minioHealthCheck(): Promise<{ status: string; message: string }> {
  try {
    await minioClient.listBuckets();
    return { status: 'healthy', message: 'MinIO is accessible' };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
