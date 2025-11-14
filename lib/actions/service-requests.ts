'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { getUserContext, assertPermission } from '@/lib/rbac';

// Validation schemas
export const serviceRequestSchema = z.object({
  clientId: z.number().int().positive('Client is required'),
  clientBusinessId: z.number().int().positive().optional(),
  serviceId: z.number().int().positive('Service is required'),
  templateId: z.number().int().positive().optional(),
  status: z.enum(['new', 'in_progress', 'awaiting_client', 'awaiting_authority', 'completed', 'cancelled']).default('new'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  metadata: z.object({}).passthrough().optional(),
});

export const serviceStepSchema = z.object({
  serviceRequestId: z.number().int().positive(),
  filingId: z.number().int().positive().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  order: z.number().int().nonnegative(),
  status: z.enum(['not_started', 'in_progress', 'done', 'blocked']).default('not_started'),
  dueDate: z.string().datetime().optional(),
  requiredDocTypeIds: z.array(z.number()).default([]),
  dependsOnStepId: z.number().int().optional(),
});

export type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>;
export type ServiceStepFormData = z.infer<typeof serviceStepSchema>;

// Get all service requests for current tenant
export async function getServiceRequests(params?: {
  search?: string;
  clientId?: number;
  serviceId?: number;
  status?: string;
  priority?: string;
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
    serviceId,
    status,
    priority,
    page = 1,
    pageSize = 20,
  } = params || {};

  try {
    const where = {
      tenantId: session.user.tenantId,
      ...(clientId && { clientId }),
      ...(serviceId && { serviceId }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(search && {
        client: {
          name: { contains: search, mode: 'insensitive' as const },
        },
      }),
    };

    const [serviceRequests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: [
          { createdAt: 'desc' },
        ],
        include: {
          client: {
            select: {
              id: true,
              name: true,
              type: true,
              email: true,
            },
          },
          clientBusiness: {
            select: {
              id: true,
              name: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          _count: {
            select: {
              steps: true,
              tasks: true,
              conversations: true,
            },
          },
        },
      }),
      prisma.serviceRequest.count({ where }),
    ]);

    return {
      serviceRequests,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    logger.error('Error fetching service requests:', error);
    throw new ApiError('Failed to fetch service requests', 500);
  }
}

// Get single service request with full details
export async function getServiceRequest(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        client: true,
        clientBusiness: true,
        service: true,
        template: true,
        steps: {
          orderBy: { order: 'asc' },
          include: {
            filing: {
              select: {
                id: true,
                status: true,
                filingType: {
                  select: { name: true },
                },
              },
            },
          },
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        conversations: {
          orderBy: { updatedAt: 'desc' },
          include: {
            _count: {
              select: { messages: true },
            },
          },
        },
      },
    });

    if (!serviceRequest) {
      throw new ApiError('Service request not found', 404);
    }

    return serviceRequest;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error fetching service request:', error);
    throw new ApiError('Failed to fetch service request', 500);
  }
}

// Create service request
export async function createServiceRequest(data: ServiceRequestFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const validated = serviceRequestSchema.parse(data);

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

    // Verify service belongs to tenant
    const service = await prisma.service.findFirst({
      where: {
        id: validated.serviceId,
        tenantId: session.user.tenantId,
      },
    });

    if (!service) {
      throw new ApiError('Service not found', 404);
    }

    // Create service request and optionally initialize steps from template
    const serviceRequest = await prisma.$transaction(async (tx) => {
      const sr = await tx.serviceRequest.create({
        data: {
          ...validated,
          tenantId: session.user.tenantId,
        },
        include: {
          template: true,
        },
      });

      // If template exists, create steps from template
      if (sr.template && sr.template.stepsDefinition) {
        const stepsDefinition = sr.template.stepsDefinition as any[];
        if (Array.isArray(stepsDefinition)) {
          await Promise.all(
            stepsDefinition.map((step, index) =>
              tx.serviceStep.create({
                data: {
                  serviceRequestId: sr.id,
                  title: step.title,
                  description: step.description,
                  order: index,
                  status: 'not_started',
                  requiredDocTypeIds: step.requiredDocTypeIds || [],
                },
              })
            )
          );
        }
      }

      return sr;
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        clientId: validated.clientId,
        entityType: 'ServiceRequest',
        entityId: serviceRequest.id,
        action: 'CREATE',
        changes: { after: serviceRequest },
      },
    });

    revalidatePath('/services/requests');
    revalidatePath(`/clients/${validated.clientId}`);
    logger.info('Service request created:', { serviceRequestId: serviceRequest.id });

    return serviceRequest;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Validation failed', 400, error.errors);
    }
    if (error instanceof ApiError) throw error;
    logger.error('Error creating service request:', error);
    throw new ApiError('Failed to create service request', 500);
  }
}

