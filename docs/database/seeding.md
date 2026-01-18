# Database Seeding Guide

Comprehensive guide for seeding the Red Clay Tennis database with test data.

## Overview

The project includes two seeding scripts:
- `seed-admin.ts` - Basic admin user setup
- `seed-comprehensive.ts` - Full database with realistic test scenarios

## Quick Start

```bash
# Seed with comprehensive test data (recommended)
npm run db:seed:comprehensive

# Or just create admin user
npm run db:seed
```

## Comprehensive Seed Script

The `seed-comprehensive.ts` script creates a complete, realistic test environment with:

### Data Created

| Category | Count | Details |
|----------|-------|---------|
| **Users** | 12 | 1 admin, 1 test user, 2 trainers, 3 premium, 3 new, 1 inactive, 1 power user |
| **Courts** | 6 | Tennis (clay, hard, grass), Pickleball, plus 1 in maintenance |
| **Trainers** | 2 | With Mon-Fri 8 AM - 6 PM schedules |
| **Package Classes** | 5 | Various tennis/pickleball packages (4, 8, 12 sessions) |
| **User Packages** | 6 | Active (3), Requested (1), Expired (1), Depleted (1) |
| **Bookings** | 10 | All states: pending, confirmed, cancelled, completed, no-show |
| **Waitlist** | 3 | Active (2), Expired (1) |
| **Notifications** | 5 | Booking confirmations, package alerts, admin approvals |
| **Peak Day Overrides** | 2 | New Year's Day, July 4th |
| **Booking Invites** | 2 | Pending and accepted session sharing |

### Test User Accounts

All passwords are `Test123!`

| Email | Role | Type | Purpose |
|-------|------|------|---------|
| `admin@redclay.com` | admin | premium | Admin dashboard testing |
| `test@redclay.com` | user | premium | E2E test suite user |
| `sarah.tennis@example.com` | user | premium | Active user with package |
| `john.new@example.com` | user | new | New user needing approval |
| `coach.maria@redclay.com` | trainer | premium | Senior trainer |
| `coach.alex@redclay.com` | trainer | premium | Junior trainer |

### Test Scenarios

The seed includes realistic scenarios for testing:

**User Types**
- ✅ Premium users with instant booking confirmation
- ✅ New users requiring admin approval
- ✅ Trainers with availability schedules
- ✅ Inactive user accounts

**Booking States**
- ✅ Pending bookings awaiting admin approval
- ✅ Confirmed bookings (today, tomorrow, next week)
- ✅ Cancelled booking with reason
- ✅ Completed booking (earlier today)
- ✅ No-show with admin notes
- ✅ Peak time weekend booking
- ✅ Package-based bookings (sessions deducted)
- ✅ Bookings with trainers

**Package States**
- ✅ Active packages with many sessions remaining
- ✅ Active package half-used
- ✅ Almost depleted package (1 session left)
- ✅ Requested package awaiting admin confirmation
- ✅ Expired package with unused sessions
- ✅ Fully depleted package

**Edge Cases**
- ✅ Court in maintenance mode
- ✅ Waitlist with trainer preference
- ✅ Session sharing invites
- ✅ Low sessions warning notification
- ✅ Peak/off-peak pricing differences

## Script Behavior

### Idempotent Design

The script is safe to run multiple times:

1. **Cleans existing data first** - Deletes all records in correct order
2. **Uses ON CONFLICT** - Updates existing users/trainers if re-run
3. **Transaction-wrapped** - All-or-nothing execution
4. **Date calculations** - Uses SQL `CURRENT_DATE` to avoid timezone issues

### Execution Order

```
1. Clean existing data (DELETE in reverse dependency order)
2. Courts
3. Users & Authentication
4. Trainers & Schedules
5. Package Classes & Court Assignments
6. User Packages
7. Bookings
8. Waitlist
9. Notifications
10. Peak Day Overrides
11. Booking Invites
```

## Database Schema Compatibility

The seed script matches the production schema:

