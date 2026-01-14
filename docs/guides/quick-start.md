# Quick Start Guide
## Red Clay Tennis Booking Platform

**Purpose:** Get up and running quickly with the tennis booking platform
**Target Audience:** Developers setting up the project for the first time
**Estimated Time:** 30-60 minutes

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Environment Setup](#development-environment-setup)
3. [Verify Setup](#verify-setup)
4. [Next Steps](#next-steps)

---

## Prerequisites

### Required Knowledge
- ✅ PostgreSQL and SQL
- ✅ RESTful API design
- ✅ React (or similar frontend framework)
- ✅ TypeScript/JavaScript
- ✅ Authentication & JWT
- ✅ Mobile-first CSS/responsive design

### Required Accounts
- ✅ Neon PostgreSQL account (free tier works for development)
- ✅ Vercel account (free tier works for development)
- ✅ Email service provider (SendGrid, Resend, etc.)
- ✅ Telegram Bot API (for Telegram integration)
- ✅ Git repository (GitHub, GitLab, etc.)

### Tools to Install
```bash
# Node.js and npm
node --version  # v18+ recommended
npm --version   # v9+ recommended

# Vercel CLI
npm install -g vercel

# PostgreSQL client (for local testing)
psql --version

# Git
git --version
```

---

## Development Environment Setup

### Step 1: Clone Repository & Install Dependencies

```bash
# Clone repository
git clone <your-repo-url>
cd Tennis-booking-system

# Install dependencies
npm install

# Or with yarn
yarn install
```

### Step 2: Set Up Neon Database

1. **Create Neon Project:**
   - Go to https://neon.tech
   - Create new project: "red-clay-tennis"
   - Note your connection string

2. **Run Migrations:**
   ```bash
   # Set DATABASE_URL environment variable
   export DATABASE_URL="postgresql://user:pass@host/db"

   # Run migrations (using your preferred migration tool)
   psql $DATABASE_URL -f docs/database/migrations.sql

   # Verify installation
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
   # Should return: 14 tables
   ```

3. **Create Development Branch:**
   ```bash
   # Neon allows database branching
   # Create a branch for local development
   # This keeps production data safe
   ```

### Step 3: Configure Environment Variables

Create `.env.local` file:

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

### Step 4: Start Development Server

```bash
# Start Next.js dev server (or your framework)
npm run dev

# Server should start at http://localhost:3000
```

---

## Verify Setup

Test database connection:
```bash
# Create test script: scripts/test-db.js
const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function testConnection() {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM users')
    console.log('✅ Database connected successfully')
    console.log(`   Users in database: ${result.rows[0].count}`)
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
  } finally {
    await pool.end()
  }
}

testConnection()
```

Run test:
```bash
node scripts/test-db.js
```

---

## Next Steps

Now that your environment is set up:

1. **Start with Phase 1 Implementation:** See [Phase 1 MVP](../implementation/phase-1-mvp.md)
2. **Review the Architecture:** See [Platform Overview](../architecture/platform-overview.md)
3. **Understand the Database:** See [Database Schema](../reference/database-schema.md)
4. **Explore Feature Documentation:** See [Features by Phase](../features/)

---

## Support Resources

- **Development Setup Details:** [Development Setup Guide](development-setup.md)
- **Deployment Guide:** [Deployment Guide](deployment-guide.md)
- **API Examples:** [API Examples](../api/examples.md)
- **Database Migrations:** [Database Migrations](../database/migrations.sql)

---

## Troubleshooting

### Common Issues

**Issue: Database Connection Failed**
```
Solution: Check DATABASE_URL format
postgresql://user:password@host:port/database?sslmode=require
```

**Issue: JWT Token Invalid**
```
Solution: Verify JWT_SECRET is set and consistent across environments
```

**Issue: RLS Policies Blocking Queries**
```
Solution: Ensure auth.uid() is properly set
Check if user context is passed to database queries
```

---

**Document Version:** 2.0
**Last Updated:** January 14, 2026
**Estimated Setup Time:** 30-60 minutes
