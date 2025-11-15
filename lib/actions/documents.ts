'use server';

// Server actions for Document CRUD operations with file upload

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { documentSchema, documentVersionSchema, type DocumentFormData, type DocumentVersionFormData } from '@/lib/schemas/documents';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { generatePresignedUploadUrl } from '@/lib/storage';


// Get all documents for current tenant
export async function getDocuments(params?: {
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
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { client: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (clientId) where.clientId = clientId;
  if (status) where.status = status;
  if (authority) where.authority = authority;

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: { id: true, name: true },
        },
        documentType: {
          select: { id: true, name: true, category: true },
        },
        latestVersion: {
          select: {
            id: true,
            issueDate: true,
            expiryDate: true,
            fileUrl: true,
            fileSize: true,
            mimeType: true,
          },
        },
      },
    }),
    prisma.document.count({ where }),
  ]);

  return {
    documents,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// Get single document by ID
export async function getDocument(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const document = await prisma.document.findFirst({
    where: {
      id,
      tenantId: session.user.tenantId,
    },
    include: {
      client: true,
      clientBusiness: true,
      documentType: true,
      versions: {
        orderBy: { uploadedAt: 'desc' },
      },
    },
  });

  if (!document) {
    throw new ApiError('Document not found', 404);
  }

  return document;
}

// Get all document types for tenant
export async function getDocumentTypes() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  return prisma.documentType.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { name: 'asc' },
  });
}

// Get clients for dropdown
export async function getClientsForSelect() {
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

// Generate presigned URL for file upload
export async function getUploadUrl(fileName: string) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const uploadUrl = await generatePresignedUploadUrl(session.user.tenantId, fileName);
  
  // Return both upload URL and the final storage path
  const storagePath = `tenant-${session.user.tenantId}/documents/${Date.now()}-${fileName}`;
  
  return {
    uploadUrl,
    storagePath,
  };
}

// Create new document
export async function createDocument(data: DocumentFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const validated = documentSchema.parse(data);

  // Verify client belongs to tenant
  const client = await prisma.client.findFirst({
    where: { id: validated.clientId, tenantId: session.user.tenantId },
  });

  if (!client) {
    throw new ApiError('Client not found', 404);
  }

  const document = await prisma.document.create({
    data: {
      ...validated,
      tenantId: session.user.tenantId,
      clientBusinessId: validated.clientBusinessId || null,
    },
  });

  logger.info('Document created', { documentId: document.id, tenantId: session.user.tenantId });

  await prisma.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      actorUserId: session.user.id,
      clientId: validated.clientId,
      entityType: 'Document',
      entityId: document.id,
      action: 'create',
      changes: validated,
    },
  });

  revalidatePath('/dashboard/documents');
  return { success: true, document };
}

// Add document version (file upload)
export async function createDocumentVersion(data: DocumentVersionFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const validated = documentVersionSchema.parse(data);

  // Verify document belongs to tenant
  const document = await prisma.document.findFirst({
    where: { id: validated.documentId, tenantId: session.user.tenantId },
  });

  if (!document) {
    throw new ApiError('Document not found', 404);
  }

  // Set all previous versions to not latest
  await prisma.documentVersion.updateMany({
    where: { documentId: validated.documentId },
    data: { isLatest: false },
  });

  // Create new version
  const version = await prisma.documentVersion.create({
    data: {
      documentId: validated.documentId,
      fileUrl: validated.fileUrl,
      storageProvider: 'minio',
      fileSize: validated.fileSize,
      mimeType: validated.mimeType,
      issueDate: validated.issueDate ? new Date(validated.issueDate) : null,
      expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : null,
      issuingAuthority: validated.issuingAuthority,
      uploadedById: session.user.id,
      isLatest: true,
    },
  });

  // Update document's latestVersionId
  await prisma.document.update({
    where: { id: validated.documentId },
    data: { latestVersionId: version.id },
  });

  logger.info('Document version created', { 
    documentId: validated.documentId, 
    versionId: version.id,
    tenantId: session.user.tenantId 
  });

  await prisma.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      actorUserId: session.user.id,
      clientId: document.clientId,
      entityType: 'DocumentVersion',
      entityId: version.id,
      action: 'create',
      changes: { documentId: validated.documentId },
    },
  });

  revalidatePath('/dashboard/documents');
  revalidatePath(`/dashboard/documents/${validated.documentId}`);
  return { success: true, version };
}

// Update existing document
export async function updateDocument(id: number, data: DocumentFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const validated = documentSchema.parse(data);

  // Verify document belongs to tenant
  const existing = await prisma.document.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });

  if (!existing) {
    throw new ApiError('Document not found', 404);
  }

  const document = await prisma.document.update({
    where: { id },
    data: {
      ...validated,
      clientBusinessId: validated.clientBusinessId || null,
    },
  });

  logger.info('Document updated', { documentId: id, tenantId: session.user.tenantId });

  await prisma.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      actorUserId: session.user.id,
      clientId: validated.clientId,
      entityType: 'Document',
      entityId: id,
      action: 'update',
      changes: validated,
    },
  });

  revalidatePath('/dashboard/documents');
  revalidatePath(`/dashboard/documents/${id}`);
  return { success: true, document };
}

// Delete document
export async function deleteDocument(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  // Verify document belongs to tenant
  const existing = await prisma.document.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });

  if (!existing) {
    throw new ApiError('Document not found', 404);
  }

  await prisma.document.delete({ where: { id } });

  logger.info('Document deleted', { documentId: id, tenantId: session.user.tenantId });

  await prisma.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      actorUserId: session.user.id,
      entityType: 'Document',
      entityId: id,
      action: 'delete',
    },
  });

  revalidatePath('/dashboard/documents');
  return { success: true };
}
