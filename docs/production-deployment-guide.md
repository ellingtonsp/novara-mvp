# Production Deployment Guide

## 🚀 Current Status
- ✅ **Backend**: Deployed on Railway (https://novara-backend-production.up.railway.app)
- 🔄 **Frontend**: Ready for deployment (Vercel recommended)

## 🎯 Deployment Options

### Option 1: Vercel (Recommended)
**Pros:** Zero-config, automatic HTTPS, CDN, excellent React support
**Cons:** None for MVP

**Steps:**
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import repository
4. Set root directory to `frontend`
5. Deploy automatically

### Option 2: Railway Frontend
**Pros:** Same platform as backend, unified dashboard
**Cons:** Less optimized for static sites

**Steps:**
1. Create new Railway service
2. Point to `frontend` directory
3. Deploy using existing `railway.toml`

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
VITE_API_URL=https://novara-backend-production.up.railway.app
```

## 🌐 Custom Domain Setup

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