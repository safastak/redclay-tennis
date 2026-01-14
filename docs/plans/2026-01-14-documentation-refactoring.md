# Documentation Refactoring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: 
Use superpowers:executing-plans to implement this plan task-by-task.
Use ralph-wiggum:ralph-loop to validate plan task-by-task. 

**Goal:** Refactor the /docs directory into a clear, well-organized structure with consistent naming, logical grouping, and proper implementation phases.

**Architecture:** Reorganize existing documentation files into a hierarchical structure with clear categories (guides, references, api, architecture, features) and consistent file naming (kebab-case with prefixes).

**Tech Stack:** Markdown files, directory structure reorganization, file renaming, content preservation.

**ralph-wiggum:ralph-loop** documented in [docs](../Plugin_Ralph-Wiggum-Technique.md)

---

## Current State Analysis

### Existing Files:
- `API_EXAMPLES.md` - API request/response examples
- `COMPREHENSIVE_SCHEMA_DOCUMENTATION.md` - Complete technical reference
- `DATABASE_MIGRATIONS.sql` - Database schema SQL
- `DOCUMENTATION_STRUCTURE_OVERVIEW.md` - Overview of documentation
- `Plugin_Ralph-Wiggum-Technique.md` - Plugin documentation (non-project)
- `QUICK_IMPLEMENTATION_GUIDE.md` - Step-by-step implementation guide
- `user-journeys/` - Empty directory
- `user-journey_refactored/` - Main source documentation (16 files)

### Issues to Address:
1. Inconsistent naming conventions (UPPERCASE, kebab-case, mixed)
2. Flat structure at root level with nested structure in subdirectories
3. No clear separation between guides, references, and architecture docs
4. Implementation phases not clearly organized
5. Plugin documentation mixed with project docs
6. Empty `user-journeys/` directory serves no purpose

---

## Proposed New Structure

```
docs/
├── README.md                           # Entry point - navigation guide
│
├── guides/                             # Step-by-step implementation guides
│   ├── quick-start.md                  # Quick implementation guide
│   ├── development-setup.md            # Dev environment setup
│   ├── deployment-guide.md             # Deployment instructions
│   └── testing-strategy.md             # Testing approaches
│
├── reference/                          # Technical reference documentation
│   ├── api-reference.md                # Complete API documentation
│   ├── database-schema.md              # Database structure reference
│   ├── automation-rules.md             # Business logic automation
│   └── ui-components.md                # UI component library
│
├── architecture/                       # System architecture documents
│   ├── platform-overview.md            # Tech stack & infrastructure
│   ├── data-model.md                   # Entity relationships
│   ├── authentication.md               # Auth & permissions model
│   └── notification-system.md          # Multi-channel notifications
│
├── features/                           # Feature-specific documentation
│   ├── phase-1-mvp/                    # Phase 1 features
│   │   ├── 01-user-registration.md
│   │   ├── 02-court-booking.md
│   │   ├── 03-booking-management.md
│   │   └── 08-admin-dashboard.md
│   │
│   ├── phase-2-revenue/                # Phase 2 features
│   │   ├── 04-package-system.md
│   │   ├── 05-waitlist.md
│   │   ├── 06-session-sharing.md
│   │   └── 07-trainer-portal.md
│   │
│   └── phase-3-advanced/               # Phase 3 features
│       ├── 09-notifications.md
│       ├── 10-telegram-integration.md
│       └── 11-ai-recommendations.md
│
├── implementation/                     # Implementation plans & phases
│   ├── phase-1-mvp.md                  # MVP implementation plan
│   ├── phase-2-revenue.md              # Revenue features plan
│   ├── phase-3-advanced.md             # Advanced features plan
│   └── timeline.md                     # Overall project timeline
│
├── api/                                # API-specific documentation
│   ├── endpoints.md                    # All API endpoints
│   ├── examples.md                     # Request/response examples
│   ├── authentication.md               # API auth patterns
│   └── error-handling.md               # Error response formats
│
├── database/                           # Database-specific files
│   ├── migrations.sql                  # Complete migration SQL
│   ├── schema-diagram.md               # Visual schema representation
│   ├── rls-policies.md                 # Row Level Security policies
│   └── helper-functions.sql            # DB helper functions
│
├── assets/                             # Supporting files
│   ├── diagrams/                       # Architecture diagrams
│   └── images/                         # Screenshots, mockups
│
└── plans/                              # Implementation plans
    └── 2026-01-14-documentation-refactoring.md
```

