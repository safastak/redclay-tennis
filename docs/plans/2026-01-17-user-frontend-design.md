# Red Clay Tennis - User Frontend Design & Implementation Plan
## Modern Mobile-First Tennis Booking Experience

**Created:** January 17, 2026
**Status:** Planning Phase
**Goal:** Design and implement a best-in-class mobile-first tennis booking experience using shadcn/ui components

---

## Executive Summary

This plan outlines the complete user-facing frontend for Red Clay Tennis, a modern tennis court booking platform. Based on research of best-in-class tennis websites and mobile-first UX patterns, this design prioritizes:

1. **Mobile-first experience** (90% of users on mobile)
2. **Frictionless booking flow** (3 taps to book)
3. **Progressive onboarding** (value before friction)
4. **shadcn/ui component library** (consistent, accessible UI)
5. **Red clay aesthetic** (warm, premium, athletic)

---

## Research Insights

### Best-in-Class Tennis Website Patterns

**Key Findings:**
- Modern tennis booking platforms emphasize **visual court showcases** with high-quality imagery
- **One-click booking** with clear availability calendars
- **Mobile-first design** with bottom navigation and thumb-optimized layouts
- **Package highlights** with clear value propositions (save $50+)
- **Instant confirmation** for premium users, approval workflow for new users
- **Integrated payment** with split payment options for group bookings

### Mobile-First Sports Booking UX Patterns

**Core Patterns Identified:**
1. **Bottom sheet modals** for selections (replacing full-page forms)
2. **Card-based layouts** with clear visual hierarchy
3. **Progressive disclosure** (show essentials, hide complexity)
4. **Swipe gestures** for navigation and quick actions
5. **Floating action buttons** for primary actions (Book Court)
6. **Real-time availability** with color-coded time slots

### 2025 Onboarding Best Practices

**Key Principles:**
- **Frontload value:** Show courts and availability before requiring signup
- **Progressive onboarding:** Collect data only when needed
- **Reduce friction:** Guest browsing, signup only at checkout
- **Personalization:** Segment by user type (casual, regular, competitive)
- **Quick wins:** First booking in under 2 minutes
- **Social proof:** "127 players booked this week"

---

## User Journey Map

### Phase 1: Discovery (No Account Required)

```
Landing Page → Browse Courts → View Availability → View Pricing
     ↓              ↓               ↓                  ↓
[Beautiful    [View Tennis   [Calendar with      [Package
 hero with     and Pickleball color-coded         comparison
 CTA]          courts]        availability]       with savings]
```

**Key Metrics:**
- Time to see available courts: < 3 seconds
- No signup wall until booking action
- Clear value proposition visible above fold

### Phase 2: Quick Signup (Progressive)

```
Select Time Slot → Quick Signup → Booking Details → Confirmation
      ↓                ↓               ↓                ↓
[One tap on      [Email + Name   [Add trainer?]   [Instant or
 available       only - no        [Use package?]    pending status]
 slot]           password yet]    [Payment info]
```

**Friction Points Minimized:**
- Email verification **after** first booking
- Password creation optional (magic link default)
- Payment info collected only at checkout
- Auto-fill from previous bookings

### Phase 3: Returning User (Optimized)

```
Login → Dashboard → Quick Book → Confirmation
  ↓        ↓           ↓            ↓
[Magic   [See next   [Favorite    [Push
 link or  available   courts,      notification
 saved    slot for    trainers     + calendar
 session] fav court]  pre-select]  event]
```

**Personalization:**
- Remember favorite courts and trainers
- Suggest usual booking times
- One-tap rebooking from history
- Package session counter prominent

---

## Design System (Red Clay Tennis)

### Color Palette

**Primary Colors:**
- **Terra Cotta Red:** `#C44536` (Primary CTA, brand)
- **Clay Orange:** `#E87461` (Accents, hover states)
- **Deep Red:** `#8B2E1F` (Dark mode primary)

