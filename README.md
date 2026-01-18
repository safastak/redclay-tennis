# Red Clay Tennis - Court Booking Platform

A mobile-first tennis court booking platform with admin management capabilities. Built with Next.js 16, PostgreSQL, and TypeScript.

## Features

- 📱 **Mobile-First Design** - Optimized for touch devices
- 🎾 **Court Booking** - Tennis and pickleball court reservations
- 📦 **Package System** - Session packages with flexible scheduling
- 👥 **User Management** - Role-based access (user, trainer, admin)
- 📊 **Admin Dashboard** - Booking management and analytics
- ⏰ **Waitlist System** - Automatic notifications when slots open
- 👫 **Session Sharing** - Invite friends to join bookings
- 🔔 **Notifications** - Multi-channel alerts (email, SMS, in-app)

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript 5, TailwindCSS 4
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL (Neon for production, local for development)
- **Authentication**: JWT + Bcrypt
- **State Management**: TanStack Query
- **Testing**: Jest (unit, integration, E2E)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (local) or Neon account
- npm or yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd redclay-tennis

# Install dependencies
npm install

# Setup environment
cp .env.local.test .env.local

# Create database
createdb redclay_test

# Run migrations
npm run db:setup

# Seed test data
npm run db:seed:comprehensive

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Login Credentials

After seeding, use these test accounts:

| Email | Password | Role |
|-------|----------|------|
| `admin@redclay.com` | `Test123!` | Admin |
| `test@redclay.com` | `Test123!` | Premium User |
| `coach.maria@redclay.com` | `Test123!` | Trainer |

## Project Structure

```
redclay-tennis/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (serverless)
│   ├── (admin)/           # Admin UI (protected)
│   ├── login/             # Authentication pages
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── admin/            # Admin dashboard components
│   ├── auth/             # Login/signup forms
│   ├── bookings/         # Booking UI
│   └── ui/               # Reusable primitives
├── lib/                   # Core business logic
│   ├── db/               # Database connection
│   ├── auth/             # JWT & authentication
│   ├── services/         # Business logic layer
│   └── validation/       # Zod schemas
├── types/                 # TypeScript definitions
├── tests/                 # Jest tests
│   ├── unit/             # Service tests
│   ├── integration/      # API tests
│   └── e2e/              # End-to-end tests
├── docs/                  # Documentation
└── scripts/               # Database utilities
```

## Development Commands

### Core Commands

```bash
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm start                # Run production build
npm run lint             # ESLint
npm run typecheck        # TypeScript check
```

### Database Commands

```bash
npm run db:setup         # Run database migrations
npm run db:test          # Test database connection
npm run db:seed          # Seed admin user only
npm run db:seed:comprehensive  # Seed full test dataset
```

### Testing Commands

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report (target: 80-90%)
```

## Database Seeding

The project includes a comprehensive seeding script that creates realistic test data:

### What Gets Seeded

- **12 Users** - Admin, trainers, premium, new, inactive users
- **6 Courts** - Tennis & pickleball courts (one in maintenance)
- **2 Trainers** - With weekly schedules
- **5 Package Classes** - Various session packages
- **6 User Packages** - Active, requested, expired, depleted states
- **10 Bookings** - All states: pending, confirmed, cancelled, completed, no-show
- **3 Waitlist Entries** - Active and expired
- **5 Notifications** - Various alert types
- **Booking Invites** - Session sharing examples

### Seeding Workflow

```bash
# Full reset and reseed (idempotent - safe to run anytime)
npm run db:seed:comprehensive