---

## File Mapping (Old → New)

| Current Location | New Location | Notes |
|-----------------|--------------|-------|
| `API_EXAMPLES.md` | `api/examples.md` | Move to api/ directory |
| `COMPREHENSIVE_SCHEMA_DOCUMENTATION.md` | Split into multiple files | See breakdown below |
| `DATABASE_MIGRATIONS.sql` | `database/migrations.sql` | Move to database/ |
| `DOCUMENTATION_STRUCTURE_OVERVIEW.md` | `README.md` (root) | Becomes main entry |
| `QUICK_IMPLEMENTATION_GUIDE.md` | Split into guides/ | See breakdown below |
| `user-journey_refactored/README.md` | Merge into root `README.md` | Consolidate |
| `user-journey_refactored/PLATFORM.md` | `architecture/platform-overview.md` | Move |
| `user-journey_refactored/foundations/*` | `reference/` and `architecture/` | Move & rename |
| `user-journey_refactored/features/*` | `features/phase-X/` | Organize by phase |
| `Plugin_Ralph-Wiggum-Technique.md` | DELETE or move to `.claude/` | Not project doc |
| `user-journeys/` (empty) | DELETE | No longer needed |

---

## Content Breakdown

### Split `COMPREHENSIVE_SCHEMA_DOCUMENTATION.md` Into:
1. `reference/database-schema.md` - Tables, columns, constraints
2. `reference/api-reference.md` - API endpoints, patterns
3. `reference/ui-components.md` - UI component schemas
4. `architecture/data-model.md` - ER diagrams, relationships
5. `architecture/authentication.md` - Auth patterns, RLS policies

### Split `QUICK_IMPLEMENTATION_GUIDE.md` Into:
1. `guides/quick-start.md` - Getting started (prerequisites, setup)
2. `guides/development-setup.md` - Dev environment details
3. `guides/deployment-guide.md` - Deployment checklist
4. `guides/testing-strategy.md` - Testing approaches
5. `implementation/phase-1-mvp.md` - Phase 1 tasks
6. `implementation/phase-2-revenue.md` - Phase 2 tasks
7. `implementation/phase-3-advanced.md` - Phase 3 tasks

### Organize Features by Phase:
- **Phase 1 (MVP):** 01, 02, 03, 08
- **Phase 2 (Revenue):** 04, 05, 06, 07
- **Phase 3 (Advanced):** 09, 10, 11

---

## Task Breakdown

### Task 1: Create New Directory Structure

**Files:**
- Create: `docs/guides/`
- Create: `docs/reference/`
- Create: `docs/architecture/`
- Create: `docs/features/phase-1-mvp/`
- Create: `docs/features/phase-2-revenue/`
- Create: `docs/features/phase-3-advanced/`
- Create: `docs/implementation/`
- Create: `docs/api/`
- Create: `docs/database/`
- Create: `docs/assets/diagrams/`
- Create: `docs/assets/images/`

**Step 1: Create directories**

```bash
mkdir -p "docs/guides"
mkdir -p "docs/reference"
mkdir -p "docs/architecture"
mkdir -p "docs/features/phase-1-mvp"
mkdir -p "docs/features/phase-2-revenue"
mkdir -p "docs/features/phase-3-advanced"
mkdir -p "docs/implementation"
mkdir -p "docs/api"
mkdir -p "docs/database"
mkdir -p "docs/assets/diagrams"
mkdir -p "docs/assets/images"
```

**Step 2: Verify directory creation**