**Neutral Palette:**
- **Background:** `#FAFAF9` (warm white)
- **Surface:** `#FFFFFF` (cards, modals)
- **Text Primary:** `#1C1917` (stone-900)
- **Text Secondary:** `#78716C` (stone-500)
- **Border:** `#E7E5E4` (stone-200)

**Semantic Colors:**
- **Success:** `#16A34A` (Available, Confirmed)
- **Warning:** `#EA580C` (Pending, Low sessions)
- **Error:** `#DC2626` (Unavailable, Expired)
- **Info:** `#0284C7` (Premium features)

**Dark Mode:**
- Background: `#1C1917` (stone-900)
- Surface: `#292524` (stone-800)
- Text: `#FAFAF9` (stone-50)
- Primary: `#E87461` (brighter clay orange)

### Typography

**Font Stack:**
```css
--font-display: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Type Scale (Mobile-First):**
- **Display:** 32px/40px bold (Hero headings)
- **H1:** 28px/36px bold (Page titles)
- **H2:** 24px/32px semibold (Section headings)
- **H3:** 20px/28px semibold (Card titles)
- **Body Large:** 18px/28px regular (Intro text)
- **Body:** 16px/24px regular (Primary text)
- **Small:** 14px/20px regular (Metadata)
- **Caption:** 12px/16px medium (Labels, timestamps)

### Spacing System

**Base unit:** 4px

**Scale:**
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px, 3xl: 64px

---

## Key Pages & Layouts

### 1. Landing Page (Public) - `/`

**Hero Section:**
- Full-screen with autoplay court video/slideshow
- Headline: "Book Your Perfect Court"
- Subtext: "Premium tennis courts from $40/hour"
- Primary CTA: "Browse Courts"
- Social proof: "127 players booked this week"

**Featured Courts:** Horizontal scrollable cards showing Tennis and Pickleball courts

**How It Works:** 3-step process (Browse → Select → Play)

**Package Highlights:** "Save up to $150 with packages"

**Mobile:** Hero 70vh, sticky "Book Now" FAB after scroll

### 2. Browse Courts - `/courts`

**Mobile Layout:**
- Simple court cards showing Tennis (2 variants) and Pickleball
- Each card displays photos, pricing, court type, "Next available: Today 2PM"
- Floating Action Button: "Quick Book"

**Desktop:** Clean 2-3 column grid layout with court cards

### 3. Court Detail & Availability - `/courts/[id]`

**Features:**
- Swipeable photo gallery
- Court specifications (Tennis or Pickleball, indoor/outdoor, lighting)
- Pricing display (regular + peak hours)
- Horizontal date picker
- Time slot cards with availability status
- Select slot → Opens booking sheet (or signup prompt)

### 4. Quick Signup/Login (Bottom Sheet)

**Flow:**
- Email + Name only (no password initially)
- Magic link sent to email
- User continues booking while link is sent
- Email verified in background
- Password setup optional later

**Alternative:** Magic link login for returning users

### 5. Booking Creation (Bottom Sheet)

**Step 1: Details**
- Court, date, time summary
- Optional trainer selection
- Package session vs pay-per-use toggle
- Notes field
- Total cost breakdown

**Step 2: Payment** (if needed)
- Card info (Stripe)
- Save card checkbox
- Secure payment badge

**Step 3: Confirmation**
- Success message with booking details
- Email confirmation sent
- Add to calendar link
- For new users: "Pending Approval" status

### 6. User Dashboard - `/dashboard`

**Sections:**
- Welcome message with name
- Next upcoming booking card
- Quick stats (upcoming bookings, active packages, hours played)
- Active package with progress bars
- Quick action buttons
- Bottom navigation: [Home] [Book] [Packages] [Profile]

### 7. My Bookings - `/bookings`

- Filter tabs: [All] [Upcoming] [Pending] [Past]
- Booking cards with status badges
- Swipe actions: left (cancel), right (rebook)
- Booking detail modal with full info
- Cancellation with policy notice

### 8. Packages - `/packages`

**Tabs:** [My Packages] [Buy Packages]

**Package Cards:**
- Popular badge for featured packages
- Sessions included (court-only + trainer)
- Validity period
- Total price with savings callout
- Average per-session cost
- Progress bars for active packages

### 9. Profile - `/profile`

- Avatar/photo upload
- User stats (bookings, packages, hours)
- Account settings links
- Email preferences, notifications, payment methods
- Password & security
- Sign out button

### 10. Notifications - `/notifications`

- Filter tabs for notification types
- Unread indicators
- Notification cards with timestamps
- Actions embedded in notifications
- Mark all as read

---

## Technical Architecture

### Component Library

**shadcn/ui Components:**
- Button (primary, secondary, outline, ghost)
- Card, Dialog, Sheet (bottom sheet)
- Calendar, Select, Badge, Avatar
- Tabs, Toast, Skeleton, Form

**Custom Components:**
- TimeSlotPicker (visual time grid)
- CourtCard (sport-specific styling)
- BookingCard (timeline view)
- PackageCard (progress tracking)
- AvailabilityCalendar (color-coded)
- TrainerSelector (availability overlay)

### Mobile Navigation

**Bottom Navigation:**
- Fixed at bottom with safe-area padding
- 4 main sections: Home, Book, Packages, Profile
- Active state: red color + bold icon
- Badge notifications on tabs

**Floating Action Button:**
- Used on Courts and Bookings pages
- Sticky bottom-right position
- Primary action prominence

### Animations

**Page Transitions:** Framer Motion (opacity + slide)

**Card Hovers:** Lift on hover, shadow increase

**Bottom Sheets:** Slide up with drag handle

**Loading States:** Skeleton screens for content, spinners for buttons

### Performance

**Image Optimization:**
- Next.js Image component with WebP/AVIF
- Responsive images with srcset
- Lazy loading below fold

**Code Splitting:**
- Dynamic imports for heavy components
- Route-based splitting

**API Caching:**
- TanStack Query with 5min stale time
- Optimistic updates for mutations

---

## Implementation Phases (16 Weeks)

### Phase 1: Foundation (Week 1-2)
Setup shadcn/ui, design system, base layout, reusable components, dark mode

### Phase 2: Public Pages (Week 3-4)
Landing page, browse courts, court detail, quick signup/login, responsive layouts

### Phase 3: Booking Flow (Week 5-6)
Time slot picker, booking creation, trainer selection, payment integration, confirmation

### Phase 4: User Dashboard (Week 7-8)
Dashboard stats, my bookings, booking detail modal, cancel/rebook, notifications

### Phase 5: Packages (Week 9-10)
Browse packages, package detail, purchase flow, progress tracking, session history

### Phase 6: Profile & Settings (Week 11-12)
Profile edit, settings pages, email preferences, push notifications

### Phase 7: Polish & Optimization (Week 13-14)
Animations, loading states, error handling, performance, accessibility audit

### Phase 8: Testing & Launch (Week 15-16)
Component tests, E2E tests, UAT, bug fixes, production deployment

---

## Success Metrics

### Performance
- Lighthouse Score: 90+
- First Contentful Paint: < 1.5s
- Core Web Vitals: All green

### User Experience
- Booking Completion Rate: > 80%
- Mobile Usage: > 85%
- Average Booking Time: < 2 minutes
- Return User Rate: > 60%

### Technical
- Test Coverage: > 80%
- TypeScript Errors: 0
- Bundle Size: < 300KB initial load
- API Response: < 500ms

---

## Next Steps

1. Review and approve design plan with stakeholders
2. Initialize shadcn/ui and configure design tokens
3. Begin Phase 1: Design system implementation
4. Design team prepares court photos and marketing assets
5. Weekly progress demos every Friday

---

**Notes:**
- Admin dashboard shadcn migration happening in parallel
- Backend APIs assumed complete and tested
- Design assets (court photos, logos) needed before Phase 2
- Consider UX research for user testing in Phase 7
