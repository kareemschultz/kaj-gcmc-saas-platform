'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

// Validation schema
export const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  basePrice: z.number().nonnegative().optional(),
  estimatedDays: z.number().int().positive().optional(),
  active: z.boolean().default(true),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;

// Get all services for current tenant
export async function getServices(params?: {
  search?: string;
  category?: string;
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
    category,
    active,
    page = 1,
    pageSize = 20,
  } = params || {};

  try {
    const where = {
      tenantId: session.user.tenantId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(category && { category }),
      ...(active !== undefined && { active }),
    };

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        include: {
          _count: {
            select: { serviceRequests: true, templates: true },
          },
        },
      }),
      prisma.service.count({ where }),
    ]);

    return {
      services,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    logger.error('Error fetching services:', error);
    throw new ApiError('Failed to fetch services', 500);
  }
}

// Get single service
export async function getService(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const service = await prisma.service.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        templates: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { serviceRequests: true, templates: true },
        },
      },
    });

    if (!service) {
      throw new ApiError('Service not found', 404);
    }

    return service;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error fetching service:', error);
    throw new ApiError('Failed to fetch service', 500);
  }
}

// Create service
export async function createService(data: ServiceFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const validated = serviceSchema.parse(data);

    const service = await prisma.service.create({
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
        entityType: 'Service',
        entityId: service.id,
        action: 'CREATE',
        changes: { after: service },
      },
    });

    revalidatePath('/services');
    logger.info('Service created:', { serviceId: service.id });

    return service;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Validation failed', 400, error.errors);
    }
    logger.error('Error creating service:', error);
    throw new ApiError('Failed to create service', 500);
  }
}

// Update service
export async function updateService(id: number, data: ServiceFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const validated = serviceSchema.parse(data);

    // Get existing service
    const existing = await prisma.service.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existing) {
      throw new ApiError('Service not found', 404);
    }

    // Update service
    const service = await prisma.service.update({
      where: { id },
      data: validated,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        entityType: 'Service',
        entityId: service.id,
        action: 'UPDATE',
        changes: { before: existing, after: service },
      },
    });

    revalidatePath('/services');
    revalidatePath(`/services/${id}`);
    logger.info('Service updated:', { serviceId: service.id });

    return service;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Validation failed', 400, error.errors);
    }
    if (error instanceof ApiError) throw error;
    logger.error('Error updating service:', error);
    throw new ApiError('Failed to update service', 500);
  }
}

// Delete service
export async function deleteService(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    // Check if service exists and belongs to tenant
    const existing = await prisma.service.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: { serviceRequests: true, templates: true },
        },
      },
    });

    if (!existing) {
      throw new ApiError('Service not found', 404);
    }

    // Check if service has associated requests or templates
    if (existing._count.serviceRequests > 0 || existing._count.templates > 0) {
      throw new ApiError(
        `Cannot delete service with ${existing._count.serviceRequests} requests and ${existing._count.templates} templates`,
        400
      );
    }

    // Delete service
    await prisma.service.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        entityType: 'Service',
        entityId: id,
        action: 'DELETE',
        changes: { before: existing },
      },
    });

    revalidatePath('/services');
    logger.info('Service deleted:', { serviceId: id });

    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error deleting service:', error);
    throw new ApiError('Failed to delete service', 500);
  }
}

// Get service categories
export async function getServiceCategories() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const services = await prisma.service.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      select: {
        category: true,
      },
      distinct: ['category'],
    });

    return services.map(s => s.category).sort();
  } catch (error) {
    logger.error('Error fetching service categories:', error);
    throw new ApiError('Failed to fetch service categories', 500);
  }
}