Run: `ls -la docs/`
Expected: All new directories exist

**Step 3: Commit**

```bash
git add docs/
git commit -m "feat: create new documentation directory structure

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Move and Rename Simple Files

**Files:**
- Move: `docs/API_EXAMPLES.md` → `docs/api/examples.md`
- Move: `docs/DATABASE_MIGRATIONS.sql` → `docs/database/migrations.sql`
- Move: `docs/user-journey_refactored/PLATFORM.md` → `docs/architecture/platform-overview.md`

**Step 1: Move API_EXAMPLES.md**

```bash
mv "docs/API_EXAMPLES.md" "docs/api/examples.md"
```

**Step 2: Move DATABASE_MIGRATIONS.sql**

```bash
mv "docs/DATABASE_MIGRATIONS.sql" "docs/database/migrations.sql"
```

**Step 3: Move PLATFORM.md**

```bash
mv "docs/user-journey_refactored/PLATFORM.md" "docs/architecture/platform-overview.md"
```

**Step 4: Verify moves**

Run: `ls docs/api/ docs/database/ docs/architecture/`
Expected: Files in correct locations

**Step 5: Commit**

```bash
git add docs/
git commit -m "refactor: move API, database, and platform docs to new locations

- Move API examples to api/ directory
- Move database migrations to database/ directory
- Move platform overview to architecture/ directory

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Move Foundation Files to Reference/Architecture

**Files:**
- Move: `docs/user-journey_refactored/foundations/database-schema.md` → `docs/reference/database-schema.md`
- Move: `docs/user-journey_refactored/foundations/automation-rules.md` → `docs/reference/automation-rules.md`
- Move: `docs/user-journey_refactored/foundations/mobile-first-ui.md` → `docs/reference/ui-components.md`
- Move: `docs/user-journey_refactored/foundations/authentication.md` → `docs/architecture/authentication.md`

**Step 1: Move database-schema.md**

```bash
mv "docs/user-journey_refactored/foundations/database-schema.md" "docs/reference/database-schema.md"
```

**Step 2: Move automation-rules.md**

```bash
mv "docs/user-journey_refactored/foundations/automation-rules.md" "docs/reference/automation-rules.md"
```

**Step 3: Move and rename mobile-first-ui.md**

```bash
mv "docs/user-journey_refactored/foundations/mobile-first-ui.md" "docs/reference/ui-components.md"
```

**Step 4: Move authentication.md**

```bash
mv "docs/user-journey_refactored/foundations/authentication.md" "docs/architecture/authentication.md"
```

**Step 5: Verify moves**

Run: `ls docs/reference/ docs/architecture/`
Expected: All foundation files in correct locations

**Step 6: Commit**

```bash
git add docs/
git commit -m "refactor: reorganize foundation docs into reference and architecture

- Move database schema to reference/
- Move automation rules to reference/
- Rename mobile-first-ui to ui-components in reference/
- Move authentication to architecture/

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: Organize Feature Files by Implementation Phase

**Files:**
- Move Phase 1 features (01, 02, 03, 08) to `features/phase-1-mvp/`
- Move Phase 2 features (04, 05, 06, 07) to `features/phase-2-revenue/`
- Move Phase 3 features (09, 10, 11) to `features/phase-3-advanced/`

**Step 1: Move Phase 1 features**

```bash
mv "docs/user-journey_refactored/features/01-user-registration.md" "docs/features/phase-1-mvp/"
mv "docs/user-journey_refactored/features/02-court-booking.md" "docs/features/phase-1-mvp/"
mv "docs/user-journey_refactored/features/03-booking-management.md" "docs/features/phase-1-mvp/"
mv "docs/user-journey_refactored/features/08-admin-dashboard.md" "docs/features/phase-1-mvp/"
```

**Step 2: Move Phase 2 features**

```bash
mv "docs/user-journey_refactored/features/04-package-system.md" "docs/features/phase-2-revenue/"
mv "docs/user-journey_refactored/features/05-waitlist.md" "docs/features/phase-2-revenue/"
mv "docs/user-journey_refactored/features/06-session-sharing.md" "docs/features/phase-2-revenue/"
mv "docs/user-journey_refactored/features/07-trainer-portal.md" "docs/features/phase-2-revenue/"
```

**Step 3: Move Phase 3 features**

```bash
mv "docs/user-journey_refactored/features/09-notifications.md" "docs/features/phase-3-advanced/"
mv "docs/user-journey_refactored/features/10-telegram-integration.md" "docs/features/phase-3-advanced/"
mv "docs/user-journey_refactored/features/11-ai-recommendations.md" "docs/features/phase-3-advanced/"
```

**Step 4: Verify organization**

Run: `ls docs/features/phase-1-mvp/ docs/features/phase-2-revenue/ docs/features/phase-3-advanced/`
Expected: Each phase directory contains correct feature files

**Step 5: Commit**

```bash
git add docs/
git commit -m "refactor: organize feature documentation by implementation phase

