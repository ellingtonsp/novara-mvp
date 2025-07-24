// Test environment setup
process.env.NODE_ENV = 'test';
process.env.PORT = '3001'; // Use different port to avoid conflicts
process.env.AIRTABLE_API_KEY = 'test-api-key';
process.env.AIRTABLE_BASE_ID = 'test-base-id';
process.env.JWT_SECRET = 'test-jwt-secret';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Sentry globally
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  Handlers: {
    requestHandler: jest.fn(() => (req, res, next) => next()),
    errorHandler: jest.fn(() => (err, req, res, next) => next(err)),
  },
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

// Mock Redis
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

// Mock database factory
jest.mock('../database/database-factory', () => ({
  databaseAdapter: {
    isUsingLocalDatabase: jest.fn(() => true),
    createUser: jest.fn(),
    findUserByEmail: jest.fn(),
  },
  airtableRequest: jest.fn(),
  findUserByEmail: jest.fn(),
}));

// Mock startup module
jest.mock('../startup', () => ({
  markAppReady: jest.fn(),
  checkAppReady: jest.fn(() => true),
  waitForReady: jest.fn(() => Promise.resolve()),
})); 