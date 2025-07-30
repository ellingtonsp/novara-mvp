# Checklist: Adding New Field to daily_checkins

Field Name: `________________`
Field Type: `________________`
Date: `________________`

## Pre-Implementation
- [ ] Confirm field name (exact, case-sensitive)
- [ ] Confirm field type (Text, Single Select, Number, etc.)
- [ ] Check if field already exists in any environment

## Airtable Setup
- [ ] Add field to Airtable STAGING with correct type
- [ ] Add field to Airtable PRODUCTION with correct type
- [ ] Verify field permissions (should be editable)

## Backend Changes

### 1. server.js - Schema Whitelist
- [ ] Add to `PRODUCTION_AIRTABLE_SCHEMA.DailyCheckins` array
```javascript
'field_name_here', // Description of field
```

### 2. server.js - Request Handler
- [ ] Add to destructuring (if needed):
```javascript
const { 
  mood_today, 
  confidence_today,
  field_name_here, // New field
  ...additionalFormFields 
} = req.body;
```

### 3. server.js - Response Object
- [ ] Add to check-in response:
```javascript
checkin: {
  id: result.id,
  mood_today: result.fields.mood_today,
  confidence_today: result.fields.confidence_today,
  field_name_here: result.fields.field_name_here, // New field
  date_submitted: result.fields.date_submitted
}
```

### 4. server.js - Metrics Endpoint (if applicable)
- [ ] Add to metrics calculation if needed
- [ ] Add to metrics response if needed

## Frontend Changes

### 1. Component Updates
- [ ] Add field to form component
- [ ] Add to form submission payload
- [ ] Add validation if required

### 2. Display Updates
- [ ] Update components that display this data
- [ ] Add to relevant dashboards/metrics

### 3. TypeScript (if applicable)
- [ ] Update interfaces/types

## Testing

### Local Testing
- [ ] Run `node backend/scripts/pre-deployment-check.js`
- [ ] Test submission with new field
- [ ] Verify field saves to Airtable
- [ ] Verify field returns in API response
- [ ] Test in UI

### Staging Testing
- [ ] Deploy to staging
- [ ] Run `node backend/scripts/test-staging-api.js`
- [ ] Test with real user account
- [ ] Verify in Airtable staging base

### Production Verification
- [ ] After production deploy, test immediately
- [ ] Check Airtable production base
- [ ] Monitor for errors

## Documentation
- [ ] Update API documentation
- [ ] Update field documentation
- [ ] Add to DEPLOYMENT_LESSONS.md if issues found

## Rollback Plan
- [ ] Know how to remove field from schema
- [ ] Have backup of working version
- [ ] Test rollback procedure

---

## Common Issues to Avoid

1. **Field not in PRODUCTION_AIRTABLE_SCHEMA** - Silent failure
2. **Typo in field name** - Case sensitive!
3. **Wrong field type** - Breaks Airtable API
4. **Not in response object** - Saves but doesn't display
5. **Only in staging** - Production breaks

## Quick Test Command

```bash
# After adding field, test with:
curl -X POST https://localhost:9002/api/checkins \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mood_today": "hopeful",
    "confidence_today": 7,
    "field_name_here": "test value",
    "date_submitted": "2025-07-30"
  }'
```