'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

// Validation schema
const documentTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

type DocumentTypeFormData = z.infer<typeof documentTypeSchema>;

// Get all document types for current tenant
export async function getDocumentTypes(params?: {
  search?: string;
  category?: string;
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
    };

    const [documentTypes, total] = await Promise.all([
      prisma.documentType.findMany({
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { documents: true },
          },
        },
      }),
      prisma.documentType.count({ where }),
    ]);

    return {
      documentTypes,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    logger.error('Error fetching document types:', error as Error);
    throw new ApiError('Failed to fetch document types', 500);
  }
}

// Get single document type
export async function getDocumentType(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const documentType = await prisma.documentType.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    if (!documentType) {
      throw new ApiError('Document type not found', 404);
    }

    return documentType;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error fetching document type:', error as Error);
    throw new ApiError('Failed to fetch document type', 500);
  }
}

// Create document type
export async function createDocumentType(data: DocumentTypeFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const validated = documentTypeSchema.parse(data);

    const documentType = await prisma.documentType.create({
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
        entityType: 'DocumentType',
        entityId: documentType.id,
        action: 'CREATE',
        changes: { after: documentType },
      },
    });

    revalidatePath('/document-types');
    logger.info('Document type created:', { documentTypeId: documentType.id });

    return documentType;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Validation failed', 400);
    }
    logger.error('Error creating document type:', error as Error);
    throw new ApiError('Failed to create document type', 500);
  }
}

// Update document type
export async function updateDocumentType(id: number, data: DocumentTypeFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const validated = documentTypeSchema.parse(data);

    // Get existing document type
    const existing = await prisma.documentType.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existing) {
      throw new ApiError('Document type not found', 404);
    }

    // Update document type
    const documentType = await prisma.documentType.update({
      where: { id },
      data: validated,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        entityType: 'DocumentType',
        entityId: documentType.id,
        action: 'UPDATE',
        changes: { before: existing, after: documentType },
      },
    });

    revalidatePath('/document-types');
    revalidatePath(`/document-types/${id}`);
    logger.info('Document type updated:', { documentTypeId: documentType.id });

    return documentType;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Validation failed', 400);
    }
    if (error instanceof ApiError) throw error;
    logger.error('Error updating document type:', error as Error);
    throw new ApiError('Failed to update document type', 500);
  }
}

// Delete document type
export async function deleteDocumentType(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    // Check if document type exists and belongs to tenant
    const existing = await prisma.documentType.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    if (!existing) {
      throw new ApiError('Document type not found', 404);
    }

    // Check if document type has documents
    if (existing._count.documents > 0) {
      throw new ApiError(
        `Cannot delete document type with ${existing._count.documents} associated documents`,
        400
      );
    }

    // Delete document type
    await prisma.documentType.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        entityType: 'DocumentType',
        entityId: id,
        action: 'DELETE',
        changes: { before: existing },
      },
    });

    revalidatePath('/document-types');
    logger.info('Document type deleted:', { documentTypeId: id });

    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error deleting document type:', error as Error);
    throw new ApiError('Failed to delete document type', 500);
  }
}
