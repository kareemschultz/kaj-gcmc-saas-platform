/**
 * Tasks tRPC Router
 *
 * Handles task management with assignments and priorities
 * Migrated from /lib/actions/tasks.ts
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { requirePermission } from '../middleware/rbac';
import { auditLogMiddleware } from '../middleware/logging';

/**
 * Task validation schema
 */
export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'blocked', 'completed']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().datetime().optional(),
  assignedToId: z.number().int().positive().optional(),
  clientId: z.number().int().positive().optional(),
  serviceRequestId: z.number().int().positive().optional(),
  filingId: z.number().int().positive().optional(),
});

/**
 * Tasks router
 */
export const tasksRouter = router({
  /**
   * List tasks with filtering and pagination
   * Requires: tasks:view permission
   */
  list: protectedProcedure
    .use(requirePermission('tasks', 'view'))
    .input(
      z
        .object({
          search: z.string().optional(),
          status: z.string().optional(),
          priority: z.string().optional(),
          assignedToId: z.number().optional(),
          clientId: z.number().optional(),
          page: z.number().default(1),
          pageSize: z.number().default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const {
        search = '',
        status,
        priority,
        assignedToId,
        clientId,
        page = 1,
        pageSize = 20,
      } = input || {};

      const where = {
        tenantId: ctx.user.tenantId,
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assignedToId && { assignedToId }),
        ...(clientId && { clientId }),
      };

      const [tasks, total] = await Promise.all([
        ctx.prisma.task.findMany({
          where,
          take: pageSize,
          skip: (page - 1) * pageSize,
          orderBy: [
            { status: 'asc' },
            { dueDate: 'asc' },
            { priority: 'desc' },
          ],
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            client: {
              select: {
                id: true,
                name: true,
              },
            },
            serviceRequest: {
              select: {
                id: true,
                service: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            filing: {
              select: {
                id: true,
                filingType: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        }),
        ctx.prisma.task.count({ where }),
      ]);

      return {
        tasks,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  /**
   * Get single task by ID
   * Requires: tasks:view permission
   */
  get: protectedProcedure
    .use(requirePermission('tasks', 'view'))
    .input(z.number())
    .query(async ({ ctx, input: id }) => {
      const task = await ctx.prisma.task.findFirst({
        where: {
          id,
          tenantId: ctx.user.tenantId,
        },
        include: {
          assignedTo: true,
          client: true,
          serviceRequest: {
            include: {
              service: true,
            },
          },
          filing: {
            include: {
              filingType: true,
            },
          },
        },
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      return task;
    }),

  /**
   * Create new task
   * Requires: tasks:create permission
   */
  create: protectedProcedure
    .use(requirePermission('tasks', 'create'))
    .use(auditLogMiddleware('Task', 'create'))
    .input(taskSchema)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.prisma.task.create({
        data: {
          ...input,
          tenantId: ctx.user.tenantId,
        },
        include: {
          assignedTo: true,
          client: true,
        },
      });

      ctx.logger.info('Task created', {
        taskId: task.id,
        tenantId: ctx.user.tenantId,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'Task',
          entityId: task.id,
          action: 'create',
          changes: input,
        },
      });

      return { success: true, task };
    }),

  /**
   * Update existing task
   * Requires: tasks:edit permission
   */
  update: protectedProcedure
    .use(requirePermission('tasks', 'edit'))
    .use(auditLogMiddleware('Task', 'update'))
    .input(
      z.object({
        id: z.number(),
        data: taskSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;

      // Verify task belongs to tenant
      const existing = await ctx.prisma.task.findFirst({
        where: { id, tenantId: ctx.user.tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      const task = await ctx.prisma.task.update({
        where: { id },
        data,
        include: {
          assignedTo: true,
          client: true,
        },
      });

      ctx.logger.info('Task updated', {
        taskId: id,
        tenantId: ctx.user.tenantId,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'Task',
          entityId: id,
          action: 'update',
          changes: data,
        },
      });

      return { success: true, task };
    }),

  /**
   * Mark task as completed
   * Requires: tasks:edit permission
   */
  complete: protectedProcedure
    .use(requirePermission('tasks', 'edit'))
    .input(z.number())
    .mutation(async ({ ctx, input: id }) => {
      // Verify task belongs to tenant
      const existing = await ctx.prisma.task.findFirst({
        where: { id, tenantId: ctx.user.tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      const task = await ctx.prisma.task.update({
        where: { id },
        data: { status: 'completed' },
      });

      ctx.logger.info('Task completed', {
        taskId: id,
        tenantId: ctx.user.tenantId,
      });

      return { success: true, task };
    }),

  /**
   * Delete task
   * Requires: tasks:delete permission
   */
  delete: protectedProcedure
    .use(requirePermission('tasks', 'delete'))
    .use(auditLogMiddleware('Task', 'delete'))
    .input(z.number())
    .mutation(async ({ ctx, input: id }) => {
      // Verify task belongs to tenant
      const existing = await ctx.prisma.task.findFirst({
        where: { id, tenantId: ctx.user.tenantId },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      await ctx.prisma.task.delete({ where: { id } });

      ctx.logger.info('Task deleted', {
        taskId: id,
        tenantId: ctx.user.tenantId,
      });

      // Create audit log
      await ctx.prisma.auditLog.create({
        data: {
          tenantId: ctx.user.tenantId,
          actorUserId: ctx.user.id,
          entityType: 'Task',
          entityId: id,
          action: 'delete',
        },
      });

      return { success: true };
    }),
});
