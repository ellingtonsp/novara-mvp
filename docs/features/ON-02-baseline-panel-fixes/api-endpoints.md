# API Endpoints: Baseline Panel Fixes

## Modified Endpoints

### PATCH /api/users/baseline
Updates user baseline information without requiring page reload.

**Request:**
```json
{
  "nickname": "string",
  "confidence_meds": "number (1-10)",
  "confidence_costs": "number (1-10)",
  "confidence_overall": "number (1-10)",
  "top_concern": "string",
  "baseline_completed": "boolean"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "email": "string",
    "nickname": "string",
    "confidence_meds": "number",
    "confidence_costs": "number",
    "confidence_overall": "number",
    "top_concern": "string",
    "baseline_completed": true,
    "updated_at": "timestamp"
  }
}
```

**Changes Made:**
- Added proper field validation
- Fixed response to include updated user object
- Ensured baseline_completed flag is set

## Frontend API Integration

### Context Update Pattern
```typescript
// Before (problematic):
const response = await fetch(`${API_BASE_URL}/api/users/baseline`, {...});
if (response.ok) {
  window.location.reload(); // ❌ Loses state
}

// After (fixed):
const response = await fetch(`${API_BASE_URL}/api/users/baseline`, {...});
if (response.ok) {
  updateUser({
    nickname: data.nickname,
    confidence_meds: data.confidence_meds,
    confidence_costs: data.confidence_costs,
    confidence_overall: data.confidence_overall,
    top_concern: data.top_concern,
    baseline_completed: true
  }); // ✅ Preserves state
}
```

## Field Mapping Issues Fixed
- Frontend sends: `primary_concern`
- Backend expects: `primary_need`
- Fix: Added mapping in fast onboarding submission

## Error Handling
- 400: Invalid baseline data
- 401: Unauthorized (no token)
- 404: User not found
- 500: Server error