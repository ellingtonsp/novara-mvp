# Local Staging Environment Setup

This guide ensures you can quickly spin up a local staging environment for testing without affecting production data.

## 🗄️ **NEW: Local SQLite Database**

**Your local environment now uses an isolated SQLite database instead of shared Airtable staging!**

### ✅ **Benefits**
- **Complete isolation** - Your own database file, no conflicts with other developers
- **Instant resets** - Clear data and start fresh anytime
- **Offline development** - No network dependency for database operations
- **Production parity** - Same relational structure as production would use
- **Fast queries** - Local database means instant responses

### 📊 **Database Configuration**
- **Type**: SQLite (file-based)
- **Location**: `backend/data/novara-local.db`
- **Schema**: Identical to production Airtable structure
- **Test Data**: Automatically seeded with realistic users and check-ins

## Quick Start Commands

### Option 1: Fresh Start (Recommended)
```bash
# Kill any existing processes
./scripts/kill-local-servers.sh

# Start local environment with SQLite database
./scripts/start-staging.sh
```

### Option 2: Reset Data and Restart
```bash
# Start with fresh test data
./scripts/start-staging.sh --reset-data
```

### Option 3: Manual Setup
```bash
# 1. Kill any conflicting processes
lsof -ti:3000,3001,3002 | xargs kill -9 2>/dev/null || true

# 2. Start backend on port 3002 (local SQLite)
cd backend
NODE_ENV=development \
USE_LOCAL_DATABASE=true \
DATABASE_TYPE=sqlite \
JWT_SECRET=staging_test_secret \
PORT=3002 \
node server.js &

# 3. Start frontend (will auto-select port 3001)
cd ../frontend
npm run dev
```

## Environment Configuration

### Local Development (SQLite)
- **Backend**: http://localhost:3002
- **Frontend**: http://localhost:3001  
- **Database**: SQLite file (`backend/data/novara-local.db`)
- **Environment**: development
- **Test Users**: Automatically created (see below)

### Production (Airtable)
- **Backend**: https://novara-mvp-production.up.railway.app
- **Frontend**: https://novara-fertility.vercel.app
- **Database**: Airtable Base `appWOsZBUfg57fKD3`
- **Environment**: production

## Port Configuration

| Service | Port | Environment | Purpose |
|---------|------|-------------|---------|
| Backend | 3002 | Local SQLite | Local development API |
| Frontend | 3001 | Development | Vite dev server |
| Production Backend | 3000 | Production | Usually blocked by other processes |

## Test Users (Pre-seeded)

Your local database comes with these test accounts:

| Email | Nickname | Profile | Use Case |
|-------|----------|---------|----------|
| `sarah@novara.test` | Sarah | Low med confidence, high cost stress | Medication concerns testing |
| `emma@novara.test` | Emma | High med confidence, financial stress | Financial guidance testing |
| `alex@novara.test` | Alex | High confidence overall | Success story testing |
| `test@local.dev` | LocalTester | Balanced profile | General testing |

**Sarah** also has 3 days of check-in history for testing insights and trends.

## Troubleshooting

### Problem: "EADDRINUSE: address already in use"

**Cause**: Another process is using the required port (usually 3000 or 3002)

**Solution**:
```bash
# Find processes using ports
lsof -ti:3000,3001,3002

# Kill specific process
kill [PID]

# Kill all processes on these ports
lsof -ti:3000,3001,3002 | xargs kill -9 2>/dev/null || true
```

### Problem: "Cannot find module './database/database-factory'"

**Cause**: Backend dependencies not installed

**Solution**:
```bash
cd backend
npm install
```

### Problem: "Login failed: Network error"

**Symptoms**: Frontend loads but login fails with network error popup

**Causes & Solutions**:

1. **Backend not running**:
   ```bash
   curl http://localhost:3002/api/health
   # Should return: {"status":"ok","environment":"development"...}
   ```

