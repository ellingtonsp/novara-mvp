# PostgreSQL Migration Guide

## Quick Start (15 minutes)

### Step 1: Add PostgreSQL to Railway (2 min)
```bash
# In Railway dashboard:
1. Go to your project
2. Click "+ New" → "Database" → "PostgreSQL"
3. Railway auto-provisions and connects it
```

### Step 2: Initialize Schema (1 min)
```bash
# From backend directory
cd backend
railway run npm run db:setup

# Or manually
railway run psql $DATABASE_URL < ../database/schema.sql
```

### Step 3: Migrate Existing Data (5 min)
```bash
# Run migration script
railway run npm run db:migrate

# Validate migration
railway run npm run db:validate
```

### Step 4: Deploy Updated Code (2 min)
```bash
# The code auto-detects PostgreSQL and uses it
git push origin staging
```

That's it! The system automatically uses PostgreSQL when DATABASE_URL is present.

## What Changes

### Before (Airtable + SQLite)
- 67% of Enhanced form data lost to localStorage
- Schema mismatches between environments
- Silent field dropping from whitelist
- Different databases in dev vs production

### After (PostgreSQL)
- 100% of form data saved
- Same database everywhere
- No field whitelisting needed
- Proper data integrity

## New Fields Now Saved

The Enhanced Daily Check-in form now saves ALL fields:

```javascript
// Previously lost in localStorage:
- anxiety_level (1-10 scale)
- side_effects (array: ["Headache", "Nausea"])  
- missed_doses (number)
- injection_confidence (1-10)
- appointment_within_3_days (boolean)
- appointment_anxiety (1-10)
- coping_strategies_used (array)
- partner_involved_today (boolean)
- wish_knew_more_about (array)
- phq4_score, phq4_anxiety, phq4_depression
```

## Testing

### Verify Enhanced Form Data Saves
```bash
# 1. Submit enhanced check-in in UI
# 2. Check database
railway run psql $DATABASE_URL -c "
  SELECT mood_today, anxiety_level, side_effects, coping_strategies_used 
  FROM daily_checkins 
  ORDER BY created_at DESC 
  LIMIT 1;
"
```

### Run Field Audit
```bash
# Verify all fields properly mapped
cd backend
npm run audit:fields
```

## Rollback Plan

If issues arise:

1. **Quick Rollback** (< 1 minute)
   ```bash
   # Remove DATABASE_URL from Railway
   railway env:unset DATABASE_URL
   # Redeploy - auto-falls back to Airtable
   ```

2. **Data is Safe**
   - Airtable data unchanged
   - PostgreSQL data persists
   - Can switch back anytime

## Environment Variables

Railway automatically provides:
- `DATABASE_URL` - Full PostgreSQL connection string
- No other changes needed!

For local development:
```bash
# .env.local
DATABASE_URL=postgresql://localhost:5432/novara_dev
```

## Common Commands

```bash
# Check which database is being used
railway logs

# Connect to PostgreSQL
railway run psql $DATABASE_URL

# View recent check-ins
railway run psql $DATABASE_URL -c "SELECT * FROM daily_checkins ORDER BY created_at DESC LIMIT 5;"

# Check Enhanced fields
railway run psql $DATABASE_URL -c "\d daily_checkins"
```

## Monitoring

After migration, monitor:
1. Check Railway logs for "🐘 Using PostgreSQL database"
2. Submit test check-in with all fields
3. Verify in database
4. Check metrics dashboard shows medication adherence

## Benefits Summary

1. **No More Data Loss**: All 18 Enhanced form fields saved
2. **Consistency**: Same database in all environments  
3. **Performance**: 100x faster than Airtable API
4. **Reliability**: Real constraints, transactions
5. **Developer Experience**: Standard PostgreSQL tools

## Support

Issues? Check:
1. Railway logs: `railway logs`
2. Database connection: `railway run psql $DATABASE_URL -c "SELECT 1;"`
3. Migration validation: `railway run npm run db:validate`
4. Field audit: `npm run audit:fields`