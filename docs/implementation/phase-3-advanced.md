# Phase 3: Advanced Features Implementation
## Red Clay Tennis Booking Platform

**Timeline:** Weeks 7-9
**Goal:** Multi-channel notifications, Telegram integration, and AI recommendations
**Team:** 2-3 full-stack developers

---

## Phase Overview

Phase 3 adds advanced features for engagement and automation:
- Multi-channel notification system
- Telegram bot integration
- AI-powered booking recommendations
- Real-time WebSocket updates

By end of Phase 3, the platform offers:
- Notifications via in-app, email, SMS, and Telegram
- Natural language booking via Telegram
- Smart booking suggestions based on user behavior
- Real-time updates for active users

---

## Week 7: Multi-Channel Notifications

### Tasks
1. In-App Notifications
2. Email Notifications
3. SMS Notifications (Optional)
4. Notification Preferences
5. WebSocket Real-Time Updates

### Key Implementation

#### Notification Service

**File:** `/lib/notifications.ts`

```typescript
import { pool } from './db'
import { sendEmail } from './email'
import { sendSMS } from './sms'
import { sendTelegramMessage } from './telegram'

interface NotificationData {
  userId: string
  type: string
  data: Record<string, any>
}

export async function sendNotification(userId: string, type: string, data: Record<string, any>) {
  try {
    // Get user preferences
    const prefs = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = $1',
      [userId]
    )

    const preferences = prefs.rows[0] || {
      in_app: true,
      email: true,
      sms: false,
      telegram: false
    }

    // Create in-app notification (always)
    await pool.query(
      `INSERT INTO notifications (user_id, type, data, status)
       VALUES ($1, $2, $3, 'unread')`,
      [userId, type, JSON.stringify(data)]
    )

    // Get user contact info
    const user = await pool.query(
      'SELECT email, phone_number, telegram_chat_id FROM users WHERE id = $1',
      [userId]
    )

    const userInfo = user.rows[0]

    // Send email if enabled
    if (preferences.email && userInfo.email) {
      await sendEmail({
        to: userInfo.email,
        template: type,
        data
      })
    }

    // Send SMS if enabled
    if (preferences.sms && userInfo.phone_number) {
      await sendSMS({
        to: userInfo.phone_number,
        template: type,
        data
      })
    }

    // Send Telegram if enabled
    if (preferences.telegram && userInfo.telegram_chat_id) {
      await sendTelegramMessage({
        chatId: userInfo.telegram_chat_id,
        template: type,
        data
      })
    }

    // Emit WebSocket event for real-time update
    emitToUser(userId, 'notification', { type, data })

  } catch (error) {
    console.error('Notification error:', error)
    // Don't throw - notifications are non-critical
  }
}
```

#### WebSocket Server

**File:** `/lib/websocket.ts`

```typescript
import { Server } from 'socket.io'
import { verifyToken } from './auth'

export function initializeWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL,
      credentials: true
    }
  })

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      const user = await verifyToken(token)
      socket.userId = user.id
      next()
    } catch (error) {
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`)

    // Join user-specific room
    socket.join(`user:${socket.userId}`)

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`)
    })
  })

  return io
}

export function emitToUser(userId: string, event: string, data: any) {
  global.io?.to(`user:${userId}`).emit(event, data)
}
```

### Documentation Reference
- See [Notifications Feature](../features/phase-3-advanced/09-notifications.md) for notification system
- See [Notification Architecture](../architecture/notification-system.md) for system design

---

## Week 8: Telegram Integration

### Tasks
1. Telegram Bot Setup
2. Account Linking
3. Natural Language Booking
4. Telegram Notifications

### Key Implementation

#### Telegram Bot Handler

**File:** `/lib/telegram-bot.ts`

