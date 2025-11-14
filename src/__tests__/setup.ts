// Vitest setup file
// This file runs before all tests

import { beforeAll, afterAll, vi } from 'vitest';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
process.env.NEXTAUTH_SECRET = 'test-secret-for-testing-only';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Mock console methods to reduce noise in tests
beforeAll(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'debug').mockImplementation(() => {});
});

afterAll(() => {
  vi.restoreAllMocks();
});

// Global test utilities
export function createMockUser(overrides = {}) {
  return {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    tenantId: 1,
    role: 'FirmAdmin',
    ...overrides,
  };
}

export function createMockSession(userOverrides = {}) {
  return {
    user: createMockUser(userOverrides),
    tenant: {
      tenantId: 1,
      tenantCode: 'TEST',
      tenantName: 'Test Tenant',
    },
    role: 'FirmAdmin',
  };
}
