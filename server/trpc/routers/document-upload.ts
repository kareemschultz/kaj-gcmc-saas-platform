/**
 * Document Upload Router
 *
 * Handles file upload and download operations
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { requirePermission } from '../middleware/rbac';
import { TRPCError } from '@trpc/server';
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

export const documentUploadRouter = router({
  // Get presigned upload URL
  getUploadUrl: protectedProcedure
    .use(requirePermission('documents', 'create'))
    .input(uploadUrlSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify document belongs to tenant
      const document = await ctx.prisma.document.findFirst({
        where: {
          id: input.documentId,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!document) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
      }

      try {
        const { uploadUrl, filePath } = await generatePresignedUploadUrl(
          ctx.user.tenantId,
          input.fileName,
          input.contentType
        );

        ctx.logger.info('Generated upload URL for document:', {
          documentId: input.documentId,
          fileName: input.fileName,
        });

        return {
          uploadUrl,
          filePath,
          expiresIn: 900, // 15 minutes in seconds
        };
      } catch (error) {
        ctx.logger.error('Failed to generate upload URL', error as Error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate upload URL',
        });
      }
    }),

  // Confirm upload and create document version
  confirmUpload: protectedProcedure
    .use(requirePermission('documents', 'create'))
    .input(confirmUploadSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify document belongs to tenant
      const document = await ctx.prisma.document.findFirst({
        where: {
          id: input.documentId,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!document) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
      }

      try {
        // Verify file exists in storage
        const fileExists = await getFileMetadata(ctx.user.tenantId, input.fileUrl);
        if (!fileExists) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'File not found in storage' });
        }

        // Set all previous versions to not latest
        await ctx.prisma.documentVersion.updateMany({
          where: { documentId: input.documentId },
          data: { isLatest: false },
        });

        // Create new version
        const version = await ctx.prisma.documentVersion.create({
          data: {
            documentId: input.documentId,
            fileUrl: input.fileUrl,
            storageProvider: 'minio',
            fileSize: input.fileSize,
            mimeType: input.mimeType,
            issueDate: input.issueDate ? new Date(input.issueDate) : null,
            expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
            issuingAuthority: input.issuingAuthority || null,
            uploadedById: ctx.user.id,
            isLatest: true,
            metadata: {
              originalFileName: input.fileName,
              uploadedByUserId: ctx.user.id,
              uploadedAt: new Date().toISOString(),
            },
          },
        });

        // Update document's latestVersionId
        await ctx.prisma.document.update({
          where: { id: input.documentId },
          data: {
            latestVersionId: version.id,
            updatedAt: new Date(),
          },
        });

        ctx.logger.info('Document version created:', {
          documentId: input.documentId,
          versionId: version.id,
          fileName: input.fileName,
        });

        // Create audit log
        await ctx.prisma.auditLog.create({
          data: {
            tenantId: ctx.user.tenantId,
            actorUserId: ctx.user.id,
            clientId: document.clientId,
            entityType: 'DocumentVersion',
            entityId: version.id,
            action: 'CREATE',
            changes: {
              documentId: input.documentId,
              fileName: input.fileName,
              fileSize: input.fileSize,
            },
          },
        });

        return { success: true, version };
      } catch (error: any) {
        ctx.logger.error('Failed to confirm upload', error as Error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save document version',
        });
      }
    }),

  // Get presigned download URL
  getDownloadUrl: protectedProcedure
    .use(requirePermission('documents', 'view'))
    .input(z.object({ documentVersionId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Get document version and verify access
      const version = await ctx.prisma.documentVersion.findFirst({
        where: {
          id: input.documentVersionId,
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
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document version not found' });
      }

      // Verify tenant access
      if (version.document.tenantId !== ctx.user.tenantId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      try {
        const downloadUrl = await generatePresignedDownloadUrl(
          ctx.user.tenantId,
          version.fileUrl
        );

        ctx.logger.info('Generated download URL for document version:', {
          versionId: input.documentVersionId,
          documentId: version.documentId,
        });

        return {
          downloadUrl,
          fileName: (version.metadata as any)?.originalFileName || `document-${version.id}`,
          expiresIn: 3600, // 1 hour in seconds
        };
      } catch (error) {
        ctx.logger.error('Failed to generate download URL', error as Error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate download URL',
        });
      }
    }),

  // Delete document version
  deleteVersion: protectedProcedure
    .use(requirePermission('documents', 'delete'))
    .input(z.object({ documentVersionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Get document version and verify access
      const version = await ctx.prisma.documentVersion.findFirst({
        where: {
          id: input.documentVersionId,
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
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document version not found' });
      }

      // Verify tenant access
      if (version.document.tenantId !== ctx.user.tenantId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      try {
        // Delete file from storage
        await deleteFile(ctx.user.tenantId, version.fileUrl);

        // If this is the latest version, update document to point to previous version
        if (version.document.latestVersionId === input.documentVersionId) {
          // Find the previous latest version
          const previousVersion = await ctx.prisma.documentVersion.findFirst({
            where: {
              documentId: version.documentId,
              id: { not: input.documentVersionId },
            },
            orderBy: { uploadedAt: 'desc' },
          });

          if (previousVersion) {
            await ctx.prisma.documentVersion.update({
              where: { id: previousVersion.id },
              data: { isLatest: true },
            });

            await ctx.prisma.document.update({
              where: { id: version.documentId },
              data: { latestVersionId: previousVersion.id },
            });
          } else {
            await ctx.prisma.document.update({
              where: { id: version.documentId },
              data: { latestVersionId: null },
            });
          }
        }

        // Delete document version record
        await ctx.prisma.documentVersion.delete({
          where: { id: input.documentVersionId },
        });

        ctx.logger.info('Document version deleted:', {
          versionId: input.documentVersionId,
          documentId: version.documentId,
        });

        // Create audit log
        await ctx.prisma.auditLog.create({
          data: {
            tenantId: ctx.user.tenantId,
            actorUserId: ctx.user.id,
            clientId: version.document.clientId,
            entityType: 'DocumentVersion',
            entityId: input.documentVersionId,
            action: 'DELETE',
            changes: {
              documentId: version.documentId,
              fileUrl: version.fileUrl,
            },
          },
        });

        return { success: true };
      } catch (error: any) {
        ctx.logger.error('Failed to delete document version', error as Error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete document version',
        });
      }
    }),

  // Get file preview URL
  getPreviewUrl: protectedProcedure
    .use(requirePermission('documents', 'view'))
    .input(z.object({ documentVersionId: z.number() }))
    .query(async ({ ctx, input }) => {
      // For now, this is the same as download URL
      // MinIO presigned URLs can be used for preview in browsers
      const version = await ctx.prisma.documentVersion.findFirst({
        where: {
          id: input.documentVersionId,
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
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document version not found' });
      }

      // Verify tenant access
      if (version.document.tenantId !== ctx.user.tenantId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      try {
        const downloadUrl = await generatePresignedDownloadUrl(
          ctx.user.tenantId,
          version.fileUrl
        );

        ctx.logger.info('Generated preview URL for document version:', {
          versionId: input.documentVersionId,
          documentId: version.documentId,
        });

        return {
          previewUrl: downloadUrl,
          fileName: (version.metadata as any)?.originalFileName || `document-${version.id}`,
          expiresIn: 3600, // 1 hour in seconds
        };
      } catch (error) {
        ctx.logger.error('Failed to generate preview URL', error as Error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate preview URL',
        });
      }
    }),
});
