# Development Setup Guide
## Red Clay Tennis Booking Platform

**Purpose:** Detailed development environment configuration
**Target Audience:** Developers configuring their local development environment
**Estimated Time:** 1-2 hours

---

## Table of Contents

1. [Environment Configuration](#environment-configuration)
2. [Database Setup](#database-setup)
3. [Authentication Configuration](#authentication-configuration)
4. [External Services](#external-services)
5. [Feature Flags](#feature-flags)
6. [Development Tools](#development-tools)

---

## Environment Configuration

### Required Environment Variables

Create `.env.local` file in project root:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Authentication
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRATION=7d
BCRYPT_ROUNDS=12

# API Base URL
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Email (example with SendGrid)
EMAIL_PROVIDER=sendgrid
EMAIL_API_KEY=SG.xxxxxxxxxxxxx
EMAIL_FROM=noreply@redclay.com
EMAIL_FROM_NAME=Red Clay Tennis

# SMS (optional, for future use)
SMS_PROVIDER=twilio
SMS_API_KEY=xxxxx
SMS_FROM=+1234567890

# Telegram (Phase 3)
TELEGRAM_BOT_TOKEN=xxxxx:xxxxx

# File Storage
BLOB_STORAGE_URL=https://your-storage.vercel-storage.com
BLOB_READ_WRITE_TOKEN=xxxxx

# Feature Flags
ENABLE_AI_RECOMMENDATIONS=false
ENABLE_TELEGRAM_BOT=false
```

---

## Database Setup

### Neon PostgreSQL Configuration

1. **Create Neon Project:**
   - Visit https://neon.tech
   - Sign up or log in
   - Create new project: "red-clay-tennis"
   - Select region closest to your users
   - Note the connection string provided

2. **Connection String Format:**
   ```
   postgresql://user:password@host:port/database?sslmode=require
   ```

3. **Database Branching (Recommended):**
   ```bash
   # Neon supports database branching like Git
   # Create a development branch to keep production safe

   # Via Neon Console:
   # - Go to your project
   # - Click "Branches"
   # - Create new branch: "development"
   # - Use this branch's connection string locally
   ```

4. **Run Migrations:**
   ```bash
   # Set DATABASE_URL
   export DATABASE_URL="your-connection-string-here"

   # Run migration SQL file
   psql $DATABASE_URL -f docs/database/migrations.sql

   # Verify tables created
   psql $DATABASE_URL -c "\dt"
   # Should show 14 tables
   ```

5. **Seed Development Data:**
   ```bash
   # Comprehensive seeding (recommended for development)
   npm run db:seed:comprehensive

   # Or basic admin user only
   npm run db:seed

   # Output example:
   # 🌱 Starting comprehensive database seeding...
   # 🧹 Cleaning existing data...
   # 📍 Seeding courts...
   # 👥 Seeding users...
   # 🎾 Seeding trainers...
   # ✅ COMPREHENSIVE DATABASE SEEDING COMPLETE!
   ```

   **What gets seeded:**
   - 12 users (admin, trainers, premium, new users)
   - 6 courts (tennis & pickleball)
   - 2 trainers with schedules
   - 5 package classes
   - 6 user packages (various states)
   - 10 bookings (all states)
   - 3 waitlist entries
   - 5 notifications
   - Booking invites for session sharing

   See [Database Seeding Guide](../database/seeding.md) for complete details.

---

## Authentication Configuration

### JWT Configuration

1. **Generate Secure JWT Secret:**
   ```bash
   # Generate a secure random string (minimum 32 characters)
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Configure JWT Settings:**
   ```bash
   JWT_SECRET=<generated-secret-from-above>
   JWT_EXPIRATION=7d  # Token expires in 7 days
   BCRYPT_ROUNDS=12   # Password hashing strength
   ```

3. **Token Expiration Options:**
   - Development: `7d` or `30d` (longer for convenience)
   - Production: `1d` or `7d` (shorter for security)

---

## External Services

### Email Service (SendGrid Example)

1. **Create SendGrid Account:**
   - Visit https://sendgrid.com
   - Sign up for free tier (100 emails/day)
   - Create API key with "Mail Send" permissions

2. **Configure Environment:**
   ```bash
   EMAIL_PROVIDER=sendgrid
   EMAIL_API_KEY=SG.your-api-key-here
   EMAIL_FROM=noreply@yourdomain.com
   EMAIL_FROM_NAME=Red Clay Tennis
   ```

3. **Verify Domain (Production):**
   - Add DNS records to verify your sending domain
   - This improves email deliverability

### SMS Service (Twilio - Optional)

1. **Create Twilio Account:**
   - Visit https://twilio.com
   - Sign up for account
   - Get phone number and API credentials

2. **Configure Environment:**
   ```bash
   SMS_PROVIDER=twilio
   SMS_ACCOUNT_SID=your-account-sid
   SMS_AUTH_TOKEN=your-auth-token
   SMS_FROM=+1234567890
   ```

### File Storage (Vercel Blob Storage)

1. **Set Up Blob Storage:**
   - Link your Vercel project
   - Enable Blob storage in project settings
   - Copy the connection tokens

2. **Configure Environment:**
   ```bash
   BLOB_STORAGE_URL=https://your-project.vercel-storage.com
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
   ```

---

## Feature Flags

Control which features are enabled in your environment:

```bash
# Phase 1 Features (Always enabled)
# - User registration
# - Court booking
# - Admin dashboard

# Phase 2 Features (Always enabled)
# - Package system
# - Waitlist
# - Session sharing

# Phase 3 Features (Controlled by flags)
ENABLE_AI_RECOMMENDATIONS=false  # Set to true to enable AI features
ENABLE_TELEGRAM_BOT=false        # Set to true to enable Telegram integration
```

---

## Development Tools

### Database Client

Install PostgreSQL client for direct database access:

```bash
# macOS (via Homebrew)
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows (download from)
# https://www.postgresql.org/download/windows/
```

### Vercel CLI

Install Vercel CLI for deployments and edge testing:

```bash
# Install globally
npm install -g vercel

# Login
vercel login

# Link project (run in project directory)
vercel link
```

### Testing Database Connection

Create test script to verify database connectivity:

```javascript
// scripts/test-db.js
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function testConnection() {
  try {
    // Test basic connectivity
    const result = await pool.query('SELECT NOW()')
    console.log('✅ Database connected successfully')
    console.log(`   Server time: ${result.rows[0].now}`)

    // Check tables
    const tables = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `)
    console.log(`✅ Tables found: ${tables.rows[0].count}`)

    // Check users table
    const users = await pool.query('SELECT COUNT(*) FROM users')
    console.log(`✅ Users in database: ${users.rows[0].count}`)

  } catch (error) {
    console.error('❌ Database test failed:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

testConnection()
```

Run the test:
```bash
node scripts/test-db.js
```

---

## Development Workflow

### Starting the Development Server

```bash
# Start the server
npm run dev

# Or with custom port
PORT=3001 npm run dev

# With debugging enabled
NODE_OPTIONS='--inspect' npm run dev
```

### Watching for Changes

Most modern frameworks (Next.js, etc.) include hot reloading by default. Changes to files should automatically reload the browser.

### Database Migrations During Development

When making schema changes:

```bash
# 1. Create a new migration file
touch docs/database/migrations/002-add-new-feature.sql

# 2. Write your SQL changes
# 3. Run the migration
psql $DATABASE_URL -f docs/database/migrations/002-add-new-feature.sql

# 4. Update docs/reference/database-schema.md
```

---

## Troubleshooting

### Database Connection Issues

**Problem:** Connection timeout or refused

**Solution:**
```bash
# Check connection string format
echo $DATABASE_URL
# Should be: postgresql://user:pass@host:port/db?sslmode=require

# Test with psql directly
psql $DATABASE_URL -c "SELECT 1"

# Check if IP is whitelisted (for cloud databases)
# Neon: Should work from any IP by default
```

### JWT Token Issues

**Problem:** Tokens not working or expiring immediately

**Solution:**
```bash
# Verify JWT_SECRET is set
echo $JWT_SECRET
# Should be at least 32 characters

# Verify expiration format
echo $JWT_EXPIRATION
# Should be like: 7d, 1h, 30m, etc.

# Check server time
date
# Ensure system time is correct
```

### Email Not Sending

**Problem:** Emails not being sent or received

**Solution:**
```bash
# Verify SendGrid API key
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer $EMAIL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [{"to": [{"email": "test@example.com"}]}],
    "from": {"email": "'"$EMAIL_FROM"'"},
    "subject": "Test",
    "content": [{"type": "text/plain", "value": "Test"}]
  }'

# Check spam folder
# Verify sender domain is verified (production)
```

---

## Next Steps

- **Begin Implementation:** [Phase 1 MVP Guide](../implementation/phase-1-mvp.md)
- **Review Testing Strategy:** [Testing Guide](testing-strategy.md)
- **Learn About Deployment:** [Deployment Guide](deployment-guide.md)

---

**Document Version:** 2.0
**Last Updated:** January 14, 2026
**Configuration Time:** 1-2 hours
