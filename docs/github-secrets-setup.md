# GitHub Secrets Setup for Railway Monitoring

## Overview

This guide will help you set up the required GitHub secrets for the Railway deployment monitoring system to work properly.

## 🔑 **Required Secrets**

You need to add these secrets to your GitHub repository:

### **1. RAILWAY_TOKEN**
- **Value**: `e3fe9d3a-1b89-483c-aa75-477da8ef6a2f`
- **Purpose**: Allows GitHub Actions to access Railway API
- **Security**: Keep this token secure and rotate regularly

### **2. RAILWAY_PROJECT_ID**
- **Value**: `f3025bf5-5cd5-4b7b-b045-4d477a4c7835`
- **Purpose**: Identifies your specific Railway project
- **Note**: This is your Novara MVP project ID

### **3. SLACK_WEBHOOK_URL** (Optional)
- **Value**: Your Slack webhook URL
- **Purpose**: Sends notifications to Slack channel
- **Setup**: Create a Slack app and webhook for #deployments channel

## 📋 **Step-by-Step Setup**

### **Step 1: Navigate to Repository Secrets**
1. Go to your GitHub repository: https://github.com/ellingtonsp/novara-mvp
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables**
4. Click **Actions**

### **Step 2: Add RAILWAY_TOKEN**
1. Click **New repository secret**
2. **Name**: `RAILWAY_TOKEN`
3. **Value**: `e3fe9d3a-1b89-483c-aa75-477da8ef6a2f`
4. Click **Add secret**

### **Step 3: Add RAILWAY_PROJECT_ID**
1. Click **New repository secret**
2. **Name**: `RAILWAY_PROJECT_ID`
3. **Value**: `f3025bf5-5cd5-4b7b-b045-4d477a4c7835`
4. Click **Add secret**

### **Step 4: Add SLACK_WEBHOOK_URL (Optional)**
1. Click **New repository secret**
2. **Name**: `SLACK_WEBHOOK_URL`
3. **Value**: Your Slack webhook URL
4. Click **Add secret**

## 🔍 **Verification Steps**

### **Test the Setup**
1. Go to **Actions** tab in your repository
2. Find the **Railway Deployment Monitor** workflow
3. Click **Run workflow** to test manually
4. Check that the workflow runs successfully

### **Expected Results**
- ✅ Workflow runs without errors
- ✅ Railway monitoring script executes
- ✅ Health checks complete successfully
- ✅ No authentication errors

## 🚨 **Troubleshooting**

### **Common Issues**

**1. "Railway credentials not configured"**
- Check that `RAILWAY_TOKEN` and `RAILWAY_PROJECT_ID` are set correctly
- Verify the token has proper permissions

**2. "Invalid project ID"**
- Confirm the `RAILWAY_PROJECT_ID` matches your project
- Check that the token has access to this project

**3. "Workflow fails immediately"**
- Check GitHub Actions logs for specific error messages
- Verify all required secrets are present

### **Security Best Practices**

1. **Rotate tokens regularly** - Update Railway tokens every 90 days
2. **Use least privilege** - Only grant necessary permissions
3. **Monitor usage** - Check for unusual activity
4. **Keep secrets secure** - Never commit secrets to code

## 📊 **What You'll Get**

Once configured, you'll have:

- **Automated monitoring** every 5 minutes during active hours
- **Immediate alerts** for deployment failures
- **GitHub issues** created automatically on failures
- **Health check validation** for all environments
- **Slack notifications** (if configured)

## 🔄 **Maintenance**

### **Regular Tasks**
- **Monthly**: Review and rotate Railway tokens
- **Weekly**: Check GitHub Actions logs for issues
- **Daily**: Monitor for deployment failures

### **Updates**
- Keep monitoring scripts updated
- Review and update alert thresholds
- Monitor for new Railway API changes

---

## ✅ **Next Steps**

1. **Add the secrets** using the steps above
2. **Test the workflow** manually
3. **Monitor the Actions tab** for successful runs
4. **Set up Slack notifications** (optional)

Your Railway deployment monitoring will be fully operational once these secrets are configured! 