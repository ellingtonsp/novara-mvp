# Novara MVP Deployment Architecture

## Overview

This document describes the complete deployment architecture for Novara MVP, including frontend, backend, custom domain setup, and CI/CD pipelines.

## Architecture Components

### 1. Frontend (Vercel)

**Production URL**: https://novarafertility.com (custom domain)
**Vercel URLs**: 
- Production: https://novara-mvp.vercel.app
- Staging: https://novara-mvp-staging.vercel.app

**Technology Stack**:
- React 19.1.0 with TypeScript
- Vite for building
- TailwindCSS for styling
- PostHog for analytics
- PWA capabilities

**Deployment**:
- Automatic deployment via GitHub integration
- `main` branch → Production
- `staging` branch → Staging environment
- Preview deployments for all PRs

### 2. Backend (Railway)

**Production URL**: https://novara-mvp-production.up.railway.app
**Staging URL**: https://novara-staging-staging.up.railway.app

**Technology Stack**:
- Node.js with Express
- PostgreSQL database
- JWT authentication
- Refactored modular architecture

**Key Features**:
- RESTful API
- CORS configured for custom domains
- Rate limiting
- Health check endpoints
- Social authentication ready (Apple/Google)

### 3. Database

**Type**: PostgreSQL
**Schema Version**: V2
**Features**:
- User management
- Daily check-ins
- Insights tracking
- Social auth support

### 4. Custom Domain Configuration

**Domain**: novarafertility.com
**DNS Provider**: [Your DNS provider]

**Current Setup**:
- `novarafertility.com` → Vercel (Frontend)
- `www.novarafertility.com` → Vercel (Frontend)
- `api.novarafertility.com` → Should point to Railway (Backend) - Currently misconfigured

**Required DNS Records**:
```
novarafertility.com     A       76.76.21.21 (Vercel)
www.novarafertility.com CNAME   cname.vercel-dns.com
api.novarafertility.com CNAME   [Railway-provided-domain].up.railway.app
```

## Environment Variables

### Frontend (Vercel)

```env
# Production
VITE_ENV=production
VITE_API_URL=https://novara-mvp-production.up.railway.app
VITE_POSTHOG_KEY=phc_[your-key]
VITE_POSTHOG_HOST=https://us.i.posthog.com

# Staging
VITE_ENV=staging
VITE_API_URL=https://novara-staging-staging.up.railway.app
```

### Backend (Railway)

```env
# Core Configuration
NODE_ENV=production
API_BASE_URL=https://novara-mvp-production.up.railway.app
USE_REFACTORED_SERVER=true
USE_SCHEMA_V2=true

# Database
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://[connection-string]
USE_LOCAL_DATABASE=false

# Authentication
JWT_SECRET=[64+ character secret]

# CORS
CORS_ORIGIN=https://novara-mvp.vercel.app,https://novarafertility.com,https://www.novarafertility.com

# External Services
AIRTABLE_API_KEY=[if-needed]
AIRTABLE_BASE_ID=[if-needed]

# Logging
LOG_LEVEL=info
ENABLE_DEBUG_LOGGING=false
ENABLE_REQUEST_LOGGING=false

# DO NOT SET - Railway provides automatically
# PORT=[Railway provides this]
```

## Git Workflow

### Branch Strategy

```
main (production)
  ↑
staging (staging environment)
  ↑
develop (integration branch)
  ↑
feature/* (feature branches)
```

### Deployment Flow

1. Create feature branch from `develop`
2. Make changes and test locally
3. Create PR to `develop`
4. After merge, test in development
5. Create PR from `develop` to `staging`
6. Test in staging environment
7. Create PR from `staging` to `main`
8. Automatic deployment to production

### Protected Branches

- `main`: Requires PR reviews, status checks must pass
- `staging`: Requires status checks
- `develop`: Base development branch

## CI/CD Pipeline

### GitHub Actions Workflows

1. **CI/CD Pipeline** (`.github/workflows/ci.yml`)
   - Runs on all PRs and pushes
   - Frontend and backend tests
   - TypeScript compilation
   - Build validation

2. **Security Checks** (`.github/workflows/security.yml`)
   - Dependency vulnerability scanning
   - Code security analysis

3. **Regression Tests** (`.github/workflows/regression.yml`)
   - E2E API testing
   - Critical path validation

4. **Railway Deployment** (`.github/workflows/railway.yml`)
   - Automatic deployment on push to main/staging
   - Health check validation

### Required Status Checks

- CI/CD Pipeline must pass
- Security scan must pass
- Build must succeed

## Common Issues and Solutions

### 1. Railway Backend Crash

**Symptoms**: 502 Bad Gateway errors

**Common Causes**:
- Missing environment variables (especially `API_BASE_URL`)
- Wrong `DATABASE_TYPE` setting
- PORT manually set (should be automatic)
- Wrong server mode (`USE_REFACTORED_SERVER`)

**Solution**:
1. Check Railway logs
2. Verify all required env vars are set
3. Ensure PORT is NOT set manually
4. Verify `API_BASE_URL` is set correctly

### 2. CORS Errors

**Symptoms**: "Access to fetch... has been blocked by CORS policy"

**Solution**:
1. Update `CORS_ORIGIN` in Railway to include all domains
2. Or update `backend/server.js` allowedOrigins array
3. Deploy changes

### 3. TypeScript Build Errors

**Common Issues**:
- Missing type definitions
- Import/export mismatches

**Solution**:
1. Install missing @types packages
2. Use correct import syntax (named vs default exports)
3. Run `npm run build` locally to test

### 4. DNS Configuration

**For Custom Domain**:
1. Add domain in Vercel dashboard
2. Update DNS records at registrar
3. Add custom domain in Railway for API subdomain
4. Update environment variables with new URLs

## Monitoring and Logs

### Frontend (Vercel)
- Vercel Dashboard → Functions → Logs
- PostHog for user analytics
- Browser console for client-side errors

### Backend (Railway)
- Railway Dashboard → Service → Logs
- Health endpoint: `/api/health`
- Structured logging with Winston

### Error Tracking
- Sentry integration (when configured)
- PostHog error tracking
- Railway/Vercel error logs

## Security Considerations

1. **Environment Variables**
   - Never commit secrets to git
   - Use strong JWT secrets (64+ characters)
   - Rotate secrets regularly

2. **CORS Configuration**
   - Only allow specific origins
   - No wildcard (*) origins in production

3. **Database Security**
   - Use connection pooling
   - SSL connections required
   - Regular backups

4. **API Security**
   - Rate limiting enabled
   - JWT token expiration
   - Input validation on all endpoints

## Backup and Recovery

### Database Backups
- Railway provides automatic backups
- Can restore from Railway dashboard
- Export data via pg_dump for external backups

### Code Backups
- All code in GitHub
- Multiple deployment environments
- Can rollback via git revert

## Performance Optimization

### Frontend
- Vite chunking for optimal loading
- PWA caching strategies
- Lazy loading for components
- Image optimization

### Backend
- Connection pooling
- Query optimization
- Caching with Redis (when enabled)
- Compression middleware

## Future Enhancements

1. **API Subdomain**: Configure api.novarafertility.com → Railway
2. **CDN**: Add CloudFlare for global performance
3. **Monitoring**: Add Datadog or New Relic
4. **Auto-scaling**: Railway Pro for auto-scaling
5. **Blue-Green Deployments**: Zero-downtime deployments

---

Last Updated: July 31, 2025