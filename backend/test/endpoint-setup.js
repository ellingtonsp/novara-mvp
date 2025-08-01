/**
 * Test Setup for Endpoint Tests
 * Specialized setup for testing the new refactored server endpoints
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '9002';
process.env.USE_REFACTORED_SERVER = 'true';
process.env.USE_LOCAL_DATABASE = 'true';
process.env.JWT_SECRET = 'test-jwt-secret-for-endpoint-tests';
process.env.LOG_LEVEL = 'error';

// Disable external services in test mode
delete process.env.AIRTABLE_API_KEY;
delete process.env.AIRTABLE_BASE_ID;
delete process.env.SENTRY_DSN;
delete process.env.REDIS_URL;

// Mock console to reduce test noise
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: process.env.JEST_VERBOSE === 'true' ? originalConsole.error : jest.fn(),
};

// Global test utilities
global.testUtils = {
  // Create a test JWT token
  createTestToken: (payload = {}) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { 
        email: 'test@example.com', 
        userId: 'test-user-123',
        ...payload 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  },

  // Wait for async operations
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Create test date strings
  getDateString: (daysAgo = 0) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  },

  // Validate response structure
  validateSuccessResponse: (response, expectedFields = []) => {
    expect(response).toHaveProperty('success', true);
    expectedFields.forEach(field => {
      expect(response).toHaveProperty(field);
    });
  },

  validateErrorResponse: (response, expectedMessage = null) => {
    expect(response).toHaveProperty('success', false);
    expect(response).toHaveProperty('error');
    if (expectedMessage) {
      expect(response.error).toContain(expectedMessage);
    }
  },
};

// Global mock configurations
global.mockConfigs = {
  // Default successful user
  defaultUser: {
    id: 'user-123',
    email: 'test@example.com',
    nickname: 'TestUser',
    cycle_stage: 'ivf_prep',
    medication_status: 'taking',
    confidence_meds: 7,
    confidence_costs: 6,
    confidence_overall: 8,
    primary_need: 'emotional_support',
    created_at: '2025-01-01T00:00:00Z',
  },

  // Default successful check-in
  defaultCheckin: {
    id: 'checkin-123',
    user_id: 'user-123',
    mood_today: 'hopeful',
    confidence_today: 7,
    date_submitted: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },

  // Default questions
  defaultQuestions: [
    {
      id: 'mood_today',
      text: 'How are you feeling today?',
      type: 'mood',
      required: true,
      context: 'baseline',
    },
    {
      id: 'confidence_today',
      text: 'Rate your confidence (1-10)',
      type: 'scale',
      required: true,
      context: 'baseline',
    },
  ],
};

// Mock Sentry globally
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  Handlers: {
    requestHandler: jest.fn(() => (req, res, next) => next()),
    tracingHandler: jest.fn(() => (req, res, next) => next()),
    errorHandler: jest.fn(() => (err, req, res, next) => next(err)),
  },
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

// Mock logger with all required methods
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  startup: jest.fn(),
  performance: jest.fn(),
  security: jest.fn(),
  database: jest.fn(),
  airtable: jest.fn(),
  stream: {
    write: jest.fn(),
  },
}));

// Mock cache/Redis
jest.mock('../utils/cache', () => ({
  initializeRedis: jest.fn(),
  cacheManager: {
    get: jest.fn(),
    set: jest.fn(),
  },
  rateLimiter: {
    rateLimitMiddleware: jest.fn(() => (req, res, next) => next()),
  },
}));

// Enhanced test helpers
global.testHelpers = {
  // Create mock service with common methods
  createMockService: (name, methods = {}) => {
    const defaultMethods = {
      initialize: jest.fn().mockResolvedValue(true),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const service = { ...defaultMethods, ...methods };
    
    // Make all methods return promises by default
    Object.keys(service).forEach(key => {
      if (typeof service[key] === 'function' && !service[key]._isMockFunction) {
        service[key] = jest.fn().mockResolvedValue(null);
      }
    });

    return service;
  },

  // Reset all mocks to default state
  resetMocks: () => {
    jest.clearAllMocks();
    
    // Reset console mocks if needed
    if (process.env.JEST_VERBOSE !== 'true') {
      global.console.log.mockClear();
      global.console.debug.mockClear();
      global.console.info.mockClear();
      global.console.warn.mockClear();
      global.console.error.mockClear();
    }
  },

  // Mock database connection states
  mockDatabaseStates: {
    connected: { isConnected: true, error: null },
    disconnected: { isConnected: false, error: new Error('Database connection failed') },
    slow: { isConnected: true, error: null, delay: 5000 },
  },
};

// Test lifecycle helpers
beforeEach(() => {
  global.testHelpers.resetMocks();
});

afterEach(() => {
  // Clean up any hanging promises or timers
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in test:', reason);
  // Don't exit in test mode, just log
});

// Export test configuration
module.exports = {
  testTimeout: 30000,
  maxWorkers: 1, // Run tests serially to avoid port conflicts
  verbose: process.env.JEST_VERBOSE === 'true',
  collectCoverage: process.env.JEST_COVERAGE === 'true',
  coverageDirectory: 'coverage/endpoints',
  coverageReporters: ['text', 'lcov', 'html'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/',
    '/scripts/',
    '/coverage/',
  ],
  testMatch: [
    '**/test/endpoints.test.js',
    '**/test/integration.test.js',
  ],
};