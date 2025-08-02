# Environment Setup Guide

This guide documents all environment configurations for Novara MVP across different deployment environments.

## Quick Reference

| Environment | Frontend URL | Backend URL | Branch |
|------------|--------------|-------------|---------|
| Production | https://novarafertility.com | https://novara-mvp-production.up.railway.app | main |
| Staging | https://novara-mvp-staging.vercel.app | https://novara-staging-staging.up.railway.app | staging |
| Development | http://localhost:4200 | http://localhost:9002 | develop |

## Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (for local database)
- Git

### Initial Setup

```bash
# Clone repository
git clone https://github.com/ellingtonsp/novara-mvp.git
cd novara-mvp

# Install dependencies
npm install
cd frontend && npm install
cd ../backend && npm install
```

### Environment Files

#### Frontend (.env.local)
```env
VITE_ENV=development
VITE_API_URL=http://localhost:9002
VITE_POSTHOG_KEY=phc_development_key
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

#### Backend (.env.local)
```env
NODE_ENV=development
PORT=9002
API_BASE_URL=http://localhost:9002
USE_REFACTORED_SERVER=true
USE_SCHEMA_V2=true

# Database
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://postgres:password@localhost:5432/novara_dev
USE_LOCAL_DATABASE=true

# Auth
JWT_SECRET=development-secret-change-in-production

# CORS
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000

# External Services (Legacy - No longer used)
# AIRTABLE_API_KEY=[removed - migrated to PostgreSQL]
# AIRTABLE_BASE_ID=[removed - migrated to PostgreSQL]
```

### Running Locally

```bash
# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory)
npm run dev

# Or use the convenience script from root
./scripts/start-dev-stable.sh
```

## Vercel Configuration

### Production Environment Variables

```env
VITE_ENV=production
VITE_API_URL=https://novara-mvp-production.up.railway.app
VITE_POSTHOG_KEY=phc_[production-key]
VITE_POSTHOG_HOST=https://us.i.posthog.com
VITE_APP_VERSION=2.0.47
```

### Staging Environment Variables

```env
VITE_ENV=staging
VITE_API_URL=https://novara-staging-staging.up.railway.app
VITE_POSTHOG_KEY=phc_[staging-key]
VITE_POSTHOG_HOST=https://us.i.posthog.com
VITE_APP_VERSION=2.0.47-staging
```

### Build Settings
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## Railway Configuration

### Production Variables

```env
# Core Settings
NODE_ENV=production
API_BASE_URL=https://novara-mvp-production.up.railway.app
USE_REFACTORED_SERVER=true
USE_SCHEMA_V2=true

# Database
DATABASE_TYPE=postgresql
DATABASE_URL=${{Postgres.DATABASE_URL}}
USE_LOCAL_DATABASE=false

# Authentication
JWT_SECRET=[Generate 64+ character secret]

# CORS - CRITICAL: Include all allowed origins
CORS_ORIGIN=https://novara-mvp.vercel.app,https://novarafertility.com,https://www.novarafertility.com

# External Services (Legacy - No longer used)
# AIRTABLE_API_KEY=[removed - migrated to PostgreSQL]
# AIRTABLE_BASE_ID=[removed - migrated to PostgreSQL]

# Logging
LOG_LEVEL=info
ENABLE_DEBUG_LOGGING=false
ENABLE_REQUEST_LOGGING=false

# NEVER SET THESE - Railway provides automatically
# PORT - Railway provides this via $PORT
```

### Staging Variables

Same as production but with:
```env
NODE_ENV=staging
API_BASE_URL=https://novara-staging-staging.up.railway.app
CORS_ORIGIN=https://novara-mvp-staging.vercel.app
LOG_LEVEL=debug
ENABLE_DEBUG_LOGGING=true
```

## Critical Configuration Notes

### 1. PORT Configuration
- **NEVER** set PORT in Railway variables
- Railway provides it automatically via `process.env.PORT`
- Backend uses: `process.env.PORT || 9002`

### 2. API_BASE_URL
- **REQUIRED** for OAuth callbacks and email links
- Must match the Railway deployment URL
- Used in `config.server.baseUrl`

### 3. CORS Configuration
- Must include all frontend URLs
- Comma-separated list, no spaces after commas
- Backend also has hardcoded origins as fallback

### 4. Database Configuration
- **All environments use PostgreSQL**
- `DATABASE_TYPE=postgresql` for all environments
- `USE_SCHEMA_V2=true` for current schema version
- Local development requires PostgreSQL installation

## Environment Variable Priority

1. **Railway/Vercel Dashboard** (Highest priority)
2. `.env.production` / `.env.staging` files
3. `.env` file
4. Hardcoded defaults in code (Lowest priority)

## Adding New Environment Variables

### Frontend (Vite)
1. Add to `.env.example` with example value
2. Prefix with `VITE_` to expose to frontend code
3. Add to Vercel dashboard for each environment
4. Access via `import.meta.env.VITE_YOUR_VAR`

### Backend
1. Add to `.env.example` with example value
2. Add to Railway dashboard for each environment
3. Add to `config/index.js` if needed
4. Access via `process.env.YOUR_VAR` or `config.yourVar`

## Secrets Management

### Generating Secrets

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate API Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Secret Rotation
1. Generate new secret
2. Update in Railway/Vercel dashboard
3. Deploy application
4. Monitor for any authentication issues
5. Keep old secret for 24h for token validity

## Debugging Environment Issues

### Check Current Environment

```javascript
// Frontend
console.log(import.meta.env);

// Backend
console.log(process.env);
```

### Common Issues

1. **CORS Errors**
   - Check CORS_ORIGIN includes your domain
   - Verify no typos in domain names
   - Check for trailing slashes

2. **502 Bad Gateway**
   - Check Railway logs
   - Verify all required env vars are set
   - Check API_BASE_URL is correct

3. **Build Failures**
   - Check for missing VITE_ prefix on frontend vars
   - Verify no syntax errors in env values
   - Check for proper quotes around values with spaces

## Environment Validation

### Backend Validation Script
```bash
node backend/scripts/validate-env.js
```

### Frontend Build Check
```bash
cd frontend && npm run build
```

## Migration Guide

### PostgreSQL Configuration
1. **Local Development**: Install PostgreSQL 14+ and set `DATABASE_URL=postgresql://postgres:password@localhost:5432/novara_local`
2. **Staging/Production**: Use Railway-provided PostgreSQL instance via `DATABASE_URL=${{Postgres.DATABASE_URL}}`
3. Always set `DATABASE_TYPE=postgresql` and `USE_SCHEMA_V2=true`
4. **Database connection is managed via DATABASE_URL environment variable**

### Adding Custom Domain
1. Update `CORS_ORIGIN` to include new domain
2. Update `VITE_API_URL` if using custom API domain
3. Add domain in Vercel/Railway dashboards
4. Update DNS records

---

Last Updated: July 31, 2025