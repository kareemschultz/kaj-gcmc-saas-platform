/**
 * Requirement Bundles Router
 *
 * Handles compliance requirement bundles
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { requirePermission } from '../middleware/rbac';
import { TRPCError } from '@trpc/server';

// Validation schemas
const requirementBundleSchema = z.object({
  name: z.string().min(1).max(255),
  authority: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
});

const requirementBundleItemSchema = z.object({
  bundleId: z.number().min(1),
  documentTypeId: z.number().optional().nullable(),
  filingTypeId: z.number().optional().nullable(),
  required: z.boolean().default(true),
  description: z.string().optional(),
  order: z.number().default(0),
});

export const requirementBundlesRouter = router({
  // List bundles
  list: protectedProcedure
    .use(requirePermission('requirement_bundles', 'view'))
    .input(
      z.object({
        authority: z.string().optional(),
        category: z.string().optional(),
        search: z.string().default(''),
      })
    )
    .query(async ({ ctx, input }) => {
      const { authority, category, search } = input;

      const where = {
        tenantId: ctx.user.tenantId,
        ...(authority && { authority }),
        ...(category && { category }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      };

      const bundles = await ctx.prisma.requirementBundle.findMany({
        where,
        include: {
          items: {
            include: {
              documentType: {
                select: { id: true, name: true, category: true },
              },
              filingType: {
                select: { id: true, name: true, code: true },
              },
            },
            orderBy: { order: 'asc' },
          },
          _count: {
            select: { items: true },
          },
        },
        orderBy: [{ authority: 'asc' }, { name: 'asc' }],
      });

      return bundles;
    }),

  // Get single bundle
  get: protectedProcedure
    .use(requirePermission('requirement_bundles', 'view'))
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const bundle = await ctx.prisma.requirementBundle.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
        },
        include: {
          items: {
            include: {
              documentType: true,
              filingType: true,
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!bundle) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Requirement bundle not found' });
      }

      return bundle;
    }),

  // Get bundle requirements with details
  getRequirements: protectedProcedure
    .use(requirePermission('requirement_bundles', 'view'))
    .input(z.object({ bundleId: z.number() }))
    .query(async ({ ctx, input }) => {
      const bundle = await ctx.prisma.requirementBundle.findFirst({
        where: {
          id: input.bundleId,
          tenantId: ctx.user.tenantId,
        },
        include: {
          items: {
            include: {
              documentType: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  description: true,
                  authority: true,
                  metadata: true,
                },
              },
              filingType: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  authority: true,
                  frequency: true,
                  description: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!bundle) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Requirement bundle not found' });
      }

      return bundle;
    }),

  // Check bundle progress for a client
  checkProgress: protectedProcedure
    .use(requirePermission('requirement_bundles', 'view'))
    .input(
      z.object({
        clientId: z.number(),
        bundleId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { clientId, bundleId } = input;

      // Verify client belongs to tenant
      const client = await ctx.prisma.client.findFirst({
        where: { id: clientId, tenantId: ctx.user.tenantId },
      });

      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
      }

      // Get the bundle with its requirements
      const bundle = await ctx.prisma.requirementBundle.findFirst({
        where: {
          id: bundleId,
          tenantId: ctx.user.tenantId,
        },
        include: {
          items: {
            include: {
              documentType: true,
              filingType: true,
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!bundle) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Requirement bundle not found' });
      }

      // Check which requirements are fulfilled
      const progress = await Promise.all(
        bundle.items.map(async (item) => {
          let fulfilled = false;
          let documents: any[] = [];
          let filings: any[] = [];

          if (item.documentTypeId) {
            // Check if client has this document type
            const clientDocs = await ctx.prisma.document.findMany({
              where: {
                clientId,
                documentTypeId: item.documentTypeId,
                tenantId: ctx.user.tenantId,
                status: { in: ['valid', 'pending_review'] },
              },
              include: {
                latestVersion: {
                  select: {
                    id: true,
                    issueDate: true,
                    expiryDate: true,
                    fileUrl: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            });

            documents = clientDocs;
            fulfilled = clientDocs.length > 0;
          }

          if (item.filingTypeId) {
            // Check if client has filings for this type
            const clientFilings = await ctx.prisma.filing.findMany({
              where: {
                clientId,
                filingTypeId: item.filingTypeId,
                tenantId: ctx.user.tenantId,
                status: { in: ['submitted', 'approved'] },
              },
              orderBy: { submissionDate: 'desc' },
              take: 5,
            });

            filings = clientFilings;
            fulfilled = clientFilings.length > 0;
          }

          return {
            item: {
              id: item.id,
              required: item.required,
              description: item.description,
              order: item.order,
              documentType: item.documentType,
              filingType: item.filingType,
            },
            fulfilled,
            documents,
            filings,
          };
        })
      );

      // Calculate completion stats
      const totalRequired = progress.filter((p) => p.item.required).length;
      const completedRequired = progress.filter(
        (p) => p.item.required && p.fulfilled
      ).length;
      const totalOptional = progress.filter((p) => !p.item.required).length;
      const completedOptional = progress.filter(
        (p) => !p.item.required && p.fulfilled
      ).length;

      return {
        bundle: {
          id: bundle.id,
          name: bundle.name,
          authority: bundle.authority,
          category: bundle.category,
          description: bundle.description,
        },
        progress,
        stats: {
          totalRequired,
          completedRequired,
          totalOptional,
          completedOptional,
          percentComplete:
            totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 0,
          isComplete: completedRequired === totalRequired,
        },
      };
    }),

  // Create bundle
  create: protectedProcedure
    .use(requirePermission('requirement_bundles', 'create'))
    .input(requirementBundleSchema)
    .mutation(async ({ ctx, input }) => {
      const bundle = await ctx.prisma.requirementBundle.create({
        data: {
          ...input,
          tenantId: ctx.user.tenantId,
        },
      });

      ctx.logger.info('Requirement bundle created:', { bundleId: bundle.id });

      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'RequirementBundle',
          entityId: bundle.id,
          action: 'CREATE',
          changes: { after: input },
        },
      });

      return bundle;
    }),

  // Update bundle
  update: protectedProcedure
    .use(requirePermission('requirement_bundles', 'edit'))
    .input(
      z.object({
        id: z.number(),
        data: requirementBundleSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.requirementBundle.findFirst({
        where: { id: input.id, tenantId: ctx.user.tenantId },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Requirement bundle not found' });
      }

      const bundle = await ctx.prisma.requirementBundle.update({
        where: { id: input.id },
        data: input.data,
      });

      ctx.logger.info('Requirement bundle updated:', { bundleId: input.id });

      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'RequirementBundle',
          entityId: input.id,
          action: 'UPDATE',
          changes: { before: existing, after: bundle },
        },
      });

      return bundle;
    }),

  // Delete bundle
  delete: protectedProcedure
    .use(requirePermission('requirement_bundles', 'delete'))
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.requirementBundle.findFirst({
        where: { id: input.id, tenantId: ctx.user.tenantId },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Requirement bundle not found' });
      }

      await ctx.prisma.requirementBundle.delete({ where: { id: input.id } });

      ctx.logger.info('Requirement bundle deleted:', { bundleId: input.id });

      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'RequirementBundle',
          entityId: input.id,
          action: 'DELETE',
          changes: { before: existing },
        },
      });

      return { success: true };
    }),

  // Add item to bundle
  addItem: protectedProcedure
    .use(requirePermission('requirement_bundles', 'edit'))
    .input(requirementBundleItemSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify bundle belongs to tenant
      const bundle = await ctx.prisma.requirementBundle.findFirst({
        where: { id: input.bundleId, tenantId: ctx.user.tenantId },
      });

      if (!bundle) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Requirement bundle not found' });
      }

      const item = await ctx.prisma.requirementBundleItem.create({
        data: {
          bundleId: input.bundleId,
          documentTypeId: input.documentTypeId || null,
          filingTypeId: input.filingTypeId || null,
          required: input.required,
          description: input.description,
          order: input.order,
        },
      });

      ctx.logger.info('Bundle item added:', { itemId: item.id, bundleId: input.bundleId });

      return item;
    }),

  // Update bundle item
  updateItem: protectedProcedure
    .use(requirePermission('requirement_bundles', 'edit'))
    .input(
      z.object({
        id: z.number(),
        data: requirementBundleItemSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify item's bundle belongs to tenant
      const existing = await ctx.prisma.requirementBundleItem.findFirst({
        where: {
          id: input.id,
          bundle: { tenantId: ctx.user.tenantId },
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Bundle item not found' });
      }

      const item = await ctx.prisma.requirementBundleItem.update({
        where: { id: input.id },
        data: {
          documentTypeId:
            input.data.documentTypeId !== undefined ? input.data.documentTypeId : undefined,
          filingTypeId:
            input.data.filingTypeId !== undefined ? input.data.filingTypeId : undefined,
          required: input.data.required,
          description: input.data.description,
          order: input.data.order,
        },
      });

      ctx.logger.info('Bundle item updated:', { itemId: input.id });

      return item;
    }),

  // Delete bundle item
  deleteItem: protectedProcedure
    .use(requirePermission('requirement_bundles', 'edit'))
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Verify item's bundle belongs to tenant
      const existing = await ctx.prisma.requirementBundleItem.findFirst({
        where: {
          id: input.id,
          bundle: { tenantId: ctx.user.tenantId },
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Bundle item not found' });
      }

      await ctx.prisma.requirementBundleItem.delete({ where: { id: input.id } });

      ctx.logger.info('Bundle item deleted:', { itemId: input.id });

      return { success: true };
    }),

  // Get bundles by authority
  getByAuthority: protectedProcedure
    .use(requirePermission('requirement_bundles', 'view'))
    .input(z.object({ authority: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.requirementBundle.findMany({
        where: {
          tenantId: ctx.user.tenantId,
          authority: input.authority,
        },
        include: {
          items: {
            include: {
              documentType: true,
              filingType: true,
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      });
    }),

  // Get bundles by category
  getByCategory: protectedProcedure
    .use(requirePermission('requirement_bundles', 'view'))
    .input(z.object({ category: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.requirementBundle.findMany({
        where: {
          tenantId: ctx.user.tenantId,
          category: input.category,
        },
        include: {
          items: {
            include: {
              documentType: true,
              filingType: true,
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      });
    }),
});
