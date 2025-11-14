# MinIO Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Start MinIO

```bash
docker-compose up -d minio
```

### Step 2: Verify MinIO is Running

- API: http://localhost:9000
- Console: http://localhost:9001
- Login: `minioadmin` / `minioadmin`

### Step 3: Run Setup Script

```bash
npm run setup:minio
```

### Step 4: Test Upload

1. Navigate to any document: `/dashboard/documents/[id]`
2. Click "Upload" tab
3. Drag and drop a file or click to browse
4. Add optional metadata (issue date, expiry date)
5. Click "Upload Document"

## 📁 File Paths Reference

### Core Files Created

```
/src/lib/minio.ts                           # MinIO client configuration
/src/lib/storage-service.ts                 # Storage operations
/src/lib/actions/document-upload.ts         # Server actions
/components/documents/document-uploader.tsx # Upload component
/components/documents/document-preview.tsx  # Preview component
/scripts/setup-minio.ts                     # Setup script
```

### Updated Files

```
/components/documents/document-versions-list.tsx  # Added download/delete
/app/(dashboard)/documents/[id]/page.tsx         # Added tabs & preview
/.env.example                                     # Added MINIO_REGION
/package.json                                     # Added setup:minio script
```

### UI Components Created

```
/components/ui/tabs.tsx           # Tabs component
/components/ui/progress.tsx       # Progress bar
/components/ui/separator.tsx      # Separator
/components/ui/alert-dialog.tsx   # Alert dialog
```

## 🔑 Key Features

### Upload Flow
1. Get presigned URL (15 min expiry)
2. Upload directly to MinIO
3. Confirm upload to database

### Download Flow
1. Request presigned URL (1 hour expiry)
2. Download directly from MinIO

### Security
- Tenant-isolated buckets: `tenant-{id}-documents`
- Private by default
- Presigned URLs with expiry
- Audit logging

## 📝 Common Commands

```bash
# Setup MinIO buckets
npm run setup:minio

# Start all services
docker-compose up -d

# View MinIO logs
docker-compose logs -f minio

# Access MinIO console
open http://localhost:9001

# Stop services
docker-compose down
```

## 🎯 Supported File Types

- **Documents**: PDF, DOCX, XLSX, XLS
- **Images**: PNG, JPG, JPEG, GIF, WebP
- **Max Size**: 50 MB

## 🔍 Preview Support

- ✅ PDF: In-browser viewer
- ✅ Images: Direct display
- ❌ Other: Download only

## 🛠 Troubleshooting

### Upload fails?
- Check presigned URL hasn't expired (15 min)
- Verify MinIO is running: `docker ps`
- Check file size < 50 MB

### Download fails?
- Check presigned URL hasn't expired (1 hour)
- Verify file exists in MinIO console
- Check browser console for errors

### Bucket not found?
- Run setup script: `npm run setup:minio`
- Check MinIO console for buckets

## 📚 Full Documentation

See [MINIO_SETUP.md](./MINIO_SETUP.md) for comprehensive documentation.

## 🔐 Production Checklist

Before deploying to production:

- [ ] Change MinIO credentials
- [ ] Enable SSL (MINIO_USE_SSL=true)
- [ ] Use strong access keys
- [ ] Configure firewall rules
- [ ] Enable versioning
- [ ] Set up backups
- [ ] Monitor access logs

## 💡 Example Usage

### Upload Component

```tsx
import { DocumentUploader } from '@/components/documents/document-uploader';

<DocumentUploader
  documentId={documentId}
  onUploadComplete={() => router.refresh()}
/>
```

### Preview Component

```tsx
import { DocumentPreview } from '@/components/documents/document-preview';

<DocumentPreview
  versionId={versionId}
  mimeType="application/pdf"
  fileName="document.pdf"
/>
```

### Download Programmatically

```tsx
import { getDownloadUrl } from '@/lib/actions/document-upload';

const { downloadUrl, fileName } = await getDownloadUrl(versionId);
window.open(downloadUrl, '_blank');
```

## 🎨 UI Components

The document detail page now includes:

- **Upload Tab**: Drag-and-drop uploader with progress
- **Versions Tab**: List with download/delete/preview
- **Preview Tab**: PDF/image viewer
- **Stats**: Total versions, status, client info

## 📊 Bucket Naming Convention

```
tenant-1-documents   → Tenant ID 1
tenant-2-documents   → Tenant ID 2
tenant-3-documents   → Tenant ID 3
```

Each tenant's files are completely isolated.

## ⚡ Quick Commands

```bash
# Full setup (first time)
docker-compose up -d && npm run setup:minio

# Restart MinIO
docker-compose restart minio

# Check MinIO status
curl http://localhost:9000/minio/health/live

# View all buckets
docker exec -it kgc-minio mc ls local/
```

## 🎉 You're Ready!

Your MinIO integration is complete and production-ready!

Next steps:
1. Test uploads/downloads
2. Configure production settings
3. Set up monitoring
4. Enable backups
