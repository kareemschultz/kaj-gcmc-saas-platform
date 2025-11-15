/**
 * Document Types Router
 *
 * Handles document type catalog management
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { requirePermission } from '../middleware/rbac';
import { TRPCError } from '@trpc/server';

// Validation schema
const documentTypeSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const documentTypesRouter = router({
  // List document types
  list: protectedProcedure
    .use(requirePermission('document_types', 'view'))
    .input(
      z.object({
        search: z.string().default(''),
        category: z.string().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, category, page, pageSize } = input;

      const where = {
        tenantId: ctx.user.tenantId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
        ...(category && { category }),
      };

      const [documentTypes, total] = await Promise.all([
        ctx.prisma.documentType.findMany({
          where,
          take: pageSize,
          skip: (page - 1) * pageSize,
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { documents: true },
            },
          },
        }),
        ctx.prisma.documentType.count({ where }),
      ]);

      return {
        documentTypes,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  // Get single document type
  get: protectedProcedure
    .use(requirePermission('document_types', 'view'))
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const documentType = await ctx.prisma.documentType.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
        },
        include: {
          _count: {
            select: { documents: true },
          },
        },
      });

      if (!documentType) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document type not found' });
      }

      return documentType;
    }),

  // Create document type
  create: protectedProcedure
    .use(requirePermission('document_types', 'create'))
    .input(documentTypeSchema)
    .mutation(async ({ ctx, input }) => {
      const documentType = await ctx.prisma.documentType.create({
        data: {
          ...input,
          tenantId: ctx.user.tenantId,
        },
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'DocumentType',
          entityId: documentType.id,
          action: 'CREATE',
          changes: { after: documentType },
        },
      });

      ctx.logger.info('Document type created:', { documentTypeId: documentType.id });

      return documentType;
    }),

  // Update document type
  update: protectedProcedure
    .use(requirePermission('document_types', 'edit'))
    .input(
      z.object({
        id: z.number(),
        data: documentTypeSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.documentType.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document type not found' });
      }

      const documentType = await ctx.prisma.documentType.update({
        where: { id: input.id },
        data: input.data,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'DocumentType',
          entityId: documentType.id,
          action: 'UPDATE',
          changes: { before: existing, after: documentType },
        },
      });

      ctx.logger.info('Document type updated:', { documentTypeId: documentType.id });

      return documentType;
    }),

  // Delete document type
  delete: protectedProcedure
    .use(requirePermission('document_types', 'delete'))
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.documentType.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
        },
        include: {
          _count: {
            select: { documents: true },
          },
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document type not found' });
      }

      // Check if document type has documents
      if (existing._count.documents > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot delete document type with ${existing._count.documents} associated documents`,
        });
      }

      await ctx.prisma.documentType.delete({
        where: { id: input.id },
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'DocumentType',
          entityId: input.id,
          action: 'DELETE',
          changes: { before: existing },
        },
      });

      ctx.logger.info('Document type deleted:', { documentTypeId: input.id });

      return { success: true };
    }),
});
