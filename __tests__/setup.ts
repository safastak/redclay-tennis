/**
 * Jest Setup File
 * Red Clay Tennis Booking Platform
 *
 * This file runs before each test file and sets up the testing environment.
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/redclay_test';

// Increase timeout for async operations in tests
jest.setTimeout(10000);

// Global test utilities
beforeAll(() => {
  // Setup that runs once before all tests
});

afterAll(() => {
  // Cleanup that runs once after all tests
});

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
});

// Suppress console output during tests (optional - uncomment to enable)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Custom matchers can be added here
// expect.extend({
//   toBeValidUUID(received: string) {
//     const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
//     const pass = uuidRegex.test(received);
//     return {
//       message: () => `expected ${received} ${pass ? 'not ' : ''}to be a valid UUID`,
//       pass,
//     };
//   },
// });
