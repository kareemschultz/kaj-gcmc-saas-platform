'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

// Validation schema
const taskSchema = z.object({
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

type TaskFormData = z.infer<typeof taskSchema>;

// Get all tasks for current tenant
export async function getTasks(params?: {
  search?: string;
  status?: string;
  priority?: string;
  assignedToId?: number;
  clientId?: number;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const {
    search = '',
    status,
    priority,
    assignedToId,
    clientId,
    page = 1,
    pageSize = 20,
  } = params || {};

  try {
    const where = {
      tenantId: session.user.tenantId,
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
      prisma.task.findMany({
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
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    logger.error('Error fetching tasks:', error as Error);
    throw new ApiError('Failed to fetch tasks', 500);
  }
}

// Get single task
export async function getTask(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const task = await prisma.task.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
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
      throw new ApiError('Task not found', 404);
    }

    return task;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error fetching task:', error as Error);
    throw new ApiError('Failed to fetch task', 500);
  }
}

// Create task
export async function createTask(data: TaskFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const validated = taskSchema.parse(data);

    const task = await prisma.task.create({
      data: {
        ...validated,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        tenantId: session.user.tenantId,
      },
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
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        entityType: 'Task',
        entityId: task.id,
        action: 'CREATE',
        changes: { after: task },
      },
    });

    // TODO: Send notification to assigned user

    revalidatePath('/tasks');
    logger.info('Task created:', { taskId: task.id });

    return task;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Validation failed', 400);
    }
    logger.error('Error creating task:', error as Error);
    throw new ApiError('Failed to create task', 500);
  }
}

// Update task
export async function updateTask(id: number, data: TaskFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const validated = taskSchema.parse(data);

    // Get existing task
    const existing = await prisma.task.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existing) {
      throw new ApiError('Task not found', 404);
    }

    // Update task
    const task = await prisma.task.update({
      where: { id },
      data: {
        ...validated,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
      },
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
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        entityType: 'Task',
        entityId: task.id,
        action: 'UPDATE',
        changes: { before: existing, after: task },
      },
    });

    // TODO: Send notification if assigned user changed

    revalidatePath('/tasks');
    revalidatePath(`/tasks/${id}`);
    logger.info('Task updated:', { taskId: task.id });

    return task;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Validation failed', 400);
    }
    if (error instanceof ApiError) throw error;
    logger.error('Error updating task:', error as Error);
    throw new ApiError('Failed to update task', 500);
  }
}

// Delete task
export async function deleteTask(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    // Check if task exists and belongs to tenant
    const existing = await prisma.task.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existing) {
      throw new ApiError('Task not found', 404);
    }

    // Delete task
    await prisma.task.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        entityType: 'Task',
        entityId: id,
        action: 'DELETE',
        changes: { before: existing },
      },
    });

    revalidatePath('/tasks');
    logger.info('Task deleted:', { taskId: id });

    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error deleting task:', error as Error);
    throw new ApiError('Failed to delete task', 500);
  }
}

// Get my tasks (tasks assigned to current user)
export async function getMyTasks() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const tasks = await prisma.task.findMany({
      where: {
        tenantId: session.user.tenantId,
        assignedToId: session.user.id,
        status: {
          not: 'completed',
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'desc' },
      ],
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 10,
    });

    return tasks;
  } catch (error) {
    logger.error('Error fetching my tasks:', error as Error);
    throw new ApiError('Failed to fetch tasks', 500);
  }
}
