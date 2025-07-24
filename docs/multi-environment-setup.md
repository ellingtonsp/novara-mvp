# Novara MVP - Multi-Environment Setup Guide

## 🏗️ **Environment Architecture Overview**

Our application follows a **three-tier environment strategy** with proper isolation and configuration management:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │     Staging     │    │   Production    │
│                 │    │                 │    │                 │
│ Frontend: 4200  │    │ Vercel Staging  │    │ Vercel Prod     │
│ Backend: 9002   │    │ Railway Staging │    │ Railway Prod    │
│ DB: SQLite      │    │ Airtable Staging│    │ Airtable Prod   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 **Environment Strategy**

### **1. Development Environment**
- **Purpose**: Local development and testing
- **Isolation**: Complete local isolation with SQLite
- **Ports**: Stable, conflict-free (4200/9002)
- **Database**: Local SQLite file
- **Features**: Full debugging, hot reload, development tools

### **2. Staging Environment**
- **Purpose**: Pre-production testing and validation
- **Isolation**: Separate Airtable base, separate deployments
- **URLs**: Dedicated staging domains
- **Database**: Staging Airtable base
- **Features**: Production-like environment, integration testing

### **3. Production Environment**
- **Purpose**: Live application serving real users
- **Isolation**: Production Airtable base, production deployments
- **URLs**: Production domains
- **Database**: Production Airtable base
- **Features**: Optimized performance, monitoring, analytics

## 🔧 **Environment Configuration Files**

### **Backend Environment Files**

#### **`.env.development`** (Local Development)
```bash
# Environment
NODE_ENV=development
PORT=9002

# Database Configuration
USE_LOCAL_DATABASE=true
DATABASE_TYPE=sqlite
DATABASE_PATH=./data/novara-local.db

# Authentication
JWT_SECRET=dev_secret_key_not_for_production
JWT_EXPIRES_IN=90d

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=debug
ENABLE_DEBUG_LOGGING=true

# Feature Flags
ENABLE_ANALYTICS=false
ENABLE_ERROR_TRACKING=true
ENABLE_RATE_LIMITING=true
```

#### **`.env.staging`** (Staging Environment)
```bash
# Environment
NODE_ENV=staging
PORT=3000

# Database Configuration
USE_LOCAL_DATABASE=false
DATABASE_TYPE=airtable
AIRTABLE_API_KEY=${AIRTABLE_API_KEY}
AIRTABLE_BASE_ID=appEOWvLjCn5c7Ght

# Authentication
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=90d

# CORS Configuration
ALLOWED_ORIGINS=https://novara-mvp-staging.vercel.app

# Logging
LOG_LEVEL=info
ENABLE_DEBUG_LOGGING=false

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_ERROR_TRACKING=true
ENABLE_RATE_LIMITING=true
```

#### **`.env.production`** (Production Environment)
```bash
# Environment
NODE_ENV=production
PORT=3000

# Database Configuration
USE_LOCAL_DATABASE=false
DATABASE_TYPE=airtable
AIRTABLE_API_KEY=${AIRTABLE_API_KEY}
AIRTABLE_BASE_ID=appWOsZBUfg57fKD3

# Authentication
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=90d

# CORS Configuration
ALLOWED_ORIGINS=https://novara-mvp.vercel.app

# Logging
LOG_LEVEL=warn
ENABLE_DEBUG_LOGGING=false

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_ERROR_TRACKING=true
ENABLE_RATE_LIMITING=true
```

### **Frontend Environment Files**

#### **`.env.development`** (Local Development)
```bash
# API Configuration
VITE_API_URL=http://localhost:9002

# Environment
VITE_ENV=development
VITE_NODE_ENV=development

# Development Settings
VITE_DEBUG=true
VITE_LOG_LEVEL=debug

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_DEV_TOOLS=true

# Google Analytics (disabled in dev)
VITE_GA_MEASUREMENT_ID=
```

#### **`.env.staging`** (Staging Environment)
```bash
# API Configuration
VITE_API_URL=https://novara-staging.up.railway.app

# Environment
VITE_ENV=staging
VITE_NODE_ENV=staging

# Development Settings
VITE_DEBUG=false
VITE_LOG_LEVEL=info

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_DEV_TOOLS=false

# Google Analytics (staging)
VITE_GA_MEASUREMENT_ID=G-QP9XJD6QFS
```

#### **`.env.production`** (Production Environment)
```bash
# API Configuration
VITE_API_URL=https://novara-mvp-production.up.railway.app

# Environment
VITE_ENV=production
VITE_NODE_ENV=production

# Development Settings
VITE_DEBUG=false
VITE_LOG_LEVEL=warn

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_DEV_TOOLS=false

# Google Analytics (production)
VITE_GA_MEASUREMENT_ID=G-QP9XJD6QFS
```

## 🚀 **Environment-Specific Scripts**

### **Development Scripts**

#### **`scripts/start-dev-stable.sh`** (Primary Development Command)
```bash
#!/bin/bash
# Stable development environment with conflict-free ports
BACKEND_PORT=9002
FRONTEND_PORT=4200

# Environment-specific configuration
export NODE_ENV=development
export VITE_ENV=development

# Start services with proper environment files
# ... (see existing implementation)
```

#### **`scripts/start-staging.sh`** (Local Staging Testing)
```bash
#!/bin/bash
# Local staging environment testing
export NODE_ENV=staging
export VITE_ENV=staging

# Use staging configuration but local ports
BACKEND_PORT=9003
FRONTEND_PORT=4201
```

