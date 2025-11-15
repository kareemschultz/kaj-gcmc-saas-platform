/**
 * Vitest setup file
 * Runs before all tests
 */

import { vi } from 'vitest';

// Mock environment variables for testing
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only-minimum-32-characters';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Suppress console logs in tests unless DEBUG is set
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  };
}
