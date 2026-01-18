# Why E2E Tests Didn't Catch the Schema Mismatch

## Date: 2026-01-16
## Issue: Schema field name mismatch (full_name vs name, phone_number vs phone, app_role vs role)

## Executive Summary

The E2E tests **passed** despite the schema mismatch because they only tested the **API layer** (backend), not the **UI layer** (frontend). The mismatch occurred between the API response and the frontend component expectations.

---

## Test Analysis

### What the E2E Tests Checked

**File: `tests/e2e/admin-users.test.ts`**

**Line 45-47:**
```typescript
expect(response.status).toBe(200)
expect(data.users).toBeDefined()
expect(Array.isArray(data.users)).toBe(true)
```

**The tests validated:**
1. ✅ HTTP status code (200)
2. ✅ Response has a `users` property
3. ✅ `users` is an array
4. ✅ Authentication works
5. ✅ Authorization works (admin vs user)
6. ✅ Filtering by user_type works

**The tests DID NOT validate:**
- ❌ Specific field names in the response (name vs full_name)
- ❌ Frontend component rendering
- ❌ Whether UserTable can display the data
- ❌ Field name contract between API and UI

---

## Root Cause: Test Layer Gap

### Test Architecture

```
┌─────────────────────────────────────────┐
│  Frontend (React Components)            │
│  - UserTable expects: name, phone, role │  ← NOT TESTED
└─────────────────────────────────────────┘
                 ↓ uses
┌─────────────────────────────────────────┐
│  API Client (lib/api/admin.ts)          │
│  - Passes through API response as-is    │  ← NOT TESTED
└─────────────────────────────────────────┘
                 ↓ calls
┌─────────────────────────────────────────┐
│  API Routes (app/api/admin/users)       │  ← E2E TESTS HERE
│  - Returns: full_name, phone_number,    │  ✅ TESTED
│    app_role                              │
└─────────────────────────────────────────┘
                 ↓ calls
┌─────────────────────────────────────────┐
│  Service Layer (lib/services/admin)     │  ✅ TESTED (implicit)
└─────────────────────────────────────────┘
                 ↓ queries
┌─────────────────────────────────────────┐
│  Database (PostgreSQL)                   │  ✅ TESTED (implicit)
└─────────────────────────────────────────┘
```

**Gap:** E2E tests stop at the API layer. They don't verify the frontend can consume the API response.

---

## Why This Happened

### 1. API-Focused Testing
The E2E tests are **API integration tests**, not true end-to-end tests. They test:
- API routes directly (via Next.js route handlers)
- Not through a browser
- Not through actual React components

### 2. Shallow Assertions
```typescript
// Current test
expect(data.users).toBeDefined()
expect(Array.isArray(data.users)).toBe(true)

// Missing assertions
expect(data.users[0]).toHaveProperty('name')  // ❌ Not checked
expect(data.users[0]).toHaveProperty('phone') // ❌ Not checked
expect(data.users[0]).toHaveProperty('role')  // ❌ Not checked
```

### 3. No Type Safety Between Layers
The API returns dynamic JSON, and TypeScript interfaces in the frontend are not enforced at runtime:

```typescript
// Frontend interface (components/admin/UserTable.tsx)
interface User {
  name: string    // Expected
  phone: string   // Expected
  role: string    // Expected
}

// Actual API response
{
  full_name: "...",   // Returned
  phone_number: "...", // Returned
  app_role: "..."      // Returned
}

// TypeScript doesn't catch this because the data comes from JSON.parse()
```

---

## What Would Have Caught This

### Option 1: Frontend Component Tests ⭐ BEST
```typescript
// Component test with real API data
import { render, screen } from '@testing-library/react'
import UserTable from '@/components/admin/UserTable'

it('should display user name, phone, and role', async () => {
  const mockData = await fetch('/api/admin/users', {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json())

  render(<UserTable users={mockData.users} />)

  // These would fail with the bug
  expect(screen.getByText('System Admin')).toBeInTheDocument()
  expect(screen.queryByText('undefined')).not.toBeInTheDocument()
})
```

### Option 2: Contract Testing
```typescript
// Schema validation test
import { z } from 'zod'

const UserResponseSchema = z.object({
  users: z.array(z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),        // ← Would fail: expects 'name'
    phone: z.string().nullable(),  // ← Would fail: expects 'phone'
    role: z.string(),        // ← Would fail: expects 'role'
    user_type: z.string(),
    created_at: z.string(),
  }))
})

it('should match expected schema', async () => {
  const response = await fetch('/api/admin/users')
  const data = await response.json()

  expect(() => UserResponseSchema.parse(data)).not.toThrow()
})
```

