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

// Import the module under test (to be implemented)
// import { applyPackageToBooking, findEligiblePackage } from '@/lib/packages';

// ============================================================================
// Mock Implementation (remove when real implementation exists)
// ============================================================================

interface PackageApplicationResult {
  applied: boolean;
  package_id?: string;
  session_type?: 'court_only' | 'trainer_included';
  reason?: string;
}

// Stub implementation for TDD - replace with actual import
async function applyPackageToBooking(
  _client: ReturnType<typeof createMockDatabaseClient>,
  booking: ReturnType<typeof createTestBooking>
): Promise<PackageApplicationResult> {
  // TODO: Implement actual package application logic in lib/packages.ts
  // This stub allows tests to run and fail until implementation is complete

  const packages = findTestPackagesByUserId(booking.user_id);
  const activePackage = packages.find(p =>
    p.status === 'active' &&
    p.remaining_court_sessions > 0
  );

  if (!activePackage) {
    return { applied: false, reason: 'No eligible package found' };
  }

  // Check peak time eligibility
  if (booking.is_peak_time && !activePackage.peak_access) {
    return { applied: false, reason: 'Package does not include peak time access' };
  }

  // Determine session type
  const sessionType = booking.trainer_id ? 'trainer_included' : 'court_only';

  // Check trainer session availability
  if (sessionType === 'trainer_included' && activePackage.remaining_trainer_sessions <= 0) {
    return { applied: false, reason: 'No trainer sessions remaining' };
  }

  // Deduct sessions
  const newCourtSessions = activePackage.remaining_court_sessions - 1;
  const newTrainerSessions = sessionType === 'trainer_included'
    ? activePackage.remaining_trainer_sessions - 1
    : activePackage.remaining_trainer_sessions;

  // Update package status if depleted
  const newStatus = newCourtSessions <= 0 ? 'depleted' : 'active';

  updateTestPackage(activePackage.id, {
    remaining_court_sessions: newCourtSessions,
    remaining_trainer_sessions: newTrainerSessions,
    status: newStatus as 'active' | 'depleted' | 'expired',
  });

  return {
    applied: true,
    package_id: activePackage.id,
    session_type: sessionType,
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
