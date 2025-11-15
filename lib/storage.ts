// MinIO/S3 storage client wrapper

import { Client } from 'minio';
import { logger } from './logger';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const bucketName = process.env.MINIO_BUCKET_NAME || 'documents';

// Ensure bucket exists on startup
export async function ensureBucketExists() {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      logger.info(`Created storage bucket: ${bucketName}`);
    }
  } catch (error) {
    logger.error('Failed to ensure bucket exists', error as Error);
    throw error;
  }
}

export async function generatePresignedUploadUrl(
  tenantId: number,
  fileName: string,
  expirySeconds: number = 3600
): Promise<string> {
  const objectName = `tenant-${tenantId}/documents/${Date.now()}-${fileName}`;
  
  try {
    const url = await minioClient.presignedPutObject(bucketName, objectName, expirySeconds);
    return url;
  } catch (error) {
    logger.error('Failed to generate presigned upload URL', error as Error, { tenantId, fileName });
    throw error;
  }
}

export async function generatePresignedDownloadUrl(
  fileUrl: string,
  expirySeconds: number = 3600
): Promise<string> {
  try {
    // Extract object name from fileUrl (assuming it's stored as full path)
    const objectName = fileUrl.replace(`https://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucketName}/`, '');
    
    const url = await minioClient.presignedGetObject(bucketName, objectName, expirySeconds);
    return url;
  } catch (error) {
    logger.error('Failed to generate presigned download URL', error as Error, { fileUrl });
    throw error;
  }
}

export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    const objectName = fileUrl.replace(`https://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucketName}/`, '');
    await minioClient.removeObject(bucketName, objectName);
    logger.info('Deleted file from storage', { fileUrl });
  } catch (error) {
    logger.error('Failed to delete file', error as Error, { fileUrl });
    throw error;
  }
}

export { minioClient };
