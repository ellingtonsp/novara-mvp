# Endpoint Testing Documentation

This document provides comprehensive documentation for testing the newly implemented endpoints in the refactored Novara backend server.

## Overview

The test suite covers 6 newly implemented endpoints:
1. `GET /api/checkins/last-values` - Returns the most recent check-in values for a user
2. `GET /api/checkins/questions` - Returns personalized check-in questions based on user state
3. `POST /api/daily-checkin-enhanced` - Enhanced version of daily check-in submission
4. `GET /api/users/profile` - Returns user profile information (alias for /api/users/me)
5. `PATCH /api/users/cycle-stage` - Updates user's menstrual cycle stage
6. `PATCH /api/users/medication-status` - Updates user's medication status

## Test Structure

### Test Files

- **`test/endpoints.test.js`** - Unit tests for individual endpoints
- **`test/integration.test.js`** - Integration tests for complete workflows
- **`test/fixtures/test-data.js`** - Test data factories and fixtures
- **`test/endpoint-setup.js`** - Specialized test setup configuration

### Test Configuration

- **`jest.endpoints.config.js`** - Jest configuration for endpoint tests
- **`scripts/run-endpoint-tests.js`** - Test runner script

## Running Tests

### Quick Start

```bash
# Run all endpoint tests
npm run test:endpoints

# Run with coverage report
npm run test:endpoints:coverage

# Run in watch mode for development
npm run test:endpoints:watch

# Run with verbose output and coverage
npm run test:endpoints:verbose
```

### Advanced Usage

```bash
# Run specific test file
npx jest test/endpoints.test.js --config=jest.endpoints.config.js

# Run with custom timeout
npx jest --config=jest.endpoints.config.js --testTimeout=60000

# Run integration tests only
npx jest test/integration.test.js --config=jest.endpoints.config.js
```

## Test Coverage

The test suite aims for comprehensive coverage across multiple dimensions:

### Functional Coverage
- ✅ **Success Cases**: All endpoints work with valid data
- ✅ **Error Cases**: Proper error handling for invalid inputs
- ✅ **Edge Cases**: Boundary conditions and unusual scenarios
- ✅ **Authentication**: All endpoints require proper authentication
- ✅ **Validation**: Input validation works correctly

### Workflow Coverage
- ✅ **Complete Check-in Flow**: Questions → Last Values → Submit Check-in
- ✅ **Profile Management**: Get Profile → Update Cycle → Update Medication
- ✅ **New User Onboarding**: First-time user experience
- ✅ **Error Recovery**: Handling failures gracefully

### Technical Coverage
- ✅ **Service Layer**: All service methods are tested
- ✅ **Middleware**: Authentication and error handling
- ✅ **Data Validation**: Input sanitization and validation
- ✅ **Response Formats**: Consistent response structures

## Test Data Management

### Factories and Fixtures

The test suite uses factories for consistent test data:

```javascript
const { createUser, createCheckin, testUsers } = require('./fixtures/test-data');

// Create a custom user
const customUser = createUser({
  cycle_stage: 'stimulation',
  medication_status: 'taking'
});

// Use predefined test users
const newUser = testUsers.newUser;
const pregnantUser = testUsers.pregnantUser;
```

### Mock Services

All external dependencies are mocked:

```javascript
// User service mock
const mockUserService = {
  findByEmail: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
};

// Check-in service mock  
const mockCheckinService = {
  getUserCheckins: jest.fn(),
  create: jest.fn(),
  findByUserAndDate: jest.fn(),
};
```

## Test Scenarios

### Unit Test Scenarios

#### GET /api/checkins/last-values
- ✅ Returns last check-in values for authenticated user
- ✅ Returns hasValues: false when no previous check-ins exist
- ✅ Returns 404 when user not found
- ✅ Calculates days since last check-in correctly

#### GET /api/checkins/questions
- ✅ Returns personalized questions for authenticated user
- ✅ Returns 404 when user not found
- ✅ Handles empty questions array
- ✅ Includes proper metadata

#### POST /api/daily-checkin-enhanced
- ✅ Creates enhanced check-in successfully
- ✅ Returns 400 for missing required fields
- ✅ Returns 400 for invalid confidence rating
- ✅ Returns 409 for duplicate check-in on same date
- ✅ Handles cycle stage update when provided
- ✅ Filters out undefined fields from check-in data

#### GET /api/users/profile
- ✅ Returns user profile successfully
- ✅ Returns 404 when user not found
- ✅ Includes all expected profile fields

#### PATCH /api/users/cycle-stage
- ✅ Updates cycle stage successfully
- ✅ Returns 400 for missing cycle_stage
- ✅ Returns 400 for invalid cycle_stage
- ✅ Validates all allowed cycle stages
- ✅ Returns derived medication status

#### PATCH /api/users/medication-status
- ✅ Updates medication status successfully
- ✅ Returns 400 for missing medication_status
- ✅ Returns 400 for invalid medication_status
- ✅ Validates all allowed medication statuses
- ✅ Includes timestamp in response

### Integration Test Scenarios

#### Complete Check-in Workflow
- ✅ Get personalized questions
- ✅ Get last values for form defaults
- ✅ Submit enhanced check-in
- ✅ Handle cycle stage updates during check-in

#### User Profile Management Workflow
- ✅ Get current profile
- ✅ Update cycle stage
- ✅ Update medication status
- ✅ Verify consistency across updates

