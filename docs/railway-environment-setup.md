# 🚂 Railway Environment Setup & Automation

## Overview

This document outlines the automated setup of Railway environments for Novara MVP, including staging and production deployments.

## 🏗️ Architecture

### Project Structure
```
novara-mvp (Railway Project)
├── Production Environment
│   └── novara-main (Production Backend Service)
└── Staging Environment  
    └── novara-staging (Staging Backend Service)
```

### Environment Separation
- **Staging**: For testing and development
- **Production**: For live users
- **Isolated**: Each environment has its own configuration and variables

## 🔧 Automated Setup

### Prerequisites
1. Railway CLI installed: `npm install -g @railway/cli`
2. Logged into Railway: `railway login`
3. In project root directory

### Running the Setup
```bash
./scripts/setup-railway-environments.sh
```

This script will:
1. ✅ Deploy to staging environment
2. ✅ Set staging environment variables
3. ✅ Deploy to production environment
4. ✅ Set production environment variables
5. ✅ Verify both deployments
6. ✅ Provide URLs and next steps

## 🌐 Environment URLs

### Staging
- **URL**: `https://novara-staging-staging.up.railway.app`
- **Health Check**: `https://novara-staging-staging.up.railway.app/api/health`
- **Frontend**: `https://novara-mvp-staging.vercel.app`

### Production
- **URL**: `https://novara-main-production.up.railway.app`
- **Health Check**: `https://novara-main-production.up.railway.app/api/health`
- **Frontend**: `https://novara-mvp.vercel.app`

## 🔐 Environment Variables

### Staging Environment
```bash
AIRTABLE_API_KEY=patp9wk9fzHxtkVUZ.1ba015773d9bbdc098796035b0a7bfd620edfbf6cd3b5aecc88c0beb5ef6dde7
AIRTABLE_BASE_ID=appEOWvLjCn5c7Ght
JWT_SECRET=staging_super_secret_jwt_key_different_from_prod
NODE_ENV=staging
USE_LOCAL_DATABASE=false
DATABASE_TYPE=airtable
CORS_ORIGIN=https://novara-mvp-staging.vercel.app
LOG_LEVEL=debug
ENABLE_DEBUG_LOGGING=true
ENABLE_REQUEST_LOGGING=true
```

### Production Environment
```bash
AIRTABLE_API_KEY=patp9wk9fzHxtkVUZ.1ba015773d9bbdc098796035b0a7bfd620edfbf6cd3b5aecc88c0beb5ef6dde7
AIRTABLE_BASE_ID=appEOWvLjCn5c7Ght
JWT_SECRET=production_super_secret_jwt_key_different_from_staging
NODE_ENV=production
USE_LOCAL_DATABASE=false
DATABASE_TYPE=airtable
CORS_ORIGIN=https://novara-mvp.vercel.app
LOG_LEVEL=info
ENABLE_DEBUG_LOGGING=false
ENABLE_REQUEST_LOGGING=false
```

## 🚀 Deployment Process

### Manual Deployment
```bash
# Deploy to staging
railway environment staging
railway service novara-staging
railway up

# Deploy to production
railway environment production
railway service novara-main
railway up
```

### Environment Switching
```bash
# Switch to staging
railway environment staging

# Switch to production
railway environment production

# Check current status
railway status
```

## 📊 Monitoring & Health Checks

### Health Endpoints
- **Staging**: `https://novara-staging-staging.up.railway.app/api/health`
- **Production**: `https://novara-main-production.up.railway.app/api/health`

### Expected Response
```json
{
  "status": "success",
  "message": "Novara API is running",
  "environment": "staging|production",
  "database": "airtable",
  "timestamp": "2025-07-24T06:30:00.000Z"
}
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Deployment Fails
- Check Railway logs: `railway logs`
- Verify environment variables are set
- Ensure all dependencies are in `package.json`

#### 2. Health Check Fails
- Check if service is running: `railway status`
- Verify PORT environment variable
- Check application logs for errors

#### 3. Environment Variables Not Set
- Use: `railway variables` to check current variables
- Set missing variables: `railway variables --set "KEY=value"`

### Debug Commands
```bash
# Check current environment
railway status

# View logs
railway logs

# Check variables
railway variables

# Open Railway dashboard
railway open
```

## 🔄 CI/CD Integration

### GitHub Actions (Recommended)
```yaml
name: Deploy to Railway
on:
  push:
    branches: [main, staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g @railway/cli
      - run: railway login --ci
      - run: railway up
```

### Manual Deployment Workflow
1. **Development**: Local development with SQLite
2. **Staging**: Deploy to staging for testing
3. **Production**: Deploy to production after staging approval

## 📝 Best Practices

### Security
- ✅ Different JWT secrets for each environment
- ✅ Environment-specific CORS origins
- ✅ Production logging disabled for security
- ✅ Separate Airtable bases (if needed)

### Performance
- ✅ Staging: Debug logging enabled for development
- ✅ Production: Info logging only for performance
- ✅ Health checks configured for monitoring
- ✅ Automatic restarts on failure

### Cost Optimization
- ✅ Single Railway project with multiple environments
- ✅ Shared Airtable base (cost-effective)
- ✅ Automatic sleep for inactive environments

## 🎯 Next Steps

1. **Frontend Configuration**: Update frontend to use correct backend URLs
2. **Testing**: Test both environments thoroughly
3. **Monitoring**: Set up monitoring and alerting
4. **CI/CD**: Implement automated deployment pipeline
5. **Documentation**: Update team documentation

## 📞 Support

For issues with Railway deployment:
1. Check this documentation
2. Review Railway logs
3. Contact the development team
4. Check Railway status page: https://status.railway.app/ 