- Group Phase 1 MVP features (user registration, booking, admin)
- Group Phase 2 revenue features (packages, waitlist, sharing)
- Group Phase 3 advanced features (notifications, telegram, AI)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Split QUICK_IMPLEMENTATION_GUIDE.md

**Files:**
- Create: `docs/guides/quick-start.md` (Prerequisites + Setup)
- Create: `docs/guides/development-setup.md` (Dev environment)
- Create: `docs/guides/deployment-guide.md` (Deployment)
- Create: `docs/guides/testing-strategy.md` (Testing)
- Create: `docs/implementation/phase-1-mvp.md` (Phase 1 tasks)
- Create: `docs/implementation/phase-2-revenue.md` (Phase 2 tasks)
- Create: `docs/implementation/phase-3-advanced.md` (Phase 3 tasks)

**Step 1: Read QUICK_IMPLEMENTATION_GUIDE.md**

Use Read tool to load content.

**Step 2: Extract and write quick-start.md**

Content: Lines 1-180 (Prerequisites + Development Environment Setup)

```markdown
# Quick Start Guide
## Red Clay Tennis Booking Platform

[Content from lines 1-180 of QUICK_IMPLEMENTATION_GUIDE.md]
```

**Step 3: Extract and write development-setup.md**

Content: Detailed dev environment configuration from lines 60-180

**Step 4: Extract and write deployment-guide.md**

Content: Lines 849-888 (Deployment Checklist section)

**Step 5: Extract and write testing-strategy.md**

Content: Lines 757-845 (Testing Strategy section)

**Step 6: Extract and write phase-1-mvp.md**

Content: Lines 182-568 (Phase 1: MVP Core)

**Step 7: Extract and write phase-2-revenue.md**

Content: Lines 570-711 (Phase 2: Revenue Features)

**Step 8: Extract and write phase-3-advanced.md**

Content: Lines 714-755 (Phase 3: Advanced Features)

**Step 9: Verify all files created**

Run: `ls docs/guides/ docs/implementation/`
Expected: All 7 new files exist

**Step 10: Commit**

```bash
git add docs/guides/ docs/implementation/
git commit -m "refactor: split quick implementation guide into focused documents

- Create quick-start guide with prerequisites and setup
- Create development-setup guide with detailed configuration
- Create deployment guide with checklist
- Create testing strategy guide
- Split phase implementations into separate documents

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: Split COMPREHENSIVE_SCHEMA_DOCUMENTATION.md

**Files:**
- Enhance: `docs/reference/database-schema.md` (add details)
- Create: `docs/reference/api-reference.md` (API patterns)
- Enhance: `docs/reference/ui-components.md` (add component schemas)
- Create: `docs/architecture/data-model.md` (ER diagrams)
- Enhance: `docs/architecture/authentication.md` (add RLS policies)

**Step 1: Read COMPREHENSIVE_SCHEMA_DOCUMENTATION.md**

Use Read tool to load content (first 100 lines already loaded).

**Step 2: Read remaining content**

Use Read tool with offset to get complete file.

**Step 3: Extract API patterns and create api-reference.md**

Content: API endpoints, patterns, authorization middleware sections

**Step 4: Extract ER diagrams and create data-model.md**

Content: Entity relationship diagrams, data flow state machines

**Step 5: Extract and enhance database-schema.md**

Append: Additional details from comprehensive doc

**Step 6: Extract and enhance ui-components.md**

Append: UI component schemas from comprehensive doc

**Step 7: Extract and enhance authentication.md**

Append: RLS policies and authorization patterns

**Step 8: Verify files updated/created**

Run: `cat docs/reference/api-reference.md | head -20`
Expected: File contains API documentation

**Step 9: Commit**

```bash
git add docs/reference/ docs/architecture/
git commit -m "refactor: split comprehensive schema into focused references

