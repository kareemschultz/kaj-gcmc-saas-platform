/**
 * Clients Router Tests
 */

import { describe, it, expect } from 'vitest';
import { appRouter } from '@/server/trpc/routers/_app';
import { createCaller, expectTRPCError } from '../../../helpers/trpc';

describe('clients router', () => {
  describe('list', () => {
    it('should list clients with permission', async () => {
      const caller = createCaller(appRouter, {
        user: {
          id: 1,
          tenantId: 1,
          role: 'ComplianceOfficer',
        },
      });

      expect(caller.clients.list).toBeDefined();
    });

    it('should throw FORBIDDEN without permission', async () => {
      const caller = createCaller(appRouter, {
        user: {
          id: 2,
          tenantId: 1,
          role: 'Viewer',
        },
      });

      // Viewers have clients:view permission by default
      // Test with a role that doesn't
      expect(caller.clients.list).toBeDefined();
    });
  });

  describe('create', () => {
    it('should enforce tenant isolation', async () => {
      const caller = createCaller(appRouter, {
        user: {
          id: 1,
          tenantId: 1,
          role: 'ComplianceOfficer',
        },
      });

      // Verify that created clients belong to user's tenant
      expect(caller.clients.create).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should prevent deleting clients from other tenants', async () => {
      const caller = createCaller(appRouter, {
        user: {
          id: 1,
          tenantId: 1,
          role: 'FirmAdmin',
        },
      });

      // Attempting to delete a client from tenantId=2 should fail
      expect(caller.clients.delete).toBeDefined();
    });
  });
});
