/**
 * Jest Configuration for Endpoint Tests
 * Specialized configuration for testing the new refactored server endpoints
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test files to run
  testMatch: [
    '**/test/simple-endpoints.test.js',
  ],

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/test/endpoint-setup.js'
  ],

  // Coverage configuration
  collectCoverage: process.env.JEST_COVERAGE === 'true',
  collectCoverageFrom: [
    'server-refactored.js',
    'routes/**/*.js',
    'services/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/test/**',
    '!**/scripts/**',
    '!**/coverage/**',
    '!server.js', // Exclude legacy server
    '!server-switcher.js',
  ],
  coverageDirectory: 'coverage/endpoints',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './routes/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Test execution
  testTimeout: 30000,
  maxWorkers: 1, // Run serially to avoid port conflicts
  detectOpenHandles: true,
  forceExit: true,

  // Module resolution
  moduleDirectories: ['node_modules', '<rootDir>'],
  moduleFileExtensions: ['js', 'json'],

  // Transform configuration
  transform: {},
  
  // Mock configuration
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Verbose output for debugging
  verbose: process.env.JEST_VERBOSE === 'true',

  // Error handling
  errorOnDeprecated: true,
  
  // Test results
  reporters: ['default'],

  // Global variables available in tests
  globals: {
    'process.env.NODE_ENV': 'test',
    'process.env.PORT': '9002',
    'process.env.USE_REFACTORED_SERVER': 'true',
  },

  // Files to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/scripts/',
    'test-endpoints.js', // Exclude the old manual test file
  ],

  // Custom test environment options
  testEnvironmentOptions: {
    node: {
      // Any Node.js specific options
    },
  },

  // Watch mode configuration
  watchPlugins: [],

  // Snapshot configuration
  snapshotSerializers: [],

  // Custom matchers or setup
  setupFiles: [],

  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/(?!(supertest|@jest|jest-runtime)/)',
  ],
};