- Create API reference with endpoints and patterns
- Create data model document with ER diagrams
- Enhance database schema with additional details
- Enhance UI components with component schemas
- Enhance authentication with RLS policies

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: Create New Root README.md

**Files:**
- Create: `docs/README.md` (main entry point)
- Source: Merge content from `DOCUMENTATION_STRUCTURE_OVERVIEW.md` and `user-journey_refactored/README.md`

**Step 1: Read source README files**

Read both source files.

**Step 2: Write new consolidated README.md**

Content structure:
```markdown
# Red Clay Tennis Booking Platform Documentation

## Overview
[Platform description]

## Documentation Structure
[Directory tree with descriptions]

## Getting Started
[Quick links to guides]

## For Different Roles
[Links by role: developers, product, design, devops]

## Quick Reference
[Key stats and numbers]

## Implementation Phases
[Phase overview with links]
```

**Step 3: Write the file**

```markdown
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
- [API Reference](reference/api-reference.md) - All API endpoints
- [Automation Rules](reference/automation-rules.md) - Business logic
- [UI Components](reference/ui-components.md) - Component library

### 🏗️ [Architecture](architecture/)
System architecture and design:
- [Platform Overview](architecture/platform-overview.md) - Tech stack & infrastructure
- [Data Model](architecture/data-model.md) - Entity relationships
- [Authentication](architecture/authentication.md) - Auth & permissions
- [Notification System](architecture/notification-system.md) - Multi-channel alerts

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
- [Timeline](implementation/timeline.md) - Overall project schedule

### 🔌 [API](api/)
API-specific documentation:
- [Endpoints](api/endpoints.md) - Complete endpoint reference
- [Examples](api/examples.md) - Request/response examples
- [Authentication](api/authentication.md) - API auth patterns
- [Error Handling](api/error-handling.md) - Error responses

### 🗄️ [Database](database/)
Database files and documentation:
- [Migrations](database/migrations.sql) - SQL migration file
- [Schema Diagram](database/schema-diagram.md) - Visual representation
- [RLS Policies](database/rls-policies.md) - Row Level Security

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
- [API Reference](reference/api-reference.md)

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
4. Package System (prepaid sessions)
5. Waitlist & Notifications
6. Session Sharing (invite friends)
7. Trainer Portal

**Documentation:** [Phase 2 Implementation Plan](implementation/phase-2-revenue.md)

---

### Phase 3: Advanced Features (Weeks 7-9)
**Goal:** Advanced automation and AI features

**Features:**
9. Multi-Channel Notifications
10. Telegram Bot Integration
11. AI Recommendations

**Documentation:** [Phase 3 Implementation Plan](implementation/phase-3-advanced.md)

---

## Support & Troubleshooting

### Common Tasks:
- **Add a new feature:** Review feature template in relevant phase directory
- **Modify database:** Update [migrations.sql](database/migrations.sql) and [schema docs](reference/database-schema.md)
- **Add API endpoint:** Document in [api/endpoints.md](api/endpoints.md) and [api/examples.md](api/examples.md)
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
```

**Step 4: Write the file using Write tool**

**Step 5: Verify README created**

