'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';

// Get all roles
export async function getRoles() {
  const session = await auth();
  if (!session?.user) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
    });

    return roles;
  } catch (error) {
    logger.error('Error fetching roles:', error as Error);
    throw new ApiError('Failed to fetch roles', 500);
  }
}
