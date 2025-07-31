# Production Database Setup Guide

## Prerequisites
- Access to production database (Railway/Heroku/etc)
- Production DATABASE_URL
- PostgreSQL client tools installed locally

## Setup Steps

### 1. Connect to Production Database
```bash
# Using Railway CLI
railway link
railway connect postgres

# OR using direct psql with your production DATABASE_URL
psql $PRODUCTION_DATABASE_URL
```

### 2. Run Schema V2 Migration
```bash
# From the novara-mvp directory
psql $PRODUCTION_DATABASE_URL < database/schema-v2.sql
```

### 3. Verify Schema Creation
```sql
-- Check all tables were created
\dt

-- Should see:
-- health_events
-- insights  
-- user_profiles
-- users

-- Verify health_events structure
\d health_events

-- Verify user_profiles has all needed columns
\d user_profiles
```

### 4. Set Production Environment Variables
Ensure these are set in your production environment:
```
USE_SCHEMA_V2=true
USE_REFACTORED_SERVER=true
JWT_SECRET=[secure-production-secret]
NODE_ENV=production
```

### 5. Test Connection
```bash
# Quick test to ensure connection works
psql $PRODUCTION_DATABASE_URL -c "SELECT version();"

# Check if any existing data needs migration
psql $PRODUCTION_DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

## Important Notes

1. **Backup First**: If you have existing production data, create a backup before running migrations
   ```bash
   pg_dump $PRODUCTION_DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Schema V2 is Different**: 
   - Uses `health_events` table instead of `daily_checkins`
   - Event-sourced architecture
   - JSONB storage for flexibility

3. **No Data Migration Included**: This creates empty tables. If you need to migrate existing data from Airtable or another source, that's a separate process.

## Rollback Plan
If something goes wrong:
```sql
-- Connect to production
psql $PRODUCTION_DATABASE_URL

-- Drop V2 tables (careful!)
DROP TABLE IF EXISTS health_events CASCADE;
DROP TABLE IF EXISTS insights CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Restore from backup if needed
psql $PRODUCTION_DATABASE_URL < backup_[timestamp].sql
```

## Post-Setup Verification
Run the regression tests against production (carefully):
```bash
# Set production URL temporarily for testing
export API_URL=https://your-production-url.com

# Run a subset of safe read-only tests
# DO NOT run tests that create data in production!
```