Run: `cat docs/README.md | head -50`
Expected: New README with navigation structure

**Step 6: Commit**

```bash
git add docs/README.md
git commit -m "docs: create comprehensive root README with navigation

- Consolidate documentation entry points
- Add clear navigation by role
- Include quick reference and phase overviews
- Provide getting started guide

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: Create API Documentation Files

**Files:**
- Create: `docs/api/endpoints.md` (complete endpoint reference)
- Move: `docs/api/examples.md` (already moved in Task 2)
- Create: `docs/api/authentication.md` (API auth patterns)
- Create: `docs/api/error-handling.md` (error response formats)

**Step 1: Extract endpoints from api/examples.md**

Read examples.md and extract endpoint list.

**Step 2: Write endpoints.md**

Content: Organized list of all API endpoints with brief descriptions

**Step 3: Extract and write authentication.md**

Content: API authentication patterns (JWT, headers, token refresh)

**Step 4: Extract and write error-handling.md**

Content: Error response formats from examples.md lines 1022-1196

**Step 5: Verify API docs**

Run: `ls docs/api/`
Expected: 4 files (endpoints.md, examples.md, authentication.md, error-handling.md)

**Step 6: Commit**

```bash
git add docs/api/
git commit -m "docs: create comprehensive API documentation

- Add endpoints reference with all API routes
- Add authentication patterns document
- Add error handling reference
- Examples already in place from earlier move

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 9: Create Database Documentation Files

**Files:**
- Already moved: `docs/database/migrations.sql`
- Create: `docs/database/schema-diagram.md` (visual representation)
- Create: `docs/database/rls-policies.md` (Row Level Security)
- Create: `docs/database/helper-functions.sql` (DB functions)

**Step 1: Extract schema diagram from reference docs**

Content: ER diagram and visual representations

**Step 2: Write schema-diagram.md**

**Step 3: Extract RLS policies from architecture/authentication.md**

**Step 4: Write rls-policies.md**

**Step 5: Extract helper functions from database schema**

Functions: `is_peak_time()`, `is_trainer_available()`, etc.

**Step 6: Write helper-functions.sql**

**Step 7: Verify database docs**

Run: `ls docs/database/`
Expected: 4 files

**Step 8: Commit**

```bash
git add docs/database/
git commit -m "docs: create complete database documentation

- Add visual schema diagram with ER relationships
- Document all RLS policies for data access
- Extract helper functions to separate SQL file
- Migrations already in place

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 10: Create Implementation Timeline Document

**Files:**
- Create: `docs/implementation/timeline.md` (overall project timeline)

**Step 1: Extract timeline content from various sources**

Sources: QUICK_IMPLEMENTATION_GUIDE.md, phase docs, README

**Step 2: Write timeline.md**

Content:
- Overall 9-week timeline
- Phase breakdown with dependencies
- Gantt-style representation
- Milestone tracking
- Resource requirements

**Step 3: Verify timeline created**

Run: `cat docs/implementation/timeline.md | head -30`
Expected: Timeline document with phase breakdown

**Step 4: Commit**

```bash
git add docs/implementation/timeline.md
git commit -m "docs: add comprehensive project timeline

- Break down 9-week implementation schedule
- Show phase dependencies and milestones
- Include resource requirements
- Add Gantt-style visualization

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 11: Create Architecture Notification System Doc

**Files:**
- Create: `docs/architecture/notification-system.md`

**Step 1: Extract notification system details**

Source: `features/phase-3-advanced/09-notifications.md` and automation rules

**Step 2: Write notification-system.md**

Content:
- Multi-channel architecture
- Notification types and triggers
- Delivery mechanisms
- User preferences
- Real-time WebSocket integration

**Step 3: Verify document created**

Run: `cat docs/architecture/notification-system.md | head -20`
Expected: Notification architecture document

**Step 4: Commit**

