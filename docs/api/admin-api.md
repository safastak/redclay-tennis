# Admin Backend API Documentation

## Overview

The Red Clay Tennis platform includes a comprehensive admin backend API for managing bookings, users, packages, waitlists, and viewing analytics. All admin endpoints require authentication and admin role permission.

**Base URL:** `/api/admin`

**Authentication:** All endpoints require a valid JWT token with `app_role: 'admin'`

**Authorization Header:** `Authorization: Bearer <token>`

---

## Table of Contents

- [Booking Management](#booking-management)
- [User Management](#user-management)
- [Package Management](#package-management)
- [Waitlist Management](#waitlist-management)
- [Dashboard & Analytics](#dashboard--analytics)

---

## Booking Management

### List Bookings

Get a paginated list of all bookings with optional filters.

**Endpoint:** `GET /api/admin/bookings`

**Query Parameters:**
- `status` (optional): Filter by booking status (`pending`, `confirmed`, `cancelled`, `completed`)
- `court_id` (optional): Filter by court UUID
- `user_id` (optional): Filter by user UUID
- `start_date` (optional): Filter bookings from this date (YYYY-MM-DD)
- `end_date` (optional): Filter bookings until this date (YYYY-MM-DD)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50)

**Response:**
```json
{
  "bookings": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "court_id": "uuid",
      "booking_date": "2024-01-15",
      "start_time": "10:00:00",
      "end_time": "11:00:00",
      "status": "pending",
      "court_fee": 50,
      "trainer_fee": 30,
      "court_name": "Court 1",
      "sport_type": "tennis",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "user_type": "premium",
      "trainer_name": "Coach Smith"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 50,
  "totalPages": 3
}
```

### Booking Statistics

Get booking statistics for the last 30 days, today, and upcoming bookings.

**Endpoint:** `GET /api/admin/bookings/stats`

**Response:**
```json
{
  "last_30_days": {
    "pending_count": 12,
    "confirmed_count": 45,
    "cancelled_count": 8,
    "completed_count": 67,
    "total_revenue": 5420.50,
    "unique_users": 32,
    "courts_used": 8
  },
  "today": {
    "today_bookings": 15,
    "today_pending": 3
  },
  "upcoming": {
    "upcoming_count": 28
  }
}
```

### Approve or Reject Booking

Approve or reject a pending booking.

**Endpoint:** `PATCH /api/admin/bookings/:id`

**Request Body (Approve):**
```json
{
  "action": "approve"
}
```

**Request Body (Reject):**
```json
{
  "action": "reject",
  "reason": "Court maintenance scheduled"
}
```

**Response:**
```json
{
  "message": "Booking approved successfully",
  "booking": {
    "id": "uuid",
    "status": "confirmed",
    "updated_at": "2024-01-14T10:30:00Z"
  }
}
```

---

## User Management

### List Users

Get a paginated list of all users with optional filters.

**Endpoint:** `GET /api/admin/users`

**Query Parameters:**
- `user_type` (optional): Filter by user type (`new`, `premium`)
- `app_role` (optional): Filter by role (`user`, `trainer`, `admin`)
- `is_active` (optional): Filter by active status (`true`, `false`)
- `search` (optional): Search by name, email, or phone
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50)

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "Jane Doe",
      "phone_number": "+1234567890",
      "user_type": "premium",
      "app_role": "user",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-14T10:00:00Z"
    }
  ],
  "total": 250,
  "page": 1,
  "limit": 50,
  "totalPages": 5
}
```

### Get User Details

Get detailed information about a specific user including statistics.

**Endpoint:** `GET /api/admin/users/:id`

**Response:**
```json
{
  "stats": {
    "confirmed_bookings": 25,
    "completed_bookings": 20,
    "cancelled_bookings": 3,
    "no_show_bookings": 1,
    "total_spent": 1250.00
  }
}
```

### Update User

Update user details including type, role, and active status.

**Endpoint:** `PATCH /api/admin/users/:id`

**Request Body:**
```json
{
  "user_type": "premium",
  "app_role": "user",
  "is_active": true,
  "full_name": "Jane Smith",
  "phone_number": "+1234567890"
}
```

**Response:**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "Jane Smith",
    "user_type": "premium",
    "app_role": "user",
    "is_active": true
  }
}
```

### Get User Activity

Get a user's booking and package history.

