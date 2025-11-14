'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/src/lib/prisma';
import { ApiError } from '@/src/lib/errors';
import { logger } from '@/src/lib/logger';

// Validation schema
export const tenantSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  code: z.string().min(1, 'Code is required').max(50).regex(/^[a-z0-9-]+$/, 'Code must be lowercase alphanumeric with hyphens'),
  contactInfo: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  settings: z.object({
    branding: z.object({
      logoUrl: z.string().url().optional(),
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
    }).optional(),
    defaults: z.object({
      currency: z.string().optional(),
      timezone: z.string().optional(),
      dateFormat: z.string().optional(),
    }).optional(),
  }).optional(),
});

export type TenantFormData = z.infer<typeof tenantSchema>;

// Get all tenants (admin only)
export async function getTenants(params?: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user) {
    throw new ApiError('Unauthorized', 401);
  }

  // TODO: Add RBAC check for admin-only access

  const {
    search = '',
    page = 1,
    pageSize = 20,
  } = params || {};

  try {
    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              tenantUsers: true,
              clients: true,
              documents: true,
              filings: true,
            },
          },
        },
      }),
      prisma.tenant.count({ where }),
    ]);

    return {
      tenants,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    logger.error('Error fetching tenants:', error);
    throw new ApiError('Failed to fetch tenants', 500);
  }
}

// Get single tenant
export async function getTenant(id: number) {
  const session = await auth();
  if (!session?.user) {
    throw new ApiError('Unauthorized', 401);
  }

  // Users can only view their own tenant unless they're admin
  if (session.user.tenantId !== id) {
    // TODO: Add RBAC check for admin access
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tenantUsers: true,
            clients: true,
            documents: true,
            filings: true,
            serviceRequests: true,
          },
        },
        subscriptions: {
          where: { status: 'active' },
          include: { plan: true },
          take: 1,
          orderBy: { startDate: 'desc' },
        },
      },
    });

    if (!tenant) {
      throw new ApiError('Tenant not found', 404);
    }

    return tenant;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error fetching tenant:', error);
    throw new ApiError('Failed to fetch tenant', 500);
  }
}

// Create tenant (admin only)
export async function createTenant(data: TenantFormData) {
  const session = await auth();
  if (!session?.user) {
    throw new ApiError('Unauthorized', 401);
  }

  // TODO: Add RBAC check for admin-only access

  try {
    const validated = tenantSchema.parse(data);

    // Check if code already exists
    const existing = await prisma.tenant.findUnique({
      where: { code: validated.code },
    });

    if (existing) {
      throw new ApiError('Tenant with this code already exists', 400);
    }

    const tenant = await prisma.tenant.create({
      data: validated,
    });

    logger.info('Tenant created:', { tenantId: tenant.id });

    revalidatePath('/admin/tenants');
    return tenant;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Validation failed', 400, error.errors);
    }
    if (error instanceof ApiError) throw error;
    logger.error('Error creating tenant:', error);
    throw new ApiError('Failed to create tenant', 500);
  }
}

// Update tenant
export async function updateTenant(id: number, data: TenantFormData) {
  const session = await auth();
  if (!session?.user) {
    throw new ApiError('Unauthorized', 401);
  }

  // Users can only update their own tenant unless they're admin
  if (session.user.tenantId !== id) {
    // TODO: Add RBAC check for admin access
  }

  try {
    const validated = tenantSchema.parse(data);

    const existing = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError('Tenant not found', 404);
    }

    // Check for duplicate code (excluding current tenant)
    if (validated.code !== existing.code) {
      const duplicate = await prisma.tenant.findUnique({
        where: { code: validated.code },
      });

      if (duplicate) {
        throw new ApiError('Tenant with this code already exists', 400);
      }
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: validated,
    });

    logger.info('Tenant updated:', { tenantId: tenant.id });

    revalidatePath('/admin/tenants');
    revalidatePath(`/admin/tenants/${id}`);
    return tenant;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Validation failed', 400, error.errors);
    }
    if (error instanceof ApiError) throw error;
    logger.error('Error updating tenant:', error);
    throw new ApiError('Failed to update tenant', 500);
  }
}

// Delete tenant (admin only - dangerous operation)
export async function deleteTenant(id: number) {
  const session = await auth();
  if (!session?.user) {
    throw new ApiError('Unauthorized', 401);
  }

  // TODO: Add RBAC check for super-admin access
  // Cannot delete own tenant
  if (session.user.tenantId === id) {
    throw new ApiError('Cannot delete your own tenant', 400);
  }

  try {
    const existing = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            clients: true,
            documents: true,
            filings: true,
          },
        },
      },
    });

    if (!existing) {
      throw new ApiError('Tenant not found', 404);
    }

    // Check if tenant has data (safety check)
    const hasData = existing._count.clients > 0 ||
                    existing._count.documents > 0 ||
                    existing._count.filings > 0;

    if (hasData) {
      throw new ApiError(
        'Cannot delete tenant with existing data. Please archive or migrate data first.',
        400
      );
    }

    await prisma.tenant.delete({
      where: { id },
    });

    logger.info('Tenant deleted:', { tenantId: id });

    revalidatePath('/admin/tenants');
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error deleting tenant:', error);
    throw new ApiError('Failed to delete tenant', 500);
  }
}