# Output shows progress:
# 🌱 Starting comprehensive database seeding...
# 🧹 Cleaning existing data...
# 📍 Seeding courts...
# 👥 Seeding users...
# 🎾 Seeding trainers...
# 📦 Seeding package classes...
# 💳 Seeding user packages...
# 📅 Seeding bookings...
# ⏰ Seeding waitlist...
# 🔔 Seeding notifications...
# ✅ COMPREHENSIVE DATABASE SEEDING COMPLETE!
```

See [Database Seeding Guide](docs/database/seeding.md) for details.

## Documentation

Comprehensive documentation in `docs/`:

### Guides
- [Quick Start](docs/guides/quick-start.md)
- [Development Setup](docs/guides/development-setup.md)
- [Testing Strategy](docs/guides/testing-strategy.md)
- [Deployment Guide](docs/guides/deployment-guide.md)

### Reference
- [Database Schema](docs/reference/database-schema.md)
- [Database Seeding](docs/database/seeding.md)
- [API Documentation](docs/api/admin-api.md)
- [UI Components](docs/reference/ui-components.md)
- [Automation Rules](docs/reference/automation-rules.md)

### Architecture
- [Platform Overview](docs/architecture/platform-overview.md)
- [Authentication](docs/architecture/authentication.md)

### Build Plans
- [Infrastructure Plan](docs/build-plans/2026-01-14-infrastructure-plan.md)
- [Admin Backend Plan](docs/build-plans/2026-01-14-admin-backend-plan.md)
- [Admin Frontend Plan](docs/build-plans/2026-01-14-admin-frontend-plan.md)
- [User Frontend Plan](docs/build-plans/2026-01-14-user-frontend-plan.md)

## Testing

### Test Coverage

Target: 80-90% code coverage

```bash
npm run test:coverage
```

### Test Layers

1. **Unit Tests** (`tests/unit/`) - Service and utility tests
2. **Integration Tests** (`tests/integration/`) - API route tests
3. **E2E Tests** (`tests/e2e/`) - Full user flow tests
4. **Component Tests** (`tests/components/`) - React component tests

### API Contract Testing

All API endpoints have schema validation with Zod:

```typescript
// types/api-contracts.ts
export const BookingResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  // ... all fields validated
})
```

See [API Contract Testing Guide](docs/testing/api-contract-testing.md).

## Database Management

### Local PostgreSQL

```bash
# Create database
createdb redclay_test

# Run migrations
npm run db:setup

# Seed data
npm run db:seed:comprehensive

# Check connection
npm run db:test
```

### Neon (Production)

```bash
# Switch to Neon
cp .env.local.neon .env.local
npm run dev

# Switch back to local
cp .env.local.test .env.local
npm run dev
```

### Database Reset

```bash
# Complete reset
dropdb redclay_test && createdb redclay_test
psql -d redclay_test -f docs/database/migrations.sql
npm run db:seed:comprehensive
```

## Environment Variables

Create `.env.local` with:

```bash
# Database
DATABASE_URL="postgresql://localhost:5432/redclay_test"

# Authentication
JWT_SECRET="your-secure-secret-min-32-chars"
JWT_EXPIRATION="7d"
BCRYPT_ROUNDS="12"

# Email (optional for development)
EMAIL_API_KEY="your-sendgrid-api-key"

# Environment
NODE_ENV="development"
```

See `.env.example` for complete list.

## API Routes

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### User Routes
- `GET /api/bookings` - User's bookings
- `POST /api/bookings` - Create booking
- `GET /api/packages` - Available packages
- `POST /api/packages/purchase` - Buy package

### Admin Routes (Protected)
- `GET /api/admin/dashboard` - Dashboard analytics
- `GET /api/admin/bookings` - All bookings
- `PATCH /api/admin/bookings/:id` - Approve/reject booking
- `GET /api/admin/users` - User management
- `GET /api/admin/packages` - Package management

See [API Documentation](docs/api/admin-api.md) for complete reference.

## Project Status

**Current Phase:** Admin frontend complete, user frontend pending

### Completed ✅
- Database schema & migrations
- Authentication system (JWT + Bcrypt)
- All admin backend APIs
- Admin frontend dashboard (mobile-first)
- Comprehensive test suite
- Database seeding system

### In Progress 🚧
- User frontend (booking interface)
- Package purchase flow
- Waitlist UI

### Planned 📋
- Telegram bot integration
- AI-powered recommendations
- Advanced analytics
- Multi-language support

See `PROJECT_STATUS.md` for detailed status.

## Development Guidelines

### Code Quality Standards

- TypeScript strict mode enabled
- ESLint + Prettier configured
- All API responses use proper error handling
- Business logic in service layer (not API routes)
- Parameterized queries prevent SQL injection
- Mobile-first UI development

### Mobile-First UI

When building components:
- Start with mobile layout (320px viewport)
- Use Tailwind responsive breakpoints (`sm:`, `md:`, `lg:`)
- Minimum touch target: 44x44px
- Test on iOS Safari and Chrome Android
- Support dark mode via `next-themes`

### Before Committing

```bash
npm run lint      # ESLint check
npm run typecheck # TypeScript check
npm test          # All tests pass
```

## Contributing

1. Create feature branch (`git checkout -b feature/amazing-feature`)
2. Write tests for new functionality
3. Ensure all tests pass (`npm test`)
4. Run linters (`npm run lint`)
5. Commit with descriptive message
6. Push and create Pull Request

## Known Issues

- Neon database times out occasionally (use local PostgreSQL for development)
- Email notifications require SendGrid API key configuration
- Some tests require Web API polyfills for jsdom environment

## License

Private project - All rights reserved

## Support

For issues or questions:
- Check [Documentation](docs/README.md)
- Review [Testing Guide](docs/guides/testing-strategy.md)
- See [Development Setup](docs/guides/development-setup.md)

---

Built with ❤️ using Next.js and PostgreSQL
