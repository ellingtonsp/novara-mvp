# Railway PostgreSQL Setup Guide

## Quick Setup (5 minutes)

### 1. Add PostgreSQL to Railway Project

```bash
# In your Railway project dashboard:
1. Click "+ New"
2. Select "Database" 
3. Choose "PostgreSQL"
4. It auto-provisions and connects to your app
```

### 2. Get Database URL

Railway automatically injects these environment variables:
- `DATABASE_URL` - Full connection string
- `PGDATABASE`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD` - Individual components

### 3. Initialize Schema

```bash
# Option 1: Using Railway CLI
railway run psql $DATABASE_URL < database/schema.sql

# Option 2: Using pg command line tools
psql $DATABASE_URL < database/schema.sql

# Option 3: Using the migration script
railway run node backend/scripts/migrate-to-postgres.js
```

### 4. Update Backend Code

```javascript
// backend/server.js
const { Pool } = require('pg');

// Railway provides DATABASE_URL automatically
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Replace Airtable adapter with PostgreSQL
const databaseAdapter = new PostgresAdapter(pool);
```

### 5. Environment Variables

No changes needed! Railway automatically provides:
- `DATABASE_URL` in production
- All individual PG* variables

For local development, add to `.env`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/novara_dev
```

## Benefits Over Airtable

1. **No Schema Sync Issues**: Same database everywhere
2. **All Fields Saved**: No whitelist filtering
3. **Better Performance**: 100x faster queries
4. **Real Constraints**: Data integrity guaranteed
5. **Standard SQL**: Use any PostgreSQL tool

## Migration Commands

```bash
# 1. Set up PostgreSQL in Railway (UI)
# 2. Initialize schema
railway run psql $DATABASE_URL < database/schema.sql

# 3. Migrate existing data
railway run node backend/scripts/migrate-to-postgres.js

# 4. Verify migration
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM daily_checkins;"
```

## Rollback Plan

If needed, the old Airtable code is preserved. Just:
1. Revert the backend changes
2. Switch back to Airtable adapter
3. Data remains in Airtable as backup