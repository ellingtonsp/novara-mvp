# Refactored Server Deployment Plan

## Current State
- Legacy server.js (4000+ lines) running on staging
- Refactored modular server tested and ready
- Server switcher allows toggling between implementations

## Deployment Strategy

### Phase 1: Staging Deployment (Immediate)
1. **Deploy with legacy server first** (safe default)
   - Push current code to staging
   - Verify deployment succeeds with legacy server
   - Test critical endpoints

2. **Switch to refactored server**
   - Set `USE_REFACTORED_SERVER=true` in Railway
   - Redeploy (takes ~1 minute)
   - Run comprehensive tests

3. **Monitor for issues**
   - Check health endpoints
   - Test check-in submission
   - Verify insights generation
   - Monitor error logs

### Phase 2: Production Preparation (Next Week)
1. **Extended staging testing**
   - Run UAT with refactored server
   - Performance testing
   - Load testing with multiple concurrent users

2. **Prepare rollback plan**
   - Document how to switch back to legacy
   - Test rollback procedure on staging
   - Prepare incident response checklist

3. **Update monitoring**
   - Add alerts for key endpoints
   - Set up performance metrics
   - Configure error tracking

### Phase 3: Production Deployment
1. **Gradual rollout**
   - Deploy with legacy server (USE_REFACTORED_SERVER=false)
   - Switch to refactored during low-traffic period
   - Monitor closely for 24 hours

2. **Full migration**
   - After 1 week stable on refactored server
   - Remove legacy server.js
   - Update documentation

## Environment Variables

### For Staging (Railway)
```env
USE_REFACTORED_SERVER=true  # Enable refactored server
USE_SCHEMA_V2=true          # Already set
DATABASE_URL=postgresql://...  # Already set
```

### For Production
```env
USE_REFACTORED_SERVER=false  # Start with legacy
# Switch to true after validation
```

## Testing Checklist

### Critical Paths
- [ ] User login/signup
- [ ] Daily check-in submission
- [ ] Check-in retrieval
- [ ] Insights generation
- [ ] User profile updates

### Performance Tests
- [ ] Server startup time
- [ ] API response times
- [ ] Memory usage
- [ ] Database connection pooling

### Integration Tests
- [ ] Frontend compatibility
- [ ] Mobile app compatibility
- [ ] Third-party integrations

## Rollback Procedure

If issues occur:
1. Set `USE_REFACTORED_SERVER=false` in Railway
2. Redeploy (automatic)
3. Verify legacy server is running
4. Investigate issues in refactored code
5. Fix and test locally before retry

## Benefits Expected

### Immediate
- Faster deployments (smaller files)
- Easier debugging
- Better error isolation

### Long-term
- Parallel development capability
- Easier onboarding for new developers
- Better testability
- Microservices-ready architecture

## Success Metrics
- Deployment time: Should reduce from ~2min to ~1min
- Error rate: Should remain at or below current levels
- Response time: Should improve by 10-20%
- Development velocity: Should increase within 2 weeks