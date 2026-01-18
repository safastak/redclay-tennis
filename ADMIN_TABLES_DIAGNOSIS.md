# Admin Tables Loading Issue - Root Cause Analysis

## Date: 2026-01-16
## Status: ✅ FIXED AND VERIFIED

## Problem Statement
Admin tables (users and bookings) are not loading/displaying data correctly in the admin dashboard.

## Investigation Summary

### Phase 1: Root Cause Investigation

#### 1. Files Examined
- `app/(admin)/admin/users/page.tsx` - Users page component
- `app/(admin)/admin/bookings/page.tsx` - Bookings page component
- `components/admin/UserTable.tsx` - User table component
- `components/admin/BookingTable.tsx` - Booking table component
- `lib/api/admin.ts` - API client functions
- `app/api/admin/users/route.ts` - Users API endpoint
- `app/api/admin/bookings/route.ts` - Bookings API endpoint
- `lib/services/admin.service.ts` - Admin service layer with database queries

#### 2. Data Flow Analysis
```
Frontend Component (useQuery)
  ↓
API Client (fetchAdminUsers/fetchAdminBookings)
  ↓
API Route (/api/admin/users, /api/admin/bookings)
  ↓
Auth Middleware (requireAuth, requireAdmin)
  ↓
Service Layer (getAdminUsers, getAdminBookings)
  ↓
Database Query
```

### ROOT CAUSE IDENTIFIED

**Schema Mismatch Between Backend and Frontend**

#### Users Table Issue

**Backend Returns** (`lib/services/admin.service.ts:253-258`):
```sql
SELECT
  id, email, full_name, phone_number,
  user_type, app_role, is_active,
  created_at, updated_at
FROM users
```

**Frontend Expects** (`components/admin/UserTable.tsx:7-14`):
```typescript
interface User {
  id: string
  name: string        // ❌ Backend returns: full_name
  email: string       // ✅ Match
  phone: string       // ❌ Backend returns: phone_number
  user_type: 'new' | 'premium'  // ✅ Match
  role: string        // ❌ Backend returns: app_role
  created_at: string  // ✅ Match
}
```

**Frontend Usage** (`components/admin/UserTable.tsx`):
- Line 64: `{user.name}` - tries to access undefined field
- Line 67: `{user.email}` - ✅ works
- Line 70: `{user.phone}` - tries to access undefined field
- Line 76: `{user.role}` - tries to access undefined field

#### Bookings Table Status
The bookings query uses column aliases that match frontend expectations:
```sql
u.full_name as user_name  -- ✅ Frontend expects user_name
u.email as user_email      -- ✅ Frontend expects user_email
c.name as court_name       -- ✅ Frontend expects court_name
```
So bookings should work correctly.

### Impact
- Users table displays empty values for name, phone, and role columns
- Data is being fetched successfully from the database
- API endpoints are working correctly
- Authentication and authorization are working
- Only the field name mapping is causing the display issue

### Solution Required
Two possible fixes:

**Option 1: Update Backend** (Change database query aliases)
```typescript
// In lib/services/admin.service.ts
SELECT
  id,
  email,
  full_name as name,           // Add alias
  phone_number as phone,        // Add alias
  user_type,
  app_role as role,            // Add alias
  is_active,
  created_at,
  updated_at
FROM users
```

**Option 2: Update Frontend** (Change interface and references)
```typescript
// In components/admin/UserTable.tsx
interface User {
  id: string
  full_name: string      // Change from name
  email: string
  phone_number: string   // Change from phone
  user_type: 'new' | 'premium'
  app_role: string       // Change from role
  created_at: string
}

// And update all references:
{user.full_name}
{user.phone_number}
{user.app_role}
```

**Recommendation**: Option 1 (Update Backend) is preferred because:
1. Less code changes (single file vs multiple frontend files)
2. API consistency - follows same pattern as bookings query
3. Cleaner frontend interface with simpler field names

## Implementation

### Changes Made

**File: `lib/services/admin.service.ts`**

1. **Updated `getAdminUsers` function (lines 253-262)**
   - Added SQL alias: `full_name as name`
   - Added SQL alias: `phone_number as phone`
   - Added SQL alias: `app_role as role`

2. **Updated `updateUser` function (line 305)**
   - Added same aliases to RETURNING clause for consistency

### Verification

- ✅ TypeScript compilation: No errors
- ✅ Schema alignment: Backend now returns field names matching frontend expectations
- ✅ Pattern consistency: Follows same approach as bookings query
- ✅ API contract: Frontend components will now receive correct field names

### Testing Results ✅

**API Testing via curl (2026-01-16 21:24 UTC):**

1. **Authentication Test:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -d '{"email":"admin@redclay.com","password":"admin123"}'
   ```
   ✅ Successfully authenticated as admin user

2. **Admin Users API Test:**
   ```bash
   curl http://localhost:3000/api/admin/users -H "Authorization: Bearer [token]"
   ```
   ✅ **Response confirms fix working:**
   ```json
   {
     "users": [{
       "id": "8f31d76c-f41e-4c9f-ac50-0b783f704fdb",
       "email": "admin@redclay.com",
       "name": "System Admin",        ← ✅ CORRECT (was full_name)
       "phone": null,                 ← ✅ CORRECT (was phone_number)
       "user_type": "premium",
       "role": "admin",               ← ✅ CORRECT (was app_role)
       "is_active": true,
       "created_at": "2026-01-14T19:19:22.110Z",
       "updated_at": "2026-01-14T19:19:42.871Z"
     }],
     "total": 1,
     "page": 1,
     "limit": 50,
     "totalPages": 1
   }
   ```

3. **Admin Bookings API Test:**
   ```bash
   curl http://localhost:3000/api/admin/bookings -H "Authorization: Bearer [token]"
   ```
   ✅ Response structure correct (empty array, no bookings in test DB)

## Resolution

The issue was resolved by adding SQL column aliases in the backend service layer to match frontend expectations. This is the recommended approach because:
- Minimal code changes (2 queries in 1 file)
- Maintains consistency with existing bookings pattern
- No frontend changes required
- Cleaner API contract for consumers
