/**
 * Database Test Helpers
 * Red Clay Tennis Booking Platform
 *
 * Provides utilities for setting up and tearing down test databases.
 */

import {
  createTestUser,
  createTestCourt,
  createTestBooking,
  createTestPackage,
  createTestTrainer,
  type TestUser,
  type TestCourt,
  type TestBooking,
  type TestPackage,
  type TestTrainer,
} from './index';

// ============================================================================
// Types
// ============================================================================

export interface TestDatabaseClient {
  query: <T = unknown>(sql: string, params?: unknown[]) => Promise<{ rows: T[]; rowCount: number }>;
  connect: () => Promise<void>;
  release: () => void;
  end: () => Promise<void>;
}

export interface TestDatabaseState {
  users: TestUser[];
  courts: TestCourt[];
  bookings: TestBooking[];
  packages: TestPackage[];
  trainers: TestTrainer[];
}

// ============================================================================
// Mock Database Client
// ============================================================================

let mockDatabaseState: TestDatabaseState = {
  users: [],
  courts: [],
  bookings: [],
  packages: [],
  trainers: [],
};

/**
 * Create a mock database client for testing
 * This simulates database operations in memory
 */
export function createTestDatabaseClient(): TestDatabaseClient {
  return {
    query: async <T = unknown>(sql: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number }> => {
      // Simple SQL parsing for common operations
      const sqlLower = sql.toLowerCase().trim();

      // SELECT queries
      if (sqlLower.startsWith('select')) {
        if (sqlLower.includes('from users')) {
          return { rows: mockDatabaseState.users as T[], rowCount: mockDatabaseState.users.length };
        }
        if (sqlLower.includes('from courts')) {
          return { rows: mockDatabaseState.courts as T[], rowCount: mockDatabaseState.courts.length };
        }
        if (sqlLower.includes('from bookings')) {
          return { rows: mockDatabaseState.bookings as T[], rowCount: mockDatabaseState.bookings.length };
        }
        if (sqlLower.includes('from user_packages')) {
          return { rows: mockDatabaseState.packages as T[], rowCount: mockDatabaseState.packages.length };
        }
        if (sqlLower.includes('from trainers')) {
          return { rows: mockDatabaseState.trainers as T[], rowCount: mockDatabaseState.trainers.length };
        }
      }

      // INSERT queries
      if (sqlLower.startsWith('insert')) {
        return { rows: [] as T[], rowCount: 1 };
      }

      // UPDATE queries
      if (sqlLower.startsWith('update')) {
        return { rows: [] as T[], rowCount: 1 };
      }

      // DELETE queries
      if (sqlLower.startsWith('delete')) {
        return { rows: [] as T[], rowCount: 1 };
      }

      // Default response
      return { rows: [] as T[], rowCount: 0 };
    },
    connect: async () => {
      // No-op for mock client
    },
    release: () => {
      // No-op for mock client
    },
    end: async () => {
      // No-op for mock client
    },
  };
}

// ============================================================================
// Database Setup/Teardown
// ============================================================================

/**
 * Set up the test database with initial data
 */
export async function setupTestDatabase(): Promise<TestDatabaseState> {
  // Reset state
  mockDatabaseState = {
    users: [],
    courts: [],
    bookings: [],
    packages: [],
    trainers: [],
  };

  // Create default test data
  const adminUser = createTestUser({
    id: 'admin-user-id',
    email: 'admin@example.com',
    full_name: 'Admin User',
    user_type: 'premium',
    role: 'admin',
  });

  const premiumUser = createTestUser({
    id: 'premium-user-id',
    email: 'premium@example.com',
    full_name: 'Premium User',
    user_type: 'premium',
    role: 'member',
  });

  const regularUser = createTestUser({
    id: 'regular-user-id',
    email: 'regular@example.com',
    full_name: 'Regular User',
    user_type: 'regular',
    role: 'member',
  });

  const newUser = createTestUser({
    id: 'new-user-id',
    email: 'newuser@example.com',
    full_name: 'New User',
    user_type: 'new',
    role: 'member',
  });

  mockDatabaseState.users = [adminUser, premiumUser, regularUser, newUser];

  // Create test courts
  const court1 = createTestCourt({
    id: 'court-1',
    name: 'Tennis Court 1',
    sport_type: 'tennis',
  });

  const court2 = createTestCourt({
    id: 'court-2',
    name: 'Tennis Court 2',
    sport_type: 'tennis',
  });

  const pickleballCourt = createTestCourt({
    id: 'pickleball-1',
    name: 'Pickleball Court 1',
    sport_type: 'pickleball',
    hourly_rate_peak: 40,
    hourly_rate_offpeak: 25,
  });

  mockDatabaseState.courts = [court1, court2, pickleballCourt];

  // Create test packages
  const premiumPackage = createTestPackage({
    id: 'premium-package-id',
    user_id: premiumUser.id,
    total_court_sessions: 8,
    remaining_court_sessions: 8,
    total_trainer_sessions: 8,
    remaining_trainer_sessions: 8,
    peak_access: true,
  });

  const regularPackage = createTestPackage({
    id: 'regular-package-id',
    user_id: regularUser.id,
    total_court_sessions: 8,
    remaining_court_sessions: 4,
    total_trainer_sessions: 4,
    remaining_trainer_sessions: 2,
    peak_access: false,
  });

  const lastSessionPackage = createTestPackage({
    id: 'last-session-package-id',
    user_id: 'user-with-last-session',
    total_court_sessions: 8,
    remaining_court_sessions: 1,
    total_trainer_sessions: 0,
    remaining_trainer_sessions: 0,
    peak_access: true,
  });

  mockDatabaseState.packages = [premiumPackage, regularPackage, lastSessionPackage];

  // Create test trainer
  const trainer = createTestTrainer({
    id: 'trainer-1',
    user_id: 'trainer-user-id',
  });

  mockDatabaseState.trainers = [trainer];

  return mockDatabaseState;
}

