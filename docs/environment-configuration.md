# Environment Configuration Guide

This document provides comprehensive guidance for configuring Novara MVP across all environments (development, staging, and production).

## Environment Overview

| Environment | Frontend URL | Backend URL | Database | Purpose |
|-------------|--------------|-------------|----------|---------|
| **Development** | http://localhost:4200 | http://localhost:9002 | Local SQLite | Local development and testing |
| **Staging** | https://novara-bd6xsx1ru-novara-fertility.vercel.app | https://novara-staging-staging.up.railway.app | Staging Airtable | Integration testing and validation |
| **Production** | https://novara-mvp.vercel.app | https://novara-mvp-production.up.railway.app | Production Airtable | Live application |

## Database Configuration

### Airtable Base IDs

| Environment | Base ID | Description |
|-------------|---------|-------------|
| **Staging** | `appEOWvLjCn5c7Ght` | Staging database for testing |
| **Production** | `app5QWCcVbCnVg2Gg` | Production database for live users |

### Database Setup Requirements

Each Airtable base must contain the following tables:
- `Users` - User profiles and preferences
- `DailyCheckins` - Daily check-in submissions
- `Insights` - Generated insights and recommendations
- `InsightEngagement` - User interaction with insights
- `FmvAnalytics` - Event tracking and analytics

## Analytics Configuration

### PostHog API Key

**Current PostHog API Key (used across all environments):**
```
phc_5imIla9RYl1YPLFcrXNOlbbZfB6tAY1EKFNq7WFsCbt
```

**PostHog Host:**
```
https://app.posthog.com
```

### Environment-Specific Analytics

| Environment | Analytics Enabled | Event Tracking | Error Tracking |
|-------------|------------------|----------------|----------------|
| **Development** | ✅ Yes | ✅ Yes | ⚠️ Limited |
| **Staging** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Production** | ✅ Yes | ✅ Yes | ✅ Yes |

## Frontend Environment Variables

### Required Variables

```bash
# API Configuration
VITE_API_URL=<backend_url>

# Environment
VITE_ENV=<environment>
VITE_NODE_ENV=<node_environment>

# Analytics
VITE_POSTHOG_API_KEY=phc_5imIla9RYl1YPLFcrXNOlbbZfB6tAY1EKFNq7WFsCbt
VITE_POSTHOG_HOST=https://app.posthog.com

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_CM01_FEATURES=true
VITE_ENABLE_AN01_FEATURES=true
```

### Environment-Specific Frontend URLs

| Environment | VITE_API_URL |
|-------------|--------------|
| **Development** | `http://localhost:9002` |
| **Staging** | `https://novara-staging-staging.up.railway.app` |
| **Production** | `https://novara-mvp-production.up.railway.app` |

## Backend Environment Variables

### Required Variables

```bash
# Core Configuration
NODE_ENV=<environment>
PORT=<port>
DATABASE_TYPE=airtable
USE_LOCAL_DATABASE=<boolean>

# Airtable Configuration
AIRTABLE_API_KEY=<your_airtable_api_key>
AIRTABLE_BASE_ID=<environment_specific_base_id>

# JWT Configuration
JWT_SECRET=<secure_jwt_secret>
JWT_EXPIRES_IN=90d

# Security
CORS_ORIGIN=<frontend_url>
TRUST_PROXY=true

# Analytics
POSTHOG_API_KEY=phc_5imIla9RYl1YPLFcrXNOlbbZfB6tAY1EKFNq7WFsCbt
POSTHOG_HOST=https://app.posthog.com
```

### Environment-Specific Backend Configuration

| Environment | AIRTABLE_BASE_ID | CORS_ORIGIN | PORT |
|-------------|------------------|-------------|------|
| **Development** | N/A (SQLite) | `http://localhost:4200` | `9002` |
| **Staging** | `appEOWvLjCn5c7Ght` | `https://novara-bd6xsx1ru-novara-fertility.vercel.app` | `8080` |
| **Production** | `app5QWCcVbCnVg2Gg` | `https://novara-mvp.vercel.app` | `8080` |

## Deployment Configuration

### Railway Backend Deployment

**Staging Environment:**
- Project: `novara-mvp`
- Environment: `staging`
- Service: `novara-staging`
- Base ID: `appEOWvLjCn5c7Ght`

**Production Environment:**
- Project: `novara-mvp`
- Environment: `production`
- Service: `novara-main`
- Base ID: `app5QWCcVbCnVg2Gg`

### Vercel Frontend Deployment

**Staging Environment:**
- Project: `novara-mvp`
- Branch: `staging`
- URL: `https://novara-bd6xsx1ru-novara-fertility.vercel.app`

**Production Environment:**
- Project: `novara-mvp`
- Branch: `main`
- URL: `https://novara-mvp.vercel.app`

## Security Considerations

### Environment Isolation

1. **Database Isolation**: Each environment uses a separate Airtable base
2. **API Key Separation**: Different API keys for staging and production
3. **CORS Configuration**: Strict origin validation per environment
4. **JWT Secrets**: Unique secrets for each environment

### Required Security Variables

```bash
# Production Security
JWT_SECRET=<64+_character_random_string>
CORS_ORIGIN=<exact_frontend_url>
TRUST_PROXY=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Monitoring and Observability

### Health Check Endpoints

- **Backend Health**: `GET /api/health`
- **Frontend Health**: Root endpoint with status indicator
- **Database Health**: Integrated into backend health check

### Logging Configuration

```bash
# Development
LOG_LEVEL=debug
ENABLE_STRUCTURED_LOGGING=true

# Staging
LOG_LEVEL=info
ENABLE_STRUCTURED_LOGGING=true

# Production
LOG_LEVEL=warn
ENABLE_STRUCTURED_LOGGING=true
ENABLE_REQUEST_LOGGING=true
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify AIRTABLE_API_KEY is correct
   - Confirm AIRTABLE_BASE_ID matches environment
   - Check Airtable base permissions

2. **CORS Errors**
   - Verify CORS_ORIGIN matches frontend URL exactly
   - Check for trailing slashes in URLs
   - Ensure TRUST_PROXY is set correctly

3. **Authentication Issues**
   - Verify JWT_SECRET is set and unique per environment
   - Check JWT_EXPIRES_IN format (e.g., "90d")
   - Confirm frontend is using correct API URL

4. **Analytics Issues**
   - Verify PostHog API key: `phc_5imIla9RYl1YPLFcrXNOlbbZfB6tAY1EKFNq7WFsCbt`
   - Check PostHog host: `https://app.posthog.com`
   - Confirm VITE_ENABLE_ANALYTICS is true

### Environment Validation

Use the health check script to validate environment configuration:

```bash
# Validate all environments
npm run validate:environments

# Validate specific environment
npm run health-check:production
npm run health-check:staging
npm run health-check:development
```

## Migration Guide

### Updating Environment Variables

1. **Never modify .env files directly** - use environment-specific example files
2. **Update all example files** when adding new variables
3. **Test changes in staging** before production
4. **Document all changes** in this guide

### Database Migration

1. **Backup existing data** before schema changes
2. **Test migrations in staging** first
3. **Update all environments** with new schema
4. **Validate data integrity** after migration

## Best Practices

1. **Environment Parity**: Keep development, staging, and production as similar as possible
2. **Secret Management**: Use Railway and Vercel secrets management
3. **Configuration Validation**: Validate all required variables are set
4. **Monitoring**: Enable comprehensive logging and monitoring
5. **Security**: Use unique secrets and keys per environment
6. **Documentation**: Keep this guide updated with all changes 