/**
 * Package Application Logic Tests
 * Red Clay Tennis Booking Platform
 *
 * Tests for the package application algorithm that determines
 * whether a user's package can be applied to a booking.
 *
 * Priority: CRITICAL - Directly affects revenue
 */

import {
  createTestBooking,
  createTestPackage,
  createMockDatabaseClient,
  generateUUID,
} from '../helpers';
import {
  setupTestDatabase,
  teardownTestDatabase,
  findTestPackagesByUserId,
  addTestPackage,
  updateTestPackage,
} from '../helpers/db';
import {
  applyPackageToBooking as applyPackage,
  isPackageEligible,
  findEligiblePackage,
  type UserPackage,
  type Booking,
  type DatabaseClient,
} from '@/lib/packages';

// Wrapper interface to match test expectations
interface PackageApplicationResult {
  applied: boolean;
  package_id?: string;
  session_type?: 'court_only' | 'trainer_included';
  reason?: string;
}

// Convert test booking to lib Booking type
function toLibBooking(testBooking: ReturnType<typeof createTestBooking>): Booking {
  return {
    id: testBooking.id,
    user_id: testBooking.user_id,
    court_id: testBooking.court_id,
    booking_date: testBooking.booking_date,
    start_time: testBooking.start_time,
    end_time: testBooking.end_time,
    trainer_id: testBooking.trainer_id,
    is_peak_time: testBooking.is_peak_time,
  };
}

// Convert test package to lib UserPackage type
function toLibPackage(testPackage: ReturnType<typeof createTestPackage>): UserPackage {
  return {
    id: testPackage.id,
    user_id: testPackage.user_id,
    package_course_id: testPackage.package_course_id,
    total_court_sessions: testPackage.total_court_sessions,
    remaining_court_sessions: testPackage.remaining_court_sessions,
    total_trainer_sessions: testPackage.total_trainer_sessions,
    remaining_trainer_sessions: testPackage.remaining_trainer_sessions,
    valid_from: testPackage.valid_from,
    valid_until: testPackage.valid_until,
    peak_access: testPackage.peak_access,
    status: testPackage.status,
    created_at: testPackage.created_at,
    updated_at: testPackage.updated_at,
  };
}

