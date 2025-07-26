# Novara MVP - Unified Deployment System v2.0

## 🚀 Overview

The new unified deployment system provides consistent, reliable deployments across all environments with comprehensive error handling, automatic rollback capabilities, and real-time monitoring.

## ✨ Key Features

- **Single Source of Truth**: All deployment configuration in one place
- **Self-contained**: Automatically installs dependencies and handles setup
- **Zero Manual Intervention**: Non-interactive deployments that work first time, every time
- **Comprehensive Logging**: Full audit trail with structured logging
- **Automatic Health Checks**: Built-in validation and monitoring
- **Rollback Support**: Quick rollback to last known good state
- **Environment Isolation**: Proper separation between development, staging, and production

## 🏗️ Architecture

```
┌─────────────────────┐
│ Unified Scripts     │
│ - deploy.sh         │
│ - rollback.sh       │
└─────────────────────┘
            │
            ▼
┌─────────────────────┐
│ Orchestrators       │
│ - deploy-orchestrator.js
│ - rollback.js       │
└─────────────────────┘
            │
            ▼
┌─────────────────────┐
│ Configuration       │
│ - deployment-config.js
│ - environment URLs  │
│ - platform settings │
└─────────────────────┘
            │
            ▼
┌─────────────────────┐
│ Platforms           │
│ - Railway (backend) │
│ - Vercel (frontend) │
│ - Local (development)
└─────────────────────┘
```

## 🔧 Core Components

### 1. Unified Configuration (`scripts/deployment-config.js`)

Single source of truth containing:
- Environment definitions (development, staging, production)
- Platform configurations (Railway, Vercel)
- Health check settings
- Deployment sequences
- Required tools and dependencies

### 2. Deployment Orchestrator (`scripts/deploy-orchestrator.js`)

Main deployment engine that:
- Validates prerequisites and configuration
- Handles platform-specific deployments
- Manages deployment state and logging
- Performs health checks and verification
- Provides rollback information

### 3. Rollback System (`scripts/rollback.js`)

Comprehensive rollback capabilities:
- Discovers recent deployment states
- Identifies last successful deployment
- Performs platform-specific rollbacks
- Verifies rollback success

### 4. Monitoring System (`scripts/deployment-monitor.js`)

Continuous monitoring that:
- Checks environment health every 30 minutes
- Alerts on deployment failures
- Tracks deployment status over time
- Integrates with GitHub Actions

## 📋 Usage

### Simple Deployment Commands

```bash
# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production (requires --force)
./scripts/deploy.sh production --force

# Dry run (validate without deploying)
./scripts/deploy.sh staging --dry-run

# Verbose logging
./scripts/deploy.sh staging --verbose
```

### Direct Orchestrator Usage

```bash
# Using Node.js directly
node scripts/deploy-orchestrator.js staging
node scripts/deploy-orchestrator.js production --force

# Check deployment status
node scripts/deployment-monitor.js --once
```

### Rollback Commands

```bash
# Rollback staging to last good state
node scripts/rollback.js staging

# Rollback production (requires --force)
node scripts/rollback.js production --force
```

## 🌍 Environment Configuration

### Development Environment
- **Frontend**: http://localhost:4200
- **Backend**: http://localhost:9002
- **Database**: Local SQLite
- **Platform**: Local processes

### Staging Environment
- **Frontend**: https://novara-mvp-staging.vercel.app
- **Backend**: https://novara-staging.up.railway.app
- **Database**: Staging Airtable (appEOWvLjCn5c7Ght)
- **Platforms**: Railway + Vercel

### Production Environment
- **Frontend**: https://novara-mvp.vercel.app
- **Backend**: https://novara-mvp-production.up.railway.app
- **Database**: Production Airtable (app5QWCcVbCnVg2Gg)
- **Platforms**: Railway + Vercel

## 🔒 Safety Features

### Production Safeguards
- Requires `--force` flag for production deployments
- Confirmation prompts for destructive operations
- Automatic staging environment validation
- Pre-deployment health checks

### Error Handling
- Comprehensive error logging
- Automatic retry mechanisms
- Graceful failure handling
- Detailed debugging information

### State Tracking
- Full deployment state saved to JSON files
- Rollback information preserved
- Deployment history maintained
- Audit trail for all operations

## 📊 Logging and Monitoring

### Log Files Location
All logs stored in `scripts/logs/`:
- `deployment-{environment}-{timestamp}.log`
- `rollback-{environment}-{timestamp}.log`
- `deployment-monitor.log`
- `deployment-status.json`

