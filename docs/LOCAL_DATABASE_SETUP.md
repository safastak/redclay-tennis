# Local Database Setup Guide

## Issue
The Neon PostgreSQL database was timing out, preventing login functionality from working.

## Solution
Set up a local PostgreSQL database for development and testing.

---

## What Was Done

### 1. Created Local Database
```bash
createdb redclay_test
```

### 2. Ran Migrations
```bash
psql -d redclay_test -f docs/database/migrations.sql
```

**Result:** 15 tables created successfully

### 3. Seeded Admin User
```bash
node -r dotenv/config -r tsx/cjs scripts/seed-admin.ts
```

**Admin Credentials:**
- Email: `admin@redclay.com`
- Password: `admin123`

### 4. Updated Environment
- **Backed up Neon config:** `.env.local.neon`
- **Created local config:** `.env.local` (now using local PostgreSQL)

---

## Current Configuration

### Local Database (Active)
```
DATABASE_URL='postgresql://localhost:5432/redclay_test'
```

### Neon Database (Backup)
The Neon configuration is saved in `.env.local.neon` if you need to switch back.

---

## How to Use

### Login to Admin Dashboard
1. **URL:** http://localhost:3000/login
2. **Email:** admin@redclay.com
3. **Password:** admin123
4. **Redirect:** You'll be redirected to http://localhost:3000/admin

### Switch Between Databases

**To use local database (current):**
```bash
cp .env.local.test .env.local
npm run dev
```

**To use Neon database:**
```bash
cp .env.local.neon .env.local
npm run dev
```

---

## Database Schema

The local database has all the same tables as Neon:

- `users` - User accounts
- `user_auth` - Password hashes (separate for security)
- `courts` - Tennis/pickleball courts
- `bookings` - Court bookings
- `packages` - Membership packages
- `user_packages` - User package purchases
- `waitlist` - Booking waitlist
- `notifications` - User notifications
- `trainers` - Trainer profiles
- ... and more (15 total tables)

---

## Troubleshooting

### If login still fails:
```bash
# Check database connection
psql -d redclay_test -c "SELECT NOW()"

# Reset admin password
node -r dotenv/config -r tsx/cjs scripts/seed-admin.ts
```

### If you need to reset everything:
```bash
dropdb redclay_test
createdb redclay_test
psql -d redclay_test -f docs/database/migrations.sql
node -r dotenv/config -r tsx/cjs scripts/seed-admin.ts
```

---

## Why Neon Was Timing Out

Possible reasons:
1. **Database suspended** - Neon suspends inactive databases
2. **IP whitelisting** - Your IP may not be allowed
3. **Network issues** - Firewall blocking port 5432
4. **Connection pool exhausted** - Too many connections

To use Neon again, you'll need to:
1. Visit https://console.neon.tech
2. Check if database is active
3. Update IP allowlist if needed
4. Then switch back using `.env.local.neon`

---

## Server Status

✅ **Dev Server:** http://localhost:3000
✅ **Database:** PostgreSQL (local) on port 5432
✅ **Admin Login:** Working
✅ **All Routes:** Accessible

**Test it now:** http://localhost:3000/login
