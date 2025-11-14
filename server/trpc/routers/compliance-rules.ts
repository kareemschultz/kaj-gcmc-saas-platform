/**
 * Compliance Rules Router
 *
 * Handles compliance rule sets and individual rules
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { requirePermission } from '../middleware/rbac';
import { TRPCError } from '@trpc/server';

// Validation schemas
const complianceRuleSetSchema = z.object({
  name: z.string().min(1).max(255),
  appliesTo: z
    .object({
      clientTypes: z.array(z.string()).optional(),
      sectors: z.array(z.string()).optional(),
    })
    .optional(),
  active: z.boolean().default(true),
});

const complianceRuleSchema = z.object({
  ruleSetId: z.number().int().positive(),
  ruleType: z.string().min(1),
  condition: z.record(z.unknown()).optional(),
  targetId: z.number().int().positive().optional(),
  weight: z.number().min(0).max(1).default(1),
  description: z.string().optional(),
});

export const complianceRulesRouter = router({
  // List rule sets
  listSets: protectedProcedure
    .use(requirePermission('compliance_rules', 'view'))
    .input(
      z.object({
        search: z.string().default(''),
        active: z.boolean().optional(),
        page: z.number().default(1),
        pageSize: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, active, page, pageSize } = input;

      const where = {
        tenantId: ctx.user.tenantId,
        ...(search && {
          name: { contains: search, mode: 'insensitive' as const },
        }),
        ...(active !== undefined && { active }),
      };

      const [ruleSets, total] = await Promise.all([
        ctx.prisma.complianceRuleSet.findMany({
          where,
          take: pageSize,
          skip: (page - 1) * pageSize,
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { rules: true },
            },
          },
        }),
        ctx.prisma.complianceRuleSet.count({ where }),
      ]);

      return {
        ruleSets,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  // Get single rule set with rules
  getSet: protectedProcedure
    .use(requirePermission('compliance_rules', 'view'))
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const ruleSet = await ctx.prisma.complianceRuleSet.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
        },
        include: {
          rules: {
            orderBy: { weight: 'desc' },
          },
        },
      });

      if (!ruleSet) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Compliance rule set not found' });
      }

      return ruleSet;
    }),

  // Create rule set
  createSet: protectedProcedure
    .use(requirePermission('compliance_rules', 'create'))
    .input(complianceRuleSetSchema)
    .mutation(async ({ ctx, input }) => {
      const ruleSet = await ctx.prisma.complianceRuleSet.create({
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
          entityType: 'ComplianceRuleSet',
          entityId: ruleSet.id,
          action: 'CREATE',
          changes: { after: ruleSet },
        },
      });

      ctx.logger.info('Compliance rule set created:', { ruleSetId: ruleSet.id });

      return ruleSet;
    }),

  // Update rule set
  updateSet: protectedProcedure
    .use(requirePermission('compliance_rules', 'edit'))
    .input(
      z.object({
        id: z.number(),
        data: complianceRuleSetSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.complianceRuleSet.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Compliance rule set not found' });
      }

      const ruleSet = await ctx.prisma.complianceRuleSet.update({
        where: { id: input.id },
        data: input.data,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'ComplianceRuleSet',
          entityId: ruleSet.id,
          action: 'UPDATE',
          changes: { before: existing, after: ruleSet },
        },
      });

      ctx.logger.info('Compliance rule set updated:', { ruleSetId: ruleSet.id });

      return ruleSet;
    }),

  // Delete rule set
  deleteSet: protectedProcedure
    .use(requirePermission('compliance_rules', 'delete'))
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.complianceRuleSet.findFirst({
        where: {
          id: input.id,
          tenantId: ctx.user.tenantId,
        },
        include: {
          _count: {
            select: { rules: true },
          },
        },
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Compliance rule set not found' });
      }

      // Delete rule set (cascade will delete associated rules)
      await ctx.prisma.complianceRuleSet.delete({
        where: { id: input.id },
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'ComplianceRuleSet',
          entityId: input.id,
          action: 'DELETE',
          changes: { before: existing },
        },
      });

      ctx.logger.info('Compliance rule set deleted:', { ruleSetId: input.id });

      return { success: true };
    }),

  // Create individual rule
  createRule: protectedProcedure
    .use(requirePermission('compliance_rules', 'create'))
    .input(complianceRuleSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify rule set belongs to tenant
      const ruleSet = await ctx.prisma.complianceRuleSet.findFirst({
        where: {
          id: input.ruleSetId,
          tenantId: ctx.user.tenantId,
        },
      });

      if (!ruleSet) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Compliance rule set not found' });
      }

      const rule = await ctx.prisma.complianceRule.create({
        data: input as any,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'ComplianceRule',
          entityId: rule.id,
          action: 'CREATE',
          changes: { after: rule },
        },
      });

      ctx.logger.info('Compliance rule created:', { ruleId: rule.id });

      return rule;
    }),

  // Update individual rule
  updateRule: protectedProcedure
    .use(requirePermission('compliance_rules', 'edit'))
    .input(
      z.object({
        id: z.number(),
        data: complianceRuleSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get existing rule and verify tenant access via ruleSet
      const existing = await ctx.prisma.complianceRule.findFirst({
        where: { id: input.id },
        include: {
          ruleSet: true,
        },
      });

      if (!existing || !existing.ruleSet || existing.ruleSet.tenantId !== ctx.user.tenantId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Compliance rule not found' });
      }

      const rule = await ctx.prisma.complianceRule.update({
        where: { id: input.id },
        data: input.data as any,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'ComplianceRule',
          entityId: rule.id,
          action: 'UPDATE',
          changes: { before: existing, after: rule },
        },
      });

      ctx.logger.info('Compliance rule updated:', { ruleId: rule.id });

      return rule;
    }),

  // Delete individual rule
  deleteRule: protectedProcedure
    .use(requirePermission('compliance_rules', 'delete'))
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Get existing rule and verify tenant access via ruleSet
      const existing = await ctx.prisma.complianceRule.findFirst({
        where: { id: input.id },
        include: {
          ruleSet: true,
        },
      });

      if (!existing || !existing.ruleSet || existing.ruleSet.tenantId !== ctx.user.tenantId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Compliance rule not found' });
      }

      await ctx.prisma.complianceRule.delete({
        where: { id: input.id },
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'ComplianceRule',
          entityId: input.id,
          action: 'DELETE',
          changes: { before: existing },
        },
      });

      ctx.logger.info('Compliance rule deleted:', { ruleId: input.id });

      return { success: true };
    }),
});
