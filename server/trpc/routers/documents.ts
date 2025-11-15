/**
 * Documents tRPC Router
 *
 * Handles document management with file uploads and version control
 * Migrated from /lib/actions/documents.ts
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { requirePermission } from '../middleware/rbac';
import { auditLogMiddleware } from '../middleware/logging';

/**
 * Document validation schemas
 */
export const documentSchema = z.object({
  clientId: z.number().min(1, 'Client is required'),
  clientBusinessId: z.number().optional().nullable(),
  documentTypeId: z.number().min(1, 'Document type is required'),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  status: z.enum(['valid', 'expired', 'pending_review', 'rejected']),
  authority: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const documentVersionSchema = z.object({
  documentId: z.number(),
  fileUrl: z.string().url('Invalid file URL'),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  issuingAuthority: z.string().optional(),
});

/**
 * Documents router
 */
export const documentsRouter = router({
  /**
   * List documents with filtering and pagination
   * Requires: documents:view permission
   */
  list: protectedProcedure
    .use(requirePermission('documents', 'view'))
    .input(
      z
        .object({
          search: z.string().optional(),
          clientId: z.number().optional(),
          status: z.string().optional(),
          authority: z.string().optional(),
          page: z.number().default(1),
          pageSize: z.number().default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const {
        search = '',
        clientId,
        status,
        authority,
        page = 1,
        pageSize = 20,
      } = input || {};

      const skip = (page - 1) * pageSize;

      const where: any = { tenantId: ctx.user.tenantId };

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { client: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }

      if (clientId) where.clientId = clientId;
      if (status) where.status = status;
      if (authority) where.authority = authority;

      const [documents, total] = await Promise.all([
        ctx.prisma.document.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
          include: {
            client: {
              select: { id: true, name: true },
            },
            documentType: {
              select: { id: true, name: true, category: true },
            },
            latestVersion: {
              select: {
                id: true,
                issueDate: true,
                expiryDate: true,
                fileUrl: true,
                fileSize: true,
                mimeType: true,
              },
            },
          },
        }),
        ctx.prisma.document.count({ where }),
      ]);

      return {
        documents,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  /**
   * Get single document by ID
   * Requires: documents:view permission
   */
  get: protectedProcedure
    .use(requirePermission('documents', 'view'))
    .input(z.number())
    .query(async ({ ctx, input: id }) => {
      const document = await ctx.prisma.document.findFirst({
        where: {
          id,
          tenantId: ctx.user.tenantId,
        },
        include: {
          client: true,
          clientBusiness: true,
          documentType: true,
          versions: {
            orderBy: { uploadedAt: 'desc' },
          },
          latestVersion: true,
        },
      });

      if (!document) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found',
        });
      }

      return document;
    }),

  /**
   * Create new document
   * Requires: documents:create permission
   */
  create: protectedProcedure
    .use(requirePermission('documents', 'create'))
    .use(auditLogMiddleware('Document', 'create'))
    .input(documentSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify client belongs to tenant
      const client = await ctx.prisma.client.findFirst({
        where: {
          id: input.clientId,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!client) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        });
      }

      const document = await ctx.prisma.document.create({
        data: {
          ...input,
          tenantId: ctx.user.tenantId,
        },
        include: {
          client: true,
          documentType: true,
        },
      });

      ctx.logger.info('Document created', {
        documentId: document.id,
        tenantId: ctx.user.tenantId,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          clientId: input.clientId,
          entityType: 'Document',
          entityId: document.id,
          action: 'create',
          changes: input,
        },
      });

      return { success: true, document };
    }),

  /**
   * Update existing document
   * Requires: documents:edit permission
   */
  update: protectedProcedure
    .use(requirePermission('documents', 'edit'))
    .use(auditLogMiddleware('Document', 'update'))
    .input(
      z.object({
        id: z.number(),
        data: documentSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      // Verify document belongs to tenant
      const existing = await ctx.prisma.document.findFirst({
        where: { id, tenantId: ctx.user.tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found',
        });
      }

      const document = await ctx.prisma.document.update({
        where: { id },
        data,
        include: {
          client: true,
          documentType: true,
        },
      });

      ctx.logger.info('Document updated', {
        documentId: id,
        tenantId: ctx.user.tenantId,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'Document',
          entityId: id,
          action: 'update',
          changes: data,
        },
      });

      return { success: true, document };
    }),

  /**
   * Delete document
   * Requires: documents:delete permission
   */
  delete: protectedProcedure
    .use(requirePermission('documents', 'delete'))
    .use(auditLogMiddleware('Document', 'delete'))
    .input(z.number())
    .mutation(async ({ ctx, input: id }) => {
      // Verify document belongs to tenant
      const existing = await ctx.prisma.document.findFirst({
        where: { id, tenantId: ctx.user.tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found',
        });
      }

      await ctx.prisma.document.delete({ where: { id } });

      ctx.logger.info('Document deleted', {
        documentId: id,
        tenantId: ctx.user.tenantId,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'Document',
          entityId: id,
          action: 'delete',
        },
      });

      return { success: true };
    }),

  /**
   * Get document versions
   * Requires: documents:view permission
   */
  listVersions: protectedProcedure
    .use(requirePermission('documents', 'view'))
    .input(z.number())
    .query(async ({ ctx, input: documentId }) => {
      // Verify document belongs to tenant
      const document = await ctx.prisma.document.findFirst({
        where: {
          id: documentId,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!document) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found',
        });
      }

      const versions = await ctx.prisma.documentVersion.findMany({
        where: { documentId },
        orderBy: { uploadedAt: 'desc' },
      });

      return versions;
    }),
});
