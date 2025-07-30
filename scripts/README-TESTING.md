# Novara Testing Scripts

## Overview

These scripts provide automated testing to prevent regressions and ensure all functionality works correctly before and after deployments.

## Available Scripts

### 🔥 Quick Smoke Test (< 30 seconds)
```bash
# Test staging environment
npm run test:smoke

# Test production
npm run test:smoke:production
```

### 🧪 Full Regression Test Suite (2-3 minutes)
```bash
# Test staging environment
npm run test:regression

# Test production
npm run test:regression:production
```

### 🔍 Pre-deployment Validation
```bash
# Run before deploying
npm run validate:pre-deploy
```

### 🚀 Safe Deployment Flow
```bash
# Complete pre-deploy validation and smoke tests
npm run deploy:safe

# After deployment, verify everything works
npm run post-deploy:verify
```

## Test Coverage

### Smoke Tests (Critical Path Only)
- API health check
- Frontend availability
- Core endpoints responding
- Basic CORS functionality

### Regression Tests (Comprehensive)
- ✅ User registration and authentication
- ✅ User profile management
- ✅ Daily check-in creation and retrieval
- ✅ Insights generation (daily and micro)
- ✅ Metrics calculation
- ✅ Frontend/backend integration
- ✅ CORS headers
- ✅ Response structure validation

### Pre-deployment Validation
- Node.js version check
- Dependencies installation
- TypeScript compilation
- Linting
- Build tests
- Environment configuration
- Security checks
- Console.log usage
- TODO tracking

## Common Issues

### If regression tests fail:
1. Check the specific endpoint that failed
2. Verify the API is running correctly
3. Check for recent code changes that might affect that endpoint
4. Look for response structure changes (e.g., `records` vs `checkins`)

### If pre-deployment validation fails:
1. Fix TypeScript errors first
2. Run `npm run lint:fix` in frontend
3. Ensure all environment variables are documented in `.env.example`
4. Remove any exposed secrets from code

## CI/CD Integration

The GitHub Actions workflow automatically runs:
- Smoke tests on every push to staging/main
- Pre-deployment validation on pull requests
- Full regression tests after merge

## Best Practices

1. **Before deploying**: Always run `npm run deploy:safe`
2. **After deploying**: Always run `npm run post-deploy:verify`
3. **When adding new features**: Update the regression tests
4. **For hotfixes**: At minimum run smoke tests

## Maintenance

To add new tests:
1. Add test function to `regression-test.js`
2. Add to the test execution list
3. Document what the test validates

Remember: These tests are your safety net! 🛡️