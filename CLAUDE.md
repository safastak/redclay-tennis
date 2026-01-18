# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Red Clay Tennis is a mobile-first tennis court booking platform with admin management capabilities. The platform handles bookings, packages, waitlists, and notifications for a tennis facility.

**Tech Stack:**
- Next.js 16 (App Router) with TypeScript 5
- PostgreSQL (via Neon for production, local for development)
- JWT + Bcrypt authentication
- TailwindCSS 4 for styling
- TanStack Query for data fetching
- Jest for testing

**Database:** Currently using local PostgreSQL (redclay_test) for development. Neon configuration available in `.env.local.neon` for production.

## Development Commands

### Core Development
```bash
npm run dev              # Start development server (http://localhost:3000)
npm run build            # Production build
npm start                # Run production build
npm run lint             # Run ESLint
npm run typecheck        # TypeScript type checking
```

### Database Commands
```bash
npm run db:setup         # Run database migrations
npm run db:test          # Test database connection
npm run db:seed          # Seed test data
```

### Testing
```bash
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report (target: 80-90%)
```

### Database Management
```bash
# Reset local database completely
dropdb redclay_test && createdb redclay_test
psql -d redclay_test -f docs/database/migrations.sql
node -r dotenv/config -r tsx/cjs scripts/seed-admin.ts

# Switch to Neon database
cp .env.local.neon .env.local
npm run dev

# Switch back to local database
cp .env.local.test .env.local
npm run dev
```

## Architecture

### High-Level Structure

The codebase follows Next.js App Router conventions with a service-oriented backend architecture:

```
app/
├── api/               # API routes (serverless functions)
│   ├── auth/         # Authentication endpoints (signup, login)
│   ├── bookings/     # User booking operations
│   ├── courts/       # Court listing
│   ├── packages/     # Package browsing & purchase
│   ├── admin/        # Admin-only endpoints
│   │   ├── bookings/ # Booking approval/rejection
│   │   ├── users/    # User management
│   │   ├── packages/ # Package CRUD
│   │   ├── waitlist/ # Waitlist management
│   │   └── analytics/# Dashboard analytics
│   └── waitlist/     # User waitlist operations
├── (admin)/          # Admin UI pages (protected route group)
│   └── admin/
│       ├── bookings/
│       ├── users/
│       └── waitlist/
├── login/            # Authentication pages
└── page.tsx          # Public landing page

lib/
├── db/               # Database connection pool & transaction helpers
├── auth/             # JWT, bcrypt, middleware
├── services/         # Business logic layer
│   ├── admin.service.ts
│   ├── booking.service.ts
│   ├── court.service.ts
│   ├── email.service.ts
│   ├── package.service.ts
│   ├── user.service.ts
│   └── waitlist.service.ts
├── utils/            # Shared utilities
├── validation/       # Zod schemas
└── query-client.ts   # TanStack Query configuration

components/
├── admin/            # Admin dashboard components
├── auth/             # Login/signup forms
├── bookings/         # Booking UI components
├── layout/           # Navigation, headers
└── ui/               # Reusable UI primitives

types/
├── database.ts       # Database entity types
└── api.ts            # API request/response types
```

### Key Architectural Patterns

**Service Layer Architecture:**
- All business logic lives in `lib/services/`
- API routes are thin controllers that call services
- Services handle database queries, validation, and business rules
- Services use the transaction helper from `lib/db/` for data consistency

**Authentication Flow:**
1. User credentials → `POST /api/auth/login`
2. Password verified with bcrypt → JWT token issued
3. JWT stored client-side, sent in Authorization header
4. `requireAuth()` middleware validates tokens on protected routes
5. `requireAdmin()` checks role for admin endpoints

**Database Connection:**
- Connection pool configured in `lib/db/index.ts`
- Pool size: 2-10 connections (configurable via env vars)
- `transaction()` helper ensures atomic operations
- Query logging enabled in development mode

**Mobile-First Design:**
- All admin UI components built mobile-first
- Bottom navigation for touch optimization
- Minimum 44x44px touch targets
- Progressive disclosure patterns
- Dark mode support via next-themes

### Database Schema

15 tables total including:
- **users** - User accounts with role-based access (user/trainer/admin)
- **user_auth** - Password hashes (separate table for security)
- **courts** - Tennis/pickleball courts with availability
- **bookings** - Court reservations with approval workflow
- **packages** - Membership packages (1/4/8/12 sessions)
- **user_packages** - Package purchases and session tracking
- **waitlist** - Booking waitlist with notification system
- **notifications** - User notifications (email/SMS/push)
- **trainers** - Trainer profiles and scheduling

Full schema: `docs/reference/database-schema.md`
Migrations: `docs/database/migrations.sql`

### Authentication & Authorization

**User Roles:**
- `user` - Regular customer (new users require admin approval for bookings)
- `trainer` - Professional trainer with elevated access
- `admin` - Full system access

**User Types:**
- `new` - Requires admin approval for all bookings
- `premium` - Instant booking confirmation

**Middleware:**
- `requireAuth()` - Validates JWT, returns user payload or 401
- `requireAdmin()` - Checks admin role, returns 403 if unauthorized
- `requireTrainer()` - Checks trainer or admin role

