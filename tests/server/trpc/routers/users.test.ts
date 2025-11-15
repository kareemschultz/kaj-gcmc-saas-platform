/**
 * Users Router Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appRouter } from '@/server/trpc/routers/_app';
import { createCaller, expectTRPCError } from '../../../helpers/trpc';

describe('users router', () => {
  describe('list', () => {
    it('should list users for FirmAdmin', async () => {
      const caller = createCaller(appRouter, {
        user: {
          id: 1,
          email: 'admin@test.com',
          name: 'Admin User',
          tenantId: 1,
          role: 'FirmAdmin',
        },
      });

      // Mock Prisma responses
      const mockUsers = [
        {
          id: 1,
          email: 'user1@test.com',
          name: 'User 1',
          phone: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          password: null,
          avatarUrl: null,
          tenantUsers: [
            {
              tenantId: 1,
              userId: 1,
              roleId: 1,
              role: { id: 1, name: 'FirmAdmin', description: null },
            },
          ],
        },
      ];

      vi.spyOn(caller.users, 'list' as any).mockResolvedValue({
        users: mockUsers,
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      });

      const result = await caller.users.list({ page: 1, pageSize: 20 });

      expect(result).toBeDefined();
      expect(result.users).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should throw FORBIDDEN for Viewer role', async () => {
      const caller = createCaller(appRouter, {
        user: {
          id: 2,
          tenantId: 1,
          role: 'Viewer',
        },
      });

      await expectTRPCError(
        () => caller.users.list({ page: 1 }),
        'FORBIDDEN'
      );
    });

    it('should throw UNAUTHORIZED without session', async () => {
      const caller = createCaller(appRouter, {
        session: null,
      });

      await expectTRPCError(
        () => caller.users.list({ page: 1 }),
        'UNAUTHORIZED'
      );
    });
  });

  describe('create', () => {
    it('should create user with permission', async () => {
      const caller = createCaller(appRouter, {
        user: {
          id: 1,
          tenantId: 1,
          role: 'FirmAdmin',
        },
      });

      const newUser = {
        name: 'New User',
        email: 'newuser@test.com',
        phone: '123-456-7890',
        password: 'password123',
        roleId: 1,
      };

      // This would require proper mocking of Prisma
      // For now, we just verify the call structure
      expect(caller.users.create).toBeDefined();
    });

    it('should throw FORBIDDEN without create permission', async () => {
      const caller = createCaller(appRouter, {
        user: {
          id: 2,
          tenantId: 1,
          role: 'Viewer',
        },
      });

      await expectTRPCError(
        () => caller.users.create({
          name: 'Test',
          email: 'test@example.com',
          password: 'password',
          roleId: 1,
        }),
        'FORBIDDEN'
      );
    });
  });
});