### GitHub Actions Integration
- Automatic health monitoring every 30 minutes
- Deployment alerts on failures
- Log artifact uploads
- Status reporting

## 🧪 Testing and Validation

### Pre-deployment Checks
- Prerequisites validation (Node.js, CLI tools)
- Configuration validation
- Environment file creation
- Platform connectivity tests

### Post-deployment Validation
- Health endpoint checks with retries
- Service warmup periods
- Response code validation
- End-to-end connectivity tests

### Rollback Verification
- Deployment state discovery
- Last successful deployment identification
- Platform-specific rollback execution
- Health check verification

## 🚨 Troubleshooting

### Common Issues

#### 1. CLI Tools Missing
**Error**: `railway command not found`
**Solution**: Tools are auto-installed, but ensure npm has global install permissions

#### 2. Authentication Failures
**Error**: `Authentication failed for platform`
**Solution**: Ensure environment variables are set (RAILWAY_TOKEN, VERCEL_TOKEN)

#### 3. Health Check Failures
**Error**: `Health check failed after 3 attempts`
**Solution**: Check deployment logs, verify environment variables, ensure services are properly deployed

#### 4. Rollback Failures
**Error**: `No successful deployment found in history`
**Solution**: Ensure previous deployments completed successfully, check deployment state files

### Debug Commands

```bash
# Verbose deployment with all logging
./scripts/deploy.sh staging --verbose

# Check deployment configuration
node scripts/deployment-config.js

# Manual health check
node scripts/deployment-monitor.js --once

# View recent deployment states
ls -la scripts/logs/deployment-state-*
```

### Log Analysis

```bash
# View latest deployment log
tail -f scripts/logs/deployment-staging-*.log

# Check deployment status
cat scripts/logs/deployment-status.json | jq '.'

# Search for errors
grep -i "error" scripts/logs/deployment-*.log
```

## 🔄 Migration from Legacy Scripts

### Deprecated Scripts
The following scripts are deprecated and redirect to the new system:
- `scripts/deploy/deploy-production.sh` → `scripts/deploy.sh production --force`
- `scripts/deploy/deploy-staging.sh` → `scripts/deploy.sh staging`

### Migration Steps
1. Update CI/CD pipelines to use new commands
2. Update deployment documentation
3. Train team on new commands
4. Remove deprecated scripts after transition period

## 🎯 Best Practices

### Development Workflow
1. Test changes locally first
2. Deploy to staging for validation
3. Run comprehensive tests
4. Deploy to production with `--force`
5. Monitor deployment health

### Production Deployments
1. Always test in staging first
2. Use `--force` flag explicitly
3. Monitor logs during deployment
4. Verify health checks pass
5. Have rollback plan ready

### Monitoring
1. Check GitHub Actions for alerts
2. Review deployment logs regularly
3. Monitor application health endpoints
4. Set up alerts for critical failures

## 📈 Performance Metrics

### Deployment Times
- **Staging**: ~2-3 minutes average
- **Production**: ~3-4 minutes average
- **Health Checks**: ~45 seconds warmup + validation

### Success Rates
- **Target**: >95% first-time success rate
- **Rollback Time**: <5 minutes to previous state
- **Recovery Time**: <10 minutes for critical failures

## 🔮 Future Enhancements

### Planned Features
- Blue-green deployment support
- Canary deployment strategies
- Advanced monitoring integrations
- Database migration handling
- Multi-region deployment support

### Monitoring Integrations
- Slack notifications
- Email alerts
- SMS alerts for critical failures
- Integration with existing monitoring tools

---

## Quick Reference

### Essential Commands
```bash
# Deploy staging
./scripts/deploy.sh staging

# Deploy production
./scripts/deploy.sh production --force

# Rollback staging
node scripts/rollback.js staging

# Check health
node scripts/deployment-monitor.js --once
```

### Key Files
- **Configuration**: `scripts/deployment-config.js`
- **Main Deployer**: `scripts/deploy-orchestrator.js`
- **Rollback**: `scripts/rollback.js`
- **Monitoring**: `scripts/deployment-monitor.js`
- **Logs**: `scripts/logs/`

### Support
For issues with the deployment system:
1. Check this documentation
2. Review deployment logs
3. Run health checks
4. Contact the development team

---

*This deployment system is designed to eliminate the pain points of manual deployments and provide a reliable, consistent experience across all environments.* 