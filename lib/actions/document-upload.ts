'use server';

// Document Upload Server Actions
// Handles presigned URL generation, upload confirmation, downloads, and deletion

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import {
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  deleteFile,
  getFileMetadata,
} from '@/lib/storage-service';

// Validation schemas
const uploadUrlSchema = z.object({
  documentId: z.number(),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
});

const confirmUploadSchema = z.object({
  documentId: z.number(),
  fileUrl: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z.number().positive(),
  mimeType: z.string().min(1),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  issuingAuthority: z.string().optional(),
});

/**
 * Get presigned upload URL for a document
 * Returns URL that expires in 15 minutes
 */
export async function getUploadUrl(
  documentId: number,
  fileName: string,
  contentType: string
) {
  const session = await auth();
  if (!session?.user?.tenantId || !session?.user?.id) {
    throw new ApiError('Unauthorized', 401);
  }

  // Validate input
  const validated = uploadUrlSchema.parse({ documentId, fileName, contentType });

  // Verify document belongs to tenant
  const document = await prisma.document.findFirst({
    where: {
      id: validated.documentId,
      tenantId: session.user.tenantId,
    },
  });

  if (!document) {
    throw new ApiError('Document not found', 404);
  }

  try {
    const { uploadUrl, filePath } = await generatePresignedUploadUrl(
      session.user.tenantId,
      validated.fileName,
      validated.contentType
    );

    logger.info('Generated upload URL for document', {
      documentId: validated.documentId,
      fileName: validated.fileName,
      tenantId: session.user.tenantId,
    });

    return {
      uploadUrl,
      filePath,
      expiresIn: 900, // 15 minutes in seconds
    };
  } catch (error) {
    logger.error('Failed to generate upload URL', error as Error, {
      documentId: validated.documentId,
      fileName: validated.fileName,
    });
    throw new ApiError('Failed to generate upload URL', 500);
  }
}

/**
 * Confirm upload and create document version record
 * Called after client successfully uploads file to MinIO
 */
