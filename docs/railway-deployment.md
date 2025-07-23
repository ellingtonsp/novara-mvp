# Railway Production Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Backend Deployment

**Step 1.1: Create Backend Service**
```bash
# From your project root
railway login
railway new
# Choose: "Deploy from existing repo"
# Select: Backend service
# Repository: Your GitHub repo
# Root directory: /backend
```

**Step 1.2: Configure Backend Environment Variables**
Go to Railway Dashboard → Your Backend Service → Variables and add:

```env
# Required Production Variables
NODE_ENV=production
AIRTABLE_API_KEY=your_airtable_api_key_here
AIRTABLE_BASE_ID=your_airtable_base_id_here
JWT_SECRET=your_secure_jwt_secret_here

# Optional Configuration
PORT=3000
API_RATE_LIMIT=100
LOG_LEVEL=info
```

**Step 1.3: Deploy Backend**
```bash
# Deploy backend
cd backend
railway up

# Check deployment
railway status
railway logs
```

### 2. Frontend Deployment

**Step 2.1: Create Frontend Service**
```bash
# Create new service for frontend
railway new
# Choose: "Deploy from existing repo"  
# Select: Frontend service
# Repository: Your GitHub repo
# Root directory: /frontend
```

**Step 2.2: Configure Frontend Environment Variables**
```env
# Frontend Production Variables
NODE_ENV=production
VITE_API_URL=https://your-backend-railway-url.railway.app
VITE_APP_ENV=production
```

**Step 2.3: Deploy Frontend**
```bash
cd frontend
railway up
```

### 3. Domain Configuration

**Step 3.1: Backend Domain (API)**
1. Railway Dashboard → Backend Service → Settings → Domains
2. Add custom domain: `api.novarafertility.com`
3. Update DNS: Add CNAME record pointing to Railway URL

**Step 3.2: Frontend Domain (Main Site)**
1. Railway Dashboard → Frontend Service → Settings → Domains  
2. Add custom domain: `novarafertility.com`
3. Add custom domain: `www.novarafertility.com`
4. Update DNS records:
   ```
   Type: CNAME
   Name: www
   Value: your-frontend-service.railway.app
   
   Type: CNAME  
   Name: @
   Value: your-frontend-service.railway.app
   ```

**Step 3.3: Update Frontend API URL**
After backend domain is configured, update frontend environment:
```env
VITE_API_URL=https://api.novarafertility.com
```

### 4. Database Strategy

**Current MVP Database (Development)**
- Airtable base: Current development data
- Users: Test users and real users mixed
- Data: Development + production mixed

**Clean Launch Database (External Launch)**
- New Airtable base: Fresh production-only data
- Migration script: Transfer real users, exclude test data
- Backup strategy: Automated daily backups

**Environment Variables for Database Migration**
```env
# Current (MVP)
AIRTABLE_BASE_ID=your_current_development_base
AIRTABLE_API_KEY=your_current_api_key

# Future (Clean Launch)  
AIRTABLE_PROD_BASE_ID=your_future_production_base
AIRTABLE_PROD_API_KEY=your_future_prod_api_key
```

## 🔍 Verification Steps

### Health Checks
```bash
# Backend health check
curl https://api.novarafertility.com/api/health

# Frontend accessibility  
curl https://novarafertility.com/novara-mvp/

# Full system test
npm run test:regression
```

### Monitoring Setup
1. **Railway Metrics**: Built-in CPU, memory, network monitoring
2. **Custom Health Endpoint**: `/api/health` returns system status
3. **Airtable Connection**: Health check verifies database connectivity
4. **Error Tracking**: Console logs captured in Railway dashboard

## 🚨 Rollback Plan

**If deployment fails:**
```bash
# Rollback backend
railway rollback --service backend

# Rollback frontend  
railway rollback --service frontend

# Check previous deployments
railway deployments
```

**Emergency fallback:**
- Backend: Revert to localhost development
- Frontend: Revert to localhost development  
- DNS: Point domains back to development URLs temporarily

## 📊 Next Steps After Deployment

1. **Monitor for 24 hours**: Check Railway logs and metrics
2. **Run regression tests**: Verify all APIs working in production
3. **Test user flow**: Complete onboarding → check-in → insights
4. **Plan database migration**: Prepare clean launch strategy
5. **Set up CI/CD**: Automated deployments on git push

## 🔒 Security Considerations

- [ ] JWT secrets are production-grade (64+ character random strings)
- [ ] Airtable API keys have minimal required permissions
- [ ] Environment variables are properly secured in Railway
- [ ] HTTPS is enforced for all domains
- [ ] CORS is configured for production domains only

## 💾 Database Migration Strategy

**Phase 1: Current State (MVP)**
- Keep current Airtable base for immediate launch
- Use existing test + real user data
- Monitor production usage patterns

**Phase 2: Clean Launch Preparation**  
- Create new production-only Airtable base
- Develop migration scripts to transfer real users
- Implement data validation and cleanup
- Plan user communication about the transition

**Phase 3: Clean Launch Execution**
- Switch environment variables to new base
- Migrate verified real users
- Archive development/test data
- Launch with clean, production-ready database 