# Deployment Monitoring Guide

## Overview

Novara MVP now includes comprehensive, proactive deployment monitoring that automatically detects and alerts on build failures, deployment issues, and service outages across all environments.

## 🚨 **What Gets Monitored**

### **1. Environment Health**
- **Staging Environment**
  - Backend: `https://novara-staging-staging.up.railway.app`
  - Frontend: `https://novara-mvp-git-staging-novara-fertility.vercel.app`
- **Production Environment**
  - Backend: `https://novara-production-production.up.railway.app`
  - Frontend: `https://novara-mvp.vercel.app`

### **2. Endpoint Monitoring**
- `/api/health` - Basic health check
- `/api/checkins/questions` - Daily check-in questions
- `/api/insights/daily` - Daily insights generation

### **3. Platform-Specific Monitoring**
- **Railway**: Deployment status, build logs, service health
- **Vercel**: Deployment status, build failures, preview deployments

## 🔧 **Monitoring Components**

### **1. Deployment Health Monitor**
**File**: `scripts/deployment-monitor.js`

Monitors application endpoints and frontend availability:
- Checks all health endpoints every 5 minutes
- Detects 401/404/500 errors automatically
- Alerts on environment failures
- Logs all monitoring activity

### **2. Platform Monitor**
**File**: `scripts/platform-monitor.js`

Monitors Railway and Vercel deployment status:
- Tracks deployment success/failure rates
- Monitors build logs for errors
- Alerts on platform-specific issues
- Requires API tokens for full functionality

### **3. GitHub Actions Workflow**
**File**: `.github/workflows/deployment-monitor.yml`

Automated monitoring that runs every 5 minutes:
- Triggers on schedule and manual dispatch
- Creates GitHub issues for failures
- Uploads monitoring logs as artifacts
- Supports Slack notifications (if configured)

## 📊 **Monitoring Commands**

### **Manual Monitoring**
```bash
# Check deployment health once
npm run monitor:deployments

# Check platform status once
npm run monitor:platforms

# Run all monitoring checks
npm run monitor:all

# Start continuous monitoring
npm run monitor:deployments:continuous
```

### **Performance Monitoring**
```bash
# Run performance tests
npm run performance

# Environment-specific performance
npm run performance:staging
npm run performance:production
```

## 🚨 **Alert Types**

### **Environment Alerts**
- `environment_down` - Entire environment is unhealthy
- `endpoint_failure` - Specific endpoint is failing
- `railway_deployment_failure` - Railway deployment failed
- `vercel_deployment_failure` - Vercel deployment failed

### **Alert Details**
Each alert includes:
- Timestamp of detection
- Specific error messages
- HTTP status codes
- Affected endpoints/services
- Deployment IDs (for platform alerts)

## 📋 **Setup Instructions**

### **1. Environment Variables**

Add these to your environment for platform monitoring:

```bash
# Railway API (optional - for detailed monitoring)
RAILWAY_TOKEN=your_railway_api_token
RAILWAY_PROJECT_ID=your_railway_project_id

# Vercel API (optional - for detailed monitoring)
VERCEL_TOKEN=your_vercel_api_token
VERCEL_TEAM_ID=your_vercel_team_id

# Slack notifications (optional)
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

### **2. GitHub Repository Settings**

Enable GitHub Actions:
1. Go to repository Settings → Actions → General
2. Enable "Allow all actions and reusable workflows"
3. Enable "Read and write permissions" for workflows

### **3. Monitoring Schedule**

The monitoring runs automatically:
- **Every 5 minutes**: GitHub Actions workflow
- **On every push**: To main/staging branches
- **Manual trigger**: Via GitHub Actions UI

## 📈 **Monitoring Dashboard**

### **Log Files**
- `logs/deployment-monitor.log` - Deployment health logs
- `logs/platform-monitor.log` - Platform-specific logs
- `logs/deployment-status.json` - Current status snapshot
- `logs/platform-status.json` - Platform status snapshot

### **GitHub Actions Artifacts**
- `deployment-monitor-logs` - Uploaded every run
- `deployment-status.md` - Status summary

## 🔍 **Troubleshooting**

### **Common Issues**

#### **401 Unauthorized Errors**
- Check JWT token configuration
- Verify environment variables
- Review authentication middleware

#### **404 Not Found Errors**
- Verify endpoint routes exist
- Check deployment status
- Review server configuration

#### **Platform API Errors**
- Verify API tokens are valid
- Check API rate limits
- Review platform-specific settings

### **Debugging Commands**
```bash
# Check current deployment status
cat logs/deployment-status.json

# View recent monitoring logs
tail -f logs/deployment-monitor.log

# Test specific endpoint
curl -v https://novara-staging-staging.up.railway.app/api/health
```

## 🎯 **Best Practices**

### **1. Response Time Monitoring**
- Monitor for response times > 5 seconds
- Alert on consecutive slow responses
- Track performance trends

### **2. Error Rate Monitoring**
- Alert when error rate > 5%
- Monitor for specific error patterns
- Track error frequency over time

### **3. Deployment Health**
- Verify deployments complete successfully
- Monitor build times
- Alert on failed deployments

### **4. Environment Consistency**
- Ensure staging and production are similar
- Monitor for configuration drift
- Alert on environment differences

## 📱 **Notification Integration**

### **Current Notifications**
- **Console output** - Immediate feedback
- **GitHub Issues** - Tracked problems
- **Log files** - Historical record

### **Future Integrations**
- **Slack notifications** - Team alerts
- **Email notifications** - Critical issues
- **SMS alerts** - Emergency situations
- **Discord webhooks** - Community alerts

## 🔄 **Continuous Improvement**

### **Monitoring Metrics**
- **Uptime percentage** - Track availability
- **Response time trends** - Performance monitoring
- **Error rate trends** - Quality monitoring
- **Deployment success rate** - Reliability monitoring

### **Alert Optimization**
- **Reduce false positives** - Fine-tune thresholds
- **Improve alert relevance** - Better categorization
- **Enhance notification channels** - More options

## 🛡️ **Security Considerations**

### **API Token Security**
- Store tokens securely in environment variables
- Rotate tokens regularly
- Use least-privilege access

### **Log Security**
- Don't log sensitive information
- Secure log file access
- Regular log rotation

### **Monitoring Security**
- Secure monitoring endpoints
- Validate monitoring requests
- Rate limit monitoring access

---

## 📞 **Support**

If you encounter issues with the monitoring system:

1. **Check the logs** - Review recent monitoring logs
2. **Verify configuration** - Ensure environment variables are set
3. **Test manually** - Run monitoring commands manually
4. **Review GitHub Actions** - Check workflow execution
5. **Contact support** - Create an issue with monitoring logs

The monitoring system is designed to be self-healing and provide comprehensive visibility into your deployment health! 