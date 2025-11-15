'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

// Validation schema
export const filingTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  code: z.string().min(1, 'Code is required').max(50),
  authority: z.string().min(1, 'Authority is required'),
  frequency: z.enum(['monthly', 'quarterly', 'annual', 'one_off']),
  defaultDueDay: z.number().int().min(1).max(31).optional(),
  defaultDueMonth: z.number().int().min(1).max(12).optional(),
  description: z.string().optional(),
});

export type FilingTypeFormData = z.infer<typeof filingTypeSchema>;

// Get all filing types for current tenant
export async function getFilingTypes(params?: {
  search?: string;
  authority?: string;
  frequency?: string;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const {
    search = '',
    authority,
    frequency,
    page = 1,
    pageSize = 20,
  } = params || {};

  try {
    const where = {
      tenantId: session.user.tenantId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(authority && { authority }),
      ...(frequency && { frequency }),
    };

    const [filingTypes, total] = await Promise.all([
      prisma.filingType.findMany({
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: [{ authority: 'asc' }, { name: 'asc' }],
        include: {
          _count: {
            select: { filings: true, recurringFilings: true },
          },
        },
      }),
      prisma.filingType.count({ where }),
    ]);

    return {
      filingTypes,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    logger.error('Error fetching filing types:', error as Error);
    throw new ApiError('Failed to fetch filing types', 500);
  }
}

// Get single filing type
export async function getFilingType(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const filingType = await prisma.filingType.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: { filings: true, recurringFilings: true },
        },
      },
    });

    if (!filingType) {
      throw new ApiError('Filing type not found', 404);
    }

    return filingType;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error fetching filing type:', error as Error);
    throw new ApiError('Failed to fetch filing type', 500);
  }
}

// Create filing type
export async function createFilingType(data: FilingTypeFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const validated = filingTypeSchema.parse(data);

    // Check for duplicate code
    const existing = await prisma.filingType.findFirst({
      where: {
        tenantId: session.user.tenantId,
        code: validated.code,
      },
    });

    if (existing) {
      throw new ApiError('Filing type with this code already exists', 400);
    }

    const filingType = await prisma.filingType.create({
      data: {
        ...validated,
        tenantId: session.user.tenantId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        entityType: 'FilingType',
        entityId: filingType.id,
        action: 'CREATE',
        changes: { after: filingType },
      },
    });

    revalidatePath('/filing-types');
    logger.info('Filing type created:', { filingTypeId: filingType.id });

    return filingType;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Validation failed', 400);
    }
    if (error instanceof ApiError) throw error;
    logger.error('Error creating filing type:', error as Error);
    throw new ApiError('Failed to create filing type', 500);
  }
}

// Update filing type
export async function updateFilingType(id: number, data: FilingTypeFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const validated = filingTypeSchema.parse(data);

    // Get existing filing type
    const existing = await prisma.filingType.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existing) {
      throw new ApiError('Filing type not found', 404);
    }

    // Check for duplicate code (excluding current)
    if (validated.code !== existing.code) {
      const duplicate = await prisma.filingType.findFirst({
        where: {
          tenantId: session.user.tenantId,
          code: validated.code,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ApiError('Filing type with this code already exists', 400);
      }
    }

    // Update filing type
    const filingType = await prisma.filingType.update({
      where: { id },
      data: validated,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        entityType: 'FilingType',
        entityId: filingType.id,
        action: 'UPDATE',
        changes: { before: existing, after: filingType },
      },
    });

    revalidatePath('/filing-types');
    revalidatePath(`/filing-types/${id}`);
    logger.info('Filing type updated:', { filingTypeId: filingType.id });

    return filingType;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Validation failed', 400);
    }
    if (error instanceof ApiError) throw error;
    logger.error('Error updating filing type:', error as Error);
    throw new ApiError('Failed to update filing type', 500);
  }
}

// Delete filing type
export async function deleteFilingType(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    // Check if filing type exists and belongs to tenant
    const existing = await prisma.filingType.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: { filings: true, recurringFilings: true },
        },
      },
    });

    if (!existing) {
      throw new ApiError('Filing type not found', 404);
    }

    // Check if filing type has associated filings
    if (existing._count.filings > 0 || existing._count.recurringFilings > 0) {
      throw new ApiError(
        `Cannot delete filing type with ${existing._count.filings} filings and ${existing._count.recurringFilings} recurring filings`,
        400
      );
    }

    // Delete filing type
    await prisma.filingType.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        entityType: 'FilingType',
        entityId: id,
        action: 'DELETE',
        changes: { before: existing },
      },
    });

    revalidatePath('/filing-types');
    logger.info('Filing type deleted:', { filingTypeId: id });

    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error deleting filing type:', error as Error);
    throw new ApiError('Failed to delete filing type', 500);
  }
}
