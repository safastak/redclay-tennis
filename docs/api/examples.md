# API Request/Response Examples
## Red Clay Tennis Booking Platform

**Purpose:** Real-world API examples for all major endpoints
**Target Audience:** Frontend developers, API consumers, testers

---

## Table of Contents

1. [Authentication](#authentication)
2. [Bookings](#bookings)
3. [Courts](#courts)
4. [Packages](#packages)
5. [Waitlist](#waitlist)
6. [Notifications](#notifications)
7. [Admin Operations](#admin-operations)
8. [Error Responses](#error-responses)

---

## Authentication

### Sign Up

**Endpoint:** `POST /api/auth/signup`

**Request:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "phone_number": "+1234567890"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "full_name": "John Doe",
    "phone_number": "+1234567890",
    "user_type": "new",
    "app_role": "user",
    "is_active": true,
    "profile_image_url": null,
    "preferences": {},
    "created_at": "2026-01-14T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2026-01-21T10:00:00Z"
}
```

---

### Sign In

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john.doe@example.com",
    "full_name": "John Doe",
    "user_type": "premium",
    "app_role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2026-01-21T10:00:00Z"
}
```

---

### Get Current User

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john.doe@example.com",
  "full_name": "John Doe",
  "phone_number": "+1234567890",
  "user_type": "premium",
  "app_role": "user",
  "is_active": true,
  "profile_image_url": "https://storage.example.com/avatars/john.jpg",
  "preferences": {
    "notifications": {
      "email": true,
      "sms": false,
      "telegram": true
    },
    "ai_recommendations": true
  },
  "created_at": "2026-01-14T10:00:00Z",
  "updated_at": "2026-01-14T15:30:00Z"
}
```

---

## Bookings

### Create Booking (NEW User - Pending Status)

**Endpoint:** `POST /api/bookings`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request:**
```json
{
  "court_id": "7a8b9c0d-1234-5678-90ab-cdef12345678",
  "trainer_id": "9f8e7d6c-5b4a-3c2d-1e0f-1234567890ab",
  "booking_date": "2026-01-20",
  "start_time": "10:00:00",
  "end_time": "11:00:00",
  "notes": "First time player, working on backhand"
}
```

**Response:** `201 Created`
```json
{
  "booking": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "court_id": "7a8b9c0d-1234-5678-90ab-cdef12345678",
    "trainer_id": "9f8e7d6c-5b4a-3c2d-1e0f-1234567890ab",
    "booking_date": "2026-01-20",
    "start_time": "10:00:00",
    "end_time": "11:00:00",
    "duration_hours": 1.0,
    "status": "pending",
    "court_fee": 50.00,
    "trainer_fee": 75.00,
    "total_fee": 125.00,
    "package_id": null,
    "is_peak_time": false,
    "notes": "First time player, working on backhand",
    "created_at": "2026-01-14T16:00:00Z"
  },
  "court": {
    "name": "Court 1",
    "sport_type": "tennis",
    "surface": "Clay"
  },
  "trainer": {
    "name": "Coach Mike Chen",
    "specialty": "Tennis Coach",
    "rating": 4.8
  },
  "message": "Booking created successfully. Awaiting admin approval."
}
```

---

### Create Booking (PREMIUM User - Instant Confirmation)

**Same request as above, but user is PREMIUM**

**Response:** `201 Created`
```json
{
  "booking": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "court_id": "7a8b9c0d-1234-5678-90ab-cdef12345678",
    "trainer_id": "9f8e7d6c-5b4a-3c2d-1e0f-1234567890ab",
    "booking_date": "2026-01-20",
    "start_time": "10:00:00",
    "end_time": "11:00:00",
    "status": "confirmed",
    "court_fee": 50.00,
    "trainer_fee": 75.00,
    "total_fee": 125.00,
    "created_at": "2026-01-14T16:00:00Z"
  },
  "message": "Booking confirmed! Confirmation sent to your email."
}
```

---

### Create Booking (With Package Applied)

**Same request, but user has active package**

**Response:** `201 Created`
```json
{
  "booking": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "court_id": "7a8b9c0d-1234-5678-90ab-cdef12345678",
    "trainer_id": "9f8e7d6c-5b4a-3c2d-1e0f-1234567890ab",
    "booking_date": "2026-01-20",
    "start_time": "10:00:00",
    "end_time": "11:00:00",
    "status": "confirmed",
    "court_fee": 0,
    "trainer_fee": 0,
    "total_fee": 0,
    "package_id": "pkg-12345",
    "package_session_type": "trainer_included",
    "created_at": "2026-01-14T16:00:00Z"
  },
  "package_usage": {
    "package_name": "Tennis Premium 12-Session",
    "session_used": "trainer_included",
    "remaining_court_only": 10,
    "remaining_trainer": 1
  },
  "message": "Booking confirmed using your package! 1 trainer session used."
}
```

---

### List User Bookings

**Endpoint:** `GET /api/bookings?status=upcoming&limit=10`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `status`: `upcoming` | `past` | `pending` | `confirmed` | `cancelled`
- `limit`: Number (default: 20)
- `offset`: Number (default: 0)

**Response:** `200 OK`
```json
{
  "bookings": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "booking_date": "2026-01-20",
      "start_time": "10:00:00",
      "end_time": "11:00:00",
      "status": "confirmed",
      "court": {
        "id": "7a8b9c0d-1234-5678-90ab-cdef12345678",
        "name": "Court 1",
        "sport_type": "tennis"
      },
      "trainer": {
        "id": "9f8e7d6c-5b4a-3c2d-1e0f-1234567890ab",
        "name": "Coach Mike Chen"
      },
      "total_fee": 0,
      "package_used": true,
      "is_primary_booking": true,
      "shared_with": [],
      "created_at": "2026-01-14T16:00:00Z"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "booking_date": "2026-01-22",
      "start_time": "14:00:00",
      "end_time": "15:00:00",
      "status": "pending",
      "court": {
        "id": "8b9c0d1e-2345-6789-01bc-def234567890",
        "name": "Court 2",
        "sport_type": "tennis"
      },
      "trainer": null,
      "total_fee": 50.00,
      "package_used": false,
      "created_at": "2026-01-14T17:00:00Z"
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 10,
    "offset": 0,
    "has_more": false
  }
}
```

---

### Get Booking Details

**Endpoint:** `GET /api/bookings/:id`

**Response:** `200 OK`
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "booking_date": "2026-01-20",
  "start_time": "10:00:00",
  "end_time": "11:00:00",
  "duration_hours": 1.0,
  "status": "confirmed",
  "court": {
    "id": "7a8b9c0d-1234-5678-90ab-cdef12345678",
    "name": "Court 1",
    "sport_type": "tennis",
    "surface": "Clay",
    "amenities": ["Lights", "Seating"]
  },
  "trainer": {
    "id": "9f8e7d6c-5b4a-3c2d-1e0f-1234567890ab",
    "name": "Coach Mike Chen",
    "specialty": "Tennis Coach",
    "rating": 4.8,
    "hourly_rate": 75.00
  },
  "pricing": {
    "court_fee": 0,
    "trainer_fee": 0,
    "total_fee": 0,
    "package_used": true
  },
  "package": {
    "id": "pkg-12345",
    "name": "Tennis Premium 12-Session",
    "session_type": "trainer_included"
  },
  "invites": [],
  "notes": "First time player, working on backhand",
  "is_peak_time": false,
  "created_at": "2026-01-14T16:00:00Z",
  "updated_at": "2026-01-14T16:00:00Z"
}
```

---

### Cancel Booking

**Endpoint:** `DELETE /api/bookings/:id`

**Request:**
```json
{
  "reason": "Schedule conflict, need to reschedule"
}
```

**Response (>24h notice):** `200 OK`
```json
{
  "booking": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "cancelled",
    "cancelled_at": "2026-01-14T18:00:00Z"
  },
  "refund": {
    "package_session_refunded": true,
    "session_type": "trainer_included",
    "package_id": "pkg-12345"
  },
  "waitlist_notifications": {
    "users_notified": 3,
    "slot_details": "Tennis Court 1, Jan 20 at 10:00 AM"
  },
  "message": "Booking cancelled successfully. Package session has been refunded. 3 users on waitlist have been notified."
}
```

**Response (<24h notice):** `200 OK`
```json
{
  "booking": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "cancelled",
    "cancelled_at": "2026-01-14T18:00:00Z",
    "admin_review_required": true
  },
  "refund": {
    "package_session_refunded": false,
    "requires_admin_review": true,
    "reason": "Less than 24 hours notice"
  },
  "message": "Booking cancelled. Package refund requires admin review due to short notice."
}
```

---

### Invite to Session

**Endpoint:** `POST /api/bookings/:id/invites`

**Request:**
```json
{
  "invited_email": "friend@example.com",
  "message": "Want to play doubles? I've booked Court 1!"
}
```

**Response:** `201 Created`
```json
{
  "invite": {
    "id": "inv-12345",
    "booking_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "invited_by": "550e8400-e29b-41d4-a716-446655440000",
    "invited_email": "friend@example.com",
    "status": "pending",
    "expires_at": "2026-01-20T10:00:00Z",
    "invited_at": "2026-01-14T18:30:00Z"
  },
  "booking": {
    "court_name": "Court 1",
    "date": "2026-01-20",
    "time": "10:00 AM"
  },
  "message": "Invitation sent to friend@example.com"
}
```

---

## Courts

### List Courts

**Endpoint:** `GET /api/courts?sport_type=tennis&is_active=true`

**Response:** `200 OK`
```json
{
  "courts": [
    {
      "id": "7a8b9c0d-1234-5678-90ab-cdef12345678",
      "name": "Court 1",
      "sport_type": "tennis",
      "surface": "Clay",
      "hourly_rate": 50.00,
      "peak_hour_rate": 60.00,
      "is_active": true,
      "maintenance_mode": false,
      "capacity": 4,
      "amenities": ["Lights", "Seating", "Water fountain"]
    },
    {
      "id": "8b9c0d1e-2345-6789-01bc-def234567890",
      "name": "Court 2",
      "sport_type": "tennis",
      "surface": "Clay",
      "hourly_rate": 50.00,
      "is_active": true,
      "maintenance_mode": false,
      "capacity": 4,
      "amenities": ["Lights", "Seating"]
    }
  ],
  "total": 2
}
```

---

### Check Court Availability

**Endpoint:** `GET /api/courts/:id/availability?date=2026-01-20`

**Response:** `200 OK`
```json
{
  "court": {
    "id": "7a8b9c0d-1234-5678-90ab-cdef12345678",
    "name": "Court 1",
    "sport_type": "tennis"
  },
  "date": "2026-01-20",
  "slots": [
    {
      "start_time": "06:00:00",
      "end_time": "07:00:00",
      "available": true,
      "is_peak_time": false,
      "price": 50.00
    },
    {
      "start_time": "07:00:00",
      "end_time": "08:00:00",
      "available": true,
      "is_peak_time": false,
      "price": 50.00
    },
    {
      "start_time": "08:00:00",
      "end_time": "09:00:00",
      "available": false,
      "is_peak_time": false,
      "booked_by": "existing_booking"
    },
    {
      "start_time": "09:00:00",
      "end_time": "10:00:00",
      "available": true,
      "is_peak_time": false,
      "price": 50.00
    },
    {
      "start_time": "10:00:00",
      "end_time": "11:00:00",
      "available": false,
      "is_peak_time": false,
      "booked_by": "existing_booking"
    }
  ],
  "available_trainers": [
    {
      "id": "9f8e7d6c-5b4a-3c2d-1e0f-1234567890ab",
      "name": "Coach Mike Chen",
      "hourly_rate": 75.00,
      "rating": 4.8,
      "available_slots": ["06:00:00", "07:00:00", "09:00:00"]
    }
  ]
}
```

---

## Packages

### List Package Classes

**Endpoint:** `GET /api/packages?sport_type=tennis&is_active=true`

**Response:** `200 OK`
```json
{
  "packages": [
    {
      "id": "pkg-class-001",
      "name": "Tennis Premium 12-Session",
      "sport_type": "tennis",
      "court_only_sessions": 10,
      "trainer_sessions": 2,
      "total_sessions": 12,
      "price": 550.00,
      "price_per_session": 45.83,
      "peak_off_peak": "anytime",
      "validity_days": 90,
      "description": "Perfect for regular players. Includes 10 court-only sessions and 2 trainer sessions. Valid for 90 days.",
      "savings": "Save $50+ vs pay-per-session",
      "is_active": true,
      "eligible_courts": [
        {
          "id": "7a8b9c0d-1234-5678-90ab-cdef12345678",
          "name": "Court 1"
        },
        {
          "id": "8b9c0d1e-2345-6789-01bc-def234567890",
          "name": "Court 2"
        }
      ]
    },
    {
      "id": "pkg-class-002",
      "name": "Pickleball Off-Peak 10",
      "sport_type": "pickleball",
      "court_only_sessions": 10,
      "trainer_sessions": 0,
      "total_sessions": 10,
      "price": 300.00,
      "price_per_session": 30.00,
      "peak_off_peak": "off_peak_only",
      "validity_days": 60,
      "description": "Great value for weekday players. Weekdays 6 AM - 5 PM only.",
      "savings": "Save $10/session",
      "is_active": true
    }
  ]
}
```

---

### Request Package

**Endpoint:** `POST /api/packages/request`

**Request:**
```json
{
  "package_class_id": "pkg-class-001"
}
```

**Response:** `201 Created`
```json
{
  "user_package": {
    "id": "usr-pkg-12345",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "package_class_id": "pkg-class-001",
    "status": "requested",
    "total_court_only_sessions": 10,
    "remaining_court_only_sessions": 10,
    "total_trainer_sessions": 2,
    "remaining_trainer_sessions": 2,
    "price_paid": 550.00,
    "payment_received": false,
    "expires_at": "2026-04-15T00:00:00Z",
    "requested_at": "2026-01-14T19:00:00Z"
  },
  "package_details": {
    "name": "Tennis Premium 12-Session",
    "total_sessions": 12,
    "validity_days": 90
  },
  "payment_instructions": {
    "method": "Cash at facility",
    "amount": 550.00,
    "next_steps": "Pay $550 cash at the facility. Admin will confirm payment and activate your package."
  },
  "message": "Package requested successfully. Awaiting payment confirmation."
}
```

---

### Get My Packages

**Endpoint:** `GET /api/packages/my-packages?status=active`

**Response:** `200 OK`
```json
{
  "packages": [
    {
      "id": "usr-pkg-12345",
      "package_class": {
        "id": "pkg-class-001",
        "name": "Tennis Premium 12-Session",
        "sport_type": "tennis"
      },
      "status": "active",
      "sessions": {
        "court_only": {
          "total": 10,
          "remaining": 8,
          "used": 2,
          "percentage_remaining": 80
        },
        "trainer": {
          "total": 2,
          "remaining": 1,
          "used": 1,
          "percentage_remaining": 50
        }
      },
      "lifecycle": {
        "purchased_at": "2026-01-14T19:00:00Z",
        "confirmed_at": "2026-01-14T20:00:00Z",
        "expires_at": "2026-04-15T00:00:00Z",
        "days_remaining": 91,
        "last_used_at": "2026-01-14T16:00:00Z"
      },
      "pricing": {
        "price_paid": 550.00,
        "original_value": 600.00,
        "savings": 50.00
      }
    }
  ]
}
```

---

## Waitlist

### Join Waitlist

**Endpoint:** `POST /api/waitlist`

**Request:**
```json
{
  "sport_type": "tennis",
  "desired_date": "2026-01-20",
  "desired_start_time": "10:00:00",
  "desired_end_time": "11:00:00",
  "preferred_court_id": "7a8b9c0d-1234-5678-90ab-cdef12345678",
  "needs_trainer": true,
  "preferred_trainer_id": "9f8e7d6c-5b4a-3c2d-1e0f-1234567890ab",
  "notes": "Prefer Court 1 with Coach Mike if possible"
}
```

**Response:** `201 Created`
```json
{
  "waitlist": {
    "id": "wl-12345",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "sport_type": "tennis",
    "desired_date": "2026-01-20",
    "desired_start_time": "10:00:00",
    "desired_end_time": "11:00:00",
    "preferred_court": {
      "id": "7a8b9c0d-1234-5678-90ab-cdef12345678",
      "name": "Court 1"
    },
    "preferred_trainer": {
      "id": "9f8e7d6c-5b4a-3c2d-1e0f-1234567890ab",
      "name": "Coach Mike Chen"
    },
    "status": "active",
    "expires_at": "2026-01-20T23:59:59Z",
    "created_at": "2026-01-14T20:00:00Z"
  },
  "notification_channels": {
    "in_app": true,
    "email": true,
    "telegram": true
  },
  "message": "Added to waitlist. You'll be notified if this slot becomes available."
}
```

---

### Get My Waitlist Entries

**Endpoint:** `GET /api/waitlist/my-entries?status=active`

**Response:** `200 OK`
```json
{
  "entries": [
    {
      "id": "wl-12345",
      "sport_type": "tennis",
      "desired_date": "2026-01-20",
      "desired_start_time": "10:00:00",
      "desired_end_time": "11:00:00",
      "preferred_court": {
        "name": "Court 1"
      },
      "preferred_trainer": {
        "name": "Coach Mike Chen"
      },
      "status": "active",
      "position_in_queue": 3,
      "created_at": "2026-01-14T20:00:00Z",
      "time_on_waitlist": "2 hours"
    }
  ],
  "total": 1
}
```

---

## Notifications

### Get Notifications

**Endpoint:** `GET /api/notifications?read=false&limit=20`

**Response:** `200 OK`
```json
{
  "notifications": [
    {
      "id": "notif-001",
      "type": "booking_confirmed",
      "title": "Booking Confirmed",
      "message": "Your booking for Tennis Court 1 on Jan 20 at 10:00 AM has been confirmed!",
      "read": false,
      "read_at": null,
      "channels_used": ["in_app", "email", "telegram"],
      "booking": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "court_name": "Court 1",
        "date": "2026-01-20",
        "time": "10:00 AM"
      },
      "actions": [
        {
          "label": "View Booking",
          "action": "view_booking",
          "url": "/bookings/a1b2c3d4-e5f6-7890-abcd-ef1234567890"
        },
        {
          "label": "Add to Calendar",
          "action": "add_to_calendar",
          "url": "/bookings/a1b2c3d4-e5f6-7890-abcd-ef1234567890/calendar"
        }
      ],
      "created_at": "2026-01-14T16:00:00Z"
    },
    {
      "id": "notif-002",
      "type": "waitlist_available",
      "title": "Waitlist Alert: Slot Available!",
      "message": "A court is now available! Tennis Court 1, Jan 20 at 10 AM. Book quickly before someone else takes it!",
      "priority": "urgent",
      "read": false,
      "waitlist": {
        "id": "wl-12345",
        "slot": "Tennis Court 1, Jan 20 at 10:00 AM"
      },
      "actions": [
        {
          "label": "Book Now",
          "action": "book_slot",
          "url": "/bookings/create?court=7a8b9c0d&date=2026-01-20&time=10:00"
        }
      ],
      "created_at": "2026-01-14T18:00:00Z"
    }
  ],
  "unread_count": 2,
  "pagination": {
    "total": 2,
    "limit": 20,
    "offset": 0
  }
}
```

---

### Mark Notification as Read

**Endpoint:** `PATCH /api/notifications/:id/read`

**Response:** `200 OK`
```json
{
  "notification": {
    "id": "notif-001",
    "read": true,
    "read_at": "2026-01-14T21:00:00Z"
  }
}
```

---

## Admin Operations

### List Pending Bookings

**Endpoint:** `GET /api/admin/bookings/pending`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:** `200 OK`
```json
{
  "bookings": [
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "full_name": "John Doe",
        "email": "john.doe@example.com",
        "user_type": "new",
        "booking_history": {
          "total_bookings": 5,
          "completed_bookings": 4,
          "cancelled_bookings": 1
        }
      },
      "court": {
        "id": "8b9c0d1e-2345-6789-01bc-def234567890",
        "name": "Court 2"
      },
      "trainer": null,
      "booking_date": "2026-01-22",
      "start_time": "14:00:00",
      "end_time": "15:00:00",
      "total_fee": 50.00,
      "notes": "Regular player, prefers afternoon slots",
      "created_at": "2026-01-14T17:00:00Z",
      "time_pending": "4 hours"
    }
  ],
  "total_pending": 1
}
```

---

### Approve Booking

**Endpoint:** `PATCH /api/admin/bookings/:id/approve`

**Request:**
```json
{
  "admin_notes": "Approved - regular customer with good history"
}
```

**Response:** `200 OK`
```json
{
  "booking": {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "status": "confirmed",
    "admin_reviewed_by": "admin-uuid",
    "admin_review_notes": "Approved - regular customer with good history",
    "updated_at": "2026-01-14T21:30:00Z"
  },
  "notifications_sent": {
    "user": true,
    "trainer": false
  },
  "message": "Booking approved and user notified"
}
```

---

### Deny Booking

**Endpoint:** `PATCH /api/admin/bookings/:id/deny`

**Request:**
```json
{
  "reason": "Court maintenance scheduled for this time slot"
}
```

**Response:** `200 OK`
```json
{
  "booking": {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "status": "cancelled",
    "admin_reviewed_by": "admin-uuid",
    "admin_review_notes": "Court maintenance scheduled for this time slot",
    "updated_at": "2026-01-14T21:30:00Z"
  },
  "package_refund": {
    "refunded": false,
    "reason": "No package used"
  },
  "message": "Booking denied and user notified"
}
```

---

### Confirm Package Payment

**Endpoint:** `POST /api/admin/packages/confirm`

**Request:**
```json
{
  "user_package_id": "usr-pkg-12345",
  "payment_method": "cash",
  "admin_notes": "Received $550 cash - receipt #12345"
}
```

**Response:** `200 OK`
```json
{
  "user_package": {
    "id": "usr-pkg-12345",
    "status": "active",
    "payment_received": true,
    "payment_method": "cash",
    "confirmed_at": "2026-01-14T22:00:00Z",
    "confirmed_by": "admin-uuid",
    "admin_notes": "Received $550 cash - receipt #12345"
  },
  "sessions_activated": {
    "court_only": 10,
    "trainer": 2,
    "total": 12
  },
  "expires_at": "2026-04-15T00:00:00Z",
  "message": "Package activated and user notified"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "errors": [
      {
        "field": "booking_date",
        "message": "Date must be in the future",
        "code": "DATE_IN_PAST"
      },
      {
        "field": "start_time",
        "message": "Start time must be before end time",
        "code": "INVALID_TIME_RANGE"
      }
    ]
  },
  "timestamp": "2026-01-14T22:00:00Z"
}
```

---

### 401 Unauthorized

```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED",
  "message": "Please sign in to access this resource",
  "timestamp": "2026-01-14T22:00:00Z"
}
```

---

### 403 Forbidden

```json
{
  "error": "Insufficient permissions",
  "code": "FORBIDDEN",
  "message": "Admin access required for this operation",
  "timestamp": "2026-01-14T22:00:00Z"
}
```

---

### 404 Not Found

```json
{
  "error": "Resource not found",
  "code": "NOT_FOUND",
  "details": {
    "resource": "booking",
    "id": "invalid-id"
  },
  "timestamp": "2026-01-14T22:00:00Z"
}
```

---

### 409 Conflict

```json
{
  "error": "Court is already booked at this time",
  "code": "COURT_UNAVAILABLE",
  "details": {
    "court_id": "7a8b9c0d-1234-5678-90ab-cdef12345678",
    "conflicting_booking_id": "existing-booking-id",
    "alternative_slots": [
      {
        "start_time": "11:00:00",
        "end_time": "12:00:00",
        "available": true
      },
      {
        "start_time": "15:00:00",
        "end_time": "16:00:00",
        "available": true
      }
    ]
  },
  "timestamp": "2026-01-14T22:00:00Z"
}
```

---

### 422 Unprocessable Entity

```json
{
  "error": "Package cannot be applied to peak time booking",
  "code": "PACKAGE_PEAK_MISMATCH",
  "details": {
    "package_id": "usr-pkg-12345",
    "package_restriction": "off_peak_only",
    "booking_time": "2026-01-18T18:00:00Z",
    "is_peak_time": true,
    "suggestion": "Choose an off-peak time (weekdays 6 AM - 5 PM) or pay regular rate"
  },
  "timestamp": "2026-01-14T22:00:00Z"
}
```

---

### 500 Internal Server Error

```json
{
  "error": "An unexpected error occurred",
  "code": "INTERNAL_SERVER_ERROR",
  "message": "Please try again later or contact support if the issue persists",
  "request_id": "req-abc123",
  "timestamp": "2026-01-14T22:00:00Z"
}
```

---

## Rate Limiting

All API endpoints are rate limited:

**Headers in Response:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705267200
```

**429 Too Many Requests:**
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "You have exceeded the rate limit of 100 requests per minute",
  "retry_after": 45,
  "timestamp": "2026-01-14T22:00:00Z"
}
```

---

## Pagination

**Query Parameters:**
- `limit`: Number of results (default: 20, max: 100)
- `offset`: Skip N results (default: 0)

**Response Structure:**
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 40,
    "has_more": true,
    "next_offset": 60
  }
}
```

---

**Document Version:** 1.0
**Last Updated:** January 14, 2026
**Total Endpoints Documented:** 25+