/**
 * Tear down the test database
 */
export async function teardownTestDatabase(): Promise<void> {
  mockDatabaseState = {
    users: [],
    courts: [],
    bookings: [],
    packages: [],
    trainers: [],
  };
}

/**
 * Get the current test database state
 */
export function getTestDatabaseState(): TestDatabaseState {
  return { ...mockDatabaseState };
}

/**
 * Add a user to the test database
 */
export function addTestUser(user: Partial<TestUser>): TestUser {
  const newUser = createTestUser(user);
  mockDatabaseState.users.push(newUser);
  return newUser;
}

/**
 * Add a booking to the test database
 */
export function addTestBooking(booking: Partial<TestBooking>): TestBooking {
  const newBooking = createTestBooking(booking);
  mockDatabaseState.bookings.push(newBooking);
  return newBooking;
}

/**
 * Add a package to the test database
 */
export function addTestPackage(pkg: Partial<TestPackage>): TestPackage {
  const newPackage = createTestPackage(pkg);
  mockDatabaseState.packages.push(newPackage);
  return newPackage;
}

/**
 * Find a user by ID
 */
export function findTestUserById(id: string): TestUser | undefined {
  return mockDatabaseState.users.find(u => u.id === id);
}

/**
 * Find a booking by ID
 */
export function findTestBookingById(id: string): TestBooking | undefined {
  return mockDatabaseState.bookings.find(b => b.id === id);
}

/**
 * Find packages by user ID
 */
export function findTestPackagesByUserId(userId: string): TestPackage[] {
  return mockDatabaseState.packages.filter(p => p.user_id === userId);
}

/**
 * Update a booking in the test database
 */
export function updateTestBooking(id: string, updates: Partial<TestBooking>): TestBooking | undefined {
  const index = mockDatabaseState.bookings.findIndex(b => b.id === id);
  if (index === -1) return undefined;

  mockDatabaseState.bookings[index] = {
    ...mockDatabaseState.bookings[index],
    ...updates,
    updated_at: new Date(),
  };

  return mockDatabaseState.bookings[index];
}

/**
 * Update a package in the test database
 */
export function updateTestPackage(id: string, updates: Partial<TestPackage>): TestPackage | undefined {
  const index = mockDatabaseState.packages.findIndex(p => p.id === id);
  if (index === -1) return undefined;

  mockDatabaseState.packages[index] = {
    ...mockDatabaseState.packages[index],
    ...updates,
    updated_at: new Date(),
  };

  return mockDatabaseState.packages[index];
}

// ============================================================================
// Real Database Helpers (for integration tests with actual database)
// ============================================================================

/**
 * Connect to a real test database
 * Note: Implement this when you have a real database setup
 */
export async function connectToTestDatabase(): Promise<TestDatabaseClient> {
  // TODO: Implement real database connection
  // const { Pool } = require('pg');
  // const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  // return pool;

  console.warn('Using mock database client. Implement connectToTestDatabase() for real database tests.');
  return createTestDatabaseClient();
}

/**
 * Run database migrations on test database
 * Note: Implement this when you have migrations set up
 */
export async function runTestMigrations(_client: TestDatabaseClient): Promise<void> {
  // TODO: Implement migration runner
  // await client.query(fs.readFileSync('./docs/database/migrations.sql', 'utf8'));
  console.warn('Migrations not implemented. Implement runTestMigrations() for real database tests.');
}

/**
 * Clean all data from test database
 * Note: Implement this when you have a real database setup
 */
export async function cleanTestDatabase(_client: TestDatabaseClient): Promise<void> {
  // TODO: Implement database cleaning
  // await client.query('TRUNCATE users, bookings, user_packages, courts, trainers CASCADE');
  console.warn('Database cleaning not implemented. Implement cleanTestDatabase() for real database tests.');
}