**Endpoint:** `GET /api/admin/users/:id/activity`

**Response:**
```json
{
  "bookings": [
    {
      "id": "uuid",
      "booking_date": "2024-01-15",
      "start_time": "10:00:00",
      "end_time": "11:00:00",
      "status": "confirmed",
      "court_fee": 50,
      "trainer_fee": 30,
      "court_name": "Court 1",
      "trainer_name": "Coach Smith",
      "created_at": "2024-01-10T12:00:00Z"
    }
  ],
  "packages": [
    {
      "id": "uuid",
      "purchased_at": "2024-01-01T00:00:00Z",
      "expires_at": "2024-01-31T23:59:59Z",
      "remaining_court_only_sessions": 5,
      "remaining_trainer_sessions": 3,
      "package_name": "Premium Package",
      "price": 200
    }
  ]
}
```

---

## Package Management

### List Packages

Get all packages with purchase statistics.

**Endpoint:** `GET /api/admin/packages`

**Query Parameters:**
- `include_inactive` (optional): Include inactive packages (`true`, `false`)

**Response:**
```json
{
  "packages": [
    {
      "id": "uuid",
      "name": "Premium Package",
      "description": "10 sessions with court and trainer",
      "court_only_sessions": 5,
      "trainer_sessions": 5,
      "price": 200,
      "validity_days": 30,
      "is_active": true,
      "purchase_count": 45,
      "active_count": 23,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Package

Create a new booking package.

**Endpoint:** `POST /api/admin/packages`

**Request Body:**
```json
{
  "name": "Starter Package",
  "description": "Perfect for beginners - 10 court sessions",
  "price": 150,
  "sport_type": "tennis",
  "court_only_sessions": 10,
  "trainer_sessions": 0,
  "validity_days": 30
}
```

**Response:**
```json
{
  "message": "Package created successfully",
  "package": {
    "id": "uuid",
    "name": "Starter Package",
    "price": 150,
    "is_active": true
  }
}
```

### Update Package

Update package details.

**Endpoint:** `PATCH /api/admin/packages/:id`

**Request Body:**
```json
{
  "name": "Updated Package Name",
  "price": 180,
  "is_active": true
}
```

**Response:**
```json
{
  "package": {
    "id": "uuid",
    "name": "Updated Package Name",
    "price": 180,
    "updated_at": "2024-01-14T10:00:00Z"
  }
}
```

### Delete Package

Soft delete a package (marks as inactive).

**Endpoint:** `DELETE /api/admin/packages/:id`

**Response:**
```json
{
  "success": true
}
```

---

## Waitlist Management

### List Waitlist Entries

Get waitlist entries with optional filters.

**Endpoint:** `GET /api/admin/waitlist`

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `notified`, `booked`, `expired`)
- `court_id` (optional): Filter by court UUID
- `date` (optional): Filter by preferred date
- `page` (optional): Page number
- `limit` (optional): Results per page

**Response:**
```json
{
  "waitlist": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "court_id": "uuid",
      "preferred_date": "2024-01-20",
      "preferred_time_start": "10:00:00",
      "preferred_time_end": "11:00:00",
      "status": "pending",
      "priority": 1,
      "court_name": "Court 1",
      "user_name": "John Doe",
      "user_email": "john@example.com",
      "user_phone": "+1234567890",
      "created_at": "2024-01-14T09:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 50,
  "totalPages": 1
}
```

### Notify Waitlist User

Notify a user that their requested time slot is available.

**Endpoint:** `POST /api/admin/waitlist/:id`

**Response:**
```json
{
  "message": "User notified successfully",
  "entry": {
    "id": "uuid",
    "status": "notified",
    "notified_at": "2024-01-14T10:30:00Z"
  }
}
```

---

## Dashboard & Analytics

### Dashboard Overview

Get key metrics for the admin dashboard.

**Endpoint:** `GET /api/admin/dashboard`

**Response:**
```json
{
  "today": {
    "total": 15,
    "pending": 3,
    "confirmed": 12
  },
  "revenue": {
    "last_7_days": 1250.50,
    "last_30_days": 5420.00,
    "all_time": 45680.00
  },
  "users": {
    "total_users": 250,
    "new_users": 180,
    "premium_users": 70,
    "users_last_30_days": 25
  },
  "pending": {
    "pending_bookings": 8,
    "waitlist_count": 15
  }
}
```

### Revenue Analytics

Get revenue data grouped by time period.

**Endpoint:** `GET /api/admin/analytics/revenue`

**Query Parameters:**
- `period`: Grouping period (`daily`, `weekly`, `monthly`)
- `days`: Number of days to include (default: 30)

**Response:**
```json
{
  "data": [
    {
      "period": "2024-01-14",
      "booking_count": 12,
      "court_revenue": 600,
      "trainer_revenue": 360,
      "total_revenue": 960
    },
    {
      "period": "2024-01-13",
      "booking_count": 15,
      "court_revenue": 750,
      "trainer_revenue": 450,
      "total_revenue": 1200
    }
  ]
}
```

### Court Utilization

Get court usage and revenue statistics.

**Endpoint:** `GET /api/admin/analytics/courts`

**Query Parameters:**
- `days`: Number of days to include (default: 30)

**Response:**
```json
{
  "courts": [
    {
      "id": "uuid",
      "name": "Court 1",
      "sport_type": "tennis",
      "total_bookings": 125,
      "completed_bookings": 110,
      "total_revenue": 6250,
      "avg_booking_fee": 50
    },
    {
      "id": "uuid",
      "name": "Court 2",
      "sport_type": "padel",
      "total_bookings": 98,
      "completed_bookings": 85,
      "total_revenue": 4900,
      "avg_booking_fee": 50
    }
  ]
}
```

---

## Error Responses

All endpoints follow a consistent error response format:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "price",
      "message": "Price must be a positive number"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Admin access required"
}
```

