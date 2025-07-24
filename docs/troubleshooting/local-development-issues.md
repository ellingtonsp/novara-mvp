# Novara MVP - Local Development Troubleshooting Guide

This guide documents recurring issues in local development and their solutions to prevent repeated headaches.

## 🚨 Critical Issues & Solutions

### 1. Port Conflicts (EADDRINUSE Errors)

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3000
Error: listen EADDRINUSE: address already in use :::3002
```

**Root Cause:** Previous server processes not properly killed, leaving ports occupied.

**Solution:**
```bash
# Always run this first before starting servers
./scripts/kill-local-servers.sh

# Verify ports are free
lsof -i :3000 :3001 :3002

# If still occupied, force kill:
sudo lsof -ti :3000 | xargs kill -9
sudo lsof -ti :3002 | xargs kill -9
```

### 2. Processes Getting Killed Unexpectedly

**Symptoms:**
```
zsh: killed     npm run dev
zsh: killed     NODE_ENV=staging...
```

**Root Causes:**
- Memory pressure on macOS
- Background process limits
- Terminal session interruption

**Solution:**
```bash
# Use the staging script instead of manual commands
./scripts/start-staging.sh

# Monitor process status
ps aux | grep -E "(node|vite)" | grep -v grep

# If processes die, check system resources
top -l 1 | grep "PhysMem"
```

### 3. Frontend Port Confusion

**Common Issue:** Frontend runs on different ports than expected.

**Port Priority (Vite auto-selects):**
1. Port 3000 (if available) ← **Most Common**
2. Port 3001 (if 3000 occupied)
3. Port 3002+ (if others occupied)

**Solution:**
```bash
# Check actual frontend port
lsof -i :3000
lsof -i :3001

# Or check Vite output in terminal
```

### 4. Backend Not Starting Properly

**Symptoms:**
- Health check fails
- API calls return 502/503 errors
- No response from backend

**Solution:**
```bash
# Check backend logs
cat staging-backend.log | tail -20

# Verify environment variables
curl -s http://localhost:3002/api/health

# Expected response:
# {"status":"ok","environment":"development",...}
```

## 🛠️ Standard Troubleshooting Workflow

### Step 1: Clean Start
```bash
# 1. Kill all existing processes
./scripts/kill-local-servers.sh

# 2. Verify cleanup
ps aux | grep -E "(node|vite)" | grep -v grep
# Should only show Cursor editor processes

# 3. Check ports are free
lsof -i :3000 :3001 :3002
# Should return nothing
```

### Step 2: Fresh Environment Start
```bash
# Start everything fresh
./scripts/start-staging.sh

# Wait for both servers to start
# Backend: http://localhost:3002/api/health
# Frontend: Check terminal output for actual port
```

### Step 3: Verify Everything Works
```bash
# Test backend
curl -s http://localhost:3002/api/health

# Test frontend (try both ports)
curl -s http://localhost:3000 | head -5
curl -s http://localhost:3001 | head -5

# Run full demo test
./scripts/demo-onboarding-flow.sh
```

## 🔍 Quick Diagnostics

### Check Current Status
```bash
# What's running?
ps aux | grep -E "(node|vite)" | grep -v grep

# What ports are occupied?
lsof -i :3000 :3001 :3002

# Backend health
curl -s http://localhost:3002/api/health

# Database status
cd backend && NODE_ENV=development USE_LOCAL_DATABASE=true node -e "
const { databaseAdapter } = require('./database/database-factory');
console.log(databaseAdapter.getStats());
"
```

### Environment Variables Check
```bash
# In backend directory
cd backend
echo "NODE_ENV: $NODE_ENV"
echo "USE_LOCAL_DATABASE: $USE_LOCAL_DATABASE"
echo "PORT: $PORT"
```

## 🚀 **Your Working URLs (After Proper Startup)**

**Frontend (React App):**
- **http://localhost:3000/** ← **Primary URL**
- http://localhost:3001/ ← **Fallback if 3000 occupied**

**Backend (API):**
- **http://localhost:3002/**
- Health: **http://localhost:3002/api/health**

## 📋 Common Error Messages & Solutions

### "Port 3000 is in use, trying another one..."
- **Normal behavior** - Vite automatically finds next available port
- Check terminal output for actual port number
- Usually moves to 3001, 3002, etc.

### "curl: (7) Failed to connect to localhost"
- Process not running or crashed
- Check `ps aux | grep node`
- Restart with `./scripts/start-staging.sh`

### "Cannot read properties of undefined"
- Usually frontend API configuration issue
- Verify `frontend/src/lib/api.ts` points to correct backend URL
- Check CORS configuration in backend

### SQLite Database Issues
```bash
# Reset database if corrupted
cd backend
rm -f data/novara-local.db
node scripts/seed-test-data.js
```

## 🔄 Recovery Commands

### Complete Environment Reset
```bash
# Nuclear option - clean everything
./scripts/kill-local-servers.sh
rm -f backend/data/novara-local.db
rm -f staging-backend.log
./scripts/start-staging.sh
```

### Quick Restart (Keep Data)
```bash
./scripts/kill-local-servers.sh
./scripts/start-staging.sh
```

### Frontend Only Restart
```bash
# Kill frontend process
pkill -f "node.*vite"
cd frontend && npm run dev
```

### Backend Only Restart
```bash
# Kill backend process  
pkill -f "node server.js"
cd backend && NODE_ENV=development USE_LOCAL_DATABASE=true PORT=3002 node server.js
```

## 📊 Performance Monitoring

### Check System Resources
```bash
# Memory usage
top -l 1 | grep "PhysMem"

# Disk space
df -h

# Node process memory
ps -o pid,rss,command -p $(pgrep node)
```

### Common Resource Issues
- **Memory pressure**: Restart browser, close unused apps
- **Disk space**: Clean npm cache with `npm cache clean --force`
- **Too many processes**: Use kill scripts regularly

## 🆘 Emergency Procedures

### If Nothing Works
1. **Full system restart** of your Mac
2. **Clear npm caches**: `npm cache clean --force` in both frontend/ and backend/
3. **Reinstall dependencies**: Delete node_modules and run `npm install`
4. **Check for macOS updates** that might affect Node.js

### If Database Gets Corrupted
```bash
cd backend
rm -f data/novara-local.db
node scripts/seed-test-data.js
```

### If Frontend Won't Start
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 🎯 **CURRENT WORKING ENVIRONMENT**

✅ **Backend**: http://localhost:3002/api/health  
✅ **Frontend**: http://localhost:3000/  
✅ **Database**: SQLite (local, isolated)  
✅ **Demo Script**: All 12 tests passing  

**Last Updated**: $(date)  
**Status**: All systems operational 