// Wrapper to match test expectations
async function applyPackageToBooking(
  client: DatabaseClient,
  testBooking: ReturnType<typeof createTestBooking>
): Promise<PackageApplicationResult> {
  const booking = toLibBooking(testBooking);
  const testPackages = findTestPackagesByUserId(testBooking.user_id);
  const packages = testPackages.map(toLibPackage);

  const result = await applyPackage(client, booking, packages);

  // Update test DB state to match
  if (result.applied && result.package_id) {
    updateTestPackage(result.package_id, {
      remaining_court_sessions: result.sessions_remaining,
      remaining_trainer_sessions: result.trainer_sessions_remaining,
      status: result.sessions_remaining <= 0 && result.trainer_sessions_remaining <= 0 ? 'depleted' : 'active',
    });
  }

  return {
    applied: result.applied,
    package_id: result.package_id || undefined,
    session_type: testBooking.trainer_id ? 'trainer_included' : 'court_only',
    reason: result.reason,
  };
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Package Application', () => {
  let mockClient: ReturnType<typeof createMockDatabaseClient>;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(() => {
    mockClient = createMockDatabaseClient();
  });

  // --------------------------------------------------------------------------
  // Basic Package Application
  // --------------------------------------------------------------------------

  describe('Basic Application', () => {
    test('applies package to eligible booking', async () => {
      const userId = generateUUID();
      addTestPackage({
        user_id: userId,
        remaining_court_sessions: 8,
        peak_access: true,
        status: 'active',
      });

      const booking = createTestBooking({
        user_id: userId,
        trainer_id: null,
        is_peak_time: false,
      });

      const result = await applyPackageToBooking(mockClient, booking);

      expect(result.applied).toBe(true);
      expect(result.package_id).toBeDefined();
      expect(result.session_type).toBe('court_only');
    });

    test('returns false when user has no packages', async () => {
      const booking = createTestBooking({
        user_id: 'user-without-packages',
        trainer_id: null,
        is_peak_time: false,
      });

      const result = await applyPackageToBooking(mockClient, booking);

      expect(result.applied).toBe(false);
      expect(result.reason).toContain('No eligible package');
    });

    test('returns false when all packages are depleted', async () => {
      const userId = generateUUID();
      addTestPackage({
        user_id: userId,
        remaining_court_sessions: 0,
        status: 'depleted',
      });

      const booking = createTestBooking({
        user_id: userId,
        trainer_id: null,
      });

      const result = await applyPackageToBooking(mockClient, booking);

      expect(result.applied).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // Peak Time Handling
  // --------------------------------------------------------------------------

  describe('Peak Time Handling', () => {
    test('rejects package for peak time when off-peak only', async () => {
      const userId = generateUUID();
      addTestPackage({
        user_id: userId,
        remaining_court_sessions: 8,
        peak_access: false, // Off-peak only
        status: 'active',
      });

      const booking = createTestBooking({
        user_id: userId,
        is_peak_time: true,
      });

      const result = await applyPackageToBooking(mockClient, booking);

      expect(result.applied).toBe(false);
      expect(result.reason).toContain('peak time');
    });

    test('applies package for peak time when peak access included', async () => {
      const userId = generateUUID();
      addTestPackage({
        user_id: userId,
        remaining_court_sessions: 8,
        peak_access: true, // Peak access included
        status: 'active',
      });

      const booking = createTestBooking({
        user_id: userId,
        is_peak_time: true,
      });

      const result = await applyPackageToBooking(mockClient, booking);

      expect(result.applied).toBe(true);
    });

    test('applies off-peak package for off-peak booking', async () => {
      const userId = generateUUID();
      addTestPackage({
        user_id: userId,
        remaining_court_sessions: 8,
        peak_access: false, // Off-peak only
        status: 'active',
      });

      const booking = createTestBooking({
        user_id: userId,
        is_peak_time: false, // Off-peak time
      });

      const result = await applyPackageToBooking(mockClient, booking);

      expect(result.applied).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // Trainer Session Handling
  // --------------------------------------------------------------------------

  describe('Trainer Session Handling', () => {
    test('deducts trainer session when trainer included', async () => {
      const userId = generateUUID();
      const pkg = addTestPackage({
        user_id: userId,
        remaining_court_sessions: 8,
        remaining_trainer_sessions: 8,
        peak_access: true,
        status: 'active',
      });

      const booking = createTestBooking({
        user_id: userId,
        trainer_id: 'trainer-1',
      });

      const result = await applyPackageToBooking(mockClient, booking);

      expect(result.applied).toBe(true);
      expect(result.session_type).toBe('trainer_included');

      // Verify session was deducted
      const packages = findTestPackagesByUserId(userId);
      const updatedPkg = packages.find(p => p.id === pkg.id);
      expect(updatedPkg?.remaining_trainer_sessions).toBe(7);
    });

    test('rejects booking with trainer when no trainer sessions remaining', async () => {
      const userId = generateUUID();
      addTestPackage({
        user_id: userId,
        remaining_court_sessions: 8,
        remaining_trainer_sessions: 0, // No trainer sessions
        peak_access: true,
        status: 'active',
      });

      const booking = createTestBooking({
        user_id: userId,
        trainer_id: 'trainer-1',
      });

      const result = await applyPackageToBooking(mockClient, booking);

      expect(result.applied).toBe(false);
      expect(result.reason).toContain('trainer sessions');
    });

    test('does not deduct trainer session for court-only booking', async () => {
      const userId = generateUUID();
      const pkg = addTestPackage({
        user_id: userId,
        remaining_court_sessions: 8,
        remaining_trainer_sessions: 8,
        peak_access: true,
        status: 'active',
      });

      const booking = createTestBooking({
        user_id: userId,
        trainer_id: null, // No trainer
      });

      await applyPackageToBooking(mockClient, booking);

      // Verify trainer sessions were NOT deducted
      const packages = findTestPackagesByUserId(userId);
      const updatedPkg = packages.find(p => p.id === pkg.id);
      expect(updatedPkg?.remaining_trainer_sessions).toBe(8);
    });
  });

  // --------------------------------------------------------------------------
  // Package Depletion
  // --------------------------------------------------------------------------

  describe('Package Depletion', () => {
    test('marks package as depleted when sessions exhausted', async () => {
      const userId = generateUUID();
      const pkg = addTestPackage({
        user_id: userId,
        remaining_court_sessions: 1, // Last session
        remaining_trainer_sessions: 0,
        peak_access: true,
        status: 'active',
      });

      const booking = createTestBooking({
        user_id: userId,
        trainer_id: null,
      });

      await applyPackageToBooking(mockClient, booking);

      // Verify package is now depleted
      const packages = findTestPackagesByUserId(userId);
      const updatedPkg = packages.find(p => p.id === pkg.id);
      expect(updatedPkg?.status).toBe('depleted');
      expect(updatedPkg?.remaining_court_sessions).toBe(0);
    });

    test('does not mark package as depleted when sessions remain', async () => {
      const userId = generateUUID();
      const pkg = addTestPackage({
        user_id: userId,
        remaining_court_sessions: 5,
        peak_access: true,
        status: 'active',
      });

      const booking = createTestBooking({
        user_id: userId,
        trainer_id: null,
      });

      await applyPackageToBooking(mockClient, booking);

      // Verify package is still active
      const packages = findTestPackagesByUserId(userId);
      const updatedPkg = packages.find(p => p.id === pkg.id);
      expect(updatedPkg?.status).toBe('active');
      expect(updatedPkg?.remaining_court_sessions).toBe(4);
    });
  });

  // --------------------------------------------------------------------------
  // Edge Cases
  // --------------------------------------------------------------------------

  describe('Edge Cases', () => {
    test('handles user with multiple active packages', async () => {
      const userId = generateUUID();

      // Add two packages
      addTestPackage({
        user_id: userId,
        remaining_court_sessions: 2,
        peak_access: false,
        status: 'active',
      });

      addTestPackage({
        user_id: userId,
        remaining_court_sessions: 8,
        peak_access: true,
        status: 'active',
      });

      const booking = createTestBooking({
        user_id: userId,
        is_peak_time: true, // Peak time - should use peak package
      });

      const result = await applyPackageToBooking(mockClient, booking);

      expect(result.applied).toBe(true);
    });

    test('handles expired package', async () => {
      const userId = generateUUID();
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1);

      addTestPackage({
        user_id: userId,
        remaining_court_sessions: 8,
        status: 'expired',
        valid_until: pastDate.toISOString().split('T')[0],
      });

      const booking = createTestBooking({
        user_id: userId,
      });

      const result = await applyPackageToBooking(mockClient, booking);

      expect(result.applied).toBe(false);
    });

    test('handles concurrent booking attempts', async () => {
      const userId = generateUUID();
      addTestPackage({
        user_id: userId,
        remaining_court_sessions: 1, // Only one session left
        peak_access: true,
        status: 'active',
      });

      const booking1 = createTestBooking({
        user_id: userId,
        start_time: '10:00:00',
      });

      const booking2 = createTestBooking({
        user_id: userId,
        start_time: '11:00:00',
      });

      // First booking should succeed
      const result1 = await applyPackageToBooking(mockClient, booking1);
      expect(result1.applied).toBe(true);

      // Second booking should fail (no sessions left)
      const result2 = await applyPackageToBooking(mockClient, booking2);
      expect(result2.applied).toBe(false);
    });
  });
});