```bash
git add docs/architecture/notification-system.md
git commit -m "docs: document multi-channel notification architecture

- Detail notification system architecture
- Document all notification types
- Explain channel delivery mechanisms
- Include user preference system

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 12: Clean Up Old Files and Directories

**Files:**
- Delete: `docs/user-journey_refactored/` (now empty)
- Delete: `docs/user-journeys/` (empty directory)
- Delete: `docs/QUICK_IMPLEMENTATION_GUIDE.md` (split into multiple files)
- Delete: `docs/COMPREHENSIVE_SCHEMA_DOCUMENTATION.md` (split into multiple files)
- Delete: `docs/DOCUMENTATION_STRUCTURE_OVERVIEW.md` (replaced by README.md)
- Move: `docs/Plugin_Ralph-Wiggum-Technique.md` → `.claude/` or DELETE

**Step 1: Verify old directories are empty**

```bash
ls -la "docs/user-journey_refactored/features/"
ls -la "docs/user-journey_refactored/foundations/"
```

Expected: Directories are empty

**Step 2: Remove empty directories**

```bash
rm -rf "docs/user-journey_refactored"
rm -rf "docs/user-journeys"
```

**Step 3: Remove old files that have been split**

```bash
rm "docs/QUICK_IMPLEMENTATION_GUIDE.md"
rm "docs/COMPREHENSIVE_SCHEMA_DOCUMENTATION.md"
rm "docs/DOCUMENTATION_STRUCTURE_OVERVIEW.md"
```

**Step 4: Handle plugin documentation**

```bash
# Option 1: Move to .claude if it's a Claude Code plugin doc
mkdir -p ".claude/docs"
mv "docs/Plugin_Ralph-Wiggum-Technique.md" ".claude/docs/"

# Option 2: Delete if not relevant
# rm "docs/Plugin_Ralph-Wiggum-Technique.md"
```

**Step 5: Verify cleanup**

Run: `ls docs/`
Expected: Only new directory structure remains

**Step 6: Commit**

```bash
git add docs/ .claude/
git commit -m "refactor: clean up old documentation structure

- Remove empty user-journey directories
- Delete split documentation files
- Move plugin documentation to .claude/
- Complete migration to new structure

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 13: Update Internal Cross-References

**Files:**
- Update all Markdown files with old file path references
- Pattern: Search for old paths and replace with new paths

**Step 1: Find all cross-references to old paths**

```bash
grep -r "user-journey_refactored" docs/ --include="*.md"
grep -r "QUICK_IMPLEMENTATION_GUIDE.md" docs/ --include="*.md"
grep -r "COMPREHENSIVE_SCHEMA_DOCUMENTATION.md" docs/ --include="*.md"
```

**Step 2: Create mapping file for replacements**

Old → New path mappings

**Step 3: Update cross-references in each file**

Use Edit tool to update paths in affected files.

**Step 4: Verify no broken links**

```bash
# Check for any remaining old references
grep -r "user-journey_refactored" docs/ --include="*.md"
```

Expected: No results

**Step 5: Commit**

```bash
git add docs/
git commit -m "docs: update all internal cross-references

- Update file path references to new structure
- Fix broken links from refactoring
- Ensure all navigation works correctly

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 14: Create Navigation Enhancement Files

**Files:**
- Create: `docs/guides/README.md` (guides index)
- Create: `docs/reference/README.md` (reference index)
- Create: `docs/architecture/README.md` (architecture index)
- Create: `docs/features/README.md` (features index)
- Create: `docs/implementation/README.md` (implementation index)
- Create: `docs/api/README.md` (API index)
- Create: `docs/database/README.md` (database index)

**Step 1: Write guides/README.md**

```markdown
# Implementation Guides

Step-by-step guides for setting up and implementing the platform.

## Available Guides

- [Quick Start](quick-start.md) - Get up and running quickly
- [Development Setup](development-setup.md) - Configure dev environment
- [Deployment Guide](deployment-guide.md) - Deploy to production
- [Testing Strategy](testing-strategy.md) - Testing approaches

## Navigation

