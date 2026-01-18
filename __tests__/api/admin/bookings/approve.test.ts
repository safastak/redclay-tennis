/**
 * Admin Booking Approval API Tests
 * Red Clay Tennis Booking Platform
 *
 * Integration tests for POST /api/admin/bookings/[id]/approve endpoint.
 *
 * Priority: HIGH - Core admin functionality
 */

import { createMocks } from 'node-mocks-http';
import {
  createTestBooking,
  generateTestToken,
  generateUUID,
} from '../../../helpers';
import {
  setupTestDatabase,
  teardownTestDatabase,
  addTestUser,
  addTestBooking,
  findTestBookingById,
  updateTestBooking,
} from '../../../helpers/db';

// Import the handler (to be implemented)
// import handler from '@/app/api/admin/bookings/[id]/approve/route';

// ============================================================================
// Mock Handler (remove when real implementation exists)
// ============================================================================

interface MockRequest {
  method: string;
  query: Record<string, string>;
  body: Record<string, unknown>;
  headers: Record<string, string>;
}

interface MockResponse {
  _getStatusCode: () => number;
  _getData: () => string;
  status: (code: number) => MockResponse;
  json: (data: unknown) => MockResponse;
}

// Stub handler for TDD - replace with actual import
async function handler(req: MockRequest, res: MockResponse): Promise<void> {
  // TODO: Implement actual handler in app/api/admin/bookings/[id]/approve/route.ts

  // Parse authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Decode token to check role (simplified)
  try {
    const tokenParts = authHeader.replace('Bearer ', '').split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString());

    if (payload.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }
  } catch {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  // Get booking ID from query
  const bookingId = req.query.id;
  if (!bookingId) {
    res.status(400).json({ error: 'Booking ID is required' });
    return;
  }

  // Find booking
  const booking = findTestBookingById(bookingId);
  if (!booking) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }

  // Check if booking is pending
  if (booking.status !== 'pending') {
    res.status(400).json({ error: 'Only pending bookings can be approved' });
    return;
  }

  // Update booking status
  const adminNotes = req.body.admin_notes as string | undefined;
  const updatedBooking = updateTestBooking(bookingId, {
    status: 'confirmed',
  });

  res.status(200).json({
    booking: updatedBooking,
    admin_notes: adminNotes,
  });
}

// ============================================================================
// Test Suite
// ============================================================================

describe('POST /api/admin/bookings/[id]/approve', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  // --------------------------------------------------------------------------
  // Successful Approval
  // --------------------------------------------------------------------------

  describe('Successful Approval', () => {
    test('admin can approve pending booking', async () => {
      const booking = addTestBooking({ status: 'pending' });
      const token = generateTestToken({ userId: 'admin-1', role: 'admin' });

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: booking.id },
        body: { admin_notes: 'Approved by test' },
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.booking.status).toBe('confirmed');
    });

    test('approval includes admin notes', async () => {
      const booking = addTestBooking({ status: 'pending' });
      const token = generateTestToken({ userId: 'admin-1', role: 'admin' });
      const adminNotes = 'Approved after phone verification';

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: booking.id },
        body: { admin_notes: adminNotes },
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.admin_notes).toBe(adminNotes);
    });

    test('approval without notes succeeds', async () => {
      const booking = addTestBooking({ status: 'pending' });
      const token = generateTestToken({ userId: 'admin-1', role: 'admin' });

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: booking.id },
        body: {},
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(200);
    });
  });

  // --------------------------------------------------------------------------
  // Authorization Errors
  // --------------------------------------------------------------------------

  describe('Authorization Errors', () => {
    test('non-admin cannot approve booking', async () => {
      const booking = addTestBooking({ status: 'pending' });
      const token = generateTestToken({ userId: 'member-1', role: 'member' });

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: booking.id },
        body: {},
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(403);
      const data = JSON.parse(res._getData());
      expect(data.error).toContain('Admin');
    });

    test('trainer cannot approve booking', async () => {
      const booking = addTestBooking({ status: 'pending' });
      const token = generateTestToken({ userId: 'trainer-1', role: 'trainer' });

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: booking.id },
        body: {},
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(403);
    });

    test('request without token is rejected', async () => {
      const booking = addTestBooking({ status: 'pending' });

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: booking.id },
        body: {},
        headers: {},
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(401);
    });
  });

  // --------------------------------------------------------------------------
  // Booking Status Validation
  // --------------------------------------------------------------------------

  describe('Booking Status Validation', () => {
    test('cannot approve already confirmed booking', async () => {
      const booking = addTestBooking({ status: 'confirmed' });
      const token = generateTestToken({ userId: 'admin-1', role: 'admin' });

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: booking.id },
        body: {},
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toContain('pending');
    });

    test('cannot approve cancelled booking', async () => {
      const booking = addTestBooking({ status: 'cancelled' });
      const token = generateTestToken({ userId: 'admin-1', role: 'admin' });

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: booking.id },
        body: {},
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(400);
    });

    test('cannot approve completed booking', async () => {
      const booking = addTestBooking({ status: 'completed' });
      const token = generateTestToken({ userId: 'admin-1', role: 'admin' });

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: booking.id },
        body: {},
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(400);
    });
  });

  // --------------------------------------------------------------------------
  // Booking Not Found
  // --------------------------------------------------------------------------

  describe('Booking Not Found', () => {
    test('returns 404 for non-existent booking', async () => {
      const token = generateTestToken({ userId: 'admin-1', role: 'admin' });

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'non-existent-booking-id' },
        body: {},
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(404);
      const data = JSON.parse(res._getData());
      expect(data.error).toContain('not found');
    });

    test('returns 400 when booking ID is missing', async () => {
      const token = generateTestToken({ userId: 'admin-1', role: 'admin' });

      const { req, res } = createMocks({
        method: 'POST',
        query: {}, // No ID
        body: {},
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(400);
    });
  });
});

