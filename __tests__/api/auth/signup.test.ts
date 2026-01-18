/**
 * User Signup API Tests
 * Red Clay Tennis Booking Platform
 *
 * Integration tests for POST /api/auth/signup endpoint.
 *
 * Priority: HIGH - Core authentication functionality
 */

import { createMocks } from 'node-mocks-http';
import {
  createTestUser,
  generateUUID,
} from '../../helpers';
import {
  setupTestDatabase,
  teardownTestDatabase,
  addTestUser,
  getTestDatabaseState,
} from '../../helpers/db';

// Import the handler (to be implemented)
// import handler from '@/app/api/auth/signup/route';

// ============================================================================
// Mock Handler (remove when real implementation exists)
// ============================================================================

interface MockRequest {
  method: string;
  body: Record<string, unknown>;
  headers: Record<string, string>;
}

interface MockResponse {
  _getStatusCode: () => number;
  _getData: () => string;
  status: (code: number) => MockResponse;
  json: (data: unknown) => MockResponse;
}

// Track created users for duplicate detection
const createdEmails = new Set<string>();

// Stub handler for TDD - replace with actual import
async function handler(req: MockRequest, res: MockResponse): Promise<void> {
  // TODO: Implement actual handler in app/api/auth/signup/route.ts

  const { email, password, full_name, phone } = req.body;

  // Validate required fields
  if (!email || !password || !full_name) {
    res.status(400).json({ error: 'Missing required fields: email, password, and full_name are required' });
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email as string)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }

  // Validate password strength
  const passwordStr = password as string;
  if (passwordStr.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  // Check for duplicate email
  if (createdEmails.has((email as string).toLowerCase())) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  // Create user
  const user = createTestUser({
    id: generateUUID(),
    email: email as string,
    full_name: full_name as string,
    phone: (phone as string) || '',
    userType: 'new',
    role: 'member',
  });

  createdEmails.add((email as string).toLowerCase());

  // Generate token (simplified)
  const token = `test-token-${user.id}`;

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      user_type: user.user_type,
      role: user.role,
    },
    token,
  });
}

// ============================================================================
// Test Suite
// ============================================================================

describe('POST /api/auth/signup', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(() => {
    // Clear created emails before each test
    createdEmails.clear();
  });

  // --------------------------------------------------------------------------
  // Successful Registration
  // --------------------------------------------------------------------------

  describe('Successful Registration', () => {
    test('creates new user with valid input', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'newuser@example.com',
          password: 'SecurePass123',
          full_name: 'John Doe',
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('newuser@example.com');
      expect(data.user.full_name).toBe('John Doe');
      expect(data.token).toBeDefined();
    });

    test('creates user with phone number', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'userphone@example.com',
          password: 'SecurePass123',
          full_name: 'Jane Doe',
          phone: '+1234567890',
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.user).toBeDefined();
    });

    test('new user has "new" user_type', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'newtype@example.com',
          password: 'SecurePass123',
          full_name: 'New User',
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.user.user_type).toBe('new');
    });

    test('new user has "member" role', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'member@example.com',
          password: 'SecurePass123',
          full_name: 'Member User',
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.user.role).toBe('member');
    });

    test('does not return password in response', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'nopassword@example.com',
          password: 'SecurePass123',
          full_name: 'No Password',
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.user.password).toBeUndefined();
      expect(data.password).toBeUndefined();
    });
  });

  // --------------------------------------------------------------------------
  // Validation Errors
  // --------------------------------------------------------------------------

  describe('Validation Errors', () => {
    test('rejects signup without email', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          password: 'SecurePass123',
          full_name: 'No Email',
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toContain('required');
    });

    test('rejects signup without password', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'nopassword@example.com',
          full_name: 'No Password',
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toContain('required');
    });

    test('rejects signup without full_name', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'noname@example.com',
          password: 'SecurePass123',
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toContain('required');
    });

    test('rejects invalid email format', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'invalid-email',
          password: 'SecurePass123',
          full_name: 'Invalid Email',
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toContain('email');
    });

    test('rejects weak password', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'weakpass@example.com',
          password: 'short', // Too short
          full_name: 'Weak Password',
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toContain('Password');
    });
  });

  // --------------------------------------------------------------------------
  // Duplicate Email
  // --------------------------------------------------------------------------

  describe('Duplicate Email', () => {
    test('rejects duplicate email', async () => {
      // First registration
      const { req: req1, res: res1 } = createMocks({
        method: 'POST',
        body: {
          email: 'duplicate@example.com',
          password: 'SecurePass123',
          full_name: 'First User',
        },
      });

      await handler(req1 as unknown as MockRequest, res1 as unknown as MockResponse);
      expect(res1._getStatusCode()).toBe(201);

      // Second registration with same email
      const { req: req2, res: res2 } = createMocks({
        method: 'POST',
        body: {
          email: 'duplicate@example.com',
          password: 'AnotherPass123',
          full_name: 'Second User',
        },
      });

      await handler(req2 as unknown as MockRequest, res2 as unknown as MockResponse);

      expect(res2._getStatusCode()).toBe(409);
      const data = JSON.parse(res2._getData());
      expect(data.error).toContain('already registered');
    });

    test('email comparison is case-insensitive', async () => {
      // First registration
      const { req: req1, res: res1 } = createMocks({
        method: 'POST',
        body: {
          email: 'CaseTest@example.com',
          password: 'SecurePass123',
          full_name: 'Case User',
        },
      });

      await handler(req1 as unknown as MockRequest, res1 as unknown as MockResponse);
      expect(res1._getStatusCode()).toBe(201);

      // Second registration with different case
      const { req: req2, res: res2 } = createMocks({
        method: 'POST',
        body: {
          email: 'casetest@example.com',
          password: 'AnotherPass123',
          full_name: 'Case User 2',
        },
      });

      await handler(req2 as unknown as MockRequest, res2 as unknown as MockResponse);

      expect(res2._getStatusCode()).toBe(409);
    });
  });

  // --------------------------------------------------------------------------
  // Token Generation
  // --------------------------------------------------------------------------

  describe('Token Generation', () => {
    test('returns valid token on successful signup', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'tokentest@example.com',
          password: 'SecurePass123',
          full_name: 'Token Test',
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.token).toBeDefined();
      expect(typeof data.token).toBe('string');
      expect(data.token.length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // Edge Cases
  // --------------------------------------------------------------------------

  describe('Edge Cases', () => {
    test('handles unicode characters in name', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'unicode@example.com',
          password: 'SecurePass123',
          full_name: 'Иван Петров', // Cyrillic
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(201);
      const data = JSON.parse(res._getData());
      expect(data.user.full_name).toBe('Иван Петров');
    });

    test('handles email with plus sign', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'user+tag@example.com',
          password: 'SecurePass123',
          full_name: 'Plus User',
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      expect(res._getStatusCode()).toBe(201);
    });

    test('handles very long name', async () => {
      const longName = 'A'.repeat(200);
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: 'longname@example.com',
          password: 'SecurePass123',
          full_name: longName,
        },
      });

      await handler(req as unknown as MockRequest, res as unknown as MockResponse);

      // Should either accept or reject with proper validation
      expect([201, 400]).toContain(res._getStatusCode());
    });
  });
});
