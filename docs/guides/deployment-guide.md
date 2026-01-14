# Deployment Guide
## Red Clay Tennis Booking Platform

**Purpose:** Step-by-step guide for deploying to production
**Target Audience:** DevOps and development team
**Platform:** Vercel + Neon PostgreSQL

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Vercel Deployment](#vercel-deployment)
3. [Database Configuration](#database-configuration)
4. [Environment Variables](#environment-variables)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## Pre-Deployment Checklist

Complete these tasks before deploying to production:

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] E2E tests passing (`npm run test:e2e`)
- [ ] Code coverage meets threshold (80%+)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)

### Database
- [ ] All migrations run successfully
- [ ] Seed data inserted (admin user, courts, packages)
- [ ] Database indexes created for performance
- [ ] Row Level Security (RLS) policies tested
- [ ] Backup strategy configured

### Security
- [ ] Security review completed
- [ ] Environment variables secured (no secrets in code)
- [ ] CORS configuration validated
- [ ] Rate limiting configured
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled

### Performance
- [ ] Performance testing completed
- [ ] Database query optimization done
- [ ] Image optimization configured
- [ ] CDN configured for static assets
- [ ] Bundle size optimized

### Mobile & UI
- [ ] Mobile responsive testing completed on real devices
- [ ] iOS Safari testing completed
- [ ] Android Chrome testing completed
- [ ] Touch interactions tested
- [ ] Lighthouse score > 90 for mobile

### External Services
- [ ] Email service configured and tested
- [ ] SMS service configured (if enabled)
- [ ] Telegram bot configured (if Phase 3)
- [ ] File storage configured
- [ ] Payment gateway tested (if applicable)

---

## Vercel Deployment

### Step 1: Install Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login
```

### Step 2: Link Project

```bash
# Link your local project to Vercel
vercel link

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? Select your team/personal account
# - Link to existing project? N (first time) or Y (subsequent)
# - Project name? red-clay-tennis (or your choice)
```

### Step 3: Configure Environment Variables

```bash
# Add environment variables via CLI
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production
vercel env add EMAIL_API_KEY production
# ... add all required variables

# Or add via Vercel Dashboard:
# 1. Go to project settings
# 2. Navigate to "Environment Variables"
# 3. Add each variable for Production, Preview, and Development
```

### Step 4: Deploy to Preview

```bash
# Deploy to preview environment (not production yet)
vercel

# This creates a preview deployment
# You'll get a URL like: https://red-clay-tennis-abc123.vercel.app

# Test the preview deployment thoroughly
```

### Step 5: Deploy to Production

```bash
# Deploy to production
vercel --prod

# This deploys to your production domain
# URL: https://red-clay-tennis.vercel.app
# Or your custom domain if configured
```

### Step 6: Configure Custom Domain (Optional)

```bash
# Add custom domain via CLI
vercel domains add yourdomain.com

# Or via Vercel Dashboard:
# 1. Go to project settings
# 2. Navigate to "Domains"
# 3. Add your domain
# 4. Follow DNS configuration instructions
```

---

## Database Configuration

### Production Database Setup

1. **Create Production Database:**
   ```bash
   # In Neon Console:
   # - Create production branch from main
   # - Note the production connection string
   # - This is separate from your development branch
   ```

2. **Run Migrations:**
   ```bash
   # Set production DATABASE_URL
   export DATABASE_URL="your-production-connection-string"

   # Run migrations
   psql $DATABASE_URL -f docs/database/migrations.sql

   # Verify
   psql $DATABASE_URL -c "\dt"
   ```

3. **Insert Seed Data:**
   ```sql
   -- Create admin user
   INSERT INTO users (email, full_name, user_type, app_role)
   VALUES ('admin@redclay.com', 'Admin User', 'premium', 'admin');

   -- Create courts
   INSERT INTO courts (name, sport_type, surface_type, hourly_rate, peak_hour_rate)
   VALUES
     ('Court 1', 'tennis', 'clay', 50, 75),
     ('Court 2', 'tennis', 'clay', 50, 75),
     ('Court 3', 'pickleball', 'hard', 30, 45);

   -- Create package classes (example)
   INSERT INTO package_classes (
     name, sport_type, total_court_sessions,
     total_trainer_sessions, price, peak_off_peak, validity_days
   )
   VALUES
     ('Tennis 8-Pack', 'tennis', 8, 0, 350, 'off-peak', 30),
     ('Tennis 8-Pack Premium', 'tennis', 8, 8, 650, 'anytime', 60);
   ```

4. **Configure Backups:**
   ```bash
   # Neon automatically backs up your database
   # Configure point-in-time recovery window in Neon console
   # Recommend: 7-day retention minimum
   ```

---

## Environment Variables

### Required Production Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@production-host/db?sslmode=require
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# Authentication
JWT_SECRET=<64-character-random-string>  # Use strong secret!
JWT_EXPIRATION=7d
BCRYPT_ROUNDS=12

# API
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# Email (Production)
EMAIL_PROVIDER=sendgrid
EMAIL_API_KEY=SG.production-key-here
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Red Clay Tennis

# SMS (Optional)
SMS_PROVIDER=twilio
SMS_API_KEY=production-key
SMS_FROM=+1234567890

# Telegram (Phase 3)
TELEGRAM_BOT_TOKEN=production-bot-token

# File Storage
BLOB_STORAGE_URL=https://your-storage.vercel-storage.com
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_production

# Feature Flags
ENABLE_AI_RECOMMENDATIONS=false
ENABLE_TELEGRAM_BOT=false

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

### Security Best Practices

- ✅ Never commit secrets to Git
- ✅ Use different secrets for production vs development
- ✅ Rotate JWT_SECRET periodically (every 90 days)
- ✅ Use minimum 64-character random strings for secrets
- ✅ Enable HTTPS only (Vercel does this by default)
- ✅ Set secure cookies in production

---

## Post-Deployment Verification

### Immediate Checks (Within 5 minutes)

```bash
# 1. Verify deployment is live
curl https://yourdomain.com/api/health
# Should return: {"status": "ok"}

# 2. Test database connection
curl https://yourdomain.com/api/health/db
# Should return: {"database": "connected"}

# 3. Check error logs
vercel logs
# Should show no critical errors
```

### Application Testing (Within 30 minutes)

- [ ] **Test Authentication:**
  - [ ] Sign up new user
  - [ ] Login with credentials
  - [ ] Verify JWT token issued
  - [ ] Test protected routes

- [ ] **Test Core Booking Flow:**
  - [ ] Create a test booking as premium user
  - [ ] Verify instant confirmation
  - [ ] Create booking as new user
  - [ ] Verify pending status
  - [ ] Admin approve booking
  - [ ] Verify approval notification sent

- [ ] **Test Email Notifications:**
  - [ ] Trigger welcome email (sign up)
  - [ ] Trigger booking confirmation email
  - [ ] Verify emails received
  - [ ] Check spam folder if not received

- [ ] **Test Error Handling:**
  - [ ] Try invalid login
  - [ ] Try booking unavailable slot
  - [ ] Verify user-friendly error messages

- [ ] **Test Mobile Experience:**
  - [ ] Load site on mobile device
  - [ ] Test touch interactions
  - [ ] Verify responsive layout
  - [ ] Test booking flow end-to-end

### Performance Verification (Within 1 hour)

```bash
# Run Lighthouse audit
npm install -g lighthouse

lighthouse https://yourdomain.com --view
# Target scores:
# - Performance: > 90
# - Accessibility: > 90
# - Best Practices: > 90
# - SEO: > 90
```

---

## Monitoring and Maintenance

### Set Up Error Monitoring

**Sentry Integration:**
```bash
# Install Sentry
npm install @sentry/nextjs

# Configure Sentry
npx @sentry/wizard -i nextjs

# Add to vercel env
vercel env add SENTRY_DSN production
```

### Set Up Analytics

**Vercel Analytics:**
```bash
# Enable in Vercel Dashboard:
# 1. Go to project
# 2. Navigate to Analytics tab
# 3. Enable Vercel Analytics
# 4. Vercel Speed Insights auto-enabled
```

### Configure Uptime Monitoring

Use a service like:
- UptimeRobot (free tier available)
- Pingdom
- Better Uptime

Monitor these endpoints:
- `https://yourdomain.com` (main site)
- `https://yourdomain.com/api/health` (API health)

### Database Monitoring

**Neon Dashboard:**
- Monitor connection pool usage
- Track query performance
- Review slow queries
- Check storage usage

**Set Up Alerts:**
- CPU usage > 80%
- Connection pool exhausted
- Slow query threshold exceeded
- Storage > 80% capacity

### Backup Strategy

**Automated Backups (Neon):**
- Point-in-time recovery enabled
- 7-day retention configured
- Test restore process monthly

**Manual Backups:**
```bash
# Weekly manual backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Store backups in secure location
# AWS S3, Google Cloud Storage, etc.
```

### Log Management

```bash
# View real-time logs
vercel logs --follow

# View logs for specific deployment
vercel logs <deployment-url>

# Export logs for analysis
vercel logs > logs.txt
```

---

## Rollback Procedure

If issues arise after deployment:

### Quick Rollback (Vercel)

```bash
# List recent deployments
vercel list

# Promote a previous deployment to production
vercel promote <deployment-url>
```

### Database Rollback

```bash
# If migrations caused issues:
# 1. Identify problematic migration
# 2. Create rollback migration
psql $DATABASE_URL -f rollback-migration.sql

# Or use Neon point-in-time recovery:
# 1. Go to Neon Console
# 2. Select database branch
# 3. Use "Restore" feature to specific timestamp
```

---

## Ongoing Maintenance

### Weekly Tasks
- [ ] Review error logs in Sentry
- [ ] Check uptime monitoring status
- [ ] Review slow query reports
- [ ] Monitor user feedback/support tickets

### Monthly Tasks
- [ ] Review and optimize slow queries
- [ ] Update dependencies (`npm audit` and `npm update`)
- [ ] Test backup restore process
- [ ] Review and rotate API keys if needed
- [ ] Performance audit with Lighthouse

### Quarterly Tasks
- [ ] Security audit
- [ ] Load testing
- [ ] Rotate JWT_SECRET (invalidates all tokens)
- [ ] Review and optimize database indexes
- [ ] Review infrastructure costs
- [ ] Capacity planning review

---

## Support Resources

- **Vercel Documentation:** https://vercel.com/docs
- **Neon Documentation:** https://neon.tech/docs
- **Platform Overview:** [Platform Architecture](../architecture/platform-overview.md)
- **Database Schema:** [Database Schema](../reference/database-schema.md)

---

## Emergency Contacts

Document your emergency contact plan:
- **Primary DevOps:** [Name, Phone, Email]
- **Backup DevOps:** [Name, Phone, Email]
- **Database Admin:** [Name, Phone, Email]
- **Vercel Support:** support@vercel.com
- **Neon Support:** support@neon.tech

---

**Document Version:** 2.0
**Last Updated:** January 14, 2026
**Deployment Platform:** Vercel + Neon PostgreSQL
