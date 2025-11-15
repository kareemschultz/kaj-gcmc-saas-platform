'use server';

// Server actions for ClientBusiness CRUD operations

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

// Validation schema
export const clientBusinessSchema = z.object({
  clientId: z.number(),
  name: z.string().min(1, 'Business name is required').max(255),
  registrationNumber: z.string().optional(),
  registrationType: z.enum([
    'Sole Proprietorship',
    'Partnership',
    'LLC',
    'Corporation',
    'Other',
  ]).optional(),
  incorporationDate: z.string().optional().nullable(),
  country: z.string().optional(),
  sector: z.string().optional(),
  status: z.enum(['Active', 'Inactive', 'Pending', 'Dissolved']).optional(),
});

export type ClientBusinessFormData = z.infer<typeof clientBusinessSchema>;

// Get all businesses for a specific client
export async function getClientBusinesses(clientId: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  // Verify client belongs to tenant
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      tenantId: session.user.tenantId,
    },
  });

  if (!client) {
    throw new ApiError('Client not found', 404);
  }

  const businesses = await prisma.clientBusiness.findMany({
    where: {
      clientId,
      tenantId: session.user.tenantId,
    },
    orderBy: { createdAt: 'desc' },
  });

  return businesses;
}

// Create new client business
export async function createClientBusiness(data: ClientBusinessFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const validated = clientBusinessSchema.parse(data);

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

  const business = await prisma.clientBusiness.create({
    data: {
      tenantId: session.user.tenantId,
      clientId: validated.clientId,
      name: validated.name,
      registrationNumber: validated.registrationNumber || null,
      registrationType: validated.registrationType || null,
      incorporationDate: validated.incorporationDate ? new Date(validated.incorporationDate) : null,
      country: validated.country || null,
      sector: validated.sector || null,
      status: validated.status || null,
    },
  });

  logger.info('Client business created', {
    businessId: business.id,
    clientId: validated.clientId,
    tenantId: session.user.tenantId,
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      actorUserId: session.user.id,
      clientId: validated.clientId,
      entityType: 'ClientBusiness',
      entityId: business.id,
      action: 'create',
      changes: validated,
    },
  });

  revalidatePath(`/dashboard/clients/${validated.clientId}`);
  return { success: true, business };
}

// Update existing client business
export async function updateClientBusiness(id: number, data: ClientBusinessFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const validated = clientBusinessSchema.parse(data);

  // Verify business belongs to tenant
  const existing = await prisma.clientBusiness.findFirst({
    where: {
      id,
      tenantId: session.user.tenantId,
    },
  });

  if (!existing) {
    throw new ApiError('Business not found', 404);
  }

  const business = await prisma.clientBusiness.update({
    where: { id },
    data: {
      name: validated.name,
      registrationNumber: validated.registrationNumber || null,
      registrationType: validated.registrationType || null,
      incorporationDate: validated.incorporationDate ? new Date(validated.incorporationDate) : null,
      country: validated.country || null,
      sector: validated.sector || null,
      status: validated.status || null,
    },
  });

  logger.info('Client business updated', {
    businessId: id,
    clientId: validated.clientId,
    tenantId: session.user.tenantId,
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      actorUserId: session.user.id,
      clientId: validated.clientId,
      entityType: 'ClientBusiness',
      entityId: id,
      action: 'update',
      changes: validated,
    },
  });

  revalidatePath(`/dashboard/clients/${validated.clientId}`);
  return { success: true, business };
}

// Delete client business
export async function deleteClientBusiness(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  // Verify business belongs to tenant
  const existing = await prisma.clientBusiness.findFirst({
    where: {
      id,
      tenantId: session.user.tenantId,
    },
  });

  if (!existing) {
    throw new ApiError('Business not found', 404);
  }

  await prisma.clientBusiness.delete({ where: { id } });

  logger.info('Client business deleted', {
    businessId: id,
    clientId: existing.clientId,
    tenantId: session.user.tenantId,
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      actorUserId: session.user.id,
      clientId: existing.clientId,
      entityType: 'ClientBusiness',
      entityId: id,
      action: 'delete',
    },
  });

  revalidatePath(`/dashboard/clients/${existing.clientId}`);
  return { success: true };
}
