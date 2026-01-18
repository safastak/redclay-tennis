/**
 * Test Helpers & Fixtures
 * Red Clay Tennis Booking Platform
 *
 * Provides factory functions and utilities for creating test data.
 */

import type { NextRequest } from 'next/server';

// ============================================================================
// Types
// ============================================================================

export interface TestUser {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  user_type: 'new' | 'regular' | 'premium';
  role: 'member' | 'admin' | 'trainer';
  created_at: Date;
  updated_at: Date;
}

export interface TestBooking {
  id: string;
  user_id: string;
  court_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  trainer_id: string | null;
  is_peak_time: boolean;
  court_fee: number;
  trainer_fee: number;
  created_at: Date;
  updated_at: Date;
}

export interface TestPackage {
  id: string;
  user_id: string;
  package_course_id: string;
  total_court_sessions: number;
  remaining_court_sessions: number;
  total_trainer_sessions: number;
  remaining_trainer_sessions: number;
  valid_from: string;
  valid_until: string;
  peak_access: boolean;
  status: 'active' | 'depleted' | 'expired';
  created_at: Date;
  updated_at: Date;
}

export interface TestCourt {
  id: string;
  name: string;
  sport_type: 'tennis' | 'pickleball';
  hourly_rate_peak: number;
  hourly_rate_offpeak: number;
  is_active: boolean;
}

export interface TestTrainer {
  id: string;
  user_id: string;
  specialization: string[];
  hourly_rate: number;
  bio: string;
  is_active: boolean;
}

// ============================================================================
// ID Generators
// ============================================================================

let idCounter = 0;

export function generateTestId(prefix = 'test'): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createTestUser(overrides: Partial<TestUser> = {}): TestUser {
  const id = overrides.id || generateUUID();
  return {
    id,
    email: `test-${id.slice(0, 8)}@example.com`,
    phone: '+1234567890',
    full_name: 'Test User',
    user_type: 'regular',
    role: 'member',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

export function createTestBooking(overrides: Partial<TestBooking> = {}): TestBooking {
  const id = overrides.id || generateUUID();
  return {
    id,
    user_id: overrides.user_id || generateUUID(),
    court_id: overrides.court_id || generateUUID(),
    booking_date: '2026-01-20',
    start_time: '10:00:00',
    end_time: '11:00:00',
    status: 'pending',
    trainer_id: null,
    is_peak_time: false,
    court_fee: 50,
    trainer_fee: 0,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

export function createTestPackage(overrides: Partial<TestPackage> = {}): TestPackage {
  const id = overrides.id || generateUUID();
  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setMonth(validUntil.getMonth() + 3);

  return {
    id,
    user_id: overrides.user_id || generateUUID(),
    package_course_id: overrides.package_course_id || generateUUID(),
    total_court_sessions: 8,
    remaining_court_sessions: 8,
    total_trainer_sessions: 8,
    remaining_trainer_sessions: 8,
    valid_from: now.toISOString().split('T')[0],
    valid_until: validUntil.toISOString().split('T')[0],
    peak_access: true,
    status: 'active',
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

export function createTestCourt(overrides: Partial<TestCourt> = {}): TestCourt {
  const id = overrides.id || generateUUID();
  return {
    id,
    name: `Test Court ${id.slice(0, 4)}`,
    sport_type: 'tennis',
    hourly_rate_peak: 60,
    hourly_rate_offpeak: 40,
    is_active: true,
    ...overrides,
  };
}

export function createTestTrainer(overrides: Partial<TestTrainer> = {}): TestTrainer {
  const id = overrides.id || generateUUID();
  return {
    id,
    user_id: overrides.user_id || generateUUID(),
    specialization: ['tennis', 'beginners'],
    hourly_rate: 80,
    bio: 'Experienced tennis coach',
    is_active: true,
    ...overrides,
  };
}

// ============================================================================
// Token Helpers
// ============================================================================

export interface TokenPayload {
  userId: string;
  email?: string;
  role?: 'member' | 'admin' | 'trainer';
  userType?: 'new' | 'regular' | 'premium';
}

/**
 * Generate a test JWT token
 * Note: This creates a simple base64 encoded token for testing.
 * In production, use proper JWT signing.
 */
export function generateTestToken(payload: Partial<TokenPayload> = {}): string {
  const tokenPayload: TokenPayload = {
    userId: payload.userId || generateUUID(),
    email: payload.email || 'test@example.com',
    role: payload.role || 'member',
    userType: payload.userType || 'regular',
  };

  // Simple base64 encoding for test purposes
  // Real implementation would use proper JWT signing
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    ...tokenPayload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  })).toString('base64url');
  const signature = 'test-signature';

  return `${header}.${body}.${signature}`;
}

/**
 * Generate an expired test token
 */
export function generateExpiredTestToken(payload: Partial<TokenPayload> = {}): string {
  const tokenPayload: TokenPayload = {
    userId: payload.userId || generateUUID(),
    email: payload.email || 'test@example.com',
    role: payload.role || 'member',
    userType: payload.userType || 'regular',
  };

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    ...tokenPayload,
    iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
    exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
  })).toString('base64url');
  const signature = 'test-signature';

  return `${header}.${body}.${signature}`;
}

