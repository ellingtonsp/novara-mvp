# Novara MVP - Local Development Guide

## 🎯 Stable Development Environment

This guide explains how to run a **stable, conflict-free local development environment** for Novara MVP.

## 📋 Prerequisites

Before starting local development, ensure you have:

- **Node.js** 18+ installed
- **PostgreSQL** 14+ installed and running
- **Git** for version control

### PostgreSQL Setup (macOS)
```bash
# Install PostgreSQL via Homebrew
brew install postgresql@14
brew services start postgresql@14

# Create development database
psql -U postgres -c "CREATE DATABASE novara_local;"
```

### PostgreSQL Setup (Windows/Linux)
Download and install PostgreSQL from https://postgresql.org/download/

## 🚀 Quick Start

```bash
# Start the stable development environment
./scripts/start-dev-stable.sh

# Stop all local servers
./scripts/kill-local-servers.sh
```

## 📊 Port Strategy

**Stable Ports (Recommended):**
- **Frontend**: `4200` (Angular default, low conflict)
- **Backend**: `9002` (High port range, rarely used)

**Avoided Ports:**
- `3000`, `3001`, `3002` (high conflict with other dev tools)

## 🗄️ Database Configuration

**Local Development:**
- Uses **PostgreSQL** database (`postgresql://localhost:5432/novara_local`)
- **Isolated** from production data
- Requires PostgreSQL server running locally
- Database automatically initialized on first connection

**Environment Variables:**
```bash
# Backend (.env.development)
NODE_ENV=development
PORT=9002
USE_LOCAL_DATABASE=true
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://postgres:password@localhost:5432/novara_local
USE_SCHEMA_V2=true
JWT_SECRET=dev_secret_key_not_for_production

# Frontend (.env.development)
VITE_API_URL=http://localhost:9002
VITE_ENV=development
VITE_NODE_ENV=development
```

## 🔧 API Endpoints

**Health Check:**
```bash
curl http://localhost:9002/api/health
```

**User Creation (Database Test):**
```bash
curl -X POST http://localhost:9002/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "nickname": "TestUser",
    "confidence_meds": 5,
    "confidence_costs": 5,
    "confidence_overall": 5,
    "primary_need": "medical_clarity",
    "cycle_stage": "ivf_prep"
  }'
```

## 🎨 Frontend Configuration

**Vite Configuration:**
- Environment-aware port selection
- Proper path aliases (`@/components/ui/*`)
- Hot module replacement enabled

**Import Resolution:**
```typescript
// ✅ Correct imports (now working)
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// ❌ Avoid relative imports
import { Button } from "../../components/ui/button";
```

## 🔗 CORS Configuration

**Backend CORS Setup:**
- Configured to allow `http://localhost:4200`
- Supports credentials and all necessary headers
- Preflight requests handled automatically

**CORS Headers:**
```
Access-Control-Allow-Origin: http://localhost:4200
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization,Origin,X-Requested-With,Accept
```

## 🛠️ Troubleshooting

### Port Conflicts
```bash
# Kill processes on specific ports
lsof -ti :4200 | xargs kill -9
lsof -ti :9002 | xargs kill -9

# Or use the cleanup script
./scripts/kill-local-servers.sh
```

### CORS Issues
```bash
# Verify CORS is working
curl -X OPTIONS http://localhost:9002/api/auth/login \
  -H "Origin: http://localhost:4200" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Should return 204 with proper CORS headers
```

### Import Resolution Issues
```bash
# Clear Vite cache
cd frontend
rm -rf node_modules/.vite
npm install
```

### Database Issues
```bash
# Reset local PostgreSQL database
psql -U postgres -c "DROP DATABASE IF EXISTS novara_local;"
psql -U postgres -c "CREATE DATABASE novara_local;"
./scripts/start-dev-stable.sh

# Or using the convenience script (if available)
./scripts/reset-local-db.sh
```

### Process Killed by macOS
```bash
# Increase memory limits (if needed)
ulimit -n 65536
ulimit -u 2048

# Or restart with stable script
./scripts/start-dev-stable.sh
```

## 📋 Development Workflow

1. **Start Environment:**
   ```bash
   ./scripts/start-dev-stable.sh
   ```

2. **Access Applications:**
   - Frontend: http://localhost:4200/
   - Backend: http://localhost:9002/
   - Health: http://localhost:9002/api/health

3. **Make Changes:**
   - Frontend changes auto-reload
   - Backend changes require restart

4. **Stop Environment:**
   ```bash
   ./scripts/kill-local-servers.sh
   ```

## 🔍 Monitoring

**Backend Logs:**
- Check terminal output for backend process
- PostgreSQL operations logged automatically
- Connection status and query logs available

**Frontend Logs:**
- Browser developer tools
- Vite HMR messages in terminal

**Health Monitoring:**
```bash
# Check if services are running
curl http://localhost:9002/api/health
curl http://localhost:4200/
```

## 🎯 Best Practices

1. **Always use stable ports** (4200/9002)
2. **Use the stable script** for consistent setup
3. **Test API endpoints** after starting
4. **Monitor logs** for errors
5. **Reset database** if data gets corrupted
6. **Verify CORS** if frontend can't connect to backend

## 🚨 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port conflicts | Use stable script, avoid 3000-3002 |
| CORS errors | Backend configured for port 4200 |
| Import errors | Clear Vite cache, check path aliases |
| Database errors | Reset PostgreSQL database |
| Process killed | Increase memory limits or restart |
| API not responding | Check backend health endpoint |

## 📞 Support

If you encounter persistent issues:

1. Check this guide first
2. Run `./scripts/kill-local-servers.sh`
3. Restart with `./scripts/start-dev-stable.sh`
4. Test health endpoints
5. Check logs for specific errors
6. Verify CORS headers if frontend can't connect

---

**Last Updated:** July 23, 2025  
**Environment:** Stable Development (4200/9002)  
**CORS:** Fixed for port 4200 