# MinIO Integration Guide

This document provides comprehensive information about the MinIO object storage integration for secure document management in the KGC Compliance Cloud platform.

## Overview

The MinIO integration provides:
- **Tenant Isolation**: Each tenant has a dedicated bucket (`tenant-{tenantId}-documents`)
- **Secure Uploads**: Presigned URLs with 15-minute expiry
- **Secure Downloads**: Presigned URLs with 1-hour expiry
- **File Management**: Upload, download, preview, and delete document versions
- **Private Storage**: All buckets are private by default

## Architecture

### Components

1. **MinIO Client** (`/src/lib/minio.ts`)
   - Configured MinIO client instance
   - Bucket naming utilities
   - Health check functions

2. **Storage Service** (`/src/lib/storage-service.ts`)
   - Bucket management (ensure, create, delete)
   - Presigned URL generation (upload/download)
   - File operations (upload, delete, metadata)
   - Tenant isolation enforcement

3. **Document Upload Actions** (`/src/lib/actions/document-upload.ts`)
   - `getUploadUrl()` - Generate presigned upload URL
   - `confirmUpload()` - Save document version after upload
   - `getDownloadUrl()` - Generate presigned download URL
   - `deleteDocumentVersion()` - Remove version and file
   - `getPreviewUrl()` - Get preview URL for PDFs/images

4. **UI Components**
   - `DocumentUploader` - Drag-and-drop file upload
   - `DocumentVersionsList` - Version history with actions
   - `DocumentPreview` - PDF/image preview viewer

## Setup Instructions

### 1. Environment Variables

Update your `.env` file with MinIO configuration:

```env
# MinIO Configuration
MINIO_ENDPOINT="localhost"        # Use "minio" for Docker
MINIO_PORT="9000"
MINIO_USE_SSL="false"            # Set to "true" for production
MINIO_ACCESS_KEY="minioadmin"    # Change in production
MINIO_SECRET_KEY="minioadmin"    # Change in production
MINIO_REGION="us-east-1"
```

### 2. Start MinIO Service

**Using Docker Compose:**

```bash
docker-compose up -d minio
```

MinIO will be available at:
- API: http://localhost:9000
- Console: http://localhost:9001

**Default Credentials:**
- Username: `minioadmin`
- Password: `minioadmin`

### 3. Run Setup Script

After starting MinIO and seeding your database with tenants:

```bash
npm run setup:minio
```

This script will:
- Verify MinIO connection
- Create buckets for all existing tenants
- Set private bucket policies
- Verify the setup

**Expected Output:**

```
============================================================
MinIO Setup Script
============================================================

🔍 Verifying MinIO connection...
✓ MinIO connection successful

📦 Existing MinIO buckets:
  No buckets found

🏢 Fetching tenants from database...
✓ Found 2 tenant(s)

🚀 Creating buckets for tenants...

Processing tenant: Acme Corp (ID: 1, Code: ACME)
  ✓ Created bucket: tenant-1-documents
  ✓ Set private policy for: tenant-1-documents

Processing tenant: Beta Industries (ID: 2, Code: BETA)
  ✓ Created bucket: tenant-2-documents
  ✓ Set private policy for: tenant-2-documents

✅ Verifying bucket setup...
  ✓ Verified: tenant-1-documents
  ✓ Verified: tenant-2-documents

============================================================
Setup Summary
============================================================
Total tenants: 2
Buckets created/verified: 2
Buckets verified: 2
Failures: 0

📦 Existing MinIO buckets:
  - tenant-1-documents (created: 2025-01-15T10:30:00.000Z)
  - tenant-2-documents (created: 2025-01-15T10:30:00.000Z)

============================================================
✅ MinIO setup completed successfully!
============================================================
```

## Usage

### Document Upload Flow

1. **User selects file** in DocumentUploader component
2. **Client requests presigned URL** from server
3. **Server generates URL** with 15-minute expiry
4. **Client uploads directly** to MinIO using presigned URL
5. **Client confirms upload** to server
6. **Server creates DocumentVersion** record in database

**Benefits:**
- Files never pass through application server
- Reduced server load and bandwidth
- Faster uploads with direct S3 API
- Automatic tenant isolation

### Code Examples

#### Upload a Document Version

```typescript
import { DocumentUploader } from '@/components/documents/document-uploader';

// In your component
<DocumentUploader
  documentId={documentId}
  onUploadComplete={() => {
    // Handle completion
  }}
/>
```

#### Download a Document Version

```typescript
import { getDownloadUrl } from '@/lib/actions/document-upload';

const handleDownload = async (versionId: number) => {
  const { downloadUrl, fileName } = await getDownloadUrl(versionId);

  // Create download link
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = fileName;
  link.click();
};
```

#### Preview a Document

```typescript
import { DocumentPreview } from '@/components/documents/document-preview';

<DocumentPreview
  versionId={versionId}
  mimeType="application/pdf"
  fileName="document.pdf"
/>
```

## File Type Support

### Supported File Types

- **Documents**: PDF (`.pdf`), Word (`.docx`), Excel (`.xlsx`, `.xls`)
- **Images**: PNG (`.png`), JPEG (`.jpg`, `.jpeg`), GIF (`.gif`), WebP (`.webp`)

### File Size Limits

- Maximum upload size: **50 MB**
- Configurable in `DocumentUploader` component

### Preview Support

- **PDF**: In-browser iframe viewer
- **Images**: Direct image display
- **Other types**: Download button only