// ============================================================================
// Date/Time Helpers
// ============================================================================

/**
 * Get tomorrow's date in YYYY-MM-DD format
 */
export function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

/**
 * Get a date N days from now in YYYY-MM-DD format
 */
export function getFutureDate(daysFromNow: number): string {
  const future = new Date();
  future.setDate(future.getDate() + daysFromNow);
  return future.toISOString().split('T')[0];
}

/**
 * Check if a time is during peak hours (typically 5PM - 9PM weekdays, weekends)
 */
export function isPeakTime(time: string, date: string): boolean {
  const hour = parseInt(time.split(':')[0], 10);
  const dayOfWeek = new Date(date).getDay();

  // Weekend = peak
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return true;
  }

  // Weekday 5PM-9PM = peak
  return hour >= 17 && hour < 21;
}

// ============================================================================
// Mock Database Client
// ============================================================================

export interface MockQueryResult<T = unknown> {
  rows: T[];
  rowCount: number;
}

export interface MockDatabaseClient {
  query: jest.Mock<Promise<MockQueryResult>>;
  connect: jest.Mock<Promise<void>>;
  release: jest.Mock<void>;
}

export function createMockDatabaseClient(): MockDatabaseClient {
  return {
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    connect: jest.fn().mockResolvedValue(undefined),
    release: jest.fn(),
  };
}

// ============================================================================
// Request/Response Mocks
// ============================================================================

/**
 * Create a mock NextRequest for API route testing
 */
export function createMockRequest(options: {
  method?: string;
  url?: string;
  body?: unknown;
  headers?: Record<string, string>;
  searchParams?: Record<string, string>;
}): NextRequest {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    body,
    headers = {},
    searchParams = {},
  } = options;

  const urlObj = new URL(url);
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  return {
    method,
    url: urlObj.toString(),
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    headers: new Headers(headers),
    nextUrl: urlObj,
  } as unknown as NextRequest;
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert that a value is a valid UUID
 */
export function expectValidUUID(value: unknown): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  expect(typeof value).toBe('string');
  expect(value).toMatch(uuidRegex);
}

/**
 * Assert that a date string is valid ISO format
 */
export function expectValidISODate(value: unknown): void {
  expect(typeof value).toBe('string');
  const date = new Date(value as string);
  expect(date.toString()).not.toBe('Invalid Date');
}

// ============================================================================
// Reset Helpers
// ============================================================================

/**
 * Reset the ID counter (useful between test suites)
 */
export function resetTestIdCounter(): void {
  idCounter = 0;
}
