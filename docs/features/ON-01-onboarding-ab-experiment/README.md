# ON-01 — Onboarding AB Experiment (Fast Lane vs. Control)

## Overview
ON-01 implements a dynamic onboarding system that automatically assigns users to either a control path (full onboarding) or test path (fast lane) through a deterministic A/B test framework, providing a 50/50 split between the two onboarding experiences.

## Current Implementation Status: 🟡 PARTIALLY COMPLETE

### ✅ **A/B Test Framework (Working)**
- **50/50 Split**: Deterministic session-based split between 'control' and 'test' paths
- **Consistent Behavior**: Cached decisions prevent hard refresh inconsistencies
- **PostHog Integration**: Feature flag support with fallback to deterministic split
- **Development Testing**: Environment variable override for forced paths
- **Onboarding Screen Split**: Users correctly assigned to control vs. test paths

### ⚠️ **Needs Validation/Fixes**
- **Onboarding Status Storage**: Not convinced we're storing full vs. quick onboarding status correctly
- **Landing Page Logic**: After completing full onboarding, users not seeing correct daily insights or daily check-in
- **User Experience Flow**: Complete user journey needs validation
- **Backend Integration**: Insights blocking logic may need fixes

### Onboarding Paths

#### Control Path (Standard Onboarding)
- Full onboarding questions (primary_need, cycle_stage, etc.)
- Complete user profile required before insights
- Traditional user experience

#### Test Path (Fast Lane)
- Quick signup with minimal fields
- "Complete Your Profile" prompt after signup
- Baseline completion required before insights
- Streamlined experience for time-pressed users

## Technical Implementation

### Core Files
- `frontend/src/utils/abTestUtils.ts` - A/B test logic and session management ✅
- `frontend/src/components/NovaraLanding.tsx` - Path-based rendering logic ⚠️
- `frontend/src/components/FastOnboarding.tsx` - Fast lane signup component ⚠️
- `frontend/src/components/BaselinePanel.tsx` - Profile completion modal ⚠️

### Key Functions
- `getOnboardingPath()` - Determines user's onboarding path ✅
- `needsBaselineCompletion()` - Checks if user needs profile completion ⚠️
- `getSessionId()` - Manages session persistence ✅
- `clearOnboardingPathCache()` - Development testing utility ✅

### Environment Configuration
```bash
# Required in .env.development
VITE_AB_TEST_ENABLED=true
VITE_FORCE_ONBOARDING_PATH=  # Empty for random, 'test' or 'control' to force
VITE_DEBUG_AB_TEST=true
```

## User Experience Flow

### Test Path (Fast Lane)
1. User arrives at landing page
2. A/B test assigns them to 'test' path ✅
3. Quick signup with minimal fields ⚠️
4. Redirected to dashboard with "Complete Your Profile" prompt ⚠️
5. User clicks "Complete Profile" to open baseline panel ⚠️
6. After baseline completion, full dashboard unlocked ⚠️

### Control Path (Standard)
1. User arrives at landing page
2. A/B test assigns them to 'control' path ✅
3. Full onboarding questions presented ⚠️
4. Complete profile required before dashboard access ⚠️
5. Traditional onboarding experience ⚠️

## Testing & Validation

### ✅ **A/B Test Consistency (Working)**
- ✅ **Hard Refresh**: Same path maintained across refreshes
- ✅ **Session Persistence**: Cached decisions prevent inconsistencies
- ✅ **50/50 Split**: Deterministic split based on session ID
- ✅ **Development Override**: Environment variables for testing

### ⚠️ **User Journey Validation (Needs Work)**
- ⚠️ **Test Path**: Fast signup → Profile completion → Full access (needs validation)
- ⚠️ **Control Path**: Full onboarding → Complete profile → Full access (needs validation)
- ⚠️ **Insights Blocking**: Backend correctly blocks insights until completion (needs validation)
- ⚠️ **Frontend Logic**: Conditional rendering based on completion status (needs validation)

## Analytics & Tracking

### Events Tracked
- `onboarding_path_selected` - When user is assigned to a path
- `onboarding_completed` - When full onboarding is completed
- `baseline_completed` - When baseline panel is completed (test path)

### PostHog Integration
- Feature flag: `fast_onboarding_v1`
- Fallback to deterministic split when PostHog unavailable
- Development bypass for testing

## Configuration Options

### Environment Variables
```bash
# Enable A/B testing
VITE_AB_TEST_ENABLED=true

# Force specific path (development only)
VITE_FORCE_ONBOARDING_PATH=test    # Force fast path
VITE_FORCE_ONBOARDING_PATH=control # Force control path
VITE_FORCE_ONBOARDING_PATH=        # Random 50/50 split

# Debug logging
VITE_DEBUG_AB_TEST=true
```

### Session Management
- Session ID generated on first visit
- Path decision cached in sessionStorage
- Consistent behavior across page refreshes
- Clear cache function for testing

## Current Status

### ✅ **What's Working**
- A/B test assignment to control vs. test paths
- Session consistency across hard refreshes
- Development environment configuration
- Basic framework structure

### ⚠️ **What Needs Work**
- Onboarding status storage in database
- Landing page logic after onboarding completion
- Daily insights display logic
- Daily check-in availability logic
- Complete user journey validation

## Next Steps Required

### Immediate Validation Needed
1. **Database Storage**: Verify onboarding status is stored correctly
2. **Landing Page Logic**: Fix conditional rendering after onboarding
3. **User Journey Testing**: Validate complete flow from signup to insights
4. **Backend Integration**: Verify insights blocking works correctly

## Related Documentation
- [A/B Test Implementation Guide](../ab-test-implementation.md)
- [Onboarding Flow Documentation](../onboarding-flow.md)
- [Analytics Integration Guide](../analytics-integration.md) 