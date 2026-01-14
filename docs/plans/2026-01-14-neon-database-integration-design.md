# Neon Database Integration & E2E Testing

**Date:** January 14, 2026
**Status:** Approved
**Phase:** Phase 2 - Backend Completion

## Purpose

Connect the Red Clay Tennis backend to Neon PostgreSQL, migrate the schema, seed test data, and establish E2E testing infrastructure.

## Database Schema

Six tables form the core system:

1. **users** - Authentication (id, email, password_hash, name, phone, role, created_at)
2. **courts** - Court definitions (id, name, surface_type, hourly_rate, is_available)
3. **bookings** - Reservations (id, user_id, court_id, start_time, end_time, status, total_price)
4. **packages** - Session bundles (id, name, sessions_count, price, validity_days)
5. **user_packages** - Purchased packages (id, user_id, package_id, sessions_remaining, expires_at)
6. **waitlist** - Booking requests (id, user_id, court_id, preferred_date, status)

The setup script executes migrations in a single transaction. Foreign keys connect tables. Indexes speed queries on email, user_id, court_id, and start_time. Check constraints enforce business rules (end_time > start_time, sessions_remaining >= 0).

## Test Data

The seed script creates realistic data:

**Courts (4):**
- Clay surface, $40/hour
- Hard surface, $30/hour
- Grass surface, $45/hour
- Indoor hard, $35/hour

**Users (2):**
- Regular: test@redclay.com (password: Test123!)
- Admin: admin@redclay.com (password: Admin123!)

Passwords hash with bcrypt. The script checks for existing data before inserting. A clear flag wipes and re-seeds when needed.

## E2E Testing

Jest and Supertest test the API endpoints directly:

```
tests/e2e/
├── auth.test.ts           # Signup, login, JWT validation
├── bookings.test.ts       # Create, list, cancel bookings
├── courts.test.ts         # List courts, check availability
└── helpers/
    ├── setup.ts           # Database setup/teardown
    └── api.ts             # Authenticated request helpers
```

Tests verify three flows:
1. **Authentication** - User signup, login, token generation, protected endpoints
2. **Bookings** - Create bookings, prevent conflicts, list user bookings, cancel bookings
3. **Courts** - List available courts, filter by availability

Test helpers wrap Supertest for authenticated requests. Before/after hooks reset state. The test suite mocks external services (SendGrid, payments).

## Verification

Five steps confirm success:

1. `npm run db:test` - Connection works
2. Query schema - All tables exist
3. Query data - Courts and users appear
4. `npm test` - All tests pass
5. `npm run build` - TypeScript compiles

A single command runs all checks: `npm run verify`

## Implementation

**Configuration:**
- Add DATABASE_URL to .env.local
- Configure pool settings (min: 2, max: 10)

**Migration:**
- Execute docs/database/migrations.sql
- Wrap in transaction

**Seeding:**
- Create scripts/seed-db.ts
- Add npm command: db:seed
- Support --clear flag

**Testing:**
- Install supertest
- Create test structure
- Add npm command: test:e2e
- Configure Jest for E2E tests

**Documentation:**
- Update PROJECT_STATUS.md
- Document npm commands
- List success criteria

## Next Steps

After completion:
- Phase 2: Package management, admin APIs, waitlist
- Frontend development (APIs ready)
- CI/CD pipeline (run tests automatically)