// Update service request
export async function updateServiceRequest(id: number, data: Partial<ServiceRequestFormData>) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const existing = await prisma.serviceRequest.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existing) {
      throw new ApiError('Service request not found', 404);
    }

    const serviceRequest = await prisma.serviceRequest.update({
      where: { id },
      data,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        clientId: serviceRequest.clientId,
        entityType: 'ServiceRequest',
        entityId: serviceRequest.id,
        action: 'UPDATE',
        changes: { before: existing, after: serviceRequest },
      },
    });

    revalidatePath('/services/requests');
    revalidatePath(`/services/requests/${id}`);
    revalidatePath(`/clients/${serviceRequest.clientId}`);
    logger.info('Service request updated:', { serviceRequestId: serviceRequest.id });

    return serviceRequest;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error updating service request:', error);
    throw new ApiError('Failed to update service request', 500);
  }
}

// Delete service request
export async function deleteServiceRequest(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const existing = await prisma.serviceRequest.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: {
            steps: true,
            tasks: true,
          },
        },
      },
    });

    if (!existing) {
      throw new ApiError('Service request not found', 404);
    }

    // Prevent deletion if in progress
    if (existing.status === 'in_progress' || existing.status === 'awaiting_authority') {
      throw new ApiError(
        'Cannot delete service request in progress. Please cancel it first.',
        400
      );
    }

    await prisma.serviceRequest.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        clientId: existing.clientId,
        entityType: 'ServiceRequest',
        entityId: id,
        action: 'DELETE',
        changes: { before: existing },
      },
    });

    revalidatePath('/services/requests');
    revalidatePath(`/clients/${existing.clientId}`);
    logger.info('Service request deleted:', { serviceRequestId: id });

    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error deleting service request:', error);
    throw new ApiError('Failed to delete service request', 500);
  }
}

// Create service step
export async function createServiceStep(data: ServiceStepFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const validated = serviceStepSchema.parse(data);

    // Verify service request belongs to tenant
    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: {
        id: validated.serviceRequestId,
        tenantId: session.user.tenantId,
      },
    });

    if (!serviceRequest) {
      throw new ApiError('Service request not found', 404);
    }

    const step = await prisma.serviceStep.create({
      data: {
        ...validated,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
      },
    });

    revalidatePath(`/services/requests/${validated.serviceRequestId}`);
    logger.info('Service step created:', { stepId: step.id });

    return step;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Validation failed', 400, error.errors);
    }
    if (error instanceof ApiError) throw error;
    logger.error('Error creating service step:', error);
    throw new ApiError('Failed to create service step', 500);
  }
}

// Update service step
export async function updateServiceStep(id: number, data: Partial<ServiceStepFormData>) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    // Verify step belongs to tenant via service request
    const existing = await prisma.serviceStep.findFirst({
      where: { id },
      include: {
        serviceRequest: {
          where: { tenantId: session.user.tenantId },
        },
      },
    });

    if (!existing || !existing.serviceRequest) {
      throw new ApiError('Service step not found', 404);
    }

    const updateData = { ...data };
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate as string) as any;
    }

    const step = await prisma.serviceStep.update({
      where: { id },
      data: updateData,
    });

    revalidatePath(`/services/requests/${existing.serviceRequestId}`);
    logger.info('Service step updated:', { stepId: step.id });

    return step;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error updating service step:', error);
    throw new ApiError('Failed to update service step', 500);
  }
}

// Delete service step
export async function deleteServiceStep(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    // Verify step belongs to tenant via service request
    const existing = await prisma.serviceStep.findFirst({
      where: { id },
      include: {
        serviceRequest: {
          where: { tenantId: session.user.tenantId },
        },
      },
    });

    if (!existing || !existing.serviceRequest) {
      throw new ApiError('Service step not found', 404);
    }

    await prisma.serviceStep.delete({
      where: { id },
    });

    revalidatePath(`/services/requests/${existing.serviceRequestId}`);
    logger.info('Service step deleted:', { stepId: id });

    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error deleting service step:', error);
    throw new ApiError('Failed to delete service step', 500);
  }
}
