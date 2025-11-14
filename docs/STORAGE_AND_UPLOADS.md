# Storage & File Uploads

Complete guide to document storage and file upload functionality.

## Overview

KGC Compliance Cloud uses MinIO for S3-compatible object storage, enabling secure document management with direct browser uploads.

## Architecture

\`\`\`
┌─────────┐           ┌──────────┐           ┌────────┐           ┌─────────┐
│ Browser │           │ Next.js  │           │ MinIO  │           │Database │
└────┬────┘           └────┬─────┘           └───┬────┘           └────┬────┘
     │                     │                     │                     │
     │ 1. Request upload URL                     │                     │
     ├────────────────────>│                     │                     │
     │                     │                     │                     │
     │                     │ 2. Generate presigned PUT URL             │
     │                     ├────────────────────>│                     │
     │                     │                     │                     │
     │                     │ 3. Return signed URL│                     │
     │                     │<────────────────────┤                     │
     │                     │                     │                     │
     │ 4. Upload file directly (no app server)  │                     │
     ├──────────────────────────────────────────>│                     │
     │                     │                     │                     │
     │ 5. Save metadata    │                     │                     │
     ├────────────────────>│                     │                     │
     │                     │                     │                     │
     │                     │ 6. Create Document record                 │
     │                     ├──────────────────────────────────────────>│
     │                     │                     │                     │
     │ 7. Success response │                     │                     │
     │<────────────────────┤                     │                     │
\`\`\`

## MinIO Configuration

### Docker Setup

MinIO runs as a Docker service:

\`\`\`yaml
# docker-compose.yml
services:
  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"  # API
      - "9001:9001"  # Console
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
\`\`\`

### Environment Variables

\`\`\`env
MINIO_ENDPOINT="minio"              # Docker service name
MINIO_PORT="9000"                   # API port
MINIO_ACCESS_KEY="minioadmin"      # Access key
MINIO_SECRET_KEY="minioadmin"      # Secret key
MINIO_USE_SSL="false"              # SSL disabled for local
MINIO_BUCKET_NAME="documents"      # Bucket name
\`\`\`

### Storage Client

\`\`\`typescript
// src/lib/storage.ts
import { Client } from 'minio';

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const bucketName = process.env.MINIO_BUCKET_NAME || 'documents';
\`\`\`

## Storage Structure

### Bucket Organization

\`\`\`
documents/                              # Root bucket
  ├── tenant-1/                        # KAJ tenant
  │   ├── documents/                   # Client documents
  │   │   ├── 1705234567890-passport.pdf
  │   │   ├── 1705234567891-license.pdf
  │   │   └── 1705234567892-invoice.pdf
  │   ├── exports/                     # Generated reports
  │   │   └── 1705234567893-report.pdf
  │   └── temp/                        # Temporary files
  └── tenant-2/                        # GCMC tenant
      └── documents/
          ├── 1705234567894-contract.pdf
          └── 1705234567895-statement.pdf
\`\`\`

### File Naming Convention

\`\`\`typescript
function generateFileName(tenantId: number, originalName: string): string {
  const timestamp = Date.now();
  const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `tenant-${tenantId}/documents/${timestamp}-${sanitized}`;
}
\`\`\`

## Upload Flow

### 1. Request Presigned URL

\`\`\`typescript
// src/lib/actions/documents.ts
export async function generateUploadUrl(
  fileName: string,
  fileType: string
) {
  const session = await auth();
  if (!session) throw new UnauthorizedError();
  
  // Generate presigned PUT URL (1 hour expiry)
  const presignedUrl = await generatePresignedUploadUrl(
    session.user.tenantId,
    fileName,
    3600 // 1 hour
  );
  
  return {
    uploadUrl: presignedUrl,
    fileKey: `tenant-${session.user.tenantId}/documents/${Date.now()}-${fileName}`,
  };
}
\`\`\`

### 2. Upload from Browser

\`\`\`typescript
// src/components/documents/document-form.tsx
async function handleFileUpload(file: File) {
  try {
    // 1. Get presigned URL
    const { uploadUrl, fileKey } = await generateUploadUrl(
      file.name,
      file.type
    );
    
    // 2. Upload directly to MinIO
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    // 3. Save metadata to database
    await createDocument({
      name: file.name,
      fileUrl: fileKey,
      fileSize: file.size,
      mimeType: file.type,
      // ...
    });
    
    toast.success('Document uploaded');
  } catch (error) {
    toast.error('Upload failed');
  }
}
\`\`\`

### 3. Save Metadata

\`\`\`typescript
export async function createDocument(input: DocumentInput) {
  const session = await auth();
  if (!session) throw new UnauthorizedError();
  
  const document = await prisma.document.create({
    data: {
      tenantId: session.user.tenantId,
      clientId: input.clientId,
      documentTypeId: input.documentTypeId,
      name: input.name,
      fileUrl: input.fileUrl,      // MinIO object key
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      uploadedById: session.user.id,
      version: 1,
    },
  });
  
  return document;
}
\`\`\`

## Download Flow

### 1. Generate Download URL

\`\`\`typescript
export async function getDocumentDownloadUrl(documentId: number) {
  const session = await auth();
  if (!session) throw new UnauthorizedError();
  
  // Get document
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });
  
  if (!document) throw new NotFoundError();
  
  // Verify tenant access
  if (document.tenantId !== session.user.tenantId) {
    throw new ForbiddenError();
  }
  
  // Generate presigned GET URL (1 hour expiry)
  const downloadUrl = await generatePresignedDownloadUrl(
    document.fileUrl,
    3600
  );
  
  return downloadUrl;
}
\`\`\`

### 2. Download from Browser

\`\`\`typescript
// src/components/documents/document-row.tsx
async function handleDownload(documentId: number) {
  const downloadUrl = await getDocumentDownloadUrl(documentId);
  
  // Open in new tab or trigger download
  window.open(downloadUrl, '_blank');
}
\`\`\`

## Document Versioning

### Version Structure

\`\`\`prisma
model Document {
  id          Int      @id @default(autoincrement())
  // ... fields ...
  version     Int      @default(1)
  versions    DocumentVersion[]
}

model DocumentVersion {
  id          Int      @id @default(autoincrement())
  documentId  Int
  document    Document @relation(fields: [documentId])
  version     Int
  fileUrl     String
  fileSize    BigInt
  uploadedById Int
  uploadedAt  DateTime @default(now())
}
\`\`\`

### Creating New Version

\`\`\`typescript
export async function uploadNewVersion(
  documentId: number,
  file: UploadedFile
) {
  const session = await auth();
  if (!session) throw new UnauthorizedError();
  
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
  });
  
  if (!document) throw new NotFoundError();
  if (document.tenantId !== session.user.tenantId) {
    throw new ForbiddenError();
  }
  
  const nextVersion = document.version + 1;
  
  // Create version record
  await prisma.documentVersion.create({
    data: {
      documentId,
      version: nextVersion,
      fileUrl: file.fileUrl,
      fileSize: file.fileSize,
      uploadedById: session.user.id,
    },
  });
  
  // Update document
  await prisma.document.update({
    where: { id: documentId },
    data: {
      version: nextVersion,
      fileUrl: file.fileUrl,
      fileSize: file.fileSize,
      updatedAt: new Date(),
    },
  });
  
  return document;
}
\`\`\`

## File Size Limits

### Upload Limits

\`\`\`typescript
// next.config.ts
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Max file size
    },
  },
};
\`\`\`

### Client-Side Validation

\`\`\`typescript
function validateFile(file: File): boolean {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  
  if (file.size > MAX_SIZE) {
    toast.error('File too large. Maximum size is 10MB.');
    return false;
  }
  
  const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    toast.error('Invalid file type.');
    return false;
  }
  
  return true;
}
\`\`\`

## Security

### Access Control

1. **Presigned URLs**: Temporary, expiring URLs
2. **Tenant Isolation**: Files organized by tenant
3. **Session Validation**: All uploads require authentication
4. **Permission Checks**: RBAC for upload/download
5. **Audit Logging**: Track all file operations

### Presigned URL Expiry

\`\`\`typescript
// Upload URLs: 1 hour (enough time to complete upload)
const uploadUrl = await minioClient.presignedPutObject(
  bucket,
  objectName,
  3600 // 1 hour
);

// Download URLs: 1 hour (enough time to view/download)
const downloadUrl = await minioClient.presignedGetObject(
  bucket,
  objectName,
  3600 // 1 hour
);
\`\`\`

### File Validation

\`\`\`typescript
// Server-side validation
function validateUpload(input: UploadInput): void {
  // Check file size
  if (input.fileSize > 10 * 1024 * 1024) {
    throw new ValidationError('File too large');
  }
  
  // Check MIME type
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  if (!allowedTypes.includes(input.mimeType)) {
    throw new ValidationError('Invalid file type');
  }
  
  // Check file extension
  const ext = input.fileName.split('.').pop()?.toLowerCase();
  const allowedExts = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
  if (!ext || !allowedExts.includes(ext)) {
    throw new ValidationError('Invalid file extension');
  }
}
\`\`\`

## MinIO Management

### Access MinIO Console

1. Open http://localhost:9001
2. Login with `minioadmin` / `minioadmin`
3. Browse buckets and files
4. Manage access policies
5. View metrics and logs

### CLI Commands

\`\`\`bash
# Set up alias
docker-compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin

# List buckets
docker-compose exec minio mc ls local

# List files
docker-compose exec minio mc ls local/documents

# Download file
docker-compose exec minio mc cp local/documents/tenant-1/documents/file.pdf ./

# Delete file
docker-compose exec minio mc rm local/documents/tenant-1/documents/file.pdf
\`\`\`

### Bucket Policies

\`\`\`typescript
// src/lib/storage.ts
export async function ensureBucketExists() {
  const exists = await minioClient.bucketExists(bucketName);
  
  if (!exists) {
    await minioClient.makeBucket(bucketName, 'us-east-1');
    
    // Set bucket policy (optional)
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`],
        },
      ],
    };
    
    await minioClient.setBucketPolicy(
      bucketName,
      JSON.stringify(policy)
    );
  }
}
\`\`\`

## Troubleshooting

### Upload Fails

1. Check MinIO is running: `docker-compose ps minio`
2. Verify environment variables in `.env`
3. Check file size is under limit
4. Verify presigned URL hasn't expired
5. Check browser console for errors

### Download Fails

1. Verify document exists in database
2. Check file exists in MinIO
3. Verify presigned URL hasn't expired
4. Check user has permission
5. Verify tenant isolation

### MinIO Connection Error

\`\`\`bash
# Test MinIO connection
curl http://localhost:9000/minio/health/live

# Check MinIO logs
docker-compose logs minio

# Restart MinIO
docker-compose restart minio
\`\`\`

### Files Not Appearing

1. Check bucket exists
2. Verify file path in database matches MinIO
3. Check MinIO console for uploaded files
4. Verify tenant ID in file path

## Performance Optimization

### Chunked Uploads

For large files, implement multipart uploads:

\`\`\`typescript
import { minioClient } from '@/src/lib/storage';

async function uploadLargeFile(file: File) {
  const chunkSize = 5 * 1024 * 1024; // 5MB chunks
  const chunks = Math.ceil(file.size / chunkSize);
  
  // Initialize multipart upload
  const uploadId = await minioClient.initiateNewMultipartUpload(
    bucketName,
    objectName
  );
  
  // Upload chunks
  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    
    await minioClient.uploadPart(
      bucketName,
      objectName,
      uploadId,
      i + 1,
      chunk
    );
  }
  
  // Complete upload
  await minioClient.completeMultipartUpload(
    bucketName,
    objectName,
    uploadId
  );
}
\`\`\`

### CDN Integration

For production, serve files through CDN:

\`\`\`typescript
const CDN_URL = process.env.CDN_URL;

function getPublicUrl(fileKey: string): string {
  if (CDN_URL) {
    return `${CDN_URL}/${fileKey}`;
  }
  return generatePresignedDownloadUrl(fileKey);
}
\`\`\`

## Production Recommendations

1. **Use S3 or managed MinIO** instead of self-hosted
2. **Enable SSL/TLS** for secure transfers
3. **Configure CDN** for faster downloads
4. **Set up backups** for disaster recovery
5. **Monitor storage usage** and set alerts
6. **Implement lifecycle policies** for old files
7. **Use stronger access keys** in production

## Next Steps

- Implement file preview
- Add OCR for text extraction (Phase 4)
- Set up automatic backups
- Configure CDN for production
- Add image thumbnail generation
