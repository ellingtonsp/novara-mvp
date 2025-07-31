# Novara MVP Documentation

Welcome to the comprehensive documentation for Novara MVP. This documentation covers deployment, configuration, troubleshooting, and operational procedures.

## =Ú Documentation Index

### Core Documentation

1. **[Deployment Architecture](./DEPLOYMENT_ARCHITECTURE.md)**
   - Complete system architecture overview
   - Frontend (Vercel) and Backend (Railway) setup
   - CI/CD pipeline configuration
   - Security considerations

2. **[Environment Setup Guide](./ENVIRONMENT_SETUP_GUIDE.md)**
   - Detailed environment variable reference
   - Local development setup
   - Production/Staging configurations
   - Secret management

3. **[Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)**
   - Common issues and solutions
   - Emergency procedures
   - Performance optimization
   - Debugging commands

4. **[Custom Domain Setup](./CUSTOM_DOMAIN_SETUP.md)**
   - DNS configuration
   - SSL setup
   - Multiple domain management
   - Migration procedures

### Deployment Guides

- **[Railway Deployment](./deployment/railway-deployment.md)** - Backend deployment procedures
- **[Railway CORS Setup](./deployment/railway-cors-setup.md)** - CORS configuration guide
- **[Railway CORS Visual Guide](./deployment/railway-cors-visual-guide.md)** - Visual CORS setup

### Feature Documentation

- **[Social Login](./features/AUTH-01-social-login.md)** - Apple/Google authentication
- **[Event Tracking](./features/AN-01-event-tracking/)** - Analytics implementation

## =€ Quick Start

### Access Points

| Service | Production | Staging | Local |
|---------|------------|---------|--------|
| Frontend | https://novarafertility.com | https://novara-mvp-staging.vercel.app | http://localhost:4200 |
| Backend API | https://novara-mvp-production.up.railway.app | https://novara-staging-staging.up.railway.app | http://localhost:9002 |
| Health Check | [/api/health](https://novara-mvp-production.up.railway.app/api/health) | [/api/health](https://novara-staging-staging.up.railway.app/api/health) | http://localhost:9002/api/health |

### Key Commands

```bash
# Local Development
./scripts/start-dev-stable.sh

# Run Tests
npm test
cd frontend && npm test
cd backend && npm test

# Check Deployment Status
gh run list --branch main --limit 5

# View Logs
# Railway: Dashboard ’ Service ’ Logs
# Vercel: Dashboard ’ Functions ’ Logs
```

## =' Common Tasks

### Deploy to Production

1. Create feature branch from `develop`
2. Make changes and test
3. PR to `develop` ’ `staging` ’ `main`
4. Automatic deployment on merge

### Update Environment Variables

**Frontend (Vercel):**
1. Dashboard ’ Settings ’ Environment Variables
2. Add/Update variable
3. Redeploy (automatic)

**Backend (Railway):**
1. Dashboard ’ Service ’ Variables
2. Add/Update variable
3. Redeploy (automatic)

### Fix CORS Issues

```env
# Railway Variables
CORS_ORIGIN=https://novara-mvp.vercel.app,https://novarafertility.com,https://www.novarafertility.com
```

### Monitor Health

```bash
# Production
curl https://novara-mvp-production.up.railway.app/api/health

# Custom Domain
curl https://api.novarafertility.com/api/health  # When configured
```

## =Ê System Status

### Current Configuration (as of July 31, 2025)

- **Frontend**: Vercel deployment with custom domain
- **Backend**: Railway deployment with PostgreSQL
- **Database**: PostgreSQL with Schema V2
- **Authentication**: JWT with social login support
- **Analytics**: PostHog integration
- **CI/CD**: GitHub Actions automated pipeline

### Recent Changes

- Migrated from Airtable to PostgreSQL
- Implemented refactored modular backend architecture
- Added social authentication infrastructure
- Fixed TypeScript build issues
- Configured CORS for custom domain

## =¨ Important Notes

1. **Never set PORT in Railway** - It's provided automatically
2. **Always include API_BASE_URL** in Railway variables
3. **CORS must include all frontend URLs**
4. **Use feature branches** - Never commit directly to main
5. **Test in staging** before production deployment

## =Þ Support

### Issue Tracking
- GitHub Issues: https://github.com/ellingtonsp/novara-mvp/issues
- Include logs and error messages
- Tag with appropriate labels

### Monitoring
- Railway Dashboard for backend metrics
- Vercel Dashboard for frontend analytics
- PostHog for user behavior tracking

## = Updates

This documentation is maintained alongside the codebase. When making significant changes:

1. Update relevant documentation
2. Include in PR description
3. Tag with `documentation` label

---

For questions or contributions, please refer to the main [README.md](../README.md) in the project root.