- Uses `package_classes` (not `packages`)
- Uses `user_packages` with proper status flow
- Respects booking date constraints (`>= CURRENT_DATE`)
- Prevents duplicate court bookings via unique index
- Maintains referential integrity

## Common Issues

### Date Constraint Violations

**Error**: `bookings_booking_date_check` violation

**Cause**: Trying to create bookings in the past

**Solution**: Script now uses SQL `CURRENT_DATE` instead of JavaScript dates to avoid timezone/timing issues

### Duplicate Key Violations

**Error**: `users_email_key` or `trainers_user_id_key` violation

**Cause**: Re-running without cleaning first (older versions)

**Solution**: Current script cleans all data first, making it fully idempotent

### Transaction Rollback

**Error**: Any error during seeding

**Behavior**: Entire transaction rolls back - no partial data

**Solution**: Fix the error and re-run. Database remains clean.

## Development Workflow

### Fresh Start

```bash
# Complete database reset with fresh seed
psql -d redclay_test -c "TRUNCATE users, user_auth, courts, trainers, trainer_schedules, bookings, package_classes, package_courts, user_packages, waitlists, notifications, peak_day_overrides, booking_invites, ai_recommendations, telegram_users RESTART IDENTITY CASCADE;"
npm run db:seed:comprehensive
```

### Quick Reseed

```bash
# Script handles cleanup automatically
npm run db:seed:comprehensive
```

### Custom Scenarios

To add custom test scenarios, edit `scripts/seed-comprehensive.ts`:

```typescript
// Add after existing scenarios
await client.query(
  `INSERT INTO bookings (user_id, court_id, booking_date, ...)
   VALUES ($1, $2, CURRENT_DATE + 3, ...)`,
  [userIds['your.user@example.com'], courtIds[0], ...]
)
```

## Testing Integration

### E2E Test Compatibility

The seed provides users expected by E2E tests:

- `test@redclay.com` - Used by auth tests
- `admin@redclay.com` - Used by admin dashboard tests

### Jest Setup

Tests use the same database with proper isolation:

```javascript
// tests/utils/test-helpers.ts creates unique users per test
createTestUser({ email: `test-${Date.now()}@example.com` })
```

### Schema Validation

Seed data validates against Zod schemas in `types/api-contracts.ts`:

- Booking response structure
- User package fields
- Dashboard analytics format

## Performance

**Execution time**: ~2-3 seconds for complete seed

**Optimization notes**:
- Uses `Promise.all()` for parallel inserts where possible
- Batches court creation
- Single transaction for atomicity

## Maintenance

### Updating Seed Data

When schema changes:

1. Update `scripts/seed-comprehensive.ts`
2. Match new field names/types
3. Test with `npm run db:seed:comprehensive`
4. Update this documentation

### Adding New Scenarios

Follow existing patterns:

```typescript
// SCENARIO N: Description
await client.query(
  `INSERT INTO table_name (...)
   VALUES (...)`,
  [values]
)
```

## Related Documentation

- [Database Schema Reference](../reference/database-schema.md)
- [Development Setup Guide](../guides/development-setup.md)
- [Testing Strategy](../guides/testing-strategy.md)
- [API Contract Testing](../testing/api-contract-testing.md)

## Troubleshooting

### "Cannot connect to database"

Check `.env.local` has correct `DATABASE_URL`:

```bash
npm run db:test
```

### "Role does not exist"

Create PostgreSQL role:

```bash
createuser -s postgres
```

### "Database does not exist"

Create database:

```bash
createdb redclay_test
npm run db:setup
```

## Advanced Usage

### Switching Databases

**Local PostgreSQL**:
```bash
cp .env.local.test .env.local
npm run db:seed:comprehensive
```

**Neon (Production)**:
```bash
cp .env.local.neon .env.local
npm run db:seed:comprehensive
```

### Partial Seeding

For minimal setup, use basic seed:

```bash
npm run db:seed  # Only creates admin user
```

### Seeding from SQL

For production data:

```bash
pg_dump redclay_test > backup.sql
psql -d redclay_new -f backup.sql
```