### **Deployment Scripts**

#### **`scripts/deploy-staging.sh`**
```bash
#!/bin/bash
# Deploy to staging environment
echo "🚀 Deploying to staging..."

# Build with staging environment
cd frontend
npm run build:staging
cd ..

# Deploy frontend to Vercel staging
vercel --prod --env staging

# Deploy backend to Railway staging
railway up --environment staging
```

#### **`scripts/deploy-production.sh`**
```bash
#!/bin/bash
# Deploy to production environment
echo "🚀 Deploying to production..."

# Build with production environment
cd frontend
npm run build:production
cd ..

# Deploy frontend to Vercel production
vercel --prod --env production

# Deploy backend to Railway production
railway up --environment production
```

## 📦 **Package.json Scripts**

### **Frontend Scripts**
```json
{
  "scripts": {
    "dev": "vite --mode development",
    "dev:staging": "vite --mode staging",
    "build": "vite build --mode production",
    "build:staging": "vite build --mode staging",
    "build:production": "vite build --mode production",
    "preview": "vite preview",
    "preview:staging": "vite preview --mode staging"
  }
}
```

### **Backend Scripts**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js --mode development",
    "dev:staging": "nodemon server.js --mode staging",
    "start:staging": "NODE_ENV=staging node server.js",
    "start:production": "NODE_ENV=production node server.js"
  }
}
```

## 🔒 **Environment Security**

### **Secret Management**
- **Development**: Use `.env.development` with non-sensitive defaults
- **Staging**: Use Railway/Vercel environment variables
- **Production**: Use Railway/Vercel environment variables with proper secrets

### **CORS Configuration**
```javascript
// Environment-aware CORS configuration
const getCorsOrigins = () => {
  switch (process.env.NODE_ENV) {
    case 'development':
      return [
        'http://localhost:4200',
        'http://localhost:3000',
        'http://localhost:3001'
      ];
    case 'staging':
      return ['https://novara-mvp-staging.vercel.app'];
    case 'production':
      return ['https://novara-mvp.vercel.app'];
    default:
      return [];
  }
};
```

### **Database Isolation**
```javascript
// Environment-aware database configuration
const getDatabaseConfig = () => {
  switch (process.env.NODE_ENV) {
    case 'development':
      return {
        type: 'sqlite',
        path: './data/novara-local.db'
      };
    case 'staging':
      return {
        type: 'airtable',
        baseId: 'appEOWvLjCn5c7Ght' // Staging base
      };
    case 'production':
      return {
        type: 'airtable',
        baseId: 'appWOsZBUfg57fKD3' // Production base
      };
  }
};
```

## 🧪 **Environment Testing**

### **Health Check Endpoints**
```bash
# Development
curl http://localhost:9002/api/health
# Expected: {"environment":"development","database":"sqlite"}

# Staging
curl https://novara-staging.up.railway.app/api/health
# Expected: {"environment":"staging","database":"airtable"}

# Production
curl https://novara-mvp-production.up.railway.app/api/health
# Expected: {"environment":"production","database":"airtable"}
```

### **Environment Validation Scripts**
```bash
# Validate development environment
./scripts/validate-dev.sh

# Validate staging environment
./scripts/validate-staging.sh

# Validate production environment
./scripts/validate-production.sh
```

## 📊 **Environment Monitoring**

### **Logging Strategy**
- **Development**: Debug-level logging with detailed information
- **Staging**: Info-level logging with key events
- **Production**: Warn/Error-level logging with minimal noise

### **Analytics Configuration**
- **Development**: Analytics disabled
- **Staging**: Analytics enabled with staging tracking
- **Production**: Analytics enabled with production tracking

### **Error Tracking**
- **Development**: Local error logging
- **Staging**: Error tracking with staging context
- **Production**: Error tracking with production context

## 🔄 **Environment Migration**

### **Database Migration Strategy**
```bash
# Development to Staging
./scripts/migrate-dev-to-staging.sh

# Staging to Production
./scripts/migrate-staging-to-production.sh

# Production Rollback
./scripts/rollback-production.sh
```

### **Configuration Migration**
```bash
# Update environment variables
./scripts/update-env-vars.sh

# Validate configuration
./scripts/validate-config.sh

# Apply configuration changes
./scripts/apply-config.sh
```

## ✅ **Best Practices Checklist**

### **Environment Isolation**
- [ ] Separate databases for each environment
- [ ] Different API keys and secrets
- [ ] Isolated deployment pipelines
- [ ] Environment-specific feature flags

### **Configuration Management**
- [ ] Environment-specific .env files
- [ ] Proper secret management
- [ ] Configuration validation
- [ ] Environment variable documentation

### **Development Workflow**
- [ ] Stable, conflict-free ports
- [ ] Hot reload and debugging tools
- [ ] Local database for development
- [ ] Easy environment switching

### **Deployment Strategy**
- [ ] Automated deployment pipelines
- [ ] Environment-specific builds
- [ ] Health checks and monitoring
- [ ] Rollback capabilities

### **Security**
- [ ] Environment-specific CORS
- [ ] Proper authentication
- [ ] Rate limiting
- [ ] Input validation

---

This multi-environment setup ensures **complete isolation**, **predictable deployments**, and **secure configuration management** across all environments. 