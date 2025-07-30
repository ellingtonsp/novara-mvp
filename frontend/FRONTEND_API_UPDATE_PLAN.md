# Frontend API Update Plan

## Current State

The frontend is currently using V1 API endpoints and is unaware of:
- PostgreSQL database (still expects Airtable responses)
- Schema V2 structure
- New refactored API endpoints
- V2 health endpoints

## API Endpoints Currently Used

### Authentication
- `POST /api/auth/login` ✅ (works with refactored server)
- `POST /api/users` ✅ (signup - works with refactored server)
- `GET /api/users/me` ✅ (profile - works with refactored server)

### Check-ins
- `POST /api/checkins` ✅ (works with refactored server)
- `GET /api/checkins?limit=X` ✅ (works with refactored server)

### Insights
- `GET /api/insights/daily` ✅ (works with refactored server)
- `GET /api/insights/micro` ❌ (not implemented in refactored server)
- `POST /api/insights/engagement` ❌ (not implemented in refactored server)

### V2 Endpoints (Not Used Yet)
- `GET /api/v2/health/daily-summary` 🆕
- `POST /api/v2/health/events` 🆕

## Implementation Strategy

### Phase 1: Ensure Compatibility (Current)
The refactored server maintains backward compatibility with all V1 endpoints the frontend uses. This is why the frontend continues to work despite the backend changes.

### Phase 2: Add Missing Endpoints
1. Implement `/api/insights/micro` endpoint
2. Implement `/api/insights/engagement` endpoint

### Phase 3: Gradual V2 Migration
1. Add feature flag to frontend for V2 endpoints
2. Create new API methods for V2 endpoints
3. Update components to use V2 when available
4. Maintain fallback to V1 for compatibility

### Phase 4: Full Migration
1. Update all frontend code to use V2 endpoints
2. Remove V1 API calls
3. Remove compatibility layer from backend

## Immediate Actions Needed

### 1. Implement Missing Micro Insights Endpoint
The WelcomeInsight component needs this endpoint.

### 2. Implement Missing Engagement Endpoint
The DailyInsightsDisplay component posts to this endpoint.

### 3. Update Frontend API Client
Add support for V2 endpoints while maintaining V1 compatibility.

## Benefits of Current Approach

1. **Zero Downtime**: Frontend continues working during migration
2. **Gradual Migration**: Can update components one at a time
3. **Easy Rollback**: Can revert to V1 if issues arise
4. **Testing**: Can A/B test V1 vs V2 endpoints