### Option 3: E2E Browser Tests (Playwright/Cypress)
```typescript
// Real browser test
test('admin can view users table', async ({ page }) => {
  await page.goto('/admin/users')

  // Would fail - table cells would be empty
  const firstUserName = await page.locator('table tbody tr:first-child td:nth-child(1)').textContent()
  expect(firstUserName).not.toBe('')
  expect(firstUserName).toBe('System Admin')
})
```

### Option 4: Detailed API Response Assertions
```typescript
it('should return users with correct field names', async () => {
  const response = await getUsers(request)
  const data = await response.json()

  expect(data.users[0]).toMatchObject({
    name: expect.any(String),   // ← Would fail
    phone: expect.any(String),  // ← Would fail
    role: expect.any(String),   // ← Would fail
  })
})
```

---

## Recommendations

### Immediate Actions

1. **Add Schema Validation to E2E Tests**
   ```typescript
   // tests/e2e/admin-users.test.ts
   it('should return users with UI-compatible field names', async () => {
     const response = await getUsers(request)
     const data = await response.json()

     expect(response.status).toBe(200)
     expect(data.users.length).toBeGreaterThan(0)

     // Validate field names match frontend expectations
     const user = data.users[0]
     expect(user).toHaveProperty('name')
     expect(user).toHaveProperty('phone')
     expect(user).toHaveProperty('role')
     expect(user).toHaveProperty('email')
     expect(user).toHaveProperty('user_type')

     // Should NOT have database field names
     expect(user).not.toHaveProperty('full_name')
     expect(user).not.toHaveProperty('phone_number')
     expect(user).not.toHaveProperty('app_role')
   })
   ```

2. **Add React Component Tests**
   ```typescript
   // tests/components/admin/UserTable.test.tsx
   import { render, screen, waitFor } from '@testing-library/react'
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
   import AdminUsersPage from '@/app/(admin)/admin/users/page'

   it('should render user names, phones, and roles', async () => {
     const queryClient = new QueryClient()
     render(
       <QueryClientProvider client={queryClient}>
         <AdminUsersPage />
       </QueryClientProvider>
     )

     await waitFor(() => {
       expect(screen.getByText('System Admin')).toBeInTheDocument()
       expect(screen.getByText('admin')).toBeInTheDocument()
     })
   })
   ```

3. **Add API Contract Types**
   ```typescript
   // types/api/admin.ts
   export interface AdminUserResponse {
     users: Array<{
       id: string
       email: string
       name: string        // Frontend contract
       phone: string | null
       role: string
       user_type: string
       is_active: boolean
       created_at: string
       updated_at: string
     }>
     total: number
     page: number
     limit: number
     totalPages: number
   }

   // Use this type in both API routes and frontend
   ```

### Long-term Improvements

1. **Add Playwright/Cypress E2E Tests**
   - Test actual browser rendering
   - Test full user flows (login → navigate → view table → see data)
   - Run against staging environment

2. **Implement Runtime Validation**
   ```typescript
   // lib/api/admin.ts
   import { z } from 'zod'

   const UserSchema = z.object({
     name: z.string(),
     phone: z.string().nullable(),
     role: z.string(),
     // ...
   })

   export async function fetchAdminUsers(filters: any) {
     const response = await fetchWithAuth(`/admin/users?${params}`)

     // Validate at runtime
     const validated = z.object({
       users: z.array(UserSchema)
     }).parse(response)

     return validated
   }
   ```

3. **CI/CD Visual Regression Testing**
   - Capture screenshots of admin tables
   - Compare against baseline
   - Would catch empty cells immediately

---

## Lessons Learned

1. **API tests ≠ E2E tests**: True E2E tests should go through the UI layer
2. **Shallow assertions miss bugs**: Check actual field values, not just array length
3. **TypeScript doesn't protect JSON boundaries**: Runtime validation needed
4. **Test at the integration points**: Where data crosses boundaries (API → UI)
5. **Component tests are valuable**: They catch UI-data mismatches

---

## Conclusion

The E2E tests passed because they only validated:
- "Does the API respond with 200?"
- "Does the response have a users array?"

They didn't validate:
- "Can the frontend actually render this data?"
- "Do the field names match what the UI expects?"

**Fix**: Add field name assertions to E2E tests + add component tests.
