# Railway API Setup Guide

## Overview

This guide will help you set up Railway API access for automated deployment monitoring and tracking.

## 🔑 **Step 1: Get Railway API Token**

### **Method 1: Railway CLI (Recommended)**

1. **Install Railway CLI** (if not already installed):
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Get your API token**:
   ```bash
   railway whoami
   ```
   This will show your user ID and you can get the token from your Railway account settings.

### **Method 2: Railway Dashboard**

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Click on your profile** (top right)
3. **Go to Account Settings**
4. **Navigate to API Tokens**
5. **Create a new token** with appropriate permissions

## 🏗️ **Step 2: Get Project ID**

### **Using Railway CLI**:
```bash
# List your projects
railway projects

# Get project details (includes project ID)
railway project
```

### **Using Railway Dashboard**:
1. **Go to your project** in Railway dashboard
2. **Look at the URL**: `https://railway.app/project/[PROJECT_ID]`
3. **Copy the PROJECT_ID** from the URL

## 🔧 **Step 3: Configure Environment Variables**

Add these to your environment:

```bash
# Railway API Configuration
RAILWAY_TOKEN=your_railway_api_token_here
RAILWAY_PROJECT_ID=your_project_id_here
```

### **For Local Development**:
Add to your `.env` file:
```bash
RAILWAY_TOKEN=your_token
RAILWAY_PROJECT_ID=your_project_id
```

### **For GitHub Actions**:
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add repository secrets:
   - `RAILWAY_TOKEN`
   - `RAILWAY_PROJECT_ID`

## 🧪 **Step 4: Test the Setup**

Once you have your tokens, test the setup:

```bash
# Test Railway API access
npm run monitor:platforms

# Test deployment time tracking
npm run monitor:deployment-times
```

## 📊 **What You'll Get**

With Railway API monitoring enabled, you'll have:

- **Real-time deployment status**
- **Automatic deployment time tracking**
- **Build log monitoring**
- **Service health monitoring**
- **Automatic alerts for failures**

## 🔒 **Security Notes**

- **Keep your API token secure** - never commit it to version control
- **Use least-privilege access** - only grant necessary permissions
- **Rotate tokens regularly** - for security best practices
- **Monitor token usage** - check for unusual activity

## 🚨 **Troubleshooting**

### **Common Issues**:

1. **"Railway credentials not configured"**
   - Check that `RAILWAY_TOKEN` and `RAILWAY_PROJECT_ID` are set
   - Verify the token is valid and has proper permissions

2. **"Project not found"**
   - Verify the `RAILWAY_PROJECT_ID` is correct
   - Ensure your token has access to the project

3. **"API rate limit exceeded"**
   - Railway has rate limits on API calls
   - The monitoring system respects these limits

### **Getting Help**:

- **Railway Documentation**: https://docs.railway.app/
- **Railway Discord**: https://discord.gg/railway
- **GitHub Issues**: Create an issue in this repository

---

## ✅ **Next Steps**

Once you have your Railway API credentials:

1. **Add them to your environment**
2. **Test the monitoring system**
3. **Set up GitHub Actions secrets** (if using automated monitoring)
4. **Start tracking deployment performance**

The monitoring system will automatically start providing insights once configured! 