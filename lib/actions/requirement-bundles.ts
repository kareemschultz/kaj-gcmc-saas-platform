'use server';

// Server actions for Requirement Bundles CRUD operations

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

// Validation schemas
const requirementBundleSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  authority: z.string().min(1, 'Authority is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
});

const requirementBundleItemSchema = z.object({
  bundleId: z.number().min(1),
  documentTypeId: z.number().optional().nullable(),
  filingTypeId: z.number().optional().nullable(),
  required: z.boolean().default(true),
  description: z.string().optional(),
  order: z.number().default(0),
});

type RequirementBundleFormData = z.infer<typeof requirementBundleSchema>;
type RequirementBundleItemFormData = z.infer<typeof requirementBundleItemSchema>;

// Get all requirement bundles for current tenant
export async function getRequirementBundles(params?: {
  authority?: string;
  category?: string;
  search?: string;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const { authority, category, search } = params || {};

  const where: any = { tenantId: session.user.tenantId };

  if (authority) where.authority = authority;
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const bundles = await prisma.requirementBundle.findMany({
    where,
    include: {
      items: {
        include: {
          documentType: {
            select: { id: true, name: true, category: true },
          },
          filingType: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { order: 'asc' },
      },
      _count: {
        select: { items: true },
      },
    },
    orderBy: [{ authority: 'asc' }, { name: 'asc' }],
  });

  return bundles;
}

// Get single requirement bundle by ID
export async function getRequirementBundle(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const bundle = await prisma.requirementBundle.findFirst({
    where: {
      id,
      tenantId: session.user.tenantId,
    },
    include: {
      items: {
        include: {
          documentType: true,
          filingType: true,
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!bundle) {
    throw new ApiError('Requirement bundle not found', 404);
  }

  return bundle;
}

// Get bundle requirements with details
export async function getBundleRequirements(bundleId: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const bundle = await prisma.requirementBundle.findFirst({
    where: {
      id: bundleId,
      tenantId: session.user.tenantId,
    },
    include: {
      items: {
        include: {
          documentType: {
            select: {
              id: true,
              name: true,
              category: true,
              description: true,
              authority: true,
              metadata: true,
            },
          },
          filingType: {
            select: {
              id: true,
              name: true,
              code: true,
              authority: true,
              frequency: true,
              description: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!bundle) {
    throw new ApiError('Requirement bundle not found', 404);
  }

  return bundle;
}

// Check bundle progress for a client
export async function checkBundleProgress(clientId: number, bundleId: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  // Verify client belongs to tenant
  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId: session.user.tenantId },
  });

  if (!client) {
    throw new ApiError('Client not found', 404);
  }

  // Get the bundle with its requirements
  const bundle = await getBundleRequirements(bundleId);

  // Check which requirements are fulfilled
  const progress = await Promise.all(
    bundle.items.map(async (item) => {
      let fulfilled = false;
      let documents: any[] = [];
      let filings: any[] = [];

      if (item.documentTypeId) {
        // Check if client has this document type
        const clientDocs = await prisma.document.findMany({
          where: {
            clientId,
            documentTypeId: item.documentTypeId,
            tenantId: session.user.tenantId,
            status: { in: ['valid', 'pending_review'] },
          },
          include: {
            latestVersion: {
              select: {
                id: true,
                issueDate: true,
                expiryDate: true,
                fileUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        documents = clientDocs;
        fulfilled = clientDocs.length > 0;
      }

      if (item.filingTypeId) {
        // Check if client has filings for this type
        const clientFilings = await prisma.filing.findMany({
          where: {
            clientId,
            filingTypeId: item.filingTypeId,
            tenantId: session.user.tenantId,
            status: { in: ['submitted', 'approved'] },
          },
          orderBy: { submissionDate: 'desc' },
          take: 5,
        });

        filings = clientFilings;
        fulfilled = clientFilings.length > 0;
      }

      return {
        item: {
          id: item.id,
          required: item.required,
          description: item.description,
          order: item.order,
          documentType: item.documentType,
          filingType: item.filingType,
        },
        fulfilled,
        documents,
        filings,
      };
    })
  );

  // Calculate completion stats
  const totalRequired = progress.filter((p) => p.item.required).length;
  const completedRequired = progress.filter(
    (p) => p.item.required && p.fulfilled
  ).length;
  const totalOptional = progress.filter((p) => !p.item.required).length;
  const completedOptional = progress.filter(
    (p) => !p.item.required && p.fulfilled
  ).length;

  return {
    bundle: {
      id: bundle.id,
      name: bundle.name,
      authority: bundle.authority,
      category: bundle.category,
      description: bundle.description,
    },
    progress,
    stats: {
      totalRequired,
      completedRequired,
      totalOptional,
      completedOptional,
      percentComplete:
        totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 0,
      isComplete: completedRequired === totalRequired,
    },
  };
}

// Create new requirement bundle
export async function createRequirementBundle(data: RequirementBundleFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const validated = requirementBundleSchema.parse(data);

  const bundle = await prisma.requirementBundle.create({
    data: {
      ...validated,
      tenantId: session.user.tenantId,
    },
  });

  logger.info('Requirement bundle created', {
    bundleId: bundle.id,
    tenantId: session.user.tenantId,
  });

  await prisma.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      actorUserId: session.user.id,
      entityType: 'RequirementBundle',
      entityId: bundle.id,
      action: 'create',
      changes: validated,
    },
  });

  revalidatePath('/dashboard/requirement-bundles');
  return { success: true, bundle };
}

// Update existing requirement bundle
export async function updateRequirementBundle(
  id: number,
  data: RequirementBundleFormData
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const validated = requirementBundleSchema.parse(data);

  // Verify bundle belongs to tenant
  const existing = await prisma.requirementBundle.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });

  if (!existing) {
    throw new ApiError('Requirement bundle not found', 404);
  }

  const bundle = await prisma.requirementBundle.update({
    where: { id },
    data: validated,
  });

  logger.info('Requirement bundle updated', {
    bundleId: id,
    tenantId: session.user.tenantId,
  });

  await prisma.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      actorUserId: session.user.id,
      entityType: 'RequirementBundle',
      entityId: id,
      action: 'update',
      changes: validated,
    },
  });

  revalidatePath('/dashboard/requirement-bundles');
  revalidatePath(`/dashboard/requirement-bundles/${id}`);
  return { success: true, bundle };
}

// Delete requirement bundle
export async function deleteRequirementBundle(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  // Verify bundle belongs to tenant
  const existing = await prisma.requirementBundle.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });

  if (!existing) {
    throw new ApiError('Requirement bundle not found', 404);
  }

  await prisma.requirementBundle.delete({ where: { id } });

  logger.info('Requirement bundle deleted', {
    bundleId: id,
    tenantId: session.user.tenantId,
  });

  await prisma.auditLog.create({
    data: {
      tenantId: session.user.tenantId,
      actorUserId: session.user.id,
      entityType: 'RequirementBundle',
      entityId: id,
      action: 'delete',
    },
  });

  revalidatePath('/dashboard/requirement-bundles');
  return { success: true };
}

// Add item to bundle
export async function addBundleItem(data: RequirementBundleItemFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const validated = requirementBundleItemSchema.parse(data);

  // Verify bundle belongs to tenant
  const bundle = await prisma.requirementBundle.findFirst({
    where: { id: validated.bundleId, tenantId: session.user.tenantId },
  });

  if (!bundle) {
    throw new ApiError('Requirement bundle not found', 404);
  }

  const item = await prisma.requirementBundleItem.create({
    data: {
      bundleId: validated.bundleId,
      documentTypeId: validated.documentTypeId || null,
      filingTypeId: validated.filingTypeId || null,
      required: validated.required,
      description: validated.description,
      order: validated.order,
    },
  });

  logger.info('Bundle item added', {
    itemId: item.id,
    bundleId: validated.bundleId,
    tenantId: session.user.tenantId,
  });

  revalidatePath('/dashboard/requirement-bundles');
  revalidatePath(`/dashboard/requirement-bundles/${validated.bundleId}`);
  return { success: true, item };
}

// Update bundle item
export async function updateBundleItem(
  id: number,
  data: Partial<RequirementBundleItemFormData>
) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  // Verify item's bundle belongs to tenant
  const existing = await prisma.requirementBundleItem.findFirst({
    where: {
      id,
      bundle: { tenantId: session.user.tenantId },
    },
  });

  if (!existing) {
    throw new ApiError('Bundle item not found', 404);
  }

  const item = await prisma.requirementBundleItem.update({
    where: { id },
    data: {
      documentTypeId: data.documentTypeId !== undefined ? data.documentTypeId : undefined,
      filingTypeId: data.filingTypeId !== undefined ? data.filingTypeId : undefined,
      required: data.required,
      description: data.description,
      order: data.order,
    },
  });

  logger.info('Bundle item updated', {
    itemId: id,
    tenantId: session.user.tenantId,
  });

  revalidatePath('/dashboard/requirement-bundles');
  revalidatePath(`/dashboard/requirement-bundles/${existing.bundleId}`);
  return { success: true, item };
}

// Delete bundle item
export async function deleteBundleItem(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  // Verify item's bundle belongs to tenant
  const existing = await prisma.requirementBundleItem.findFirst({
    where: {
      id,
      bundle: { tenantId: session.user.tenantId },
    },
  });

  if (!existing) {
    throw new ApiError('Bundle item not found', 404);
  }

  await prisma.requirementBundleItem.delete({ where: { id } });

  logger.info('Bundle item deleted', {
    itemId: id,
    tenantId: session.user.tenantId,
  });

  revalidatePath('/dashboard/requirement-bundles');
  revalidatePath(`/dashboard/requirement-bundles/${existing.bundleId}`);
  return { success: true };
}

// Get bundles by authority
export async function getBundlesByAuthority(authority: string) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  return getRequirementBundles({ authority });
}

// Get bundles by category
export async function getBundlesByCategory(category: string) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  return getRequirementBundles({ category });
}
