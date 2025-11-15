'use server';

// Server actions for Client CRUD operations

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { assertCanView, assertCanCreate, assertCanEdit, assertCanDelete, getUserContext } from '@/lib/rbac';

// Validation schemas
export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  type: z.enum(['individual', 'company', 'partnership']),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  tin: z.string().optional(),
  nisNumber: z.string().optional(),
  sector: z.string().optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).optional(),
  notes: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

// Get all clients for current tenant
export async function getClients(params?: {
  search?: string;
  type?: string;
  sector?: string;
  riskLevel?: string;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const userContext = getUserContext(session);
  assertCanView(userContext, 'clients');

  const {
    search = '',
    type,
    sector,
    riskLevel,
    page = 1,
    pageSize = 20,
  } = params || {};

  const skip = (page - 1) * pageSize;

  const where: any = { tenantId: session.user.tenantId };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { tin: { contains: search, mode: 'insensitive' } },
      { nisNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (type) where.type = type;
  if (sector) where.sector = sector;
  if (riskLevel) where.riskLevel = riskLevel;

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            documents: true,
            filings: true,
            serviceRequests: true,
          },
        },
      },
    }),
    prisma.client.count({ where }),
  ]);

  return {
    clients,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// Get single client by ID
export async function getClient(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const userContext = getUserContext(session);
  assertCanView(userContext, 'clients');

  const client = await prisma.client.findFirst({
    where: {
      id,
      tenantId: session.user.tenantId,
    },
    include: {
      businesses: true,
      _count: {
        select: {
          documents: true,
          filings: true,
          serviceRequests: true,
        },
      },
    },
  });

  if (!client) {
    throw new ApiError('Client not found', 404);
  }

  return client;
}

// Create new client
export async function createClient(data: ClientFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const userContext = getUserContext(session);
  assertCanCreate(userContext, 'clients');

  const validated = clientSchema.parse(data);

  const client = await prisma.client.create({
    data: {
      ...validated,
      tenantId: session.user.tenantId,
      email: validated.email || null,
    },
  });

  logger.info('Client created', { clientId: client.id, tenantId: session.user.tenantId });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      actorUserId: session.user.id,
      clientId: client.id,
      entityType: 'Client',
      entityId: client.id,
      action: 'create',
      changes: validated,
    },
  });

  revalidatePath('/dashboard/clients');
  return { success: true, client };
}

// Update existing client
export async function updateClient(id: number, data: ClientFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const userContext = getUserContext(session);
  assertCanEdit(userContext, 'clients');

  const validated = clientSchema.parse(data);

  // Verify client belongs to tenant
  const existing = await prisma.client.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });

  if (!existing) {
    throw new ApiError('Client not found', 404);
  }

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...validated,
      email: validated.email || null,
    },
  });

  logger.info('Client updated', { clientId: id, tenantId: session.user.tenantId });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      actorUserId: session.user.id,
      clientId: id,
      entityType: 'Client',
      entityId: id,
      action: 'update',
      changes: validated,
    },
  });

  revalidatePath('/dashboard/clients');
  revalidatePath(`/dashboard/clients/${id}`);
  return { success: true, client };
}

// Delete client
export async function deleteClient(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const userContext = getUserContext(session);
  assertCanDelete(userContext, 'clients');

  // Verify client belongs to tenant
  const existing = await prisma.client.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });

  if (!existing) {
    throw new ApiError('Client not found', 404);
  }

  await prisma.client.delete({ where: { id } });

  logger.info('Client deleted', { clientId: id, tenantId: session.user.tenantId });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      actorUserId: session.user.id,
      entityType: 'Client',
      entityId: id,
      action: 'delete',
    },
  });

  revalidatePath('/dashboard/clients');
  return { success: true };
}
