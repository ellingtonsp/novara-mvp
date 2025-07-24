# Novara MVP - Environment Setup Guide

## 🚀 **Quick Start**

### **For New Developers**
```bash
# 1. Clone the repository
git clone <repository-url>
cd novara-mvp

# 2. Validate environment
./scripts/validate-dev.sh

# 3. Start development
./scripts/start-dev-stable.sh
```

### **For Existing Developers**
```bash
# Update and validate
git pull origin main
./scripts/validate-dev.sh
./scripts/start-dev-stable.sh
```

## 🏗️ **Environment Architecture**

Our application uses a **three-tier environment strategy**:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │     Staging     │    │   Production    │
│                 │    │                 │    │                 │
│ Frontend: 4200  │    │ Vercel Staging  │    │ Vercel Prod     │
│ Backend: 9002   │    │ Railway Staging │    │ Railway Prod    │
│ DB: SQLite      │    │ Airtable Staging│    │ Airtable Prod   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 **Environment Configuration Setup**

### **Step 1: Backend Environment Files**

Create environment-specific configuration files in the `backend/` directory:

#### **Development Environment**
```bash
cd backend
cp env.development.example .env.development
```

#### **Staging Environment**
```bash
cd backend
cp env.staging.example .env.staging
```

#### **Production Environment**
```bash
cd backend
cp env.production.example .env.production
```

### **Step 2: Frontend Environment Files**

Create environment-specific configuration files in the `frontend/` directory:

#### **Development Environment**
```bash
cd frontend
cp env.development.example .env.development
```

#### **Staging Environment**
```bash
cd frontend
cp env.staging.example .env.staging
```

#### **Production Environment**
```bash
cd frontend
cp env.production.example .env.production
```

## 📦 **Dependencies Installation**

### **Backend Dependencies**
```bash
cd backend
npm install
```

### **Frontend Dependencies**
```bash
cd frontend
npm install
```

## 🚀 **Development Workflow**

### **Starting Development Environment**
```bash
# Primary development command (recommended)
./scripts/start-dev-stable.sh

# Alternative commands
cd backend && npm run dev
cd frontend && npm run dev
```

### **Development URLs**
- **Frontend**: http://localhost:4200
- **Backend**: http://localhost:9002
- **Health Check**: http://localhost:9002/api/health

### **Stopping Development**
```bash
./scripts/kill-local-servers.sh
```

## 🧪 **Environment Testing**

### **Development Environment Validation**
```bash
./scripts/validate-dev.sh
```

### **Manual Testing**
```bash
# Test backend health
curl http://localhost:9002/api/health

# Test frontend
open http://localhost:4200

# Test API connectivity
curl http://localhost:9002/api/users
```

## 🚀 **Deployment Workflow**

### **Staging Deployment**
```bash
# Deploy to staging environment
./scripts/deploy-staging.sh
```

### **Production Deployment**
```bash
# Deploy to production environment
./scripts/deploy-production.sh
```

### **Deployment URLs**

#### **Staging**
- **Frontend**: https://novara-mvp-staging.vercel.app
- **Backend**: https://novara-staging.up.railway.app
- **Health**: https://novara-staging.up.railway.app/api/health

#### **Production**
- **Frontend**: https://novara-mvp.vercel.app
- **Backend**: https://novara-mvp-production.up.railway.app
- **Health**: https://novara-mvp-production.up.railway.app/api/health

## 🔒 **Environment Security**

### **Secret Management**

#### **Development**
- Use `.env.development` files with non-sensitive defaults
- JWT secrets can be simple strings for local development
- No real API keys needed (uses SQLite)

#### **Staging**
- Use Railway/Vercel environment variables
- Separate Airtable base for testing
- Staging-specific JWT secrets

#### **Production**
- Use Railway/Vercel environment variables
- Production Airtable base
- Strong, unique JWT secrets

### **Environment Variables Checklist**

#### **Backend (.env.development)**
- [ ] `NODE_ENV=development`
- [ ] `PORT=9002`
- [ ] `USE_LOCAL_DATABASE=true`
- [ ] `DATABASE_TYPE=sqlite`
- [ ] `JWT_SECRET=dev_secret_key_not_for_production`
- [ ] `ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000`