// ============================================================================
// Deny Endpoint Tests
// ============================================================================

describe('POST /api/admin/bookings/[id]/deny', () => {
  // Stub handler for deny endpoint
  async function denyHandler(req: MockRequest, res: MockResponse): Promise<void> {
    // TODO: Implement actual handler in app/api/admin/bookings/[id]/deny/route.ts

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const tokenParts = authHeader.replace('Bearer ', '').split('.');
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString());

      if (payload.role !== 'admin') {
        res.status(403).json({ error: 'Forbidden: Admin access required' });
        return;
      }
    } catch {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const bookingId = req.query.id;
    if (!bookingId) {
      res.status(400).json({ error: 'Booking ID is required' });
      return;
    }

    const booking = findTestBookingById(bookingId);
    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (booking.status !== 'pending') {
      res.status(400).json({ error: 'Only pending bookings can be denied' });
      return;
    }

    const reason = req.body.reason as string | undefined;
    if (!reason) {
      res.status(400).json({ error: 'Denial reason is required' });
      return;
    }

    const updatedBooking = updateTestBooking(bookingId, {
      status: 'cancelled',
    });

    res.status(200).json({
      booking: updatedBooking,
      denial_reason: reason,
    });
  }

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  test('admin can deny pending booking with reason', async () => {
    const booking = addTestBooking({ status: 'pending' });
    const token = generateTestToken({ userId: 'admin-1', role: 'admin' });

    const { req, res } = createMocks({
      method: 'POST',
      query: { id: booking.id },
      body: { reason: 'User verification failed' },
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    await denyHandler(req as unknown as MockRequest, res as unknown as MockResponse);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.booking.status).toBe('cancelled');
    expect(data.denial_reason).toBe('User verification failed');
  });

  test('denial requires a reason', async () => {
    const booking = addTestBooking({ status: 'pending' });
    const token = generateTestToken({ userId: 'admin-1', role: 'admin' });

    const { req, res } = createMocks({
      method: 'POST',
      query: { id: booking.id },
      body: {}, // No reason
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    await denyHandler(req as unknown as MockRequest, res as unknown as MockResponse);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toContain('reason');
  });

  test('non-admin cannot deny booking', async () => {
    const booking = addTestBooking({ status: 'pending' });
    const token = generateTestToken({ userId: 'member-1', role: 'member' });

    const { req, res } = createMocks({
      method: 'POST',
      query: { id: booking.id },
      body: { reason: 'Test reason' },
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    await denyHandler(req as unknown as MockRequest, res as unknown as MockResponse);

    expect(res._getStatusCode()).toBe(403);
  });
});
