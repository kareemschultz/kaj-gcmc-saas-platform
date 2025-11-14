'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { getUserContext, assertAdmin } from '@/lib/rbac';

// Validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(255),
  phone: z.string().optional(),
  roleId: z.number().int().positive('Role is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  name: z.string().min(1).max(255).optional(),
  phone: z.string().optional(),
  roleId: z.number().int().positive().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// Get all users for current tenant
export async function getUsers(params?: {
  search?: string;
  roleId?: number;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  const {
    search = '',
    roleId,
    page = 1,
    pageSize = 20,
  } = params || {};

  try {
    const where = {
      tenantUsers: {
        some: {
          tenantId: session.user.tenantId,
          ...(roleId && { roleId }),
        },
      },
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: { name: 'asc' },
        include: {
          tenantUsers: {
            where: { tenantId: session.user.tenantId },
            include: {
              role: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    logger.error('Error fetching users:', error);
    throw new ApiError('Failed to fetch users', 500);
  }
}

// Get single user
export async function getUser(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        id,
        tenantUsers: {
          some: {
            tenantId: session.user.tenantId,
          },
        },
      },
      include: {
        tenantUsers: {
          where: { tenantId: session.user.tenantId },
          include: {
            role: {
              include: {
                permissions: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    return user;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error fetching user:', error);
    throw new ApiError('Failed to fetch user', 500);
  }
}

// Create user
export async function createUser(data: CreateUserFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const validated = createUserSchema.parse(data);

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (existing) {
      throw new ApiError('User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Create user and tenant association in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: validated.email,
          name: validated.name,
          phone: validated.phone,
          password: hashedPassword,
        },
      });

      // Associate with current tenant
      await tx.tenantUser.create({
        data: {
          tenantId: session.user.tenantId,
          userId: newUser.id,
          roleId: validated.roleId,
        },
      });

      return newUser;
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        entityType: 'User',
        entityId: user.id,
        action: 'CREATE',
        changes: {
          after: {
            id: user.id,
            email: user.email,
            name: user.name
          }
        },
      },
    });

    revalidatePath('/users');
    logger.info('User created:', { userId: user.id });

    return user;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Validation failed', 400, error.errors);
    }
    if (error instanceof ApiError) throw error;
    logger.error('Error creating user:', error);
    throw new ApiError('Failed to create user', 500);
  }
}

// Update user
export async function updateUser(id: number, data: UpdateUserFormData) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    const validated = updateUserSchema.parse(data);

    // Check if user exists and belongs to tenant
    const existing = await prisma.user.findFirst({
      where: {
        id,
        tenantUsers: {
          some: {
            tenantId: session.user.tenantId,
          },
        },
      },
      include: {
        tenantUsers: {
          where: { tenantId: session.user.tenantId },
        },
      },
    });

    if (!existing) {
      throw new ApiError('User not found', 404);
    }

    // Check for duplicate email (excluding current user)
    if (validated.email && validated.email !== existing.email) {
      const duplicate = await prisma.user.findUnique({
        where: { email: validated.email },
      });

      if (duplicate) {
        throw new ApiError('User with this email already exists', 400);
      }
    }

    // Update user and role in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: {
          ...(validated.email && { email: validated.email }),
          ...(validated.name && { name: validated.name }),
          ...(validated.phone !== undefined && { phone: validated.phone }),
          ...(validated.avatarUrl !== undefined && { avatarUrl: validated.avatarUrl }),
        },
      });

      // Update role if provided
      if (validated.roleId) {
        await tx.tenantUser.update({
          where: {
            tenantId_userId: {
              tenantId: session.user.tenantId,
              userId: id,
            },
          },
          data: {
            roleId: validated.roleId,
          },
        });
      }

      return updated;
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        entityType: 'User',
        entityId: user.id,
        action: 'UPDATE',
        changes: { before: existing, after: user },
      },
    });

    revalidatePath('/users');
    revalidatePath(`/users/${id}`);
    logger.info('User updated:', { userId: user.id });

    return user;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Validation failed', 400, error.errors);
    }
    if (error instanceof ApiError) throw error;
    logger.error('Error updating user:', error);
    throw new ApiError('Failed to update user', 500);
  }
}

// Delete user
export async function deleteUser(id: number) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new ApiError('Unauthorized', 401);
  }

  try {
    // Can't delete yourself
    if (id === session.user.id) {
      throw new ApiError('Cannot delete your own account', 400);
    }

    // Check if user exists and belongs to tenant
    const existing = await prisma.user.findFirst({
      where: {
        id,
        tenantUsers: {
          some: {
            tenantId: session.user.tenantId,
          },
        },
      },
    });

    if (!existing) {
      throw new ApiError('User not found', 404);
    }

    // Remove tenant association (user may be associated with other tenants)
    await prisma.tenantUser.delete({
      where: {
        tenantId_userId: {
          tenantId: session.user.tenantId,
          userId: id,
        },
      },
    });

    // Check if user has other tenant associations
    const otherTenants = await prisma.tenantUser.count({
      where: { userId: id },
    });

    // If no other tenants, delete the user completely
    if (otherTenants === 0) {
      await prisma.user.delete({
        where: { id },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        entityType: 'User',
        entityId: id,
        action: 'DELETE',
        changes: { before: existing },
      },
    });

    revalidatePath('/users');
    logger.info('User deleted:', { userId: id });

    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error('Error deleting user:', error);
    throw new ApiError('Failed to delete user', 500);
  }
}

// Change password
export async function changePassword(userId: number, data: ChangePasswordFormData) {
  const session = await auth();
  if (!session?.user) {
    throw new ApiError('Unauthorized', 401);
  }

  // Users can only change their own password (unless they're an admin)
  if (userId !== session.user.id) {
    throw new ApiError('Forbidden', 403);
  }

  try {
    const validated = changePasswordSchema.parse(data);

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      throw new ApiError('User not found', 404);
    }

    // Verify current password
    const validPassword = await bcrypt.compare(
      validated.currentPassword,
      user.password
    );

    if (!validPassword) {
      throw new ApiError('Current password is incorrect', 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validated.newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    logger.info('Password changed:', { userId });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Validation failed', 400, error.errors);
    }
    if (error instanceof ApiError) throw error;
    logger.error('Error changing password:', error);
    throw new ApiError('Failed to change password', 500);
  }
}
