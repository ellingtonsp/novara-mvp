# Check-in Update E2E Test Suite

## Overview

This comprehensive end-to-end test suite verifies that the check-in update functionality works correctly after the hotfix implementation. It tests the complete flow from UI to database to ensure users can properly update their check-ins throughout the day.

## Test Coverage

### Core Functionality Tests
1. **Create New Check-in** - Verifies initial check-in creation returns 201 status
2. **Duplicate Prevention** - Ensures 409 status when trying to create duplicate check-ins
3. **Check-in Update** - Tests PUT endpoint returns 200 status with updated data
4. **Database Persistence** - Verifies updated data persists correctly in PostgreSQL
5. **UI State Management** - Tests that system recognizes existing check-ins
6. **Complete Update Flow** - Validates entire user journey from create to update

### Data Integrity Tests
- All form fields are properly saved and retrieved
- Updated values overwrite previous values correctly
- Timestamps are properly managed (created_at vs updated_at)
- User associations remain intact

### API Endpoint Tests
- `POST /api/checkins` - Create new check-in
- `PUT /api/checkins/:id` - Update existing check-in
- `GET /api/checkins` - Retrieve user check-ins
- Auth token validation throughout the flow

## Prerequisites

### Environment Setup
- **Backend**: Running on port 9002 (`./scripts/start-local.sh`)
- **Frontend**: Running on port 4200 (optional, for UI validation)
- **Database**: PostgreSQL configured and accessible
- **Node.js**: Compatible version installed

### Required Services
```bash
# Start the backend with PostgreSQL
./scripts/start-local.sh

# Optionally start frontend
cd frontend && npm run dev
```

## Usage

### Quick Start (Recommended)
```bash
# Run the complete test suite with environment checks
./scripts/test-checkin-update-e2e.sh
```

### Direct Execution
```bash
# Run just the test script
node ./scripts/test-checkin-update-e2e.js
```

### Manual Environment Check
```bash
# Verify backend is running
curl http://localhost:9002/api/health

# Check if ports are in use
lsof -i :9002  # Backend
lsof -i :4200  # Frontend
```

## Test Data

### Initial Check-in Data
```javascript
{
  mood_today: 'hopeful',
  confidence_today: 6,
  medication_taken: 'yes',
  user_note: 'Initial check-in - feeling optimistic about the day',
  primary_concern_today: 'appointment_preparation',
  anxiety_level: 4
}
```

### Updated Check-in Data
```javascript
{
  mood_today: 'grateful, excited',
  confidence_today: 8,
  medication_taken: 'yes',
  user_note: 'Updated check-in - had a great appointment and feeling much better!',
  primary_concern_today: 'financial_planning',
  anxiety_level: 2
}
```

### Test User
- **Email**: `checkin-update-test@example.com`
- **Password**: `TestPassword123!`
- **Type**: `trying_to_conceive`
- **Auto-cleanup**: Existing check-ins are cleaned up before tests

## Expected Results

### Success Scenario
```
✅ Environment Check - Backend healthy, PostgreSQL detected
✅ User Setup - Test user logged in successfully
✅ Create Initial Check-in - 201 status, proper data structure
✅ Duplicate Validation - 409 status prevents duplicates
✅ Update Check-in - 200 status, data updated correctly
✅ Database Persistence - Updated data persists in PostgreSQL
✅ UI State Management - System recognizes existing check-in
✅ Complete Update Flow - Full user journey works end-to-end

🎉 ALL TESTS PASSED! Check-in update functionality is working correctly.
```

### Failure Indicators
- **Environment Issues**: Backend not running, PostgreSQL connection failed
- **Auth Problems**: Token validation failing, user creation issues
- **API Failures**: Wrong status codes, malformed responses
- **Data Issues**: Field values not persisting, update not working
- **Database Problems**: PostgreSQL queries failing, constraints violated

## Test Output

### Summary Report
```
📋 CHECK-IN UPDATE E2E TEST REPORT
==================================
Environment: Local Development
Backend: http://localhost:9002
Frontend: http://localhost:4200
Database: PostgreSQL
Test Date: 2025-08-01T10:30:00.000Z
Test User: checkin-update-test@example.com

SUMMARY RESULTS:
  ✅ Passed: 12
  ❌ Failed: 0
  📊 Total Tests: 12
  🎯 Success Rate: 100%
```

### Detailed Results
Each test includes:
- **Status**: Pass/Fail with visual indicators
- **Details**: Expected vs actual values
- **Error Messages**: Specific failure reasons
- **Network Info**: Response codes and timing
- **Data Validation**: Field-by-field verification

## Troubleshooting

### Common Issues

#### Backend Not Running
```bash
# Start the backend
./scripts/start-local.sh

# Check if it's running
curl http://localhost:9002/api/health
```

#### PostgreSQL Connection Issues
```bash
# Check PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL if needed
brew services start postgresql

# Verify connection
psql -h localhost -p 5432 -U your_username -d novara_local
```

#### Port Conflicts
```bash
# Kill processes on required ports
lsof -ti:9002 | xargs kill -9  # Backend
lsof -ti:4200 | xargs kill -9  # Frontend
```

#### Auth/Token Issues
- Check that backend auth middleware is enabled
- Verify JWT secret is configured
- Ensure user registration/login endpoints work

#### Database Schema Issues
- Run database migrations: `npm run migrate`
- Check table exists: `\dt` in psql
- Verify column names match expected fields

### Debug Mode
Enable verbose logging by setting:
```bash
export DEBUG=true
node ./scripts/test-checkin-update-e2e.js
```

## Integration with CI/CD

### GitHub Actions
```yaml
name: Check-in Update E2E Tests
on: [push, pull_request]
jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Start backend
        run: ./scripts/start-local.sh &
      - name: Run E2E tests
        run: ./scripts/test-checkin-update-e2e.sh
```

### Local Development Workflow
1. Make changes to check-in functionality
2. Start local environment: `./scripts/start-local.sh`
3. Run tests: `./scripts/test-checkin-update-e2e.sh`
4. Verify all tests pass before committing
5. Review test report for any regressions

## Related Files

### Backend Files
- `backend/routes/checkins.js` - Check-in API endpoints
- `backend/services/checkin-service.js` - Business logic
- `backend/database/postgres-adapter.js` - Database operations

### Frontend Files
- `frontend/src/components/DailyCheckinForm.tsx` - Main check-in form
- `frontend/src/components/TodaysCheckinStatus.tsx` - Update button component
- `frontend/src/lib/api.ts` - API communication layer

### Test Files
- `scripts/test-checkin-update-e2e.js` - Main test script
- `scripts/test-checkin-update-e2e.sh` - Shell wrapper script
- `scripts/test-checkin-data-integrity.js` - Related data tests

## Success Criteria

The test suite passes when:
1. ✅ Users can create initial check-ins (201 status)
2. ✅ Duplicate check-ins are prevented (409 status)
3. ✅ Users can update existing check-ins (200 status)
4. ✅ Updated data persists in PostgreSQL database
5. ✅ UI correctly identifies existing check-ins
6. ✅ Complete update flow works end-to-end
7. ✅ No data corruption or loss during updates
8. ✅ Proper error handling for edge cases

This comprehensive test suite ensures the hotfix successfully enables users to update their check-ins throughout the day, providing the flexibility needed for the IVF journey tracking application.