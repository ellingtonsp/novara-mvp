# Schema V2 Deployment Guide

## 🎯 Overview

This guide covers the deployment of Schema V2 - an event-sourced PostgreSQL architecture that replaces the problematic Airtable/SQLite schema mismatch issues. Schema V2 provides:

- **Event-sourced health data** - Immutable, append-only event log
- **JSONB flexibility** - Schema evolution without migrations  
- **Backward compatibility** - Existing API continues to work
- **Enhanced analytics** - Materialized views for fast queries
- **Zero data loss** - Eliminates field filtering issues

## 🏗️ Architecture

### Schema V2 Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   PostgreSQL    │
│   (unchanged)   │────┤   + Schema V2    │────┤   Schema V2     │
│                 │    │   Services       │    │   Tables        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Compatibility   │
                       │     Layer        │
                       │  (V1 ↔ V2)      │
                       └──────────────────┘
```

### Key Tables

- **`health_events`** - Central event log (mood, medication, symptoms, etc.)
- **`users`** - Clean user authentication data
- **`user_profiles`** - Extended user profile information  
- **`insights`** - AI-generated insights and recommendations
- **`user_daily_metrics`** - Materialized view for fast analytics
- **`daily_checkins_legacy`** - Compatibility view for existing API

## 🚀 Deployment Steps

### Phase 1: Enable Schema V2 (Zero Downtime)

1. **Set Environment Variable**
   ```bash
   # In Railway dashboard or via CLI
   railway variables set USE_SCHEMA_V2=true
   ```

2. **Restart Backend Service**
   ```bash
   railway service restart backend
   ```

3. **Verify Deployment**
   ```bash
   curl https://your-app.railway.app/api/v2/status \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

   Expected response:
   ```json
   {
     "success": true,
     "status": {
       "schema_v2_enabled": true,
       "database_type": "postgresql",
       "features": {
         "health_events": true,
         "event_sourcing": true,
         "enhanced_analytics": true,
         "backward_compatibility": true
       }
     }
   }
   ```

### Phase 2: Verify Existing Functionality

1. **Test Existing API Endpoints**
   ```bash
   # Daily check-ins still work
   curl -X POST https://your-app.railway.app/api/checkins \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "mood_today": "hopeful",
       "confidence_today": 7,
       "medication_taken": "yes"
     }'
   
   # Get check-ins still works
   curl https://your-app.railway.app/api/checkins \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. **Check Logs for Schema V2 Usage**
   ```bash
   railway logs --service backend
   ```
   
   Look for:
   ```
   🚀 Using Schema V2 for check-in creation
   🚀 Using Schema V2 for check-ins retrieval
   🔧 Schema V2: ENABLED
   ```

### Phase 3: Test New Schema V2 Features

1. **Health Timeline**
   ```bash
   curl "https://your-app.railway.app/api/v2/health/timeline?limit=10" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. **Enhanced Analytics**
   ```bash
   curl "https://your-app.railway.app/api/v2/analytics?timeframe=week" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. **Create Health Events**
   ```bash
   curl -X POST https://your-app.railway.app/api/v2/health/events \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "event_type": "mood",
       "event_subtype": "quick_check",
       "event_data": {
         "mood": "confident",
         "confidence": 9,
         "note": "Great day!"
       }
     }'
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `USE_SCHEMA_V2` | `true` | Enable Schema V2 event-sourced architecture |
| `DATABASE_URL` | `postgresql://...` | PostgreSQL connection string (already set) |
| `JWT_SECRET` | `your-secret` | JWT signing secret (already set) |

### Feature Flags

Schema V2 uses feature flags for gradual rollout:

```javascript
// In backend code
const useSchemaV2 = process.env.USE_SCHEMA_V2 === 'true';

// Automatically routes to appropriate schema
if (useSchemaV2) {
  // Use event-sourced health_events table
  return await compatibility.createDailyCheckin(userId, data);
} else {
  // Use legacy daily_checkins table
  return await createLegacyCheckin(userId, data);
}
```

## 📊 Monitoring

### Key Metrics to Watch

1. **Response Times**
   - Check-in creation: Should remain <200ms
   - Check-in retrieval: Should remain <100ms
   - Analytics queries: Should be <500ms

2. **Database Performance**
   ```sql
   -- Check health_events table size
   SELECT COUNT(*) FROM health_events;
   
   -- Check materialized view freshness
   SELECT last_updated FROM user_daily_metrics ORDER BY last_updated DESC LIMIT 1;
   
   -- Monitor query performance
   SELECT query, mean_exec_time, calls 
   FROM pg_stat_statements 
   WHERE query LIKE '%health_events%' 
   ORDER BY mean_exec_time DESC;
   ```