### 404 Not Found
```json
{
  "error": "Booking not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to process request"
}
```

---

## Implementation Details

### Authentication Flow

1. User logs in via `/api/auth/login`
2. Server validates credentials and returns JWT token
3. Token includes `app_role` field
4. All admin endpoints verify:
   - Token is valid (via `requireAuth`)
   - User has `app_role: 'admin'` (via `requireAdmin`)

### Permission Checks

Every admin endpoint includes:
```typescript
const user = await requireAuth(request)
if (user instanceof NextResponse) return user

const adminCheck = requireAdmin(user)
if (adminCheck) return adminCheck
```

### Error Handling

All endpoints use consistent error handling:
```typescript
try {
  // Endpoint logic
} catch (error) {
  return handleApiError(error)
}
```

The `handleApiError` utility provides:
- Consistent error response format
- Proper HTTP status codes
- Error logging
- Type-safe error handling

---

## Testing

Comprehensive test coverage is available:

**E2E Tests:**
- `tests/e2e/admin-bookings.test.ts` - Booking management tests
- `tests/e2e/admin-users.test.ts` - User management tests
- `tests/e2e/admin-packages.test.ts` - Package management tests
- `tests/e2e/admin-waitlist.test.ts` - Waitlist management tests
- `tests/e2e/admin-dashboard.test.ts` - Dashboard & analytics tests

**Unit Tests:**
- `tests/unit/email.service.test.ts` - Email notification tests

Run tests:
```bash
npm test
```

---

## Notification System

The platform includes an email notification service for:

- **Booking Confirmations** - Sent when admin approves a booking
- **Booking Cancellations** - Sent when admin rejects a booking
- **Welcome Emails** - Sent to new users
- **User Approval Emails** - Sent when user is upgraded to premium

Configure email service:
```env
EMAIL_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@redclay.com
EMAIL_FROM_NAME=Red Clay Tennis
```

If `EMAIL_API_KEY` is not configured, the service gracefully logs notifications instead of sending.

---

## Future Enhancements

Potential improvements for the admin backend:

1. **Bulk Operations** - Update multiple bookings/users at once
2. **Advanced Filtering** - Date ranges, multiple status filters
3. **Export Functionality** - CSV/Excel export for reports
4. **Real-time Updates** - WebSocket notifications for pending bookings
5. **Audit Logging** - Track all admin actions for compliance
6. **Role-based Permissions** - Granular permissions beyond admin/user

---

## Related Documentation

- [Platform Architecture](../PLATFORM_ARCHITECTURE_SCHEMA.md)
- [Database Schema](../database/schema.sql)
- [Admin Backend Plan](../build-plans/2026-01-14-admin-backend-plan.md)
- [API Examples](./examples.md)

---

**Last Updated:** January 14, 2026
**API Version:** 1.0
**Status:** ✅ Complete
