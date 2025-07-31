# Railway Environment Variables for PostgreSQL Setup

## Critical Schema Alignment Requirements

### ⚠️ IMPORTANT: All environments MUST use identical configuration

## Staging Environment Variables
```bash
# Database (Railway auto-injects these when PostgreSQL is added)
# DATABASE_URL=postgresql://... (auto-injected by Railway)

# Schema Configuration - MUST BE IDENTICAL ACROSS ALL ENVIRONMENTS
USE_SCHEMA_V2=true
USE_REFACTORED_SERVER=true

# Environment
NODE_ENV=staging
RAILWAY_ENVIRONMENT=staging

# Security
JWT_SECRET=staging_super_secret_jwt_key_different_from_prod

# Remove/Delete these Airtable variables:
# AIRTABLE_API_KEY=xxx (DELETE THIS)
# AIRTABLE_BASE_ID=xxx (DELETE THIS)
```

## Production Environment Variables
```bash
# Database (Railway auto-injects these when PostgreSQL is added)
# DATABASE_URL=postgresql://... (auto-injected by Railway)

# Schema Configuration - MUST BE IDENTICAL ACROSS ALL ENVIRONMENTS
USE_SCHEMA_V2=true
USE_REFACTORED_SERVER=true

# Environment
NODE_ENV=production
RAILWAY_ENVIRONMENT=production

# Security
JWT_SECRET=[GENERATE A NEW SECURE SECRET FOR PRODUCTION]

# Remove/Delete these Airtable variables if present:
# AIRTABLE_API_KEY=xxx (DELETE THIS)
# AIRTABLE_BASE_ID=xxx (DELETE THIS)
```

## Local Development (.env.local)
```bash
# Database
DATABASE_URL=postgresql://stephen@localhost:5432/novara_local

# Schema Configuration - MUST BE IDENTICAL ACROSS ALL ENVIRONMENTS
USE_SCHEMA_V2=true
USE_REFACTORED_SERVER=true

# Environment
NODE_ENV=development

# Security
JWT_SECRET=local_development_secret_key
```

## Schema Verification Commands

### After setting up each environment, verify schema alignment:

```bash
# Local verification
psql -U stephen -d novara_local -c "\dt" | grep health_events
psql -U stephen -d novara_local -c "\d health_events" | grep event_type

# Staging verification (using Railway CLI)
railway link
railway environment  # select staging
railway run psql $DATABASE_URL -c "\dt" | grep health_events
railway run psql $DATABASE_URL -c "\d health_events" | grep event_type

# Production verification (using Railway CLI)
railway link
railway environment  # select production
railway run psql $DATABASE_URL -c "\dt" | grep health_events
railway run psql $DATABASE_URL -c "\d health_events" | grep event_type
```

## Expected Schema (ALL environments must match):

### Tables:
- `users` - Core user accounts
- `user_profiles` - User profile data
- `health_events` - Event-sourced health data (replaces daily_checkins)
- `insights` - Generated insights

### Health Events Structure:
```
id               | uuid (primary key)
user_id          | uuid (foreign key to users)
event_type       | varchar(50) - 'mood', 'medication', 'symptom', etc.
event_subtype    | varchar(50) - 'daily_checkin', 'injection', etc.
event_data       | jsonb - Flexible event data
occurred_at      | timestamp - When event happened
recorded_at      | timestamp - When we recorded it
source           | varchar(50) - 'web_app', 'mobile', etc.
correlation_id   | uuid - Links related events
```

## Migration Checklist

### For Staging:
1. [ ] Add PostgreSQL database in Railway staging
2. [ ] Run `railway run psql $DATABASE_URL < database/schema-v2.sql`
3. [ ] Update environment variables (remove Airtable, add Schema V2 flags)
4. [ ] Deploy and verify with regression tests

### For Production:
1. [ ] Add PostgreSQL database in Railway production
2. [ ] Run `railway run psql $DATABASE_URL < database/schema-v2.sql`
3. [ ] Update environment variables (remove Airtable, add Schema V2 flags)
4. [ ] Deploy and verify with careful monitoring

## Critical Points:
1. **USE_SCHEMA_V2=true** must be set in ALL environments
2. **USE_REFACTORED_SERVER=true** must be set in ALL environments
3. **Remove all Airtable variables** to prevent confusion
4. **health_events** table replaces daily_checkins - this is intentional
5. **Event-sourced architecture** - we append events, not update rows