'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { getUserContext, assertPermission } from '@/lib/rbac';

// Validation schemas
const complianceRuleSetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  appliesTo: z.object({
    clientTypes: z.array(z.string()).optional(),
    sectors: z.array(z.string()).optional(),
  }).optional(),
  active: z.boolean().default(true),
});

const complianceRuleSchema = z.object({
  ruleSetId: z.number().int().positive(),
  ruleType: z.string().min(1, 'Rule type is required'),
  condition: z.object({}).passthrough().optional(),
  targetId: z.number().int().positive().optional(),
  weight: z.number().min(0).max(1).default(1),
  description: z.string().optional(),
});

type ComplianceRuleSetFormData = z.infer<typeof complianceRuleSetSchema>;
type ComplianceRuleFormData = z.infer<typeof complianceRuleSchema>;

// Get all rule sets for current tenant
export async function getComplianceRuleSets(params?: {
  search?: string;
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
    active,
    page = 1,
    pageSize = 20,
  } = params || {};

  try {
    const where = {
      tenantId: session.user.tenantId,
      ...(search && {
        name: { contains: search, mode: 'insensitive' as const },
      }),
      ...(active !== undefined && { active }),
    };

    const [ruleSets, total] = await Promise.all([
      prisma.complianceRuleSet.findMany({
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { rules: true },
          },
        },
      }),
      prisma.complianceRuleSet.count({ where }),
    ]);

    return {
      ruleSets,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    logger.error('Error fetching compliance rule sets:', error as Error);
    throw new ApiError('Failed to fetch compliance rule sets', 500);
  }
}

// Get single rule set with rules
export async function getComplianceRuleSet(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const ruleSet = await prisma.complianceRuleSet.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        rules: {
          orderBy: { weight: 'desc' },
        },
      },
    });

    if (!ruleSet) {
      throw new ApiError('Compliance rule set not found', 404);
    }

    return ruleSet;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error fetching compliance rule set:', error as Error);
    throw new ApiError('Failed to fetch compliance rule set', 500);
  }
}

// Create rule set
export async function createComplianceRuleSet(data: ComplianceRuleSetFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const validated = complianceRuleSetSchema.parse(data);

    const ruleSet = await prisma.complianceRuleSet.create({
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
        entityType: 'ComplianceRuleSet',
        entityId: ruleSet.id,
        action: 'CREATE',
        changes: { after: ruleSet },
      },
    });

    revalidatePath('/compliance/rules');
    logger.info('Compliance rule set created:', { ruleSetId: ruleSet.id });

    return ruleSet;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Validation failed', 400);
    }
    logger.error('Error creating compliance rule set:', error as Error);
    throw new ApiError('Failed to create compliance rule set', 500);
  }
}

// Update rule set
export async function updateComplianceRuleSet(id: number, data: ComplianceRuleSetFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const validated = complianceRuleSetSchema.parse(data);

    const existing = await prisma.complianceRuleSet.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existing) {
      throw new ApiError('Compliance rule set not found', 404);
    }

    const ruleSet = await prisma.complianceRuleSet.update({
      where: { id },
      data: validated,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        entityType: 'ComplianceRuleSet',
        entityId: ruleSet.id,
        action: 'UPDATE',
        changes: { before: existing, after: ruleSet },
      },
    });

    revalidatePath('/compliance/rules');
    revalidatePath(`/compliance/rules/${id}`);
    logger.info('Compliance rule set updated:', { ruleSetId: ruleSet.id });

    return ruleSet;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Validation failed', 400);
    }
    if (error instanceof ApiError) throw error;
    logger.error('Error updating compliance rule set:', error as Error);
    throw new ApiError('Failed to update compliance rule set', 500);
  }
}

// Delete rule set
export async function deleteComplianceRuleSet(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const existing = await prisma.complianceRuleSet.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: { rules: true },
        },
      },
    });

    if (!existing) {
      throw new ApiError('Compliance rule set not found', 404);
    }

    // Delete rule set (cascade will delete associated rules)
    await prisma.complianceRuleSet.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        entityType: 'ComplianceRuleSet',
        entityId: id,
        action: 'DELETE',
        changes: { before: existing },
      },
    });

    revalidatePath('/compliance/rules');
    logger.info('Compliance rule set deleted:', { ruleSetId: id });

    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error deleting compliance rule set:', error as Error);
    throw new ApiError('Failed to delete compliance rule set', 500);
  }
}

// Create individual rule
export async function createComplianceRule(data: ComplianceRuleFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const validated = complianceRuleSchema.parse(data);

    // Verify rule set belongs to tenant
    const ruleSet = await prisma.complianceRuleSet.findFirst({
      where: {
        id: validated.ruleSetId,
        tenantId: session.user.tenantId,
      },
    });

    if (!ruleSet) {
      throw new ApiError('Compliance rule set not found', 404);
    }

    const rule = await prisma.complianceRule.create({
      data: validated,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        entityType: 'ComplianceRule',
        entityId: rule.id,
        action: 'CREATE',
        changes: { after: rule },
      },
    });

    revalidatePath('/compliance/rules');
    revalidatePath(`/compliance/rules/${validated.ruleSetId}`);
    logger.info('Compliance rule created:', { ruleId: rule.id });

    return rule;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Validation failed', 400);
    }
    logger.error('Error creating compliance rule:', error as Error);
    throw new ApiError('Failed to create compliance rule', 500);
  }
}

// Update individual rule
export async function updateComplianceRule(id: number, data: Partial<ComplianceRuleFormData>) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    // Get existing rule and verify tenant access via ruleSet
    const existing = await prisma.complianceRule.findFirst({
      where: { id },
      include: {
        ruleSet: true,
      },
    });

    if (!existing || !existing.ruleSet || existing.ruleSet.tenantId !== session.user.tenantId) {
      throw new ApiError('Compliance rule not found', 404);
    }

    const rule = await prisma.complianceRule.update({
      where: { id },
      data,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        entityType: 'ComplianceRule',
        entityId: rule.id,
        action: 'UPDATE',
        changes: { before: existing, after: rule },
      },
    });

    revalidatePath('/compliance/rules');
    revalidatePath(`/compliance/rules/${existing.ruleSetId}`);
    logger.info('Compliance rule updated:', { ruleId: rule.id });

    return rule;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error updating compliance rule:', error as Error);
    throw new ApiError('Failed to update compliance rule', 500);
  }
}

// Delete individual rule
export async function deleteComplianceRule(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    // Get existing rule and verify tenant access via ruleSet
    const existing = await prisma.complianceRule.findFirst({
      where: { id },
      include: {
        ruleSet: true,
      },
    });

    if (!existing || !existing.ruleSet || existing.ruleSet.tenantId !== session.user.tenantId) {
      throw new ApiError('Compliance rule not found', 404);
    }

    await prisma.complianceRule.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        entityType: 'ComplianceRule',
        entityId: id,
        action: 'DELETE',
        changes: { before: existing },
      },
    });

    revalidatePath('/compliance/rules');
    revalidatePath(`/compliance/rules/${existing.ruleSetId}`);
    logger.info('Compliance rule deleted:', { ruleId: id });

    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error deleting compliance rule:', error as Error);
    throw new ApiError('Failed to delete compliance rule', 500);
  }
}