2. **Wrong API URL in frontend**:
   - Check `frontend/src/lib/api.ts`
   - In dev mode should use `http://localhost:3002`

3. **Database not initialized**:
   ```bash
   cd backend
   node scripts/seed-test-data.js
   ```

### Problem: Empty Database

**Cause**: Database file doesn't exist or wasn't seeded

**Solution**:
```bash
cd backend
NODE_ENV=development node scripts/seed-test-data.js
```

### Problem: Frontend connects to production instead of local

**Cause**: API URL configuration pointing to production

**Solution**:
```bash
# Verify current API configuration
grep -n "API_BASE_URL" frontend/src/lib/api.ts

# Should show:
# const API_BASE_URL = import.meta.env.DEV 
#   ? 'http://localhost:3002'  // Local development (SQLite backend)
#   : 'https://novara-mvp-production.up.railway.app';  // Production
```

## Verification Steps

### 1. Backend Health Check
```bash
curl http://localhost:3002/api/health
```
Expected response:
```json
{
  "status": "ok",
  "environment": "development",
  "service": "Novara API"
}
```

### 2. Database Verification
```bash
# Test user login
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "sarah@novara.test"}'

# Should return successful login with JWT token
```

### 3. Frontend Loading
- Navigate to `http://localhost:3001`
- Should see Novara landing page
- Browser console should show: `Making API request to: http://localhost:3002/api/auth/login`

### 4. Full Stack Test
1. Click "Already have an account?"
2. Enter email: `sarah@novara.test`
3. Should login successfully and show user dashboard
4. Network tab should show requests to `localhost:3002`

## Environment Safety

### Local Database Verification
- **File Location**: `backend/data/novara-local.db`
- **NO Airtable API calls** when in development mode
- **Isolated data** - Changes don't affect production or other developers

### Quick Environment Check
```bash
# Check which environment your backend is using
curl http://localhost:3002/api/health | grep environment

# Should return: "environment":"development"
```

## Database Operations

### Clear All Data
```bash
cd backend
node -e "
const { databaseAdapter } = require('./database/database-factory');
databaseAdapter.clearLocalData();
console.log('Database cleared');
"
```

### View Database Stats
```bash
cd backend
node -e "
const { databaseAdapter } = require('./database/database-factory');
console.log('Database Stats:', databaseAdapter.getStats());
"
```

### Reseed Test Data
```bash
cd backend
node scripts/seed-test-data.js
```

## Common Workflows

### Daily Development Workflow
```bash
# Start fresh local environment
./scripts/start-staging.sh

# When done
./scripts/kill-local-servers.sh
```

### Testing New Features
1. Start local environment: `./scripts/start-staging.sh`
2. Login with test user: `sarah@novara.test`
3. Test feature end-to-end in isolated environment
4. Reset data if needed: `./scripts/start-staging.sh --reset-data`

### Debugging Issues
1. Check backend logs: `curl http://localhost:3002/api/health`
2. Check frontend console in browser
3. Verify environment variables: `echo $NODE_ENV`
4. Check API requests in Network tab point to `localhost:3002`
5. Check database: `ls backend/data/`

## Recovery Commands

If something goes wrong:

```bash
# Nuclear option - kill everything and restart with fresh data
./scripts/kill-local-servers.sh
rm -f backend/data/novara-local.db
./scripts/start-staging.sh
```

## Performance Benefits

**Local SQLite vs Airtable API:**
- 🚀 **99% faster queries** - No network latency
- 🔄 **Unlimited requests** - No rate limiting
- 📱 **Offline development** - Works without internet
- 🧪 **Instant test data** - Reset database in milliseconds
- 👥 **No conflicts** - Each developer has isolated environment

---

**💡 Pro Tip**: Bookmark `http://localhost:3001` and `http://localhost:3002/api/health` for quick access during development.

**⚠️ Important**: Always verify you're in development environment before testing. Check the health endpoint shows `"environment":"development"`. 