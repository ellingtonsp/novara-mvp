# Environment Configuration Guide

## 🌍 **Environment Architecture**

Our application follows a **dev → staging → production** workflow with proper environment isolation.

### **Environment URLs**

| Environment | Frontend | Backend | Database |
|-------------|----------|---------|----------|
| **Development** | `http://localhost:3000` | `http://localhost:3002` | SQLite (local) |
| **Staging** | `https://novara-mvp-staging.vercel.app` | `https://novara-staging.up.railway.app` | Airtable (staging) |
| **Production** | `https://novara-mvp.vercel.app` | `https://novara-mvp-production.up.railway.app` | Airtable (production) |

## 🔧 **Port Allocation**

### **Development (Consistent)**
- **Backend**: Always port `3002` (no conflicts)
- **Frontend**: Port `3000` (auto-fallback to 3001 if occupied)
- **Database**: SQLite file (isolated)

### **Why This Structure**
1. **No Port Conflicts**: Backend on 3002, frontend on 3000/3001
2. **Environment Isolation**: Each environment has separate databases
3. **Predictable URLs**: Consistent naming across environments
4. **Auto-Failover**: Frontend auto-selects available ports

## ⚙️ **Environment Variables**

### **Development (.env.development)**
```bash
# Backend
NODE_ENV=development
PORT=3002
USE_LOCAL_DATABASE=true
JWT_SECRET=dev_secret_key

# Frontend  
VITE_API_URL=http://localhost:3002
VITE_ENV=development
```

### **Staging**
```bash
# Backend (Railway)
NODE_ENV=staging
AIRTABLE_BASE_ID=appEOWvLjCn5c7Ght
JWT_SECRET=staging_secret

# Frontend (Vercel)
VITE_API_URL=https://novara-staging.up.railway.app
VITE_ENV=staging
```

### **Production**
```bash
# Backend (Railway)
NODE_ENV=production
AIRTABLE_BASE_ID=appWOsZBUfg57fKD3
JWT_SECRET=production_secret

# Frontend (Vercel)
VITE_API_URL=https://novara-mvp-production.up.railway.app
VITE_ENV=production
```

## 🚀 **Deployment Structure**

### **Frontend (Vercel)**
- **Production**: `novara-mvp.vercel.app`
- **Staging**: `novara-mvp-staging.vercel.app`
- **Development**: `localhost:3000`

### **Backend (Railway)**
- **Production**: `novara-mvp-production.up.railway.app`
- **Staging**: `novara-staging.up.railway.app`
- **Development**: `localhost:3002`

### **Database**
- **Production**: Airtable Base (appWOsZBUfg57fKD3)
- **Staging**: Airtable Base (appEOWvLjCn5c7Ght)
- **Development**: SQLite (isolated file)

## 🔒 **CORS Configuration**

The backend automatically configures CORS based on environment:

```javascript
const allowedOrigins = [
  'http://localhost:3000',  // Development frontend
  'https://novara-mvp.vercel.app', // Production frontend
  'https://novara-mvp-staging.vercel.app', // Staging frontend
];

// Additional development origins in non-production
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3001'); // Fallback port
}
```

## 📱 **API Endpoint Detection**

Frontend components automatically detect the correct API endpoint:

```javascript
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3002'  // Development
  : 'https://novara-mvp-production.up.railway.app';  // Production
```

## ✅ **Environment Health Checks**

### **Development**
```bash
curl http://localhost:3002/api/health
# Should return: "environment":"development"
```

### **Staging**
```bash
curl https://novara-staging.up.railway.app/api/health
# Should return: "environment":"staging"
```

### **Production**
```bash
curl https://novara-mvp-production.up.railway.app/api/health
# Should return: "environment":"production"
```

## 🎯 **Quick Commands**

### **Start Development**
```bash
./start-local.sh
# Opens: http://localhost:3000 & http://localhost:3002
```

### **Test Environment**
```bash
./scripts/demo-onboarding-flow.sh
# Tests complete flow in development
```

### **Deploy Staging**
```bash
git push origin staging
# Auto-deploys to staging URLs
```

### **Deploy Production**
```bash
git push origin main
# Auto-deploys to production URLs
```

---

## 🔍 **Environment Verification**

Use these commands to verify you're in the correct environment:

```bash
# Check backend environment
curl -s http://localhost:3002/api/health | grep environment

# Check frontend environment (in browser console)
console.log(import.meta.env.VITE_ENV)

# Check database type
curl -s http://localhost:3002/api/health | grep -E "(airtable|sqlite)"
```

This configuration ensures **complete environment isolation** and **predictable, conflict-free development**. 