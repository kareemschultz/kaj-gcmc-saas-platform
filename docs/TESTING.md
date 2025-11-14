# Testing Guide

## Overview

KGC Compliance Cloud uses **Vitest** as its testing framework, providing fast unit and integration tests with TypeScript support and excellent developer experience.

## Test Stack

- **Framework**: Vitest 2.0
- **Runner**: Node environment
- **Coverage**: V8 coverage provider
- **UI**: Vitest UI for interactive test running
- **Mocking**: Vitest's built-in mocking capabilities

## Running Tests

### All Tests
\`\`\`bash
pnpm test
\`\`\`

### Watch Mode (Re-run on file changes)
\`\`\`bash
pnpm test:watch
\`\`\`

### UI Mode (Interactive browser UI)
\`\`\`bash
pnpm test:ui
\`\`\`

### Coverage Report
\`\`\`bash
pnpm test:coverage
\`\`\`

Coverage reports are generated in `coverage/` directory:
- `coverage/index.html`: Open in browser for detailed coverage
- `coverage/lcov.info`: For CI/CD integrations

## Test Structure

### Directory Layout

\`\`\`
src/
└── lib/
    ├── __tests__/
    │   ├── rbac.test.ts
    │   ├── compliance-engine.test.ts
    │   └── ...
    ├── rbac.ts
    ├── compliance-engine.ts
    └── ...
\`\`\`

Tests are colocated with the code they test in `__tests__` subdirectories.

### Test File Naming

- Unit tests: `*.test.ts` or `*.spec.ts`
- Integration tests: `*.integration.test.ts`
- Component tests: `*.test.tsx`

## Writing Tests

### Basic Test Structure

\`\`\`typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { functionToTest } from '../module';

describe('Module Name', () => {
  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks();
  });

  describe('functionToTest', () => {
    it('should do something expected', () => {
      // Arrange
      const input = { foo: 'bar' };

      // Act
      const result = functionToTest(input);

      // Assert
      expect(result).toBe('expected value');
    });

    it('should throw error on invalid input', () => {
      expect(() => {
        functionToTest(null);
      }).toThrow('Expected error message');
    });
  });
});
\`\`\`

### Mocking

#### Mocking Modules

\`\`\`typescript
import { vi } from 'vitest';

// Mock entire module
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));
\`\`\`

#### Mocking Functions

\`\`\`typescript
import { vi } from 'vitest';

const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

vi.mock('@/lib/logger', () => ({
  logger: mockLogger,
}));
\`\`\`

#### Setting Mock Return Values

\`\`\`typescript
import { prisma } from '@/lib/prisma';

// Mock implementation
prisma.user.findMany.mockResolvedValue([
  { id: 1, email: 'test@example.com', name: 'Test User' },
]);

// Mock rejection
prisma.user.create.mockRejectedValue(new Error('Database error'));
\`\`\`

### Testing Async Code

\`\`\`typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected value');
});

it('should handle promise rejections', async () => {
  await expect(asyncFunction()).rejects.toThrow('Error message');
});
\`\`\`

### Testing Errors

\`\`\`typescript
import { ForbiddenError } from '@/lib/errors';

it('should throw ForbiddenError', () => {
  expect(() => {
    someFunction();
  }).toThrow(ForbiddenError);
});

it('should throw with specific message', () => {
  expect(() => {
    someFunction();
  }).toThrow('Permission denied');
});
\`\`\`

## Test Categories

### 1. Unit Tests

Test individual functions and modules in isolation.

**Example**: RBAC permission checking
\`\`\`typescript
describe('hasPermission', () => {
  it('should allow SuperAdmin all permissions', () => {
    const user = { userId: 1, tenantId: 1, role: 'SuperAdmin' as const };
    expect(hasPermission(user, 'clients', 'delete')).toBe(true);
  });
});
\`\`\`

**Location**: `src/lib/__tests__/`

### 2. Integration Tests

Test interactions between multiple modules or with external systems.

**Example**: Server action with database
\`\`\`typescript
describe('createClient', () => {
  it('should create client and return ID', async () => {
    const mockSession = { user: { id: 1, tenantId: 1 }, role: 'FirmAdmin' };
    const clientData = { name: 'Test Client', type: 'individual' };

    const result = await createClient(clientData);

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Test Client');
  });
});
\`\`\`

**Location**: `src/lib/actions/__tests__/`

### 3. Component Tests

Test React components (planned for future).

**Example**: Permission-aware button
\`\`\`typescript
describe('CreateClientButton', () => {
  it('should not render for Viewer role', () => {
    const { container } = render(<CreateClientButton />, {
      session: { role: 'Viewer' },
    });

    expect(container.querySelector('button')).toBeNull();
  });
});
\`\`\`

**Location**: `components/__tests__/`

## Test Coverage Goals

| Category | Target Coverage |
|----------|-----------------|
| Critical Business Logic | 90%+ |
| RBAC System | 100% |
| Compliance Engine | 80%+ |
| Server Actions | 70%+ |
| UI Components | 60%+ |

### Viewing Coverage

\`\`\`bash
pnpm test:coverage
open coverage/index.html
\`\`\`

## Existing Tests

### RBAC Tests (`src/lib/__tests__/rbac.test.ts`)

**Coverage**: 100% of public RBAC API

Tests:
- ✅ Permission checking for all 8 roles
- ✅ SuperAdmin wildcard permissions
- ✅ Role-specific permission restrictions
- ✅ Permission assertions (throwing errors)
- ✅ Admin role checking
- ✅ Helper functions (canView, canCreate, etc.)
- ✅ getUserModules()

### Compliance Engine Tests (`src/lib/__tests__/compliance-engine.test.ts`)

**Coverage**: Core scoring logic

Tests:
- ✅ Green compliance (score >= 80)
- ✅ Amber compliance (score 60-79)
- ✅ Red compliance (score < 60)
- ✅ Expired documents detection
- ✅ Expiring documents detection
- ✅ Overdue filings counting
- ✅ recalculateClientCompliance database persistence
- ✅ Error handling

## Best Practices

### 1. Test Naming
- Use descriptive test names that explain the expected behavior
- Format: "should [expected behavior] when [condition]"
- Example: "should throw ForbiddenError when user lacks permission"

### 2. Arrange-Act-Assert Pattern
\`\`\`typescript
it('should calculate correct score', () => {
  // Arrange - Set up test data
  const client = createMockClient();

  // Act - Execute the function
  const score = calculateScore(client);

  // Assert - Verify the result
  expect(score).toBe(85);
});
\`\`\`

### 3. One Assertion Per Test
- Each test should verify one specific behavior
- Makes failures easier to diagnose
- Split complex tests into multiple smaller tests

### 4. Avoid Test Interdependence
- Tests should not depend on other tests
- Use `beforeEach` for setup, not previous test results
- Tests should pass in any order

### 5. Mock External Dependencies
- Always mock database (Prisma)
- Mock external APIs
- Mock file system operations
- Mock time-dependent code

### 6. Test Edge Cases
- Null/undefined inputs
- Empty arrays/objects
- Boundary values
- Error conditions

## Continuous Integration

Tests run automatically on:
- Every commit (pre-commit hook - planned)
- Every pull request (GitHub Actions - planned)
- Before deployment

### CI Configuration (Planned)

\`\`\`yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3
\`\`\`

## Debugging Tests

### Run Single Test File
\`\`\`bash
pnpm test src/lib/__tests__/rbac.test.ts
\`\`\`

### Run Single Test
\`\`\`bash
pnpm test -t "should allow SuperAdmin all permissions"
\`\`\`

### Debug Mode
\`\`\`bash
DEBUG=* pnpm test
\`\`\`

### Vitest UI
Best for debugging - provides visual test runner with:
- Test hierarchy
- Real-time results
- Coverage visualization
- Error inspection

\`\`\`bash
pnpm test:ui
\`\`\`

## Future Testing Plans

1. **Integration Tests**: Full server action tests with test database
2. **E2E Tests**: Playwright for full user workflows
3. **Visual Regression**: Screenshot comparison for UI
4. **Performance Tests**: Load testing critical endpoints
5. **Contract Tests**: API contract validation

---

**Last Updated**: 2025-11-14  
**Version**: 1.0.0
