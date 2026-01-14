# Red Clay Tennis Booking Platform Documentation

**Platform:** Mobile-first tennis/pickleball court booking system
**Stack:** Neon (PostgreSQL) + Vercel (Serverless)
**Architecture:** Serverless-first, edge-optimized, mobile-first

---

## Documentation Structure

This documentation is organized into focused categories:

### 📚 [Guides](guides/)
Step-by-step implementation and setup guides:
- [Quick Start](guides/quick-start.md) - Get up and running quickly
- [Development Setup](guides/development-setup.md) - Configure dev environment
- [Deployment Guide](guides/deployment-guide.md) - Deploy to production
- [Testing Strategy](guides/testing-strategy.md) - Testing approaches

### 📖 [Reference](reference/)
Technical reference documentation:
- [Database Schema](reference/database-schema.md) - Complete DB structure
- [Automation Rules](reference/automation-rules.md) - Business logic
- [UI Components](reference/ui-components.md) - Component library

### 🏗️ [Architecture](architecture/)
System architecture and design:
- [Platform Overview](architecture/platform-overview.md) - Tech stack & infrastructure
- [Authentication](architecture/authentication.md) - Auth & permissions

### ✨ [Features](features/)
Feature-specific documentation organized by phase:
- [Phase 1 - MVP](features/phase-1-mvp/) - Core booking system (4 features)
- [Phase 2 - Revenue](features/phase-2-revenue/) - Packages & waitlist (4 features)
- [Phase 3 - Advanced](features/phase-3-advanced/) - Notifications & AI (3 features)

### 🚀 [Implementation](implementation/)
Implementation plans and timelines:
- [Phase 1 MVP](implementation/phase-1-mvp.md) - Weeks 1-3
- [Phase 2 Revenue](implementation/phase-2-revenue.md) - Weeks 4-6
- [Phase 3 Advanced](implementation/phase-3-advanced.md) - Weeks 7-9

### 🔌 [API](api/)
API-specific documentation:
- [Examples](api/examples.md) - Request/response examples

### 🗄️ [Database](database/)
Database files and documentation:
- [Migrations](database/migrations.sql) - SQL migration file

---

## Getting Started

### For First-Time Setup:
1. Read [Quick Start Guide](guides/quick-start.md)
2. Follow [Development Setup](guides/development-setup.md)
3. Run [Database Migrations](database/migrations.sql)
4. Start with [Phase 1 Implementation](implementation/phase-1-mvp.md)

### For Backend Developers:
- [Database Schema](reference/database-schema.md)
- [Authentication](architecture/authentication.md)
- [Automation Rules](reference/automation-rules.md)
- [API Examples](api/examples.md)

### For Frontend Developers:
- [UI Components](reference/ui-components.md)
- [API Examples](api/examples.md)
- [Authentication](architecture/authentication.md)
- Feature docs by phase

### For Product/Design:
- [Platform Overview](architecture/platform-overview.md)
- [Feature Documentation](features/)
- [UI Components](reference/ui-components.md)

### For DevOps:
- [Platform Overview](architecture/platform-overview.md)
- [Deployment Guide](guides/deployment-guide.md)
- [Database Migrations](database/migrations.sql)

---

## Quick Reference

### Project Stats:
- **14 database tables** in production (3 future tables planned)
- **25+ API endpoints**
- **11 user-facing features** across 3 phases
- **12 automation rules**
- **3 build phases** (9 weeks estimated)
- **90% mobile users** - mobile-first design mandatory

### Tech Stack:
- **Database:** Neon PostgreSQL (serverless)
- **Backend:** Vercel Serverless Functions
- **Frontend:** React (mobile-first)
- **Authentication:** JWT tokens
- **Real-time:** WebSocket
- **External:** Telegram Bot API, Email/SMS providers

### Key Concepts:
- **NEW users** require admin approval for bookings
- **PREMIUM users** get instant booking confirmation
- **Packages** apply automatically to eligible bookings
- **Waitlists** notify all users when slots become available
- **Multi-channel** notifications (in-app, email, SMS, Telegram)

---

## Implementation Phases

### Phase 1: MVP Core (Weeks 1-3)
**Goal:** Basic booking system with admin approval

**Features:**
1. User Registration & Authentication
2. Court Booking Flow
3. Booking Management
4. Admin Dashboard & Approval

**Documentation:** [Phase 1 Implementation Plan](implementation/phase-1-mvp.md)

---

### Phase 2: Revenue Features (Weeks 4-6)
**Goal:** Package system and revenue-generating features

**Features:**
1. Package System (prepaid sessions)
2. Waitlist & Notifications
3. Session Sharing (invite friends)
4. Trainer Portal

**Documentation:** [Phase 2 Implementation Plan](implementation/phase-2-revenue.md)

---

### Phase 3: Advanced Features (Weeks 7-9)
**Goal:** Advanced automation and AI features

**Features:**
1. Multi-Channel Notifications
2. Telegram Bot Integration
3. AI Recommendations

**Documentation:** [Phase 3 Implementation Plan](implementation/phase-3-advanced.md)

---

## Support & Troubleshooting

### Common Tasks:
- **Add a new feature:** Review feature template in relevant phase directory
- **Modify database:** Update [migrations.sql](database/migrations.sql) and schema docs
- **Add API endpoint:** Document in [api/examples.md](api/examples.md)
- **Update automation:** Modify [automation-rules.md](reference/automation-rules.md)

### Questions?
- Check the [Quick Start Guide](guides/quick-start.md)
- Review relevant feature documentation in [features/](features/)
- Consult [API Examples](api/examples.md) for code samples

---

**Documentation Version:** 2.0 (Refactored)
**Last Updated:** January 14, 2026
**Total Documentation Files:** 30+ files
**Maintainer:** Development Team
