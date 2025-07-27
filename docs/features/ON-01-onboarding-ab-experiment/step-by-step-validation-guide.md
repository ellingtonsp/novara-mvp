# ON-01 Step-by-Step Validation Guide

## 🎯 Overview

This guide provides a focused, incremental approach to validating the ON-01 A/B test implementation. Each step builds on the previous one and stops at logical testing points for easy troubleshooting.

## 🧪 Testing Philosophy

**Incremental Validation**: Test each component individually before testing integration
**Logical Breakpoints**: Pause after each major component for review
**Easy Troubleshooting**: Isolate issues to specific components
**Production Readiness**: Ensure each step works before proceeding

## 📋 Test Steps Overview

| Step | Component | Purpose | Success Criteria |
|------|-----------|---------|------------------|
| **1** | A/B Test Framework | Validate core logic | Deterministic 50/50 split |
| **2** | Backend Database | Verify schema support | onboarding_path field works |
| **3** | Control Path | Test standard flow | Full onboarding → Insights |
| **4** | Test Path | Test fast flow | Fast signup → Baseline → Insights |
| **5** | Insights Blocking | Verify gating logic | Incomplete users blocked |
| **6** | Analytics | Check tracking | Events captured correctly |
| **7** | Complete Journey | End-to-end validation | Both paths work fully |

## 🚀 Running the Tests

### Quick Start
```bash
# Run the complete incremental test
./scripts/test-ON-01-incremental.sh
```

### Manual Step-by-Step
```bash
# Start backend (if not running)
cd backend && NODE_ENV=development USE_LOCAL_DATABASE=true PORT=9002 node server.js

# In another terminal, run individual steps
node test-ON-01-step-by-step.js
```

## 📊 Step Details

### Step 1: A/B Test Framework Validation

**What it tests:**
- Session ID generation and uniqueness
- Deterministic path assignment logic
- 50/50 distribution simulation

**Expected results:**
- ✅ Unique session IDs generated
- ✅ Consistent path assignment for same session
- ✅ ~50/50 distribution (within 20% variance)

**If it fails:**
- Check `abTestUtils.ts` session ID generation
- Verify deterministic split logic
- Review distribution calculation

### Step 2: Backend Database Schema Validation

**What it tests:**
- Backend health and connectivity
- Database schema with `onboarding_path` field
- User creation with new fields

**Expected results:**
- ✅ Backend responds on port 9002
- ✅ Users created with `onboarding_path` field
- ✅ Database stores new fields correctly

**If it fails:**
- Check backend is running on correct port
- Verify SQLite database schema
- Review user creation endpoint

### Step 3: Control Path User Journey

**What it tests:**
- Standard onboarding flow (6 questions)
- User authentication and login
- Baseline completion logic for control users

**Expected results:**
- ✅ Control users created with full onboarding
- ✅ Login works correctly
- ✅ Control users DON'T need baseline completion

**If it fails:**
- Check user creation endpoint
- Verify authentication flow
- Review baseline logic for control path

### Step 4: Test Path User Journey

**What it tests:**
- Fast onboarding flow (3 questions)
- Baseline panel completion
- Post-baseline state validation

**Expected results:**
- ✅ Test users created with minimal data
- ✅ Baseline panel completion works
- ✅ Users marked as baseline_completed

**If it fails:**
- Check fast onboarding endpoint
- Verify baseline panel API
- Review baseline completion logic

### Step 5: Insights Blocking Logic

**What it tests:**
- Insights access for complete users
- Insights blocking for incomplete users
- Proper error messages

**Expected results:**
- ✅ Control users get insights immediately
- ✅ Incomplete test users blocked from insights
- ✅ Proper error messages returned

**If it fails:**
- Check insights endpoint logic
- Verify blocking conditions
- Review error message handling

### Step 6: Analytics Tracking

**What it tests:**
- Analytics endpoint availability
- Event tracking for onboarding completion
- PostHog integration

**Expected results:**
- ✅ Analytics endpoints respond
- ✅ Events tracked correctly
- ✅ PostHog integration working

**If it fails:**
- Check analytics endpoint setup
- Verify event tracking logic
- Review PostHog configuration

### Step 7: Complete User Journey Integration

**What it tests:**
- End-to-end control path: Signup → Check-in → Insights
- End-to-end test path: Fast signup → Baseline → Check-in → Insights
- Full integration of all components

**Expected results:**
- ✅ Both paths complete successfully
- ✅ Check-ins submitted correctly
- ✅ Insights generated for both paths

**If it fails:**
- Check integration between components
- Verify data flow between steps
- Review error handling

## 🔧 Troubleshooting Common Issues

### Backend Not Starting
```bash
# Check if port 9002 is available
lsof -i :9002

# Kill any existing processes
pkill -f "node server.js"

# Start with verbose logging
cd backend && NODE_ENV=development USE_LOCAL_DATABASE=true PORT=9002 DEBUG=* node server.js
```

### Database Issues
```bash
# Check SQLite database
sqlite3 backend/data/novara-local.db ".schema Users"

# Reset database if needed
rm backend/data/novara-local.db
cd backend && npm run seed
```

### Frontend Issues
```bash
# Check if frontend is running
curl http://localhost:4200

# Start frontend if needed
cd frontend && npm run dev
```

### Environment Variables
```bash
# Verify environment setup
echo "VITE_AB_TEST_ENABLED: $VITE_AB_TEST_ENABLED"
echo "VITE_DEBUG_AB_TEST: $VITE_DEBUG_AB_TEST"
echo "NODE_ENV: $NODE_ENV"
```

## 📈 Success Metrics

### Test Results Interpretation

| Success Rate | Status | Action Required |
|--------------|--------|-----------------|
| **90-100%** | ✅ Production Ready | Deploy to staging |
| **70-89%** | 🟡 Nearly Ready | Fix minor issues |
| **<70%** | ❌ Needs Work | Address major issues |

### Key Metrics to Track

1. **A/B Test Distribution**: Should be ~50/50
2. **User Creation Success**: Both paths should work
3. **Baseline Completion**: Test path users should complete
4. **Insights Access**: Proper blocking and access
5. **Analytics Events**: All events tracked correctly

## 🎯 Next Steps After Validation

### If Tests Pass (90%+)
1. Update ON-01 implementation status to ✅ COMPLETE
2. Deploy to staging environment
3. Run staging validation tests
4. Prepare for production deployment

### If Tests Partially Pass (70-89%)
1. Identify and fix failing components
2. Re-run specific test steps
3. Update implementation status
4. Document remaining issues

### If Tests Fail (<70%)
1. Focus on core functionality first
2. Fix A/B test framework issues
3. Resolve database schema problems
4. Re-run tests after fixes

## 📄 Documentation Updates

After successful validation, update:

1. **ON-01-IMPLEMENTATION-STATUS.md** - Mark as complete
2. **Roadmap** - Update story status
3. **Deployment notes** - Add production deployment steps
4. **Testing procedures** - Document validation process

## 🔄 Continuous Validation

Run this validation:
- After each major code change
- Before staging deployment
- Before production deployment
- When investigating issues

This ensures ON-01 remains stable and functional throughout development. 