```typescript
import TelegramBot from 'node-telegram-bot-api'
import { pool } from './db'

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })

// Command: /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id

  await bot.sendMessage(
    chatId,
    'Welcome to Red Clay Tennis! To link your account, use: /link <your-email>'
  )
})

// Command: /link <email>
bot.onText(/\/link (.+)/, async (msg, match) => {
  const chatId = msg.chat.id
  const email = match[1]

  try {
    // Find user by email
    const user = await pool.query(
      'SELECT id, full_name FROM users WHERE email = $1',
      [email]
    )

    if (user.rows.length === 0) {
      await bot.sendMessage(chatId, 'Email not found. Please sign up first on our website.')
      return
    }

    // Generate linking code
    const linkCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Store linking code
    await pool.query(
      `INSERT INTO telegram_link_codes (user_id, code, chat_id, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '10 minutes')`,
      [user.rows[0].id, linkCode, chatId]
    )

    await bot.sendMessage(
      chatId,
      `Hi ${user.rows[0].full_name}! Your linking code is: ${linkCode}\n\nEnter this code on the website to complete linking.`
    )
  } catch (error) {
    console.error('Telegram link error:', error)
    await bot.sendMessage(chatId, 'An error occurred. Please try again.')
  }
})

// Command: /book
bot.onText(/\/book/, async (msg) => {
  const chatId = msg.chat.id

  // Check if user is linked
  const user = await pool.query(
    'SELECT id FROM users WHERE telegram_chat_id = $1',
    [chatId]
  )

  if (user.rows.length === 0) {
    await bot.sendMessage(chatId, 'Please link your account first with /link <email>')
    return
  }

  await bot.sendMessage(
    chatId,
    'What would you like to book? Examples:\n' +
    '- "Tennis court tomorrow at 3pm"\n' +
    '- "Pickleball on Friday 10am with trainer"\n' +
    '- "Court 2 next Monday 4pm"'
  )
})

// Handle natural language booking
bot.on('message', async (msg) => {
  // Skip if it's a command
  if (msg.text?.startsWith('/')) return

  const chatId = msg.chat.id

  // Check if user is linked
  const user = await pool.query(
    'SELECT id FROM users WHERE telegram_chat_id = $1',
    [chatId]
  )

  if (user.rows.length === 0) return

  // Parse booking intent
  try {
    const booking = await parseBookingIntent(msg.text, user.rows[0].id)

    if (booking) {
      await bot.sendMessage(
        chatId,
        `I found:\n` +
        `Sport: ${booking.sport}\n` +
        `Date: ${booking.date}\n` +
        `Time: ${booking.time}\n\n` +
        `Reply "confirm" to book, or provide more details.`
      )
    } else {
      await bot.sendMessage(
        chatId,
        'I didn\'t quite understand that. Try: "Tennis court tomorrow at 3pm"'
      )
    }
  } catch (error) {
    console.error('Booking parse error:', error)
    await bot.sendMessage(chatId, 'Sorry, I had trouble understanding that.')
  }
})

async function parseBookingIntent(text: string, userId: string) {
  // Simple NLP parsing (can be enhanced with GPT/Claude API)
  const sports = ['tennis', 'pickleball']
  const sport = sports.find(s => text.toLowerCase().includes(s))

  // Parse date
  const tomorrow = text.toLowerCase().includes('tomorrow')
  const date = tomorrow
    ? new Date(Date.now() + 24 * 60 * 60 * 1000)
    : null

  // Parse time (simple regex)
  const timeMatch = text.match(/(\d{1,2})(am|pm|:)/i)
  const time = timeMatch ? timeMatch[0] : null

  if (sport && date && time) {
    return { sport, date, time }
  }

  return null
}

export { bot }
```

### Documentation Reference
- See [Telegram Integration Feature](../features/phase-3-advanced/10-telegram-integration.md) for Telegram features

---

## Week 9: AI Recommendations

### Tasks
1. User Behavior Tracking
2. Recommendation Generation
3. AI Dashboard Widget
4. Accept/Reject Interactions

### Key Implementation

#### Behavior Tracking

**File:** `/lib/analytics.ts`

```typescript
export async function trackUserBehavior(userId: string, action: string, metadata: Record<string, any>) {
  try {
    await pool.query(
      `INSERT INTO user_behavior (user_id, action, metadata, timestamp)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
      [userId, action, JSON.stringify(metadata)]
    )
  } catch (error) {
    console.error('Behavior tracking error:', error)
  }
}

// Usage examples:
// trackUserBehavior(userId, 'booking_viewed', { court_id, date, time })
// trackUserBehavior(userId, 'booking_created', { booking_id, sport })
// trackUserBehavior(userId, 'package_purchased', { package_id })
```

#### Recommendation Engine

**File:** `/lib/recommendations.ts`

```typescript
export async function generateRecommendations(userId: string) {
  try {
    // Get user's past bookings
    const bookings = await pool.query(
      `SELECT
        court_id,
        booking_date,
        start_time,
        sport_type,
        trainer_id
       FROM bookings b
       JOIN courts c ON b.court_id = c.id
       WHERE b.user_id = $1 AND b.status = 'confirmed'
       ORDER BY b.booking_date DESC
       LIMIT 10`,
      [userId]
    )

    // Analyze patterns
    const patterns = analyzeBookingPatterns(bookings.rows)

    // Get user behavior
    const behavior = await pool.query(
      `SELECT action, metadata
       FROM user_behavior
       WHERE user_id = $1 AND timestamp > NOW() - INTERVAL '30 days'
       ORDER BY timestamp DESC`,
      [userId]
    )

    // Generate recommendations
    const recommendations = []

    // Recommendation 1: Same time/day pattern
    if (patterns.preferredDay && patterns.preferredTime) {
      const nextDate = getNextOccurrence(patterns.preferredDay)

      recommendations.push({
        type: 'recurring_pattern',
        title: `Book your usual ${patterns.preferredDay} slot?`,
        description: `${patterns.sport} at ${patterns.preferredTime}`,
        action: {
          court_id: patterns.preferredCourt,
          booking_date: nextDate,
          start_time: patterns.preferredTime
        },
        confidence: 0.85
      })
    }

    // Recommendation 2: Try a new court
    if (patterns.sport) {
      const unusedCourts = await pool.query(
        `SELECT id, name FROM courts
         WHERE sport_type = $1
           AND id NOT IN (
             SELECT DISTINCT court_id FROM bookings WHERE user_id = $2
           )
         LIMIT 1`,
        [patterns.sport, userId]
      )

      if (unusedCourts.rows.length > 0) {
        recommendations.push({
          type: 'explore_new',
          title: `Try ${unusedCourts.rows[0].name}`,
          description: `You haven't played here yet!`,
          action: {
            court_id: unusedCourts.rows[0].id
          },
          confidence: 0.65
        })
      }
    }

    // Recommendation 3: Package suggestion
    const shouldSuggestPackage = patterns.bookingsPerMonth >= 4
    if (shouldSuggestPackage) {
      const packages = await pool.query(
        `SELECT * FROM package_classes
         WHERE sport_type = $1 AND is_active = true
         ORDER BY price / NULLIF(total_court_sessions, 0) ASC
         LIMIT 1`,
        [patterns.sport]
      )

      if (packages.rows.length > 0) {
        const pkg = packages.rows[0]
        recommendations.push({
          type: 'package_savings',
          title: 'Save with a package',
          description: `You book ${patterns.bookingsPerMonth}x/month. Save ${pkg.savings_percent}% with the ${pkg.name}`,
          action: {
            package_class_id: pkg.id
          },
          confidence: 0.9
        })
      }
    }

    // Store recommendations
    for (const rec of recommendations) {
      await pool.query(
        `INSERT INTO ai_recommendations (user_id, type, title, description, action, confidence, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
        [userId, rec.type, rec.title, rec.description, JSON.stringify(rec.action), rec.confidence]
      )
    }

    return recommendations
  } catch (error) {
    console.error('Recommendation generation error:', error)
    return []
  }
}

function analyzeBookingPatterns(bookings) {
  // Analyze day of week
  const dayCount = {}
  const timeCount = {}
  const courtCount = {}
  let sportType = null

  for (const booking of bookings) {
    const day = new Date(booking.booking_date).toLocaleDateString('en-US', { weekday: 'long' })
    dayCount[day] = (dayCount[day] || 0) + 1

    const time = booking.start_time.substring(0, 5) // HH:MM
    timeCount[time] = (timeCount[time] || 0) + 1

    courtCount[booking.court_id] = (courtCount[booking.court_id] || 0) + 1

    sportType = booking.sport_type
  }

  const preferredDay = Object.keys(dayCount).sort((a, b) => dayCount[b] - dayCount[a])[0]
  const preferredTime = Object.keys(timeCount).sort((a, b) => timeCount[b] - timeCount[a])[0]
  const preferredCourt = Object.keys(courtCount).sort((a, b) => courtCount[b] - courtCount[a])[0]

  return {
    preferredDay,
    preferredTime,
    preferredCourt,
    sport: sportType,
    bookingsPerMonth: bookings.length / 3 // Assuming 3 months of data
  }
}
```

### Documentation Reference
- See [AI Recommendations Feature](../features/phase-3-advanced/11-ai-recommendations.md) for AI features

---

## Verification & Testing

### Week 7 Verification
```bash
# Test in-app notification
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"user_id": "user-1", "type": "test", "data": {}}'

# Test WebSocket connection
# Use browser console:
const socket = io('ws://localhost:3000', { auth: { token: '<token>' } })
socket.on('notification', (data) => console.log('Notification:', data))
```

### Week 8 Verification
```bash
# Test Telegram bot
# 1. Message your bot on Telegram: /start
# 2. Link account: /link your-email@example.com
# 3. Try booking: "Tennis court tomorrow at 3pm"
```

### Week 9 Verification
```bash
# Test recommendation generation
curl http://localhost:3000/api/recommendations \
  -H "Authorization: Bearer <token>"

# Expected: Array of recommendation objects
```

---

## Phase 3 Deliverables

### Features Completed
- ✅ Multi-channel notification system
- ✅ User notification preferences
- ✅ Real-time WebSocket updates
- ✅ Telegram bot integration
- ✅ Natural language booking via Telegram
- ✅ AI-powered booking recommendations
- ✅ User behavior analytics
- ✅ Package savings suggestions

### Database Tables Used
- `notifications` - In-app notifications
- `notification_preferences` - User preferences
- `telegram_link_codes` - Account linking
- `user_behavior` - Analytics tracking
- `ai_recommendations` - AI suggestions

### API Endpoints Created
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications/mark-read` - Mark as read
- `PUT /api/notifications/preferences` - Update preferences
- `GET /api/recommendations` - Get AI recommendations
- `POST /api/recommendations/[id]/accept` - Accept recommendation
- `POST /api/recommendations/[id]/reject` - Reject recommendation

---

## Success Criteria

Phase 3 is complete when:
- [ ] Notifications sent via all enabled channels
- [ ] WebSocket real-time updates working
- [ ] Telegram bot responding to commands
- [ ] Natural language booking functional
- [ ] AI recommendations generated daily
- [ ] Users can accept/reject recommendations
- [ ] All tests passing for new features
- [ ] Feature flags working correctly

---

## Common Issues & Solutions

### Issue: WebSocket Connection Failing
**Symptom:** Real-time updates not working

**Solution:**
- Check CORS configuration in WebSocket server
- Verify token is passed in auth handshake
- Test WebSocket endpoint directly

### Issue: Telegram Bot Not Responding
**Symptom:** Bot commands not working

**Solution:**
- Verify TELEGRAM_BOT_TOKEN is set correctly
- Check bot is running (`polling: true`)
- Test with /start command first

### Issue: AI Recommendations Empty
**Symptom:** No recommendations generated

**Solution:**
- Ensure user has booking history (10+ bookings)
- Check user_behavior table has data
- Verify recommendation generation cron job running

---

## Next Steps

After completing Phase 3:
- **Launch preparation** - Final QA and staging
- **User onboarding** - Create tutorial for new features
- **Marketing preparation** - Highlight AI and Telegram features
- **Monitor adoption** - Track usage of advanced features
- **Iterate based on feedback** - Improve recommendation algorithm

---

## Production Deployment

### Feature Flags
Enable Phase 3 features gradually:

```bash
# Enable notifications (low risk)
ENABLE_NOTIFICATIONS=true

# Enable Telegram (medium risk)
ENABLE_TELEGRAM_BOT=true

# Enable AI recommendations (monitor performance)
ENABLE_AI_RECOMMENDATIONS=true
```

### Monitoring
Track key metrics:
- Notification delivery success rate
- WebSocket connection stability
- Telegram bot response time
- AI recommendation acceptance rate
- User engagement with notifications

---

**Phase Duration:** 3 weeks
**Estimated Effort:** 120-180 developer hours
**Team Size:** 2-3 full-stack developers
**Risk Level:** Medium-High (third-party integrations)

---

**Document Version:** 2.0
**Last Updated:** January 14, 2026