#### **Frontend (.env.development)**
- [ ] `VITE_API_URL=http://localhost:9002`
- [ ] `VITE_ENV=development`
- [ ] `VITE_DEBUG=true`
- [ ] `VITE_ENABLE_ANALYTICS=false`

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Port Conflicts**
```bash
# Check what's using the ports
lsof -i :4200 :9002

# Kill processes using the ports
./scripts/kill-local-servers.sh
```

#### **Database Issues**
```bash
# Reset local database
rm backend/data/novara-local.db
./scripts/start-dev-stable.sh
```

#### **Environment Configuration Issues**
```bash
# Validate environment setup
./scripts/validate-dev.sh

# Recreate environment files
cp backend/env.development.example backend/.env.development
cp frontend/env.development.example frontend/.env.development
```

#### **Dependency Issues**
```bash
# Clean install dependencies
cd backend && rm -rf node_modules package-lock.json && npm install
cd frontend && rm -rf node_modules package-lock.json && npm install
```

### **Environment-Specific Issues**

#### **Development**
- **Issue**: "User not found" errors
- **Solution**: Add test user to SQLite database
```bash
sqlite3 backend/data/novara-local.db "INSERT INTO Users (id, email, nickname, confidence_meds, confidence_costs, confidence_overall, primary_need, cycle_stage, created_at) VALUES ('rec$(date +%s)000test', 'test@example.com', 'TestUser', 5, 5, 5, 'medical_clarity', 'ivf_prep', '$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")');"
```

#### **Staging**
- **Issue**: CORS errors
- **Solution**: Verify `ALLOWED_ORIGINS` includes staging URL
- **Issue**: Database connection errors
- **Solution**: Check Airtable API key and base ID

#### **Production**
- **Issue**: Authentication errors
- **Solution**: Verify JWT secrets are properly set
- **Issue**: Performance issues
- **Solution**: Check Railway/Vercel resource allocation

## 📊 **Monitoring and Logs**

### **Development Logs**
```bash
# Backend logs
cd backend && npm run dev

# Frontend logs
cd frontend && npm run dev
```

### **Staging/Production Logs**
- **Railway**: https://railway.app (Backend logs)
- **Vercel**: https://vercel.com (Frontend logs)

### **Health Checks**
```bash
# Development
curl http://localhost:9002/api/health

# Staging
curl https://novara-staging.up.railway.app/api/health

# Production
curl https://novara-mvp-production.up.railway.app/api/health
```

## 🔄 **Environment Migration**

### **Development to Staging**
1. Test all features in development
2. Run `./scripts/validate-dev.sh`
3. Deploy to staging: `./scripts/deploy-staging.sh`
4. Test staging environment
5. Fix any issues found

### **Staging to Production**
1. Ensure staging is working correctly
2. Run staging health checks
3. Deploy to production: `./scripts/deploy-production.sh`
4. Monitor production environment
5. Verify all features work

## 📋 **Best Practices**

### **Development**
- Always use `./scripts/start-dev-stable.sh` for development
- Test changes locally before committing
- Use the validation script regularly
- Keep environment files up to date

### **Staging**
- Test all features in staging before production
- Use staging for integration testing
- Monitor staging environment health
- Keep staging data separate from production

### **Production**
- Never deploy directly to production without staging
- Monitor production environment closely
- Keep backups of production data
- Use proper secrets and security measures

## 🎯 **Quick Reference**

### **Essential Commands**
```bash
# Development
./scripts/start-dev-stable.sh          # Start development
./scripts/kill-local-servers.sh        # Stop development
./scripts/validate-dev.sh              # Validate environment

# Deployment
./scripts/deploy-staging.sh            # Deploy to staging
./scripts/deploy-production.sh         # Deploy to production

# Testing
curl http://localhost:9002/api/health  # Health check
```

### **Environment URLs**
| Environment | Frontend | Backend | Health |
|-------------|----------|---------|--------|
| Development | http://localhost:4200 | http://localhost:9002 | http://localhost:9002/api/health |
| Staging | https://novara-mvp-staging.vercel.app | https://novara-staging.up.railway.app | https://novara-staging.up.railway.app/api/health |
| Production | https://novara-mvp.vercel.app | https://novara-mvp-production.up.railway.app | https://novara-mvp-production.up.railway.app/api/health |

---

This setup ensures **complete environment isolation**, **predictable deployments**, and **secure configuration management** across all environments. 