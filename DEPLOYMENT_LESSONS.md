# Deployment Lessons Learned

## 1. Railway URL Naming Convention
**Issue**: Confusion about Railway service URLs (single vs double "staging")
**Learning**: Railway auto-generates URLs by appending environment to service name
- Service name: `novara-staging`
- Generated URL: `novara-staging-staging.up.railway.app`

**Future Prevention**:
- Added smart URL detection in `frontend/src/lib/environment.ts`
- Centralized Railway URL mapping with clear comments
- Health check utility to verify connectivity

## 2. Airtable Schema Whitelisting
**Issue**: New fields not saving despite existing in Airtable
**Root Cause**: Backend has `PRODUCTION_AIRTABLE_SCHEMA` whitelist that filters fields
**Impact**: Silent failure - no errors, but data not saved

**Future Prevention**:
- Always check `PRODUCTION_AIRTABLE_SCHEMA` when adding new fields
- Add console warnings when fields are filtered
- Consider making schema validation configurable by environment

## 3. API Endpoint Changes
**Issue**: Login endpoint changed from `/api/users/login` to `/api/auth/login`
**Learning**: Keep API documentation and test scripts synchronized

**Future Prevention**:
- Maintain API endpoint documentation
- Use the `/api/checkins-test` endpoint to verify available routes
- Update test scripts when endpoints change

## 4. Debugging Checklist for "Field Not Saving"

1. **Frontend**: Is the field being sent in the request?
   - Check Network tab in browser DevTools
   - Check the request payload

2. **Backend**: Is the field being received?
   - Add console.log for req.body
   - Check if field is in destructured variables

3. **Schema Validation**: Is the field whitelisted?
   - Check `PRODUCTION_AIRTABLE_SCHEMA`
   - Look for "Filtered out field" logs

4. **Airtable**: Does the field exist with exact name?
   - Case sensitive field names
   - Check field type compatibility

5. **Response**: Is the field included in API response?
   - Check the response construction
   - Add field to response object

## 5. Environment-Specific Configurations

**Issue**: Different environments may have different schemas
**Learning**: Staging and production Airtable bases might differ

**Future Prevention**:
```javascript
// Consider environment-specific schemas
const AIRTABLE_SCHEMA = {
  production: { ... },
  staging: { ... }
};
```

## 6. Testing Best Practices

**Created Scripts**:
- `test-medication-complete.js` - Comprehensive field testing
- `verify-schema.js` - Schema validation
- `debug-medication-tracking.js` - Field-specific debugging

**Key Testing Points**:
1. Always test with actual user accounts
2. Verify both submission AND retrieval
3. Check all environments (local, staging, production)
4. Use health check endpoints first

## 7. Git Workflow Improvements

**Issue**: Created confusing branch structure
**Learning**: Keep it simple

**Best Practice**:
```bash
# For bugs found during staging UAT
git checkout staging
# Fix directly in staging branch
git add .
git commit -m "fix: ..."
git push

# OR for complex fixes
git checkout -b hotfix/specific-issue staging
# Make fixes
git checkout staging
git merge hotfix/specific-issue
git push
```

## 8. CORS and API URL Issues

**Prevention**:
- Always verify actual deployed URLs
- Don't assume URL patterns
- Test with curl before updating frontend
- Use health checks to verify connectivity

## 9. Critical Backend Files to Check

When adding new fields, always check:
1. `PRODUCTION_AIRTABLE_SCHEMA` in `server.js`
2. Field destructuring in endpoint handlers
3. Response object construction
4. Any field filtering functions

## 10. Deployment Verification

**Always After Deployment**:
1. Check health endpoint
2. Run validation tests
3. Test new features with real data
4. Verify in actual UI, not just API

---

## Quick Reference Commands

```bash
# Check staging health
curl https://novara-staging-staging.up.railway.app/api/health

# Test login
curl -X POST https://novara-staging-staging.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Check recent deployments
gh run list --branch staging --limit 5

# Run validation tests
node backend/scripts/test-staging-api.js
```

## Schema Update Checklist

- [ ] Add field to Airtable (staging & production)
- [ ] Add field to `PRODUCTION_AIRTABLE_SCHEMA`
- [ ] Add field to request destructuring
- [ ] Add field to response object
- [ ] Update TypeScript interfaces
- [ ] Test in all environments
- [ ] Update API documentation