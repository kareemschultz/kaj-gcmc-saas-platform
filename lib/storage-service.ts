// Storage Service - MinIO operations with tenant isolation
// All operations enforce tenant isolation via bucket naming: tenant-{tenantId}-documents

import { BucketItemStat } from 'minio';
import {
  minioClient,
  getTenantBucketName,
  UPLOAD_URL_EXPIRY,
  DOWNLOAD_URL_EXPIRY,
} from './minio';
import { logger } from './logger';

/**
 * Ensure bucket exists for a tenant
 * Creates bucket if it doesn't exist and sets private policy
 */
export async function ensureBucket(tenantId: number): Promise<void> {
  const bucketName = getTenantBucketName(tenantId);

  try {
    const exists = await minioClient.bucketExists(bucketName);

    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      logger.info(`Created bucket for tenant: ${bucketName}`);

      // Set bucket to private (default - no public access)
      // MinIO buckets are private by default, but we can explicitly set the policy
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Deny',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };

      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      logger.info(`Set private policy for bucket: ${bucketName}`);
    }
  } catch (error) {
    logger.error(`Failed to ensure bucket exists: ${bucketName}`, error as Error);
    throw new Error(`Failed to create or access bucket for tenant ${tenantId}`);
  }
}

/**
 * Generate presigned URL for uploading a file
 * URL expires in 15 minutes
 */
export async function generatePresignedUploadUrl(
  tenantId: number,
  fileName: string,
  contentType?: string
): Promise<{ uploadUrl: string; filePath: string }> {
  const bucketName = getTenantBucketName(tenantId);

  // Ensure bucket exists
  await ensureBucket(tenantId);

  // Generate unique file path with timestamp
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `documents/${timestamp}-${sanitizedFileName}`;

  try {
    // Generate presigned PUT URL
    const uploadUrl = await minioClient.presignedPutObject(
      bucketName,
      filePath,
      UPLOAD_URL_EXPIRY
    );

    logger.info('Generated presigned upload URL', {
      tenantId,
      fileName,
      filePath,
      expiresIn: UPLOAD_URL_EXPIRY,
    });

    return { uploadUrl, filePath };
  } catch (error) {
    logger.error('Failed to generate presigned upload URL', error as Error, {
      tenantId,
      fileName,
    });
    throw new Error('Failed to generate upload URL');
  }
}

/**
 * Generate presigned URL for downloading a file
 * URL expires in 1 hour
 */
export async function generatePresignedDownloadUrl(
  tenantId: number,
  filePath: string
): Promise<string> {
  const bucketName = getTenantBucketName(tenantId);

  try {
    const downloadUrl = await minioClient.presignedGetObject(
      bucketName,
      filePath,
      DOWNLOAD_URL_EXPIRY
    );

    logger.info('Generated presigned download URL', {
      tenantId,
      filePath,
      expiresIn: DOWNLOAD_URL_EXPIRY,
    });

    return downloadUrl;
  } catch (error) {
    logger.error('Failed to generate presigned download URL', error as Error, {
      tenantId,
      filePath,
    });
    throw new Error('Failed to generate download URL');
  }
}

/**
 * Upload file directly to MinIO (server-side upload)
 */
export async function uploadFile(
  tenantId: number,
  file: Buffer,
  fileName: string,
  metadata?: Record<string, string>
): Promise<{ filePath: string; size: number }> {
  const bucketName = getTenantBucketName(tenantId);

  // Ensure bucket exists
  await ensureBucket(tenantId);

  // Generate unique file path
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `documents/${timestamp}-${sanitizedFileName}`;

  try {
    const metaData = {
      'Content-Type': metadata?.contentType || 'application/octet-stream',
      ...metadata,
    };

    await minioClient.putObject(bucketName, filePath, file, file.length, metaData);

    logger.info('Uploaded file to storage', {
      tenantId,
      fileName,
      filePath,
      size: file.length,
    });

    return { filePath, size: file.length };
  } catch (error) {
    logger.error('Failed to upload file', error as Error, {
      tenantId,
      fileName,
    });
    throw new Error('Failed to upload file');
  }
}

/**
 * Delete file from storage
 */
export async function deleteFile(tenantId: number, filePath: string): Promise<void> {
  const bucketName = getTenantBucketName(tenantId);

  try {
    await minioClient.removeObject(bucketName, filePath);

    logger.info('Deleted file from storage', { tenantId, filePath });
  } catch (error) {
    logger.error('Failed to delete file', error as Error, { tenantId, filePath });
    throw new Error('Failed to delete file');
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(
  tenantId: number,
  filePath: string
): Promise<BucketItemStat> {
  const bucketName = getTenantBucketName(tenantId);

  try {
    const stat = await minioClient.statObject(bucketName, filePath);

    logger.info('Retrieved file metadata', { tenantId, filePath });

    return stat;
  } catch (error) {
    logger.error('Failed to get file metadata', error as Error, {
      tenantId,
      filePath,
    });
    throw new Error('File not found or inaccessible');
  }
}

/**
 * List files in bucket (with optional prefix filter)
 */
export async function listFiles(
  tenantId: number,
  prefix?: string
): Promise<Array<{ name: string; size: number; lastModified: Date }>> {
  const bucketName = getTenantBucketName(tenantId);

  try {
    const objectsStream = minioClient.listObjects(
      bucketName,
      prefix || '',
      true // recursive
    );

    const files: Array<{ name: string; size: number; lastModified: Date }> = [];

    for await (const obj of objectsStream) {
      if (obj.name) {
        files.push({
          name: obj.name,
          size: obj.size,
          lastModified: obj.lastModified,
        });
      }
    }

    logger.info('Listed files in bucket', { tenantId, prefix, count: files.length });

    return files;
  } catch (error) {
    logger.error('Failed to list files', error as Error, { tenantId, prefix });
    throw new Error('Failed to list files');
  }
}

/**
 * Check if file exists
 */
export async function fileExists(tenantId: number, filePath: string): Promise<boolean> {
  try {
    await getFileMetadata(tenantId, filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Copy file within the same bucket
 */
export async function copyFile(
  tenantId: number,
  sourceFilePath: string,
  destinationFilePath: string
): Promise<void> {
  const bucketName = getTenantBucketName(tenantId);

  try {
    await minioClient.copyObject(
      bucketName,
      destinationFilePath,
      `/${bucketName}/${sourceFilePath}`
    );

    logger.info('Copied file', {
      tenantId,
      source: sourceFilePath,
      destination: destinationFilePath,
    });
  } catch (error) {
    logger.error('Failed to copy file', error as Error, {
      tenantId,
      sourceFilePath,
      destinationFilePath,
    });
    throw new Error('Failed to copy file');
  }
}

/**
 * Get bucket statistics
 */
export async function getBucketStats(tenantId: number): Promise<{
  totalFiles: number;
  totalSize: number;
}> {
  const files = await listFiles(tenantId);

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  return {
    totalFiles: files.length,
    totalSize,
  };
}