## Security Features

### Tenant Isolation

- Each tenant has a dedicated bucket: `tenant-{tenantId}-documents`
- No cross-tenant access possible
- Enforced at the storage service level

### Private Buckets

All buckets are created with private policies:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": { "AWS": ["*"] },
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::tenant-{id}-documents/*"]
    }
  ]
}
```

### Presigned URL Expiry

- **Upload URLs**: 15 minutes (900 seconds)
- **Download URLs**: 1 hour (3600 seconds)
- Configurable in `/src/lib/minio.ts`

### Access Control

- All operations verify tenant ownership
- User authentication required
- Audit logging for all operations

## Monitoring

### Health Check

```typescript
import { minioHealthCheck } from '@/lib/minio';

const health = await minioHealthCheck();
console.log(health);
// { status: 'healthy', message: 'MinIO is accessible' }
```

### Bucket Statistics

```typescript
import { getBucketStats } from '@/lib/storage-service';

const stats = await getBucketStats(tenantId);
console.log(stats);
// { totalFiles: 150, totalSize: 524288000 }
```

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to MinIO

**Solutions**:
1. Verify MinIO is running: `docker ps | grep minio`
2. Check environment variables in `.env`
3. Test connection: `curl http://localhost:9000/minio/health/live`

### Upload Failures

**Problem**: Upload fails with 403 Forbidden

**Solutions**:
1. Check presigned URL hasn't expired (15 min limit)
2. Verify bucket exists: `npm run setup:minio`
3. Check MinIO access credentials

### Download Issues

**Problem**: Cannot download files

**Solutions**:
1. Verify file exists in storage
2. Check presigned URL expiry (1 hour limit)
3. Verify tenant ownership of document

### Bucket Access Denied

**Problem**: Access denied errors

**Solutions**:
1. Run setup script: `npm run setup:minio`
2. Verify MinIO credentials in `.env`
3. Check bucket policies in MinIO console

## Production Deployment

### Recommended Settings

```env
# Production MinIO Configuration
MINIO_ENDPOINT="minio.yourdomain.com"
MINIO_PORT="443"
MINIO_USE_SSL="true"
MINIO_ACCESS_KEY="<strong-random-key>"
MINIO_SECRET_KEY="<strong-random-secret>"
MINIO_REGION="us-east-1"
```

### Security Checklist

- [ ] Change default MinIO credentials
- [ ] Enable SSL/TLS (HTTPS)
- [ ] Use strong access keys (32+ characters)
- [ ] Configure firewall rules
- [ ] Enable MinIO versioning
- [ ] Set up automated backups
- [ ] Monitor bucket access logs
- [ ] Implement rate limiting
- [ ] Configure CORS policies
- [ ] Enable encryption at rest

### Backup Strategy

1. **Regular Backups**: Use MinIO's built-in replication
2. **Cross-Region**: Replicate to secondary region
3. **Retention Policy**: Keep versions for compliance
4. **Test Restores**: Regularly test backup restoration

## API Reference

### Storage Service Functions

#### `ensureBucket(tenantId: number): Promise<void>`
Creates bucket if it doesn't exist.

#### `generatePresignedUploadUrl(tenantId, fileName, contentType): Promise<{uploadUrl, filePath}>`
Generates presigned upload URL with 15-minute expiry.

#### `generatePresignedDownloadUrl(tenantId, filePath): Promise<string>`
Generates presigned download URL with 1-hour expiry.

#### `uploadFile(tenantId, file, fileName, metadata): Promise<{filePath, size}>`
Direct server-side file upload.

#### `deleteFile(tenantId, filePath): Promise<void>`
Removes file from storage.

#### `getFileMetadata(tenantId, filePath): Promise<BucketItemStat>`
Retrieves file metadata.

#### `listFiles(tenantId, prefix?): Promise<Array>`
Lists all files in tenant bucket.

### Document Upload Actions

#### `getUploadUrl(documentId, fileName, contentType)`
Server action to get presigned upload URL.

#### `confirmUpload(data)`
Server action to confirm upload and create DocumentVersion.

#### `getDownloadUrl(documentVersionId)`
Server action to get presigned download URL.

#### `deleteDocumentVersion(documentVersionId)`
Server action to delete version and file.

## Performance Optimization

### Upload Optimization

1. **Direct Upload**: Files go directly to MinIO
2. **Chunked Upload**: For large files (future enhancement)
3. **Progress Tracking**: Real-time upload progress
4. **Compression**: Client-side image compression (future)

### Download Optimization

1. **CDN Integration**: Use CloudFront/CDN (future)
2. **Caching**: Browser caching with presigned URLs
3. **Lazy Loading**: Load previews on demand

## Maintenance

### Cleanup Old Files

```typescript
// Example cleanup script
import { listFiles, deleteFile } from '@/lib/storage-service';

async function cleanupOldFiles(tenantId: number, daysOld: number) {
  const files = await listFiles(tenantId);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  for (const file of files) {
    if (file.lastModified < cutoffDate) {
      await deleteFile(tenantId, file.name);
    }
  }
}
```

## Support

For issues or questions:
1. Check this documentation
2. Review MinIO logs: `docker-compose logs minio`
3. Check application logs
4. Contact platform administrator

## Resources

- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)
- [MinIO JavaScript SDK](https://min.io/docs/minio/linux/developers/javascript/API.html)
- [S3 API Reference](https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html)
