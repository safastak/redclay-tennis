# API Contract Testing

## Overview

API contract testing ensures that the responses from backend APIs match the expectations of frontend components. This prevents bugs where the API returns data in one format (e.g., `full_name`) but the frontend expects another format (e.g., `name`).

## Three-Layer Testing Strategy

### Layer 1: E2E API Tests (Required Field Validation)

**Location:** `tests/e2e/*.test.ts`

**Purpose:** Verify API responses contain the correct field names expected by the frontend.

**Example:**
```typescript
it('should return users with UI-compatible field names', async () => {
  const response = await getUsers(request)
  const data = await response.json()

  const user = data.users[0]

  // Should have frontend-friendly field names
  expect(user).toHaveProperty('name')
  expect(user).toHaveProperty('phone')
  expect(user).toHaveProperty('role')

  // Should NOT have database field names
  expect(user).not.toHaveProperty('full_name')
  expect(user).not.toHaveProperty('phone_number')
  expect(user).not.toHaveProperty('app_role')
})
```

### Layer 2: Component Tests (Rendering Validation)

**Location:** `tests/components/**/*.test.tsx`

**Purpose:** Verify React components can correctly render API response data.

**Example:**
```typescript
it('should render user data from API response', () => {
  const apiUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-0100',
    role: 'user',
    user_type: 'premium',
    // ...
  }

  render(<UserTable users={[apiUser]} />)

  expect(screen.getByText('John Doe')).toBeInTheDocument()
  expect(screen.getByText('555-0100')).toBeInTheDocument()
})
```

### Layer 3: Contract Validation (Runtime Type Safety)

**Location:** `types/api-contracts.ts` + `tests/integration/api-contracts.test.ts`

**Purpose:** Define and enforce strict schemas for API responses using Zod.

**Example:**
```typescript
// Define schema
export const AdminUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),  // NOT full_name
  phone: z.string().nullable(),  // NOT phone_number
  role: z.enum(['user', 'trainer', 'admin']),  // NOT app_role
  // ...
})

// Test schema
it('should validate API response', () => {
  const response = await getUsers(request)
  const data = await response.json()

  expect(() => AdminUserSchema.parse(data.users[0])).not.toThrow()
})
```

## Field Naming Conventions

### Frontend Fields (API Responses)

Always use these field names in API responses:

| Frontend Field | Database Field | Type |
|---------------|----------------|------|
| `name` | `full_name` | string |
| `phone` | `phone_number` | string \| null |
| `role` | `app_role` | 'user' \| 'trainer' \| 'admin' |

### SQL Aliasing

Use SQL `AS` clauses to transform database fields:

```sql
SELECT
  id,
  email,
  full_name AS name,
  phone_number AS phone,
  app_role AS role,
  user_type,
  is_active,
  created_at,
  updated_at
FROM users
```

## Adding Tests for New Endpoints

When adding a new API endpoint, follow this checklist:

### 1. E2E Test Checklist

- [ ] Test successful response (200)
- [ ] Test authentication (401 without token)
- [ ] Test authorization (403 for non-admin)
- [ ] **Validate field names match frontend expectations**
- [ ] **Validate types for critical fields**
- [ ] **Add negative assertions for database field names**

### 2. Component Test Checklist

- [ ] Test rendering with mock data
- [ ] Test empty states
- [ ] Test null/undefined handling
- [ ] **Test with API response structure**
- [ ] **Test that undefined values don't render**

### 3. Contract Validation Checklist

- [ ] Define Zod schema in `types/api-contracts.ts`
- [ ] Export TypeScript type with `z.infer`
- [ ] Add validation test in `tests/integration/api-contracts.test.ts`
- [ ] Add negative test with wrong field names
- [ ] (Optional) Add runtime validation in API client

## Common Pitfalls

### ❌ Don't: Shallow E2E Assertions

```typescript
// BAD: Only checks if array exists
expect(data.users).toBeDefined()
expect(Array.isArray(data.users)).toBe(true)
```

### ✅ Do: Deep E2E Assertions

```typescript
// GOOD: Checks actual field names
const user = data.users[0]
expect(user).toHaveProperty('name')
expect(user).not.toHaveProperty('full_name')
```

### ❌ Don't: Skip Component Tests

Components can fail silently if data structure changes. Always test them.

### ✅ Do: Test Components with Realistic Data

```typescript
// Use data structures that match actual API responses
const mockUser = {
  id: '1',
  name: 'Test',  // Matches API contract
  phone: '555-0100',  // Matches API contract
  role: 'user',  // Matches API contract
  // ...
}
```

### ❌ Don't: Trust TypeScript Alone

TypeScript interfaces are compile-time only. JSON responses aren't type-checked at runtime.

### ✅ Do: Add Runtime Validation

```typescript
import { AdminUsersResponseSchema } from '@/types/api-contracts'

export async function fetchAdminUsers(filters: any) {
  const data = await fetchWithAuth(`/admin/users?${params}`)
  return AdminUsersResponseSchema.parse(data)  // Runtime validation
}
```

## Running Tests

```bash
# Run all tests
npm test

# Run E2E tests only
npm test tests/e2e

# Run component tests only
npm test tests/components

# Run contract tests only
npm test tests/integration/api-contracts

# Run with coverage
npm run test:coverage
```

## Test Coverage Goals

- **E2E Tests:** 100% of API routes
- **Component Tests:** 80%+ of React components
- **Contract Tests:** 100% of API response schemas

## Maintenance

When changing database schema:

1. Update SQL migrations
2. Update service layer queries (with AS clauses)
3. Update Zod schemas in `types/api-contracts.ts`
4. Run all tests to ensure contracts still match
5. Update documentation if field mappings change

## Further Reading

- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Zod Documentation](https://zod.dev/)
- [Jest Best Practices](https://jestjs.io/docs/tutorial-react)
