/**
 * Integration Test Setup
 * Red Clay Tennis Booking Platform
 *
 * Provides database connection, seeding, and cleanup for integration tests.
 */

import { createServer, Server } from 'http';

// ============================================================================
// Types
// ============================================================================

export interface TestDatabase {
  query: <T = unknown>(sql: string, params?: unknown[]) => Promise<{ rows: T[]; rowCount: number }>;
  connect: () => Promise<void>;
  end: () => Promise<void>;
}

export interface IntegrationTestContext {
  db: TestDatabase;
  server: Server;
  baseUrl: string;
}

// ============================================================================
// Configuration
// ============================================================================

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test_user:test_password@localhost:5433/redclay_test';
const TEST_PORT = 3001;

// ============================================================================
// Database Connection
// ============================================================================

/**
 * Create a database connection for testing
 * Note: Install 'pg' package when using real Postgres
 */
export async function createTestDatabase(): Promise<TestDatabase> {
  // For now, return a mock that can be replaced with real pg client
  // TODO: Replace with real pg.Pool when database is set up

  const mockDb: TestDatabase = {
    query: async <T = unknown>(sql: string, _params?: unknown[]): Promise<{ rows: T[]; rowCount: number }> => {
      console.log('[Mock DB] Query:', sql.slice(0, 100));
      return { rows: [] as T[], rowCount: 0 };
    },
    connect: async () => {
      console.log('[Mock DB] Connected to:', DATABASE_URL);
    },
    end: async () => {
      console.log('[Mock DB] Connection closed');
    },
  };

  return mockDb;
}

/**
 * Real database connection (uncomment when pg is installed)
 */
// import { Pool } from 'pg';
// export async function createRealTestDatabase(): Promise<TestDatabase> {
//   const pool = new Pool({ connectionString: DATABASE_URL });
//   await pool.connect();
//   return {
//     query: (sql, params) => pool.query(sql, params),
//     connect: async () => { await pool.connect(); },
//     end: async () => { await pool.end(); },
//   };
// }

// ============================================================================
// Database Seeding
// ============================================================================

/**
 * Seed the test database with initial data
 */
export async function seedTestDatabase(db: TestDatabase): Promise<void> {
  // Clean existing data
  await cleanTestDatabase(db);

  // Insert test users
  await db.query(`
    INSERT INTO users (id, email, phone, full_name, user_type, role, password_hash)
    VALUES
      ('admin-user-id', 'admin@example.com', '+1111111111', 'Admin User', 'premium', 'admin', 'hashed_password'),
      ('premium-user-id', 'premium@example.com', '+2222222222', 'Premium User', 'premium', 'member', 'hashed_password'),
      ('regular-user-id', 'regular@example.com', '+3333333333', 'Regular User', 'regular', 'member', 'hashed_password'),
      ('new-user-id', 'newuser@example.com', '+4444444444', 'New User', 'new', 'member', 'hashed_password')
    ON CONFLICT (id) DO NOTHING
  `);

  // Insert test courts
  await db.query(`
    INSERT INTO courts (id, name, sport_type, hourly_rate_peak, hourly_rate_offpeak, is_active)
    VALUES
      ('court-1', 'Tennis Court 1', 'tennis', 60.00, 40.00, true),
      ('court-2', 'Tennis Court 2', 'tennis', 60.00, 40.00, true),
      ('pickleball-1', 'Pickleball Court 1', 'pickleball', 40.00, 25.00, true)
    ON CONFLICT (id) DO NOTHING
  `);

  // Insert test packages
  await db.query(`
    INSERT INTO user_packages (id, user_id, total_court_sessions, remaining_court_sessions,
                               total_trainer_sessions, remaining_trainer_sessions,
                               valid_from, valid_until, peak_access, status)
    VALUES
      ('pkg-1', 'premium-user-id', 8, 8, 8, 8, CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', true, 'active'),
      ('pkg-2', 'regular-user-id', 8, 4, 4, 2, CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', false, 'active')
    ON CONFLICT (id) DO NOTHING
  `);

  console.log('[Test DB] Database seeded successfully');
}

/**
 * Clean all test data from database
 */
export async function cleanTestDatabase(db: TestDatabase): Promise<void> {
  // Delete in order to respect foreign key constraints
  await db.query('DELETE FROM bookings WHERE id LIKE \'test-%\'');
  await db.query('DELETE FROM user_packages WHERE id LIKE \'test-%\' OR id LIKE \'pkg-%\'');
  await db.query('DELETE FROM users WHERE id LIKE \'test-%\' OR email LIKE \'%@example.com\'');
  await db.query('DELETE FROM courts WHERE id LIKE \'test-%\' OR id LIKE \'court-%\' OR id LIKE \'pickleball-%\'');

  console.log('[Test DB] Database cleaned');
}

// ============================================================================
// Server Setup
// ============================================================================

/**
 * Create a test server instance
 */
export async function createTestServer(): Promise<{ server: Server; baseUrl: string }> {
  // In a real setup, you would import your Next.js app
  // For now, create a simple mock server

  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Test server running' }));
  });

  return new Promise((resolve) => {
    server.listen(TEST_PORT, () => {
      console.log(`[Test Server] Running on port ${TEST_PORT}`);
      resolve({
        server,
        baseUrl: `http://localhost:${TEST_PORT}`,
      });
    });
  });
}

/**
 * Close the test server
 */
export async function closeTestServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ============================================================================
// Full Integration Test Context
// ============================================================================

/**
 * Set up complete integration test context
 */
export async function setupIntegrationTests(): Promise<IntegrationTestContext> {
  const db = await createTestDatabase();
  await db.connect();
  await seedTestDatabase(db);

  const { server, baseUrl } = await createTestServer();

  return { db, server, baseUrl };
}

/**
 * Tear down integration test context
 */
export async function teardownIntegrationTests(ctx: IntegrationTestContext): Promise<void> {
  await cleanTestDatabase(ctx.db);
  await ctx.db.end();
  await closeTestServer(ctx.server);
}

// ============================================================================
// Jest Hooks
// ============================================================================

let testContext: IntegrationTestContext | null = null;

/**
 * Get the current test context
 */
export function getTestContext(): IntegrationTestContext {
  if (!testContext) {
    throw new Error('Integration test context not initialized. Call setupIntegrationTests() first.');
  }
  return testContext;
}

/**
 * Global setup for integration tests
 */
export async function globalSetup(): Promise<void> {
  testContext = await setupIntegrationTests();
}

/**
 * Global teardown for integration tests
 */
export async function globalTeardown(): Promise<void> {
  if (testContext) {
    await teardownIntegrationTests(testContext);
    testContext = null;
  }
}
