# Platform Architecture

High-level directives for the Red Clay tennis booking platform rebuild.

---

## Core Stack

### Database: Neon
- **Use:** Neon PostgreSQL for all data storage
- **Why:** Serverless Postgres with built-in branching, auto-scaling, and edge network
- **Key Features to Leverage:**
  - Row Level Security (RLS) for permissions
  - Database branching for preview deployments
  - Connection pooling for serverless functions
  - Real-time subscriptions for live updates

### Deployment: Vercel
- **Use:** Vercel for hosting and serverless functions
- **Why:** Edge network, automatic deployments, serverless scalability
- **Key Features to Leverage:**
  - Edge functions for global performance
  - Preview deployments per git branch
  - Automatic HTTPS and domain management
  - Environment variables per environment

---

## Architecture Principles

### Serverless-First
- No persistent backend servers
- Stateless API routes/functions
- Scale automatically with demand
- Pay-per-use pricing model

### Edge-Optimized
- Static assets served from CDN
- API routes deployed to edge when possible
- Database queries optimized for latency
- Mobile users expect fast responses globally

### Security-First
- Database RLS enforces permissions at data layer
- Authentication tokens managed securely
- API routes validate permissions
- User data isolated by role

### Mobile-First Architecture
- API responses optimized for mobile bandwidth
- Lazy loading and pagination default
- Touch-optimized UI components
- Progressive Web App (PWA) capabilities

---

## Data Flow

```
User (Mobile/Web)
    ↓
Vercel Edge Functions (API Routes)
    ↓
Neon Database (PostgreSQL + RLS)
    ↓
Real-time Subscriptions (Live Updates)
    ↓
User Interface Updates
```

---

## Integration Points

### Authentication
- Use Neon's built-in auth or integrate auth provider
- JWT tokens for API authentication
- RLS policies enforce data access
- Role-based permissions in database

### Real-Time Updates
- Database subscriptions for live booking updates
- WebSocket connections for instant notifications
- Optimistic UI updates with server confirmation

### External Services
- Email provider for notifications
- SMS provider for urgent alerts
- Telegram API for bot integration
- AI services for recommendations

### File Storage
- Use Vercel Blob for user uploads
- Store file references in Neon database
- CDN delivery for profile images

---

## Development Workflow

### Local Development
- Neon branch per developer
- Local Vercel dev server
- Environment variables for API keys
- Hot reload for rapid iteration

### Staging/Preview
- Automatic preview deployment per PR
- Dedicated Neon branch per preview
- Test with real data copies
- Share links for review

### Production
- Main branch auto-deploys to production
- Production Neon database with backups
- Monitoring and error tracking
- Rollback capability

---

## Performance Targets

### Mobile Users (90% of traffic)
- Initial page load: < 2 seconds
- API response time: < 500ms
- Time to interactive: < 3 seconds
- Core Web Vitals: All green

### Desktop Users
- Initial page load: < 1 second
- API response time: < 300ms
- Full feature availability

---

## Scalability Considerations

### Database
- Neon auto-scales compute and storage
- Connection pooling prevents connection exhaustion
- Read replicas for analytics queries
- Database indexes on frequently queried columns

### API Functions
- Vercel auto-scales serverless functions
- Stateless design allows horizontal scaling
- Cache frequently accessed data
- Rate limiting prevents abuse

### Frontend
- Static asset caching via CDN
- Code splitting for faster loads
- Image optimization automatic
- Service worker for offline capability

---

## Security Model

### Data Layer (Neon RLS)
- Users can only access their own bookings
- Trainers see their assigned sessions
- Admins have full access with audit logs
- Anonymous users see public data only

### API Layer (Vercel Functions)
- Validate JWT tokens on every request
- Check user roles before operations
- Sanitize inputs to prevent injection
- Rate limit to prevent abuse

### Client Layer
- HTTPS only, no mixed content
- Secure token storage (httpOnly cookies or secure storage)
- Input validation before API calls
- XSS protection on user-generated content

---

## Monitoring & Observability

### Application Monitoring
- Vercel Analytics for performance metrics
- Error tracking for exceptions
- User analytics for feature usage
- API endpoint monitoring

### Database Monitoring
- Neon console for query performance
- Connection pool usage
- Slow query identification
- Storage and compute usage

### Alerts
- Failed deployments
- Error rate spikes
- Database connection issues
- API rate limit violations

---

## Cost Optimization

### Neon
- Scale down compute during low usage
- Use appropriate instance size
- Optimize queries to reduce compute time
- Archive old booking data

### Vercel
- Optimize function execution time
- Cache API responses when possible
- Use edge functions for static content
- Monitor bandwidth usage

---

**Next Steps:** Review [foundations/](./foundations/) for technical implementation details.
