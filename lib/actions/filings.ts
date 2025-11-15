'use server';

// Server actions for Filing CRUD operations

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { filingSchema, type FilingFormData } from '@/lib/schemas/filings';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';


// Get all filings for current tenant
export async function getFilings(params?: {
  search?: string;
  clientId?: number;
  status?: string;
  authority?: string;
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
    status,
    authority,
    page = 1,
    pageSize = 20,
  } = params || {};

  const skip = (page - 1) * pageSize;

  const where: any = { tenantId: session.user.tenantId };

  if (search) {
    where.OR = [
      { referenceNumber: { contains: search, mode: 'insensitive' } },
      { periodLabel: { contains: search, mode: 'insensitive' } },
      { client: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (clientId) where.clientId = clientId;
  if (status) where.status = status;
  if (authority) {
    where.filingType = {
      authority: authority,
    };
  }

  const [filings, total] = await Promise.all([
    prisma.filing.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: { id: true, name: true },
        },
        filingType: {
          select: { id: true, name: true, code: true, authority: true, frequency: true },
        },
        _count: {
          select: {
            documents: true,
          },
        },
      },
    }),
    prisma.filing.count({ where }),
  ]);

  return {
    filings,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// Get single filing by ID
export async function getFiling(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const filing = await prisma.filing.findFirst({
    where: {
      id,
      tenantId: session.user.tenantId,
    },
    include: {
      client: true,
      clientBusiness: true,
      filingType: true,
      documents: {
        include: {
          document: {
            include: {
              documentType: true,
              latestVersion: true,
            },
          },
        },
      },
    },
  });

  if (!filing) {
    throw new ApiError('Filing not found', 404);
  }

  return filing;
}

// Get filing types for tenant
export async function getFilingTypes() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  return prisma.filingType.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { name: 'asc' },
  });
}

// Get clients for dropdown
export async function getClientsForFilingSelect() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  return prisma.client.findMany({
    where: { tenantId: session.user.tenantId },
    select: { id: true, name: true, type: true },
    orderBy: { name: 'asc' },
  });
}

// Get documents for a client to attach to filing
export async function getClientDocuments(clientId: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  return prisma.document.findMany({
    where: { 
      clientId,
      tenantId: session.user.tenantId,
    },
    include: {
      documentType: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Create new filing
export async function createFiling(data: FilingFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const validated = filingSchema.parse(data);

  // Verify client belongs to tenant
  const client = await prisma.client.findFirst({
    where: { id: validated.clientId, tenantId: session.user.tenantId },
  });

  if (!client) {
    throw new ApiError('Client not found', 404);
  }

  // Calculate total
  const taxAmount = validated.taxAmount || 0;
  const penalties = validated.penalties || 0;
  const interest = validated.interest || 0;
  const total = taxAmount + penalties + interest;

  const filing = await prisma.filing.create({
    data: {
      ...validated,
      tenantId: session.user.tenantId,
      clientBusinessId: validated.clientBusinessId || null,
      periodStart: validated.periodStart ? new Date(validated.periodStart) : null,
      periodEnd: validated.periodEnd ? new Date(validated.periodEnd) : null,
      submissionDate: validated.submissionDate ? new Date(validated.submissionDate) : null,
      total,
    },
  });

  logger.info('Filing created', { filingId: filing.id, tenantId: session.user.tenantId });

  await prisma.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      actorUserId: session.user.id,
      clientId: validated.clientId,
      entityType: 'Filing',
      entityId: filing.id,
      action: 'create',
      changes: validated,
    },
  });

  revalidatePath('/dashboard/filings');
  return { success: true, filing };
}

// Attach documents to filing
export async function attachDocumentsToFiling(filingId: number, documentIds: number[]) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  // Verify filing belongs to tenant
  const filing = await prisma.filing.findFirst({
    where: { id: filingId, tenantId: session.user.tenantId },
  });

  if (!filing) {
    throw new ApiError('Filing not found', 404);
  }

  // Delete existing attachments
  await prisma.filingDocument.deleteMany({
    where: { filingId },
  });

  // Create new attachments
  if (documentIds.length > 0) {
    await prisma.filingDocument.createMany({
      data: documentIds.map((documentId) => ({
        filingId,
        documentId,
      })),
    });
  }

  logger.info('Filing documents updated', { filingId, documentCount: documentIds.length });

  revalidatePath(`/dashboard/filings/${filingId}`);
  return { success: true };
}

// Update existing filing
export async function updateFiling(id: number, data: FilingFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const validated = filingSchema.parse(data);

  // Verify filing belongs to tenant
  const existing = await prisma.filing.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });

  if (!existing) {
    throw new ApiError('Filing not found', 404);
  }

  // Calculate total
  const taxAmount = validated.taxAmount || 0;
  const penalties = validated.penalties || 0;
  const interest = validated.interest || 0;
  const total = taxAmount + penalties + interest;

  const filing = await prisma.filing.update({
    where: { id },
    data: {
      ...validated,
      clientBusinessId: validated.clientBusinessId || null,
      periodStart: validated.periodStart ? new Date(validated.periodStart) : null,
      periodEnd: validated.periodEnd ? new Date(validated.periodEnd) : null,
      submissionDate: validated.submissionDate ? new Date(validated.submissionDate) : null,
      total,
    },
  });

  logger.info('Filing updated', { filingId: id, tenantId: session.user.tenantId });

  await prisma.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      actorUserId: session.user.id,
      clientId: validated.clientId,
      entityType: 'Filing',
      entityId: id,
      action: 'update',
      changes: validated,
    },
  });

  revalidatePath('/dashboard/filings');
  revalidatePath(`/dashboard/filings/${id}`);
  return { success: true, filing };
}

// Delete filing
export async function deleteFiling(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  // Verify filing belongs to tenant
  const existing = await prisma.filing.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });

  if (!existing) {
    throw new ApiError('Filing not found', 404);
  }

  await prisma.filing.delete({ where: { id } });

  logger.info('Filing deleted', { filingId: id, tenantId: session.user.tenantId });

  await prisma.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      actorUserId: session.user.id,
      entityType: 'Filing',
      entityId: id,
      action: 'delete',
    },
  });

  revalidatePath('/dashboard/filings');
  return { success: true };
}
