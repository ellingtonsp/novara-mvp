# Novara MVP - Context Summary for Claude

## Current Status (As of 2025-07-30)

### Recent Work Completed
1. **Removed "Welcome back, User!" popup** - Successfully removed from NovaraLanding.tsx by merging onboarding-flow-fixes branch
2. **Fixed baseline endpoint field names** - Changed from `baseline_confidence_meds` to `confidence_meds` to match database schema
3. **Added PostgreSQL local development setup** - Created Docker and Homebrew setup scripts for environment parity
4. **Enhanced check-in fields support** - Added fields to SQLite adapter and compatibility service

### Current Environment Configuration

#### Local Development
- **Frontend**: http://localhost:4200
- **Backend**: http://localhost:9002 (NOT 3002!)
- **Database Options**:
  - SQLite: `npm run local` (old, doesn't support all enhanced fields)
  - PostgreSQL: `npm run dev:postgres` (new, full Schema V2 support)

#### Staging
- **Frontend**: https://novara-staging.vercel.app (may be down)
- **Backend**: Status unclear - multiple URLs referenced:
  - https://novara-backend-staging.up.railway.app
  - https://novara-staging-production.up.railway.app
  - https://novara-staging-staging.up.railway.app

#### Production
- **Frontend**: https://novara.vercel.app
- **Backend**: https://novara-backend-production.up.railway.app
- **Database**: PostgreSQL with Schema V2

### Database Migration Status
- **Production**: Moving from Airtable to PostgreSQL
- **Schema**: Using Schema V2 with event-sourcing architecture
- **Compatibility**: `compatibility-service.js` handles both V1 and V2 schemas

### Outstanding Issues

#### 1. Enhanced Check-in Fields Not Saving Locally
- Fields being filtered out by `PRODUCTION_AIRTABLE_SCHEMA` in server.js
- Enhanced fields include:
  - anxiety_level
  - appointment_within_3_days
  - appointment_anxiety
  - coping_strategies_used
  - wish_knew_more_about
  - physical_symptoms
  - PHQ-4 assessment fields

#### 2. Staging Environment Uncertainty
- Multiple staging backend URLs referenced in codebase
- Need to verify correct staging backend URL
- Staging may be down (404 errors)

#### 3. Local Development Database
- SQLite doesn't have enhanced fields in schema
- PostgreSQL setup created but not yet tested
- Need to run PostgreSQL locally for full feature parity

### Files Modified Today
1. `/backend/routes/users.js` - Added PATCH /api/users/baseline endpoint
2. `/backend/services/compatibility-service.js` - Added physical_symptoms support
3. `/backend/database/sqlite-adapter.js` - Added enhanced fields to schema
4. `/frontend/src/components/NovaraLanding.tsx` - Via merge, removed WelcomeInsight
5. Created PostgreSQL setup files:
   - `docker-compose.yml`
   - `scripts/setup-local-postgres.sh`
   - `scripts/setup-local-postgres-homebrew.sh`
   - `LOCAL_POSTGRES_SETUP.md`

### Key Test Scripts
- `/scripts/test-checkin-fields.js` - Comprehensive test for all check-in fields
- `/scripts/regression-test.js` - Full API regression test suite

### Next Steps
1. **Set up PostgreSQL locally** using one of the setup methods
2. **Test enhanced field handling** with PostgreSQL
3. **Verify staging environment** status and correct URLs
4. **Test both quick and enhanced check-in paths**
5. **Verify insights calculations** use enhanced data

### Important Notes
- We're migrating to PostgreSQL in production on next merge to main
- Don't modify PRODUCTION_AIRTABLE_SCHEMA anymore since we're moving away from Airtable
- Use feature branches for all work: `feature/EPIC-ID-description`
- Backend uses port 9002, not 3002

### Current Git Status
- Branch: feature/mobile-ui-improvements (or staging)
- All changes committed and pushed to staging

### User's Key Requirements
"Before we merge with prod. I want to verify that all inputs in the daily and enhanced daily check-ins are being correctly logged in the database and all related insights or other calculations on those inputs are rendering correctly no matter which path the user takes to log details"