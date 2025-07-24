// Test environment setup
process.env.NODE_ENV = 'test';
process.env.AIRTABLE_API_KEY = 'test-api-key';
process.env.AIRTABLE_BASE_ID = 'test-base-id';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 