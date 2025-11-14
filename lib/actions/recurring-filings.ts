'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

// Validation schema
export const recurringFilingSchema = z.object({
  clientId: z.number().int().positive('Client is required'),
  clientBusinessId: z.number().int().positive().optional(),
  filingTypeId: z.number().int().positive('Filing type is required'),
  schedule: z.string().min(1, 'Schedule is required'),
  active: z.boolean().default(true),
  nextRunAt: z.string().datetime().optional(),
});

export type RecurringFilingFormData = z.infer<typeof recurringFilingSchema>;

// Get all recurring filings for current tenant
export async function getRecurringFilings(params?: {
  search?: string;
  clientId?: number;
  filingTypeId?: number;
  active?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const {
    search = '',
    clientId,
    filingTypeId,
    active,
    page = 1,
    pageSize = 20,
  } = params || {};

  try {
    const where = {
      tenantId: session.user.tenantId,
      ...(clientId && { clientId }),
      ...(filingTypeId && { filingTypeId }),
      ...(active !== undefined && { active }),
      ...(search && {
        OR: [
          { client: { name: { contains: search, mode: 'insensitive' as const } } },
          { filingType: { name: { contains: search, mode: 'insensitive' as const } } },
        ],
      }),
    };

    const [recurringFilings, total] = await Promise.all([
      prisma.recurringFiling.findMany({
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: [
          { active: 'desc' },
          { nextRunAt: 'asc' },
        ],
        include: {
          client: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          clientBusiness: {
            select: {
              id: true,
              name: true,
            },
          },
          filingType: {
            select: {
              id: true,
              name: true,
              code: true,
              authority: true,
              frequency: true,
            },
          },
        },
      }),
      prisma.recurringFiling.count({ where }),
    ]);

    return {
      recurringFilings,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    logger.error('Error fetching recurring filings:', error);
    throw new ApiError('Failed to fetch recurring filings', 500);
  }
}

// Get single recurring filing
export async function getRecurringFiling(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const recurringFiling = await prisma.recurringFiling.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        client: true,
        clientBusiness: true,
        filingType: true,
      },
    });

    if (!recurringFiling) {
      throw new ApiError('Recurring filing not found', 404);
    }

    return recurringFiling;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error fetching recurring filing:', error);
    throw new ApiError('Failed to fetch recurring filing', 500);
  }
}

// Create recurring filing
export async function createRecurringFiling(data: RecurringFilingFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const validated = recurringFilingSchema.parse(data);

    // Verify client belongs to tenant
    const client = await prisma.client.findFirst({
      where: {
        id: validated.clientId,
        tenantId: session.user.tenantId,
      },
    });

    if (!client) {
      throw new ApiError('Client not found', 404);
    }

    // Verify filing type belongs to tenant
    const filingType = await prisma.filingType.findFirst({
      where: {
        id: validated.filingTypeId,
        tenantId: session.user.tenantId,
      },
    });

    if (!filingType) {
      throw new ApiError('Filing type not found', 404);
    }

    const recurringFiling = await prisma.recurringFiling.create({
      data: {
        ...validated,
        nextRunAt: validated.nextRunAt ? new Date(validated.nextRunAt) : null,
        tenantId: session.user.tenantId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        clientId: validated.clientId,
        entityType: 'RecurringFiling',
        entityId: recurringFiling.id,
        action: 'CREATE',
        changes: { after: recurringFiling },
      },
    });

    revalidatePath('/filings/recurring');
    revalidatePath(`/clients/${validated.clientId}`);
    logger.info('Recurring filing created:', { recurringFilingId: recurringFiling.id });

    return recurringFiling;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Validation failed', 400, error.errors);
    }
    if (error instanceof ApiError) throw error;
    logger.error('Error creating recurring filing:', error);
    throw new ApiError('Failed to create recurring filing', 500);
  }
}

// Update recurring filing
export async function updateRecurringFiling(id: number, data: Partial<RecurringFilingFormData>) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const existing = await prisma.recurringFiling.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existing) {
      throw new ApiError('Recurring filing not found', 404);
    }

    const updateData = { ...data };
    if (updateData.nextRunAt) {
      updateData.nextRunAt = new Date(updateData.nextRunAt as string) as any;
    }

    const recurringFiling = await prisma.recurringFiling.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        clientId: recurringFiling.clientId,
        entityType: 'RecurringFiling',
        entityId: recurringFiling.id,
        action: 'UPDATE',
        changes: { before: existing, after: recurringFiling },
      },
    });

    revalidatePath('/filings/recurring');
    revalidatePath(`/filings/recurring/${id}`);
    revalidatePath(`/clients/${recurringFiling.clientId}`);
    logger.info('Recurring filing updated:', { recurringFilingId: recurringFiling.id });

    return recurringFiling;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error updating recurring filing:', error);
    throw new ApiError('Failed to update recurring filing', 500);
  }
}

// Delete recurring filing
export async function deleteRecurringFiling(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const existing = await prisma.recurringFiling.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existing) {
      throw new ApiError('Recurring filing not found', 404);
    }

    await prisma.recurringFiling.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        clientId: existing.clientId,
        entityType: 'RecurringFiling',
        entityId: id,
        action: 'DELETE',
        changes: { before: existing },
      },
    });

    revalidatePath('/filings/recurring');
    revalidatePath(`/clients/${existing.clientId}`);
    logger.info('Recurring filing deleted:', { recurringFilingId: id });

    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error deleting recurring filing:', error);
    throw new ApiError('Failed to delete recurring filing', 500);
  }
}

// Toggle active status
export async function toggleRecurringFilingActive(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const existing = await prisma.recurringFiling.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existing) {
      throw new ApiError('Recurring filing not found', 404);
    }

    const recurringFiling = await prisma.recurringFiling.update({
      where: { id },
      data: { active: !existing.active },
    });

    revalidatePath('/filings/recurring');
    revalidatePath(`/filings/recurring/${id}`);
    logger.info('Recurring filing toggled:', {
      recurringFilingId: id,
      active: recurringFiling.active,
    });

    return recurringFiling;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error toggling recurring filing:', error);
    throw new ApiError('Failed to toggle recurring filing', 500);
  }
}