export async function confirmUpload(data: {
  documentId: number;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
}) {
  const session = await auth();
  if (!session?.user?.tenantId || !session?.user?.id) {
    throw new ApiError('Unauthorized', 401);
  }

  // Validate input
  const validated = confirmUploadSchema.parse(data);

  // Verify document belongs to tenant
  const document = await prisma.document.findFirst({
    where: {
      id: validated.documentId,
      tenantId: session.user.tenantId,
    },
  });

  if (!document) {
    throw new ApiError('Document not found', 404);
  }

  try {
    // Verify file exists in storage
    const fileExists = await getFileMetadata(session.user.tenantId, validated.fileUrl);
    if (!fileExists) {
      throw new ApiError('File not found in storage', 404);
    }

    // Set all previous versions to not latest
    await prisma.documentVersion.updateMany({
      where: { documentId: validated.documentId },
      data: { isLatest: false },
    });

    // Create new version
    const version = await prisma.documentVersion.create({
      data: {
        documentId: validated.documentId,
        fileUrl: validated.fileUrl,
        storageProvider: 'minio',
        fileSize: validated.fileSize,
        mimeType: validated.mimeType,
        issueDate: validated.issueDate ? new Date(validated.issueDate) : null,
        expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
        issuingAuthority: validated.issuingAuthority || null,
        uploadedById: session.user.id,
        isLatest: true,
        metadata: {
          originalFileName: validated.fileName,
          uploadedByUserId: session.user.id,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Update document's latestVersionId
    await prisma.document.update({
      where: { id: validated.documentId },
      data: {
        latestVersionId: version.id,
        updatedAt: new Date(),
      },
    });

    logger.info('Document version created', {
      documentId: validated.documentId,
      versionId: version.id,
      fileName: validated.fileName,
      tenantId: session.user.tenantId,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        clientId: document.clientId,
        entityType: 'DocumentVersion',
        entityId: version.id,
        action: 'create',
        changes: {
          documentId: validated.documentId,
          fileName: validated.fileName,
          fileSize: validated.fileSize,
        },
      },
    });

    revalidatePath('/dashboard/documents');
    revalidatePath(`/dashboard/documents/${validated.documentId}`);

    return { success: true, version };
  } catch (error) {
    logger.error('Failed to confirm upload', error as Error, {
      documentId: validated.documentId,
      fileName: validated.fileName,
    });

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Failed to save document version', 500);
  }
}

/**
 * Get presigned download URL for a document version
 * Returns URL that expires in 1 hour
 */
export async function getDownloadUrl(documentVersionId: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  // Get document version and verify access
  const version = await prisma.documentVersion.findFirst({
    where: {
      id: documentVersionId,
    },
    include: {
      document: {
        select: {
          id: true,
          tenantId: true,
          clientId: true,
          title: true,
        },
      },
    },
  });

  if (!version) {
    throw new ApiError('Document version not found', 404);
  }

  // Verify tenant access
  if (version.document.tenantId !== session.user.tenantId) {
    throw new ApiError('Unauthorized', 403);
  }

  try {
    const downloadUrl = await generatePresignedDownloadUrl(
      session.user.tenantId,
      version.fileUrl
    );

    logger.info('Generated download URL for document version', {
      versionId: documentVersionId,
      documentId: version.documentId,
      tenantId: session.user.tenantId,
    });

    return {
      downloadUrl,
      fileName: (version.metadata as any)?.originalFileName || `document-${version.id}`,
      expiresIn: 3600, // 1 hour in seconds
    };
  } catch (error) {
    logger.error('Failed to generate download URL', error as Error, {
      versionId: documentVersionId,
    });
    throw new ApiError('Failed to generate download URL', 500);
  }
}

/**
 * Delete a document version
 * Removes both database record and file from storage
 */
export async function deleteDocumentVersion(documentVersionId: number) {
  const session = await auth();
  if (!session?.user?.tenantId || !session?.user?.id) {
    throw new ApiError('Unauthorized', 401);
  }

  // Get document version and verify access
  const version = await prisma.documentVersion.findFirst({
    where: {
      id: documentVersionId,
    },
    include: {
      document: {
        select: {
          id: true,
          tenantId: true,
          clientId: true,
          latestVersionId: true,
        },
      },
    },
  });

  if (!version) {
    throw new ApiError('Document version not found', 404);
  }

  // Verify tenant access
  if (version.document.tenantId !== session.user.tenantId) {
    throw new ApiError('Unauthorized', 403);
  }

  try {
    // Delete file from storage
    await deleteFile(session.user.tenantId, version.fileUrl);

    // If this is the latest version, update document to point to previous version
    if (version.document.latestVersionId === documentVersionId) {
      // Find the previous latest version
      const previousVersion = await prisma.documentVersion.findFirst({
        where: {
          documentId: version.documentId,
          id: { not: documentVersionId },
        },
        orderBy: { uploadedAt: 'desc' },
      });

      if (previousVersion) {
        await prisma.documentVersion.update({
          where: { id: previousVersion.id },
          data: { isLatest: true },
        });

        await prisma.document.update({
          where: { id: version.documentId },
          data: { latestVersionId: previousVersion.id },
        });
      } else {
        await prisma.document.update({
          where: { id: version.documentId },
          data: { latestVersionId: null },
        });
      }
    }

    // Delete document version record
    await prisma.documentVersion.delete({
      where: { id: documentVersionId },
    });

    logger.info('Document version deleted', {
      versionId: documentVersionId,
      documentId: version.documentId,
      tenantId: session.user.tenantId,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        clientId: version.document.clientId,
        entityType: 'DocumentVersion',
        entityId: documentVersionId,
        action: 'delete',
        changes: {
          documentId: version.documentId,
          fileUrl: version.fileUrl,
        },
      },
    });

    revalidatePath('/dashboard/documents');
    revalidatePath(`/dashboard/documents/${version.documentId}`);

    return { success: true };
  } catch (error) {
    logger.error('Failed to delete document version', error as Error, {
      versionId: documentVersionId,
    });

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError('Failed to delete document version', 500);
  }
}

/**
 * Get file preview URL (same as download but with inline disposition)
 */
export async function getPreviewUrl(documentVersionId: number) {
  // For now, this is the same as download URL
  // MinIO presigned URLs can be used for preview in browsers
  return getDownloadUrl(documentVersionId);
}