**Token Management:**
- JWT secret: Minimum 32 characters (set in JWT_SECRET env var)
- Expiration: 7 days default (JWT_EXPIRATION)
- Bcrypt rounds: 12 (BCRYPT_ROUNDS)

## Implementation Plans

Four comprehensive phase-by-phase plans exist in `docs/build-plans/`:

1. **Infrastructure Plan** (✅ Complete) - Database, auth, core services
2. **Admin Backend Plan** (✅ Complete) - All admin APIs
3. **Admin Frontend Plan** (✅ Complete) - Admin dashboard UI
4. **User Frontend Plan** (⏳ Not started) - User-facing booking UI

Each plan includes:
- Clear phase breakdown with dependencies
- Complete code examples
- Testing requirements
- Success criteria checklists
- Git commit strategy

Current implementation status tracked in `PROJECT_STATUS.md`.

## Common Development Tasks

### Adding a New API Endpoint

1. Create service method in `lib/services/[feature].service.ts`
2. Add route handler in `app/api/[feature]/route.ts`
3. Use `requireAuth()` for protected endpoints
4. Use `requireAdmin()` for admin-only endpoints
5. Add Zod validation schema in `lib/validation/`
6. Write tests in `tests/integration/` or `tests/e2e/`
7. Add types to `types/api.ts` and `types/database.ts`

### Running Tests

Test organization:
- `tests/unit/` - Service and utility tests
- `tests/integration/` - API route tests
- `tests/e2e/` - End-to-end user flows
- `tests/utils/` - Test helpers and fixtures

All tests should pass before committing. Target coverage: 80-90%.

### Adding Tests for API Endpoints

When adding a new API endpoint or modifying existing ones, always include three layers of tests:

**1. E2E API Tests** (`tests/e2e/`)
- Verify correct field names in response (not database field names)
- Add both positive and negative assertions
- Example: `expect(user).toHaveProperty('name')` AND `expect(user).not.toHaveProperty('full_name')`

**2. Component Tests** (`tests/components/`)
- Test React components can render the API response
- Use realistic mock data matching API structure
- Verify no undefined values render

**3. Contract Validation** (`types/api-contracts.ts`)
- Define Zod schema for API response
- Add validation test in `tests/integration/api-contracts.test.ts`
- Optionally add runtime validation in API client

See `docs/testing/api-contract-testing.md` for complete guide.

### Working with the Database

**Connection patterns:**
```typescript
import { query, transaction } from '@/lib/db'

// Simple query
const result = await query('SELECT * FROM users WHERE id = $1', [userId])

// Transaction (for multiple related operations)
await transaction(async (client) => {
  await client.query('INSERT INTO bookings ...')
  await client.query('UPDATE user_packages ...')
  // Automatically commits or rolls back on error
})
```

**Local database admin credentials:**
- Email: `admin@redclay.com`
- Password: `admin123`

### Testing Authentication

Use the seeded admin account for testing protected routes:

```bash
# Login and get JWT token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@redclay.com","password":"admin123"}'

# Use token in subsequent requests
curl http://localhost:3000/api/admin/bookings \
  -H "Authorization: Bearer <token>"
```

## Important Notes

### Environment Configuration

Required environment variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Minimum 32 characters for security
- `EMAIL_API_KEY` - SendGrid API key for notifications
- `NODE_ENV` - Set to 'production' for production builds

### Code Quality Standards

- TypeScript strict mode enabled
- All API responses must include proper error handling
- Use service layer for business logic (never in API routes)
- Database queries must use parameterized queries (prevent SQL injection)
- All async operations must have proper error boundaries
- Use TanStack Query for client-side data fetching (caching + optimistic updates)
- AVOID creating md files and instead update existing ones.

### Mobile-First UI Development

When building UI components:
- Start with mobile layout (320px viewport)
- Use Tailwind responsive breakpoints (`sm:`, `md:`, `lg:`)
- Minimum touch target: 44x44px
- Test on iOS Safari and Chrome Android
- Support dark mode via `next-themes`
- Use shadcn/ui components from `components/ui/`

### Testing Requirements

Before merging:
- All tests pass (`npm test`)
- Type checking passes (`npm run typecheck`)
- Lint passes (`npm run lint`)
- Coverage targets met (80-90%)
- Manual testing on mobile viewport

## Documentation

Comprehensive documentation available in `docs/`:

- `docs/reference/database-schema.md` - Complete database schema
- `docs/reference/ui-components.md` - Mobile-first component specifications
- `docs/reference/automation-rules.md` - Business logic rules
- `docs/build-plans/` - Phase-by-phase implementation plans
- `docs/architecture/platform-overview.md` - High-level architecture
- `docs/LOCAL_DATABASE_SETUP.md` - Database setup guide
- `docs/ADMIN_BACKEND_COMPLETE.md` - Admin backend documentation

## Project Status

**Current Phase:** Admin frontend complete, user frontend not started

**Recent Milestones:**
- ✅ Infrastructure (database, auth, services)
- ✅ Admin backend APIs (bookings, users, packages, analytics)
- ✅ Admin frontend UI (mobile-first dashboard)
- ⏳ User frontend (booking interface, package purchase)

**Known Issues:**
- Neon database times out occasionally (using local PostgreSQL for development)
- Email notifications require SendGrid API key configuration

See `PROJECT_STATUS.md` and `IMPLEMENTATION_READY.md` for detailed status.
