# Mobile-First UI Foundation

**Critical Context:** 90% of users access the platform via mobile devices. Every component, interaction, and layout must be designed for touch-first, thumb-optimized mobile experience. dark/light theme with red as primary color.


---

## Core Principles

### 1. Thumb-Optimized Design
- Primary actions in thumb reach zone (bottom 60% of screen)
- Bottom navigation for main app sections
- Critical buttons within easy thumb reach
- Avoid top-corner actions that require hand repositioning

### 2. Touch-First Interactions
- Minimum touch target: 44x44px (Apple) / 48x48px (Material)
- Adequate spacing between interactive elements (minimum 8px)
- Swipe gestures for common actions (delete, archive, navigate)
- Long-press for contextual menus
- Pull-to-refresh for content updates

### 3. One-Handed Operation
- Essential features accessible with one hand
- Bottom sheet modals over full-screen overlays
- Sticky bottom action buttons
- Avoid requiring two-handed gestures

### 4. Minimize Text Input
- Prefer selection over typing
- Date/time pickers over manual entry
- Dropdowns and radio buttons over free text
- Auto-complete for search
- Smart defaults based on user history

### 5. Progressive Disclosure
- Show essential info first, details on demand
- Collapsible sections for advanced options
- Steppers for multi-step processes
- Bottom sheets for additional details

---

## Layout Patterns

### Mobile Layout (< 640px) - PRIMARY FOCUS

**Screen Structure:**
```
┌─────────────────────────────────┐
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ ← Status bar (safe area)
│ ┌─────────────────────────────┐ │
│ │ Top App Bar (56px)          │ │ ← Fixed header
│ │ [☰] Title          [🔔][👤]│ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │   Scrollable Content        │ │
│ │   (Cards stack vertically)  │ │
│ │                             │ │
│ │   Optimized for thumb       │ │
│ │   scrolling                 │ │
│ │                             │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Bottom Nav (56px)           │ │ ← Fixed bottom nav
│ │ [🏠] [📅] [💼] [👤]        │ │
│ └─────────────────────────────┘ │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ ← Safe area (home indicator)
└─────────────────────────────────┘
```

**Thumb Reach Zones:**
```
┌─────────────────────────────────┐
│ 🔴 Hard to reach (avoid)        │ ← Top 15%
│                                 │
│ 🟡 Stretch zone                 │ ← 15-40%
│ (read-only content okay)        │
│                                 │
│ 🟢 Natural thumb zone           │ ← 40-85%
│ (primary interactions here)     │
│                                 │
│ 🟢 Easy reach (nav, actions)    │ ← Bottom 15%
└─────────────────────────────────┘
```

### Tablet Layout (640px - 1024px) - SECONDARY