[← Back to Main Documentation](../README.md)
```

**Step 2: Write similar README files for other directories**

Pattern: List files in directory with descriptions

**Step 3: Write features/README.md with phase breakdown**

**Step 4: Verify all README files created**

Run: `find docs/ -name "README.md"`
Expected: 8 README files (root + 7 subdirectories)

**Step 5: Commit**

```bash
git add docs/
git commit -m "docs: add navigation README files to all directories

- Create index files for easier navigation
- Add file descriptions in each directory
- Include back-navigation links
- Complete documentation structure

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 15: Final Verification and Documentation

**Files:**
- Verify: All files in correct locations
- Verify: No broken links
- Verify: All commits made
- Create: Migration summary document

**Step 1: Run verification script**

```bash
# List all markdown files in new structure
find docs/ -type f -name "*.md" | sort

# Count files
find docs/ -type f -name "*.md" | wc -l
```

Expected: ~35-40 markdown files

**Step 2: Check for broken links**

```bash
# Find any references to old structure
grep -r "user-journey_refactored\|QUICK_IMPLEMENTATION\|COMPREHENSIVE_SCHEMA" docs/ --include="*.md"
```

Expected: No results (or only in this plan file)

**Step 3: Verify git status**

```bash
git status
```

Expected: Working tree clean (all changes committed)

**Step 4: Create migration summary**

Document: `docs/MIGRATION_SUMMARY.md`

Content:
- What was changed
- File mapping (old → new)
- Breaking changes
- How to find files in new structure

**Step 5: Write MIGRATION_SUMMARY.md**

**Step 6: Final commit**

```bash
git add docs/MIGRATION_SUMMARY.md
git commit -m "docs: add migration summary for documentation refactoring

- Document all changes made during refactoring
- Provide file mapping for reference
- Include guide for finding documents in new structure
- Complete documentation restructuring project

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Step 7: Create git tag**

```bash
git tag -a docs-v2.0 -m "Documentation refactoring complete - v2.0 structure"
```

---

## Testing & Verification

After implementation, verify:

1. **Directory Structure:**
   ```bash
   tree docs/ -L 2
   ```

2. **File Count:**
   ```bash
   find docs/ -type f -name "*.md" | wc -l
   # Expected: 35-40 files
   ```

3. **No Broken Links:**
   ```bash
   # Install markdown-link-check
   npm install -g markdown-link-check

   # Check all markdown files
   find docs/ -name "*.md" -exec markdown-link-check {} \;
   ```

4. **Git History Clean:**
   ```bash
   git log --oneline --graph --all | head -20
   # Should show 15 commits for refactoring
   ```

5. **Navigation Works:**
   - Open `docs/README.md` in browser/previewer
   - Click through all links
   - Verify all navigation works

---

## Rollback Plan

If issues arise:

```bash
# View commits
git log --oneline | head -20

# Rollback to before refactoring
git revert <commit-hash>

# Or reset (destructive)
git reset --hard <commit-before-refactoring>
```

---

## Maintenance

### Adding New Documentation:

1. **New Feature:** Add to appropriate `features/phase-X/` directory
2. **New Guide:** Add to `guides/` with link in guides/README.md
3. **New API Endpoint:** Update `api/endpoints.md` and `api/examples.md`
4. **Schema Change:** Update `reference/database-schema.md` and `database/migrations.sql`

### Updating Existing Docs:

1. Update the relevant file
2. Update cross-references if paths change
3. Update parent README.md if description changes
4. Commit with clear message

---

## Success Criteria

- [ ] All 15 tasks completed
- [ ] All files in new structure
- [ ] No broken links
- [ ] All commits made with proper messages
- [ ] Documentation navigable and easy to find
- [ ] Old structure completely removed
- [ ] Cross-references updated
- [ ] README files in all directories
- [ ] Migration summary created
- [ ] Git tag created for v2.0

---

**Plan Version:** 1.0
**Created:** January 14, 2026
**Estimated Time:** 4-6 hours
**Complexity:** Medium
**Risk:** Low (all operations are reversible via git)