#### New User Onboarding Workflow
- ✅ Handle new user with no check-in history
- ✅ Provide appropriate questions for new users
- ✅ Accept first check-in submission

#### Error Recovery Workflows
- ✅ Handle duplicate check-in gracefully
- ✅ Handle service failures gracefully
- ✅ Validate input data across endpoints

## Test Utilities

### Global Test Utilities

Available as `global.testUtils`:

```javascript
// Create JWT token for testing
const token = testUtils.createTestToken({ userId: 'custom-user' });

// Wait for async operations
await testUtils.waitFor(1000);

// Get date strings
const today = testUtils.getDateString(0);
const yesterday = testUtils.getDateString(1);

// Validate response structures
testUtils.validateSuccessResponse(response, ['user', 'token']);
testUtils.validateErrorResponse(response, 'User not found');
```

### Mock Configurations

Available as `global.mockConfigs`:

```javascript
// Use default mock data
const user = mockConfigs.defaultUser;
const checkin = mockConfigs.defaultCheckin;
const questions = mockConfigs.defaultQuestions;
```

### Test Helpers

Available as `global.testHelpers`:

```javascript
// Create mock service
const mockService = testHelpers.createMockService('userService', {
  findByEmail: jest.fn().mockResolvedValue(user)
});

// Reset all mocks
testHelpers.resetMocks();
```

## Coverage Reports

### Coverage Thresholds

The test suite enforces minimum coverage thresholds:

- **Overall**: 70% (branches, functions, lines, statements)
- **Routes**: 80% (higher threshold for critical paths)

### Coverage Reports Generated

1. **Terminal Output**: Summary during test execution
2. **LCOV Report**: Machine-readable format for CI/CD
3. **HTML Report**: Human-readable browser report at `coverage/endpoints/lcov-report/index.html`
4. **JSON Report**: Structured data for further processing

### Viewing Coverage

```bash
# Run tests with coverage
npm run test:endpoints:coverage

# Open HTML report
open coverage/endpoints/lcov-report/index.html
```

## Continuous Integration

### GitHub Actions

The test suite is designed to run in CI/CD pipelines:

```yaml
- name: Run Endpoint Tests
  run: |
    npm run test:endpoints:coverage
  env:
    NODE_ENV: test
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

### Pre-deployment Checks

Before deploying to staging/production:

```bash
# Run full test suite with coverage
npm run test:endpoints:verbose

# Verify all tests pass
echo $? # Should be 0
```

## Debugging Tests

### Verbose Mode

Enable detailed test output:

```bash
JEST_VERBOSE=true npm run test:endpoints
```

### Debug Individual Tests

```bash
# Debug specific test
npx jest --config=jest.endpoints.config.js --testNamePattern="should return last check-in values"

# Debug with Node debugger
node --inspect-brk node_modules/.bin/jest --config=jest.endpoints.config.js --runInBand
```

### Common Issues

1. **Port Conflicts**: Tests use port 9002. Ensure it's available.
2. **Mock Issues**: Verify mocks are properly reset between tests.
3. **Async Issues**: Use proper async/await patterns in tests.
4. **Environment Variables**: Ensure test environment is properly configured.

## Best Practices

### Writing Tests

1. **Arrange-Act-Assert**: Structure tests clearly
2. **Descriptive Names**: Test names should explain what they test
3. **One Assertion Per Test**: Keep tests focused
4. **Mock External Dependencies**: Don't test external services
5. **Test Edge Cases**: Include boundary conditions

### Test Data

1. **Use Factories**: Create consistent test data
2. **Isolate Tests**: Each test should be independent
3. **Clean State**: Reset mocks and data between tests
4. **Realistic Data**: Use data that reflects real usage

### Performance

1. **Fast Tests**: Keep tests under 30 seconds total
2. **Parallel Execution**: Tests run serially to avoid conflicts
3. **Selective Mocking**: Only mock what's necessary
4. **Clean Teardown**: Properly clean up resources

## Troubleshooting

### Common Test Failures

#### Authentication Issues
```
Error: Unauthorized
```
**Solution**: Verify mock authentication is properly configured

#### Port Binding Issues
```
Error: EADDRINUSE: address already in use :::9002
```
**Solution**: Stop any running servers on port 9002

#### Mock Not Found
```
Error: Cannot find module '../services/user-service'
```
**Solution**: Verify mock paths match actual file locations

#### Timeout Issues
```
Error: Timeout - Async callback was not invoked within timeout
```
**Solution**: Increase timeout or check for hanging promises

### Getting Help

1. **Check Logs**: Look at test output for specific error messages
2. **Run Individual Tests**: Isolate failing tests
3. **Verify Environment**: Ensure test environment is properly configured
4. **Check Mocks**: Verify all required services are mocked

## Future Enhancements

### Planned Improvements

1. **E2E Tests**: Add Playwright/Cypress tests for browser testing
2. **Performance Tests**: Add load testing for endpoints
3. **Visual Testing**: Add screenshot testing for UI components
4. **API Contract Testing**: Add OpenAPI spec validation
5. **Mutation Testing**: Add mutation testing for test quality

### Contributing

When adding new endpoints:

1. Add unit tests to `test/endpoints.test.js`
2. Add integration tests to `test/integration.test.js`
3. Update test fixtures in `test/fixtures/test-data.js`
4. Update this documentation
5. Ensure coverage thresholds are met

For questions or issues with the test suite, refer to the development team or create an issue in the project repository.