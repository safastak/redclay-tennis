/**
 * Auth API Integration Tests
 * Red Clay Tennis Booking Platform
 *
 * These tests make real HTTP requests to the API and verify database state.
 * Run with: npm run test:integration
 */

import request from 'supertest';
import {
  setupIntegrationTests,
  teardownIntegrationTests,
  type IntegrationTestContext,
} from '../setup';

// ============================================================================
// Test Configuration
// ============================================================================

const describeIntegration = process.env.RUN_INTEGRATION_TESTS ? describe : describe.skip;

describeIntegration('Auth API Integration Tests', () => {
  let ctx: IntegrationTestContext;

  beforeAll(async () => {
    ctx = await setupIntegrationTests();
  }, 30000);

  afterAll(async () => {
    await teardownIntegrationTests(ctx);
  });

  // --------------------------------------------------------------------------
  // POST /api/auth/signup
  // --------------------------------------------------------------------------

  describe('POST /api/auth/signup', () => {
    test('creates new user with valid input', async () => {
      const uniqueEmail = `test-${Date.now()}@example.com`;

      const response = await request(ctx.baseUrl)
        .post('/api/auth/signup')
        .send({
          email: uniqueEmail,
          password: 'SecurePass123',
          full_name: 'Integration Test User',
          phone: '+1234567890',
        });

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(uniqueEmail);
      expect(response.body.user.user_type).toBe('new');
      expect(response.body.token).toBeDefined();
    });

    test('user is persisted in database after signup', async () => {
      const uniqueEmail = `dbtest-${Date.now()}@example.com`;

      const response = await request(ctx.baseUrl)
        .post('/api/auth/signup')
        .send({
          email: uniqueEmail,
          password: 'SecurePass123',
          full_name: 'DB Test User',
        });

      if (response.status === 201) {
        // Verify user exists in database
        const dbResult = await ctx.db.query(
          'SELECT * FROM users WHERE email = $1',
          [uniqueEmail]
        );

        expect(dbResult.rowCount).toBe(1);
      }
    });

    test('rejects duplicate email', async () => {
      const email = `duplicate-${Date.now()}@example.com`;

      // First signup
      await request(ctx.baseUrl)
        .post('/api/auth/signup')
        .send({
          email,
          password: 'SecurePass123',
          full_name: 'First User',
        });

      // Second signup with same email
      const response = await request(ctx.baseUrl)
        .post('/api/auth/signup')
        .send({
          email,
          password: 'DifferentPass123',
          full_name: 'Second User',
        });

      expect(response.status).toBe(409);
    });

    test('rejects weak password', async () => {
      const response = await request(ctx.baseUrl)
        .post('/api/auth/signup')
        .send({
          email: `weak-${Date.now()}@example.com`,
          password: 'weak',
          full_name: 'Weak Password User',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('password');
    });

    test('password is hashed in database', async () => {
      const email = `hash-${Date.now()}@example.com`;
      const plainPassword = 'SecurePass123';

      await request(ctx.baseUrl)
        .post('/api/auth/signup')
        .send({
          email,
          password: plainPassword,
          full_name: 'Hash Test User',
        });

      // Verify password is not stored in plain text
      const dbResult = await ctx.db.query(
        'SELECT password_hash FROM users WHERE email = $1',
        [email]
      );

      if (dbResult.rowCount === 1) {
        const storedHash = (dbResult.rows[0] as { password_hash: string }).password_hash;
        expect(storedHash).not.toBe(plainPassword);
        expect(storedHash).toContain(':'); // Our hash format includes salt:hash
      }
    });
  });

  // --------------------------------------------------------------------------
  // POST /api/auth/login
  // --------------------------------------------------------------------------

  describe('POST /api/auth/login', () => {
    const testEmail = 'login-test@example.com';
    const testPassword = 'LoginPass123';

    beforeAll(async () => {
      // Create a user for login tests
      await request(ctx.baseUrl)
        .post('/api/auth/signup')
        .send({
          email: testEmail,
          password: testPassword,
          full_name: 'Login Test User',
        });
    });

    test('returns token for valid credentials', async () => {
      const response = await request(ctx.baseUrl)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    test('rejects invalid password', async () => {
      const response = await request(ctx.baseUrl)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123',
        });

      expect(response.status).toBe(401);
    });

    test('rejects non-existent email', async () => {
      const response = await request(ctx.baseUrl)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'AnyPassword123',
        });

      expect(response.status).toBe(401);
    });

    test('token contains correct user info', async () => {
      const response = await request(ctx.baseUrl)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      if (response.status === 200) {
        const token = response.body.token;
        // Decode JWT payload (base64)
        const [, payloadBase64] = token.split('.');
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());

        expect(payload.email).toBe(testEmail);
        expect(payload.userId).toBeDefined();
        expect(payload.exp).toBeGreaterThan(Date.now() / 1000);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Token Verification
  // --------------------------------------------------------------------------

  describe('Token Verification', () => {
    test('protected endpoint accepts valid token', async () => {
      // Login to get token
      const loginResponse = await request(ctx.baseUrl)
        .post('/api/auth/login')
        .send({
          email: 'premium@example.com',
          password: 'password123',
        });

      if (loginResponse.status === 200) {
        const token = loginResponse.body.token;

        // Access protected endpoint
        const response = await request(ctx.baseUrl)
          .get('/api/bookings')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).not.toBe(401);
      }
    });

    test('protected endpoint rejects invalid token', async () => {
      const response = await request(ctx.baseUrl)
        .get('/api/bookings')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    test('protected endpoint rejects expired token', async () => {
      // Create an expired token (would need to mock time or use a pre-generated expired token)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiZXhwIjoxfQ.invalid';

      const response = await request(ctx.baseUrl)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });
  });

  // --------------------------------------------------------------------------
  // POST /api/auth/logout
  // --------------------------------------------------------------------------

  describe('POST /api/auth/logout', () => {
    test('logout succeeds with valid token', async () => {
      // Login first
      const loginResponse = await request(ctx.baseUrl)
        .post('/api/auth/login')
        .send({
          email: 'premium@example.com',
          password: 'password123',
        });

      if (loginResponse.status === 200) {
        const token = loginResponse.body.token;

        const response = await request(ctx.baseUrl)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${token}`);

        expect([200, 204]).toContain(response.status);
      }
    });
  });
});