**Screen Structure:**
```
┌─────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────┐ │
│ │ Top App Bar                                 │ │
│ └─────────────────────────────────────────────┘ │
│ ┌───────────┬─────────────────────────────────┐ │
│ │           │                                 │ │
│ │ Side Nav  │  Content Area                   │ │
│ │ (256px)   │  (2-column cards where possible)│ │
│ │           │                                 │ │
│ └───────────┴─────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Desktop Layout (> 1024px) - NICE-TO-HAVE

**Screen Structure:**
```
┌───────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────┐ │
│ │ Top App Bar                                       │ │
│ └───────────────────────────────────────────────────┘ │
│ ┌─────────┬─────────────────────────────────────────┐ │
│ │         │                                         │ │
│ │ Side    │  Content Area                           │ │
│ │ Nav     │  (Multi-column, max-width 1200px)      │ │
│ │         │                                         │ │
│ └─────────┴─────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────┘
```

---

## Component Library

### Bottom Navigation (Primary Mobile Navigation)

**Layout:**
```
┌─────────────────────────────────┐
│ ┌──────┬──────┬──────┬──────┐  │
│ │ 🏠   │ 📅   │ 💼   │ 👤   │  │ ← 56px height
│ │ Home │ Book │ Pkgs │ You  │  │ ← Labels (optional)
│ └──────┴──────┴──────┴──────┘  │
└─────────────────────────────────┘
```

**Specs:**
- Height: 56px minimum (includes safe area)
- Icons: 24x24px
- Touch target per tab: 48x48px minimum
- Active state: Bold icon + primary color
- Max 5 tabs (4 recommended for clarity)

**Navigation Items:**
- Home: Dashboard overview
- Book: Court booking flow
- Packages: Package management
- Profile: User settings and account

### Cards (Primary Content Container)

**Standard Card (Mobile):**
```
┌───────────────────────────────┐
│ Card Header (16px padding)    │ ← Title + action icon
├───────────────────────────────┤
│                               │
│ Card Content (16px padding)   │ ← Main info
│ - Bullet points               │
│ - Key data                    │
│                               │
├───────────────────────────────┤
│ [Primary Action] [Secondary]  │ ← Bottom actions
└───────────────────────────────┘
```

**Specs:**
- Corner radius: 12px
- Shadow: Subtle (elevation 2)
- Padding: 16px
- Margin between cards: 12px
- Full width on mobile (minus screen padding)

### Buttons

**Primary Button (Mobile):**
```
┌─────────────────────────────────┐
│   Primary Action Text (16px)   │ ← 48px height minimum
└─────────────────────────────────┘
```

**Button Hierarchy:**
1. **Primary:** Filled, bold color (max 1 per screen)
2. **Secondary:** Outlined, neutral color
3. **Tertiary:** Text only, subtle

**Specs:**
- Height: 48px minimum (56px for critical actions)
- Padding: 16px horizontal, 12px vertical
- Corner radius: 8px
- Font: 16px medium weight
- Loading state: Spinner replaces text
- Disabled: 40% opacity, non-interactive

**Sticky Bottom Button (Mobile Pattern):**
```
┌─────────────────────────────────┐
│                                 │
│ Scrollable Content              │
│                                 │
├─────────────────────────────────┤ ← Shadow when scrolled
│ [   Confirm Booking - $50   ]  │ ← 56px + safe area
└─────────────────────────────────┘
```
- Used for primary flow actions (checkout, confirm, submit)
- Fixed to bottom with safe area padding
- Shadow indicates content above

### Time Slot Grid

**Mobile Layout (Vertical Stack):**
```
┌─────────────────────────────────┐
│ 9:00 AM - 10:00 AM              │
│ ✅ Available                    │
│ Court 2 + Coach Mike            │
│ [Select] ────────────────────── │ ← Full width button
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ 10:00 AM - 11:00 AM             │
│ ⚠️ Court available              │
│ Coach Mike already booked       │
│ [Book Court Only] ─────────────│
└─────────────────────────────────┘
```

**Specs:**
- Card per time slot
- Status badge: 8px left border (color-coded)
- Icon + text for quick scanning
- Full-width action button
- 12px spacing between cards

**Tablet/Desktop (Grid):**
```
┌────────┬────────┬────────┬────────┐
│ 9 AM   │ 10 AM  │ 11 AM  │ 12 PM  │
│ ✅     │ ⚠️     │ ✅     │ ❌     │
│ [Book] │ [View] │ [Book] │[Wait]  │
└────────┴────────┴────────┴────────┘
```

### Bottom Sheet Modal (Mobile Preferred)

**Usage:** Overlays for selections, details, confirmations

```
┌─────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ← Dimmed backdrop
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ┌─────────────────────────────┐ │
│ │ ━━━━━━━ (Handle bar)        │ │ ← Drag to dismiss
│ │                             │ │
│ │ Sheet Title                 │ │
│ │                             │ │
│ │ Scrollable content          │ │
│ │ - Option 1                  │ │
│ │ - Option 2                  │ │
│ │ - Option 3                  │ │
│ │                             │ │
│ │ [Primary Action]            │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Specs:**
- Swipe down to dismiss
- Max height: 90vh
- Handle bar: 32px wide, 4px tall, centered
- Corner radius: 16px top corners only
- Backdrop: 60% opacity black

**When to use:**
- Trainer selection
- Package details
- Booking confirmation
- Filter options
- Quick actions

### Package Card

**Mobile Display:**
```
┌──────────────────────────────────────┐
│ TENNIS PREMIUM 12-SESSION  [ANYTIME] │ ← Header
├──────────────────────────────────────┤
│                                      │
│ 💼 10 court-only sessions            │
│ 👨‍🏫 2 trainer + court sessions       │
│                                      │
│ ⏱️ Valid for 90 days                │
│ 💰 $550 total ($45.83/session avg)  │
│ 💾 Save $50+ vs pay-per-session     │
│                                      │
├──────────────────────────────────────┤
│ [Request Package] ───────────────────│ ← Full width
└──────────────────────────────────────┘
```

**Session Counter (Active Package):**
```
┌──────────────────────────────────────┐
│ 📊 SESSION USAGE                     │
│                                      │
│ Court-Only Sessions:                 │
│ ████████░░ 8/10 remaining            │ ← Progress bar
│                                      │
│ Trainer Sessions:                    │
│ ██░░ 1/2 remaining                   │
│                                      │
│ ⏰ Valid until: Apr 15, 2026         │
│                                      │
│ [View History] [Book Now]            │
└──────────────────────────────────────┘
```

**Color-Coded Progress:**
- Green: 70-100% remaining
- Yellow: 40-69% remaining
- Orange: 20-39% remaining
- Red: 1-19% remaining
- Gray: Depleted

### Status Badges

**Visual Examples:**
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ ✅ ACTIVE   │  │ ⏳ PENDING  │  │ ❌ EXPIRED  │
└─────────────┘  └─────────────┘  └─────────────┘
```

**Specs:**
- Height: 24px
- Padding: 4px 8px
- Corner radius: 12px (pill shape)
- Font: 12px bold uppercase
- Icon + text for clarity

**Status Types:**
- Active: Green background, white text
- Pending: Orange background, white text
- Confirmed: Blue background, white text
- Expired: Gray background, white text
- Cancelled: Red background, white text

### Forms & Inputs

**Mobile Input Field:**
```
┌─────────────────────────────────┐
│ Label (12px, gray)              │
│ ┌─────────────────────────────┐ │
│ │ Input value (16px)          │ │ ← 56px height
│ └─────────────────────────────┘ │
│ Helper text (12px)              │
└─────────────────────────────────┘
```

**Input Specs:**
- Height: 56px (easy thumb target)
- Font size: 16px (prevents zoom on iOS)
- Padding: 16px
- Corner radius: 8px
- Label above field, not floating
- Error state: Red border + error text below

**Preferred Input Types:**
- Date: Native date picker (calendar UI)
- Time: Native time picker (wheel/clock UI)
- Select: Bottom sheet with options
- Radio: Large tap targets (48x48px)
- Checkbox: 24x24px with 48x48px tap area

### Lists

**Mobile List Item:**
```
┌─────────────────────────────────┐
│ [Icon] Title Text               │ ← 64px minimum height
│        Subtitle / meta info     │
│                          [→]    │
└─────────────────────────────────┘
```

**Specs:**
- Minimum height: 64px (72px for two-line)
- Padding: 16px
- Tap area: Full width of list item
- Dividers: 1px, subtle gray
- Swipe actions: Delete, archive (reveal on swipe)

### Empty States

**Mobile Empty State:**
```
┌─────────────────────────────────┐
│                                 │
│          📭                     │ ← Large icon
│                                 │
│   No Bookings Yet               │ ← Heading
│                                 │
│   Book your first court to      │ ← Subtext
│   get started                   │
│                                 │
│   [Book a Court] ──────────────│ ← Action
│                                 │
└─────────────────────────────────┘
```

**Specs:**
- Icon: 64x64px emoji or illustration
- Center-aligned content
- Max width: 300px
- Clear call-to-action
- Friendly, encouraging copy

---

## Touch Interactions

### Gestures

**Supported Gestures:**
- **Tap:** Primary action (buttons, links, cards)
- **Long press:** Contextual menu (copy, share, delete)
- **Swipe horizontal:** Navigate between views, dismiss items
- **Swipe vertical:** Scroll content, refresh
- **Pinch:** Zoom (if applicable, e.g., court map)
- **Pull down:** Refresh content

**Feedback:**
- Instant visual response to touch (ripple effect)
- Haptic feedback for confirmations and errors
- Loading states for async actions
- Success/error animations

### Loading States

**Skeleton Screens (Preferred):**
```
┌─────────────────────────────────┐
│ ████████░░░░░░░░░░░░░░░░        │ ← Animated shimmer
│ ████░░░░░░░░░░░░                │
│                                 │
│ ████████░░░░░░░░░░░░░░░░        │
│ ████░░░░░░░░░░░░                │
└─────────────────────────────────┘
```

**Spinner (Secondary):**
- Use for button loading states
- Use when content size unknown
- Center-aligned, 40x40px

**Progressive Loading:**
- Load critical content first
- Show placeholders for images
- Lazy load below-fold content

---

## Navigation Patterns

### Bottom Navigation (Primary)

**Always Visible:**
- Home (dashboard overview)
- Book (court booking flow)
- Packages (user packages)
- Profile (user settings)

**Behavior:**
- Persists across app
- Active state indicated by color + bold icon
- Badge notifications (e.g., pending bookings)

### Top App Bar

**Components:**
- Left: Menu icon or back button
- Center: Page title or logo
- Right: Notifications, profile, search

**Scroll Behavior:**
- Option 1: Fixed (always visible)
- Option 2: Hide on scroll down, show on scroll up
- Recommendation: Fixed for primary pages

### Breadcrumbs (Desktop Only)

```
Home > Bookings > Booking #123
```

**Mobile:** Use back button instead

---

## Performance Optimizations

### Mobile-Specific Considerations

**Image Optimization:**
- Serve WebP with JPEG fallback
- Responsive images (srcset)
- Lazy load below fold
- Compress profile images
- Max width: 800px for mobile

**Code Splitting:**
- Load route-specific code on demand
- Separate mobile and desktop bundles
- Defer non-critical JavaScript
- Critical CSS inlined

**Network Optimization:**
- Cache API responses (5 minutes for bookings)
- Optimistic UI updates
- Retry failed requests
- Offline mode with service worker

**Animation Performance:**
- Use CSS transforms (GPU accelerated)
- Limit animations to opacity and transform
- 60fps target
- Reduce motion for accessibility

---

## Accessibility

### Touch Accessibility

**Minimum Sizes:**
- Touch target: 44x44px (iOS), 48x48px (Android)
- Spacing between targets: 8px minimum
- Text size: 16px minimum (prevent zoom)

**Focus Indicators:**
- Visible focus ring for keyboard users
- Logical tab order
- Skip to main content link

**Screen Readers:**
- Semantic HTML (headings, landmarks, lists)
- ARIA labels for icons
- Announce dynamic content changes
- Alt text for images

**Color Contrast:**
- Text: 4.5:1 minimum (AA)
- Large text: 3:1 minimum
- UI components: 3:1 minimum
- Don't rely on color alone

---

## Color System

### Brand Colors
- **Primary:** `#2563EB` (Blue - actions, links, active states)
- **Secondary:** `#10B981` (Green - success, confirmations)
- **Accent:** `#8B5CF6` (Purple - premium features)

### Semantic Colors
- **Success:** `#10B981` (Green)
- **Warning:** `#F59E0B` (Orange)
- **Error:** `#EF4444` (Red)
- **Info:** `#3B82F6` (Light Blue)

### Neutral Colors
- **Text Primary:** `#111827` (Gray-900)
- **Text Secondary:** `#6B7280` (Gray-500)
- **Border:** `#E5E7EB` (Gray-200)
- **Background:** `#F9FAFB` (Gray-50)
- **Surface:** `#FFFFFF` (White)

### Status Colors (Bookings & Packages)
- **Active:** `#10B981` (Green)
- **Pending:** `#F59E0B` (Orange)
- **Confirmed:** `#3B82F6` (Blue)
- **Expired:** `#6B7280` (Gray)
- **Cancelled:** `#EF4444` (Red)

---

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
             Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
```

### Scale (Mobile-First)
- **H1:** 28px bold (page title)
- **H2:** 24px bold (section heading)
- **H3:** 20px semibold (card title)
- **Body:** 16px regular (main text)
- **Small:** 14px regular (metadata)
- **Caption:** 12px regular (labels, helpers)

### Line Height
- Headings: 1.2
- Body: 1.5
- Small/Caption: 1.4

### Font Weight
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

---

## Spacing System

**Base unit:** 4px

**Scale:**
- XS: 4px
- SM: 8px
- MD: 12px
- LG: 16px
- XL: 24px
- 2XL: 32px
- 3XL: 48px

**Usage:**
- Component padding: 16px (LG)
- Card margins: 12px (MD)
- Section spacing: 24px (XL)
- Screen padding: 16px (LG)

---

## Icons

**System:**
- Use consistent icon set (Heroicons, Material Icons, or Lucide)
- Size: 24x24px default, 20x20px for inline
- Color: Inherit from parent or semantic color

**Common Icons:**
- 🏠 Home
- 📅 Calendar / Book
- 💼 Package
- 👤 Profile
- 🔔 Notifications
- ✅ Success / Available
- ⚠️ Warning
- ❌ Error / Unavailable
- 🔍 Search
- ⚙️ Settings
- ← Back

---

## Dark Mode Considerations

**Adaptive Colors:**
- Use CSS custom properties for color switching
- Increase contrast in dark mode
- Reduce pure white to avoid eye strain (#E5E7EB instead of #FFFFFF)
- Invert shadows (use elevation with lighter shades)

**Implementation:**
```css
:root {
  --color-background: #FFFFFF;
  --color-text: #111827;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #111827;
    --color-text: #F9FAFB;
  }
}
```

---

## Responsive Breakpoints

```css
/* Mobile first - default styles */
/* 0px - 639px */

/* Tablet */
@media (min-width: 640px) { ... }

/* Desktop */
@media (min-width: 1024px) { ... }

/* Large desktop */
@media (min-width: 1280px) { ... }
```

**Approach:**
1. Design mobile first (default styles)
2. Add tablet enhancements at 640px
3. Add desktop layouts at 1024px
4. Optimize for large screens at 1280px

---

## Quick Reference

### Mobile Component Checklist
- ✅ Touch target minimum 44x44px?
- ✅ Text size minimum 16px?
- ✅ Primary action in thumb zone?
- ✅ Adequate spacing between tappable elements?
- ✅ Loading states for async actions?
- ✅ Error states with recovery options?
- ✅ Keyboard accessible (focus visible)?
- ✅ Screen reader friendly (semantic HTML, ARIA)?
- ✅ Color contrast meets WCAG AA?
- ✅ Works on iOS and Android?

---

**Next:** See [Database Schema](./database-schema.md) for data layer implementation and [Automation Rules](./automation-rules.md) for cross-linking logic.