3. **Error Rates**
   - Watch for any 500 errors in `/api/checkins` endpoints
   - Monitor Schema V2 specific endpoints for issues

### Logs to Monitor

```bash
# Backend service logs
railway logs --service backend --tail

# Look for these patterns:
# ✅ Good: "Using Schema V2 for check-in creation"
# ❌ Bad: "Check-in creation error:" 
# ⚠️  Watch: "Falling back to V1 approach"
```

## 🔄 Rollback Plan

If issues arise, you can instantly rollback:

1. **Disable Schema V2**
   ```bash
   railway variables set USE_SCHEMA_V2=false
   railway service restart backend
   ```

2. **Verify Rollback**
   ```bash
   curl https://your-app.railway.app/api/v2/status \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```
   
   Should show:
   ```json
   {
     "status": {
       "schema_v2_enabled": false,
       "database_type": "postgresql"
     }
   }
   ```

3. **Data Safety**
   - All Schema V2 events are preserved in `health_events` table
   - Legacy `daily_checkins` table continues to work normally
   - No data is lost during rollback

## 🚧 Migration Path to Frontend

### Phase 1: Backend Only (Current)
- ✅ Schema V2 backend deployed
- ✅ Existing frontend unchanged
- ✅ Backward compatibility maintained

### Phase 2: Gradual Frontend Migration (Future)
- Update components to use `/api/v2/*` endpoints
- Implement enhanced analytics UI
- Add real-time health timeline view
- Utilize event-sourced data for insights

### Phase 3: Full Migration (Future)
- Remove legacy API compatibility layer
- Pure event-sourced architecture
- Advanced analytics and ML features

## 📝 API Reference

### New Schema V2 Endpoints

#### `GET /api/v2/status`
Get Schema V2 status and features

#### `GET /api/v2/health/timeline`
Get user's health event timeline
- Query params: `start_date`, `end_date`, `event_types`, `limit`

#### `GET /api/v2/health/daily-summary`
Get summary of health events for a specific day
- Query params: `date` (defaults to today)

#### `POST /api/v2/health/events`
Create individual health events
- Body: `event_type`, `event_subtype`, `event_data`, `occurred_at`

#### `GET /api/v2/analytics`
Get enhanced analytics with event-sourced data
- Query params: `timeframe` (week, month, quarter)

### Existing Endpoints (Unchanged)
- `POST /api/checkins` - Still works, now uses Schema V2 under the hood
- `GET /api/checkins` - Still works, returns data from compatibility view
- All other existing endpoints remain functional

## ✅ Success Criteria

Schema V2 deployment is successful when:

1. **Zero Downtime** - Existing API continues to work
2. **No Data Loss** - All check-ins and user data preserved
3. **Performance Maintained** - Response times within normal ranges
4. **New Capabilities** - Schema V2 endpoints return valid data
5. **Field Preservation** - All 18 enhanced form fields now save correctly

## 🔍 Troubleshooting

### Common Issues

1. **"Schema V2 not available" errors**
   - Check `USE_SCHEMA_V2` environment variable is set to `true`
   - Verify PostgreSQL `DATABASE_URL` is configured

2. **Check-ins not saving**
   - Check backend logs for database connection errors
   - Verify health_events table exists: `\dt health_events` in psql

3. **Analytics queries slow**
   - Refresh materialized views: `REFRESH MATERIALIZED VIEW user_daily_metrics;`
   - Check indexes are present: `\di user_daily_metrics`

4. **Memory usage increases**
   - Monitor PostgreSQL connection pool: max 20 connections
   - Watch for connection leaks in application logs

### Support Commands

```bash
# Check database schema
node backend/scripts/check-daily-metrics.js

# Test Schema V2 functionality
node backend/scripts/test-schema-v2.js

# Test API integration
node backend/scripts/test-schema-v2-api.js

# Refresh materialized views
node backend/scripts/fix-weekly-metrics.js
```

## 🎉 Next Steps

After successful deployment:

1. **Monitor for 24-48 hours** to ensure stability
2. **Collect performance metrics** to establish new baselines  
3. **Plan frontend migration** to utilize new Schema V2 capabilities
4. **Consider additional event types** (sleep, exercise, appointments)
5. **Implement advanced analytics** using event-sourced data

Schema V2 provides a solid foundation for scaling Novara's health tracking capabilities while maintaining full backward compatibility and eliminating data loss issues.