# Local PostgreSQL Setup for Novara

This guide explains how to set up PostgreSQL locally to ensure full environment continuity with staging and production.

## Why PostgreSQL Locally?

- **Environment Parity**: Same database engine across all environments
- **Schema V2 Support**: Full event-sourcing capabilities with enhanced fields
- **No Field Filtering**: All enhanced check-in fields work properly
- **Production-Ready Testing**: Test features exactly as they'll work in production

## Setup Options

### Option 1: Using Docker (Recommended)

1. Install Docker Desktop from https://www.docker.com/products/docker-desktop/

2. Run the setup script:
   ```bash
   ./scripts/setup-local-postgres.sh
   ```

3. Start development:
   ```bash
   cd backend && npm run dev:postgres
   ```

### Option 2: Using Homebrew (macOS)

1. Run the Homebrew setup script:
   ```bash
   ./scripts/setup-local-postgres-homebrew.sh
   ```

2. Start development:
   ```bash
   cd backend && npm run dev:postgres
   ```

### Option 3: Manual Setup

1. Install PostgreSQL 15+ using your preferred method

2. Create database and user:
   ```sql
   CREATE DATABASE novara_local;
   CREATE USER novara WITH PASSWORD 'novara_local_dev';
   GRANT ALL PRIVILEGES ON DATABASE novara_local TO novara;
   ```

3. Apply Schema V2:
   ```bash
   psql -U novara -d novara_local -f backend/database/schema/schema-v2.sql
   ```

4. Create `backend/.env.local`:
   ```env
   DATABASE_URL=postgresql://novara:novara_local_dev@localhost:5432/novara_local
   USE_SCHEMA_V2=true
   NODE_ENV=development
   PORT=3002
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

5. Start development:
   ```bash
   cd backend && npm run dev:postgres
   ```

## Benefits of Local PostgreSQL

1. **All Enhanced Fields Work**: No more filtered fields like:
   - anxiety_level
   - appointment_within_3_days
   - coping_strategies_used
   - wish_knew_more_about
   - physical_symptoms
   - PHQ-4 assessments

2. **Event Sourcing**: Full Schema V2 with health_events table

3. **True Environment Parity**: Test exactly what will run in production

## Switching Between Databases

- **SQLite** (old): `npm run local`
- **PostgreSQL** (new): `npm run dev:postgres`

## Troubleshooting

### Port Already in Use
If PostgreSQL is already running on port 5432:
```bash
# Check what's using the port
lsof -i :5432

# Stop existing PostgreSQL
brew services stop postgresql@15  # if using Homebrew
docker-compose down               # if using Docker
```

### Connection Refused
Ensure PostgreSQL is running:
```bash
# Docker
docker-compose ps

# Homebrew
brew services list | grep postgresql
```

### Permission Denied
Check database ownership:
```sql
\l novara_local  -- in psql
```

## Next Steps

Once PostgreSQL is running locally:

1. Test all enhanced check-in fields work properly
2. Verify insights use the enhanced data
3. Ensure PHQ-4 assessments save correctly
4. Test both quick and enhanced check-in paths

The move to PostgreSQL ensures complete feature parity across all environments!