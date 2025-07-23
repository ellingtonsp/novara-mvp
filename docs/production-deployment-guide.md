# Production Deployment Guide

## 🚀 Current Status
- ✅ **Frontend**: Deployed on Vercel (https://novara-mvp.vercel.app)
- ✅ **Backend**: Deployed on Railway (https://novara-mvp-production.up.railway.app)
- ✅ **Database**: Airtable (functional)

## 🎯 Deployment Options

### Option 1: Vercel (✅ COMPLETED)
**Pros:** Zero-config, automatic HTTPS, CDN, excellent React support
**Cons:** None for MVP

**Status:** ✅ **LIVE** - https://novara-mvp.vercel.app

### Option 2: Railway Frontend
**Pros:** Same platform as backend, unified dashboard
**Cons:** Less optimized for static sites

**Status:** Configuration ready in `frontend/railway.toml`

## 🔧 Environment Configuration

### Backend Environment Variables (Railway)
```
NODE_ENV=production
PORT=$PORT
AIRTABLE_API_KEY=your_airtable_key
AIRTABLE_BASE_ID=your_base_id
JWT_SECRET=your_jwt_secret
```

### Frontend Environment Variables (Vercel)
```
VITE_API_URL=https://novara-mvp-production.up.railway.app
```

## 🌐 Finding Railway Backend URL

### Method 1: Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Sign in to your account
3. Click on your **novara-mvp** project
4. Look for the **"Deployments"** tab
5. Find your active deployment and click on it
6. The URL will be displayed in the **"Domains"** section

### Method 2: Railway CLI
```bash
# Link to project
railway link

# Check status
railway status

# List domains
railway domain
```

### Method 3: Check Recent Deployments
Look for URLs in the format:
- `https://[project-name]-[environment]-[hash].up.railway.app`
- `https://[custom-domain].railway.app`

## 🔧 Custom Domain Setup

### Vercel Domain Configuration
1. Add domain in Vercel dashboard
2. Update DNS records:
   - Type: CNAME
   - Name: @ or www
   - Value: cname.vercel-dns.com

### SSL/HTTPS
- Vercel: Automatic
- Railway: Automatic

## 📊 Monitoring & Analytics

### Recommended Tools
1. **Vercel Analytics** (built-in)
2. **Railway Metrics** (built-in)
3. **Google Analytics** (optional)

## 🔒 Security Checklist

### Backend Security
- ✅ JWT authentication
- ✅ CORS configured
- ✅ Environment variables secured
- 🔄 Rate limiting (future enhancement)
- 🔄 Input validation (future enhancement)

### Frontend Security
- ✅ HTTPS enforced
- ✅ Security headers configured
- ✅ XSS protection
- 🔄 CSP headers (future enhancement)

## 📈 Scalability Plan

### Phase 1: MVP (Current)
- Railway backend
- Vercel frontend
- Airtable database

### Phase 2: Growth (Future)
- Migrate to AWS/GCP
- PostgreSQL database
- Redis caching
- CDN optimization

### Phase 3: Enterprise (Future)
- Microservices architecture
- Kubernetes deployment
- Advanced monitoring
- Load balancing

## 🚨 Emergency Procedures

### Rollback Process
1. Revert to previous git commit
2. Redeploy automatically
3. Verify functionality

### Monitoring Alerts
- Set up Railway alerts for backend
- Set up Vercel alerts for frontend
- Monitor API response times

## 📞 Support Contacts
- Railway Support: Built-in chat
- Vercel Support: Built-in chat
- Airtable Support: Email support

## 🔄 Current Issues & Solutions

### Issue: Railway Backend URL Changed
**Problem:** Backend URL may have changed after deployment
**Solution:** 
1. Check Railway dashboard for current URL
2. Update frontend API configuration
3. Test connectivity

### Issue: Frontend 404 Error (RESOLVED ✅)
**Problem:** Vite base path causing 404 errors
**Solution:** 
1. Removed `base: '/novara-mvp/'` from vite.config.ts
2. Created root-level vercel.json
3. Fixed asset loading paths 