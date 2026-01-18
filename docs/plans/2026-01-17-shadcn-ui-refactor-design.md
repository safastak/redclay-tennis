# shadcn UI Refactoring Design

**Date**: 2026-01-17
**Status**: Ready for Implementation
**Strategy**: Clean sweep - delete and rebuild all admin UI components

## Objective

Replace all custom UI components with shadcn primitives while maintaining mobile-first design, bottom navigation on mobile, and RED brand theme.

## Current State

- Custom admin components with inline Tailwind classes
- Manual dark mode management (`dark:` classes everywhere)
- No component library - everything built from scratch
- Mobile-first with working bottom navigation
- RED primary color theme (#DC2626)
- shadcn already configured (components.json exists)

## Target State

- All UI components use shadcn primitives from `components/ui/`
- Admin components become thin wrappers around shadcn
- Automatic dark mode via CSS variables
- Mobile-first responsive patterns (cards on mobile, tables on desktop)
- RED theme preserved via existing CSS variables
- Bottom navigation unchanged

## Phase 1: Foundation Setup

### Install shadcn Components

Install 20+ components in single batch:

```bash
npx shadcn@latest add button badge card table dialog form input label textarea select checkbox switch separator skeleton toast alert alert-dialog dropdown-menu popover tooltip avatar progress command tabs calendar scroll-area
```

**Components by category:**
- **Primitives**: Button, Badge, Card, Input, Label, Textarea, Select, Checkbox, Switch
- **Layout**: Separator, Skeleton, ScrollArea
- **Feedback**: Dialog, Toast, Alert, AlertDialog
- **Navigation**: Dropdown Menu, Popover, Tooltip
- **Data Display**: Table, Avatar, Progress
- **Advanced**: Command, Tabs, Calendar, Form

### Preserve Existing Config

Keep these files unchanged:
- `app/globals.css` - RED theme CSS variables
- `components.json` - shadcn configuration
- `components/AdminBottomNav.tsx` - Mobile navigation
- `components/theme-provider.tsx` - Dark mode provider

## Phase 2: Component Migration

### Delete These Components

Remove entirely from `components/admin/`:
- `BookingTable.tsx`
- `UserTable.tsx`
- `StatsCard.tsx`
- `StatusBadge.tsx`
- `UserTypeBadge.tsx`
- `PackageCard.tsx`
- `PackageFormModal.tsx`
- `WaitlistCard.tsx`
- `BookingFilters.tsx`
- `AdminHeader.tsx`
- `AdminSidebar.tsx`

### Rebuild Order (Simple → Complex)

1. **StatusBadge.tsx** - Use shadcn Badge
2. **UserTypeBadge.tsx** - Use shadcn Badge with variants
3. **StatsCard.tsx** - Use shadcn Card
4. **PackageCard.tsx** - Use Card + Button + Badge
5. **WaitlistCard.tsx** - Use Card + Button + Badge
6. **BookingFilters.tsx** - Use Select + Input
7. **AdminHeader.tsx** - Use Button + Dropdown Menu
8. **AdminSidebar.tsx** - Use Separator
9. **UserTable.tsx** - Use Table (desktop) + Card (mobile)
10. **BookingTable.tsx** - Use Table (desktop) + Card (mobile)
11. **PackageFormDialog.tsx** - Use Dialog + Form + Input + Select (rename from Modal)
12. **PackageRequestCard.tsx** - Use Card + Button + Badge

## Phase 3: Implementation Patterns

### Pattern 1: Badge Components

**Old (StatusBadge.tsx):**
```tsx
<span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400">
  Confirmed
</span>
```

**New:**
```tsx
import { Badge } from "@/components/ui/badge"

<Badge variant="success">Confirmed</Badge>
```

### Pattern 2: Card Components

**Old (StatsCard.tsx):**
```tsx
<div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
  <div className="flex items-center justify-between">
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
</div>
```

**New:**
```tsx
import { Card, CardContent } from "@/components/ui/card"

<Card>
  <CardContent className="flex items-center justify-between p-6">
    <div className="flex-1">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  </CardContent>
</Card>
```

### Pattern 3: Table Components (Mobile-First)

**Old (BookingTable.tsx):**
```tsx
<table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
  {/* Always renders table, hard to use on mobile */}
</table>
```

**New (Mobile cards + Desktop table):**
```tsx
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table"

// Mobile: Cards
<div className="lg:hidden space-y-4">
  {bookings.map(booking => (
    <Card key={booking.id}>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">{booking.user_name}</span>
            <Badge variant={booking.status}>{booking.status}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {booking.court_name}
          </div>
          {/* More details */}
        </div>
      </CardContent>
    </Card>
  ))}
</div>

// Desktop: Table
<div className="hidden lg:block">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>User</TableHead>
        <TableHead>Court</TableHead>
        {/* More headers */}
      </TableRow>
    </TableHeader>
    <TableBody>
      {bookings.map(booking => (
        <TableRow key={booking.id}>
          <TableCell>{booking.user_name}</TableCell>
          <TableCell>{booking.court_name}</TableCell>
          {/* More cells */}
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

### Pattern 4: Form Dialogs

**Old (PackageFormModal.tsx):**
```tsx
<div className="fixed inset-0 z-50 bg-black/50">
  <div className="fixed inset-0 overflow-y-auto">
    <form onSubmit={handleSubmit}>
      <input type="text" value={name} onChange={e => setName(e.target.value)} />
      {/* Manual form state management */}
    </form>
  </div>
</div>
```

**New (PackageFormDialog.tsx with react-hook-form):**
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Package</DialogTitle>
    </DialogHeader>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Package Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  </DialogContent>
</Dialog>
```

### Pattern 5: Buttons

**Old:**
```tsx
<button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 p-2 min-w-[48px] min-h-[48px]">
  <Check className="h-5 w-5" />
</button>
```

**New:**
```tsx
import { Button } from "@/components/ui/button"

<Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700">
  <Check className="h-4 w-4" />
</Button>
```

## Phase 4: Testing Strategy

After each component rebuild:

1. **Visual verification**
   - Test at 375px (mobile), 768px (tablet), 1024px+ (desktop)
   - Toggle dark mode
   - Verify touch targets ≥48x48px

2. **Functional verification**
   - Component renders without errors
   - TypeScript compiles
   - Existing functionality preserved
   - TanStack Query mutations still work

3. **Test suite**
   - Update component tests with new structure
   - Run `npm test` after each component
   - Target: All tests passing

## Phase 5: Final Cleanup

- Remove unused imports from old components
- Update all page imports to use new components
- Run `npm run typecheck` - zero errors
- Run `npm run lint` - zero errors
- Run full test suite - all passing
- Manual testing:
  - Bottom navigation works on mobile
  - RED theme consistent throughout
  - Dark mode transitions smooth
  - All admin pages functional

## Success Criteria

- [ ] All 20+ shadcn components installed
- [ ] Zero custom UI primitives (buttons, badges, cards are all shadcn)
- [ ] All admin components use shadcn as foundation
- [ ] Mobile-first: Cards on mobile, tables on desktop
- [ ] Bottom navigation unchanged and functional
- [ ] RED primary color preserved
- [ ] Dark mode working via CSS variables
- [ ] Touch targets ≥48x48px
- [ ] TypeScript compiles with zero errors
- [ ] All tests passing
- [ ] Zero lint errors

## Files Changed

**New files:**
- `components/ui/*.tsx` (20+ shadcn components)

**Modified files:**
- `components/admin/StatusBadge.tsx`
- `components/admin/UserTypeBadge.tsx`
- `components/admin/StatsCard.tsx`
- `components/admin/PackageCard.tsx`
- `components/admin/WaitlistCard.tsx`
- `components/admin/BookingFilters.tsx`
- `components/admin/AdminHeader.tsx`
- `components/admin/AdminSidebar.tsx`
- `components/admin/UserTable.tsx`
- `components/admin/BookingTable.tsx`
- `components/admin/PackageFormDialog.tsx` (renamed from PackageFormModal.tsx)
- `components/admin/PackageRequestCard.tsx`
- All admin pages that import these components

**Unchanged files:**
- `components/admin/AdminBottomNav.tsx`
- `components/theme-provider.tsx`
- `app/globals.css`
- `components.json`

## Implementation Notes

- Install all components first (avoids missing dependency errors)
- Rebuild components in dependency order (simple badges before complex tables)
- Test after each component rebuild
- Use mobile-first breakpoints: `lg:hidden` and `hidden lg:block`
- Leverage CSS variables for theming (avoid hardcoded colors)
- Maintain 48x48px minimum touch targets
- Use shadcn's built-in accessibility features (ARIA labels, keyboard navigation)
