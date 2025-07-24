# 🛡️ GitHub Branch Protection Setup Guide

## Overview

This guide walks you through setting up branch protection rules for your Novara MVP repository to ensure code quality and prevent accidental changes to important branches.

## 🎯 **Protected Branches Strategy**

| Branch | Purpose | Protection Level | Approvals Required |
|--------|---------|------------------|-------------------|
| `main` | Production | High | 2 |
| `staging` | Staging Environment | Medium | 1 |
| `develop` | Development | Low | 1 (optional) |

## 📋 **Step-by-Step Setup**

### **Step 1: Access Repository Settings**

1. Navigate to: `https://github.com/ellingtonsp/novara-mvp`
2. Click **Settings** tab
3. In left sidebar, click **Branches**

### **Step 2: Protect Main Branch**

1. Click **Add rule**
2. **Branch name pattern**: `main`
3. Click **Create**

#### **Main Branch Protection Settings:**

```
✅ Require a pull request before merging
   ✅ Require approvals: 2
   ✅ Dismiss stale PR approvals when new commits are pushed
   ✅ Require review from code owners

✅ Require status checks to pass before merging
   ✅ Require branches to be up to date before merging
   ✅ Status checks that are required: (leave empty for now)

✅ Require conversation resolution before merging

✅ Require signed commits

✅ Require linear history

✅ Restrict pushes that create files that override the protection rules

✅ Restrict deletions

✅ Allow force pushes: ❌ (unchecked)
```

### **Step 3: Protect Staging Branch**

1. Click **Add rule**
2. **Branch name pattern**: `staging`
3. Click **Create**

#### **Staging Branch Protection Settings:**

```
✅ Require a pull request before merging
   ✅ Require approvals: 1
   ✅ Dismiss stale PR approvals when new commits are pushed

✅ Require status checks to pass before merging
   ✅ Require branches to be up to date before merging

✅ Restrict pushes that create files that override the protection rules

✅ Restrict deletions

✅ Allow force pushes: ✅ (checked - for staging flexibility)
```

### **Step 4: Create Staging Branch (if not exists)**

```bash
# Create and push staging branch
git checkout -b staging
git push origin staging
```

## 🔧 **Workflow Integration**

### **Development Workflow:**

```bash
# 1. Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/new-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push feature branch
git push origin feature/new-feature

# 4. Create Pull Request
# Go to GitHub and create PR: feature/new-feature → main
```

### **Staging Deployment Workflow:**

```bash
# 1. Create staging branch from main
git checkout main
git pull origin main
git checkout -b staging-update

# 2. Make staging-specific changes
# (environment variables, configuration)

# 3. Push and create PR
git push origin staging-update
# Create PR: staging-update → staging
```

## 🚨 **Emergency Override (Admin Only)**

If you need to bypass protection rules:

1. Go to repository **Settings** → **Branches**
2. Find the branch rule
3. Click **Edit**
4. Temporarily uncheck protection rules
5. Make your changes
6. Re-enable protection rules

## 📊 **Status Checks Integration**

### **Recommended Status Checks:**

1. **Build Status**: Vercel/Railway deployment checks
2. **Test Status**: Automated test results
3. **Lint Status**: Code quality checks
4. **Security Scans**: Vulnerability checks

### **Setting Up Status Checks:**

1. In branch protection rule
2. Check "Require status checks to pass before merging"
3. Add status checks:
   - `vercel-production` (for main)
   - `vercel-staging` (for staging)
   - `railway-deployment`

## 🔒 **Code Owners Setup**

Create `.github/CODEOWNERS` file:

```
# Global code owners
* @ellingtonsp

# Frontend specific
/frontend/ @ellingtonsp

# Backend specific  
/backend/ @ellingtonsp

# Documentation
/docs/ @ellingtonsp
```

## 🎯 **Best Practices**

### **Do's:**
- ✅ Always require PR reviews for main/staging
- ✅ Use descriptive commit messages
- ✅ Keep branches up to date
- ✅ Test in staging before main
- ✅ Use conventional commit format

### **Don'ts:**
- ❌ Force push to protected branches
- ❌ Merge without reviews
- ❌ Skip staging environment
- ❌ Use generic commit messages

## 🚀 **Automated Workflows**

### **GitHub Actions Integration:**

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging
on:
  pull_request:
    branches: [staging]
    types: [closed]

jobs:
  deploy:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Staging
        run: |
          # Your deployment commands
```

## 📈 **Monitoring & Alerts**

### **Branch Protection Alerts:**

1. **Failed Status Checks**: GitHub will block merges
2. **Outdated Branches**: Require updates before merge
3. **Missing Reviews**: Block until approved
4. **Force Push Attempts**: Logged and potentially blocked

### **Recommended Notifications:**

- Email notifications for failed checks
- Slack/Discord integration for team alerts
- Weekly branch protection reports

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **"Branch is out of date"**
   - Solution: Update branch with `git pull origin main`

2. **"Required status checks are not passing"**
   - Solution: Fix failing tests/checks

3. **"No reviews from code owners"**
   - Solution: Request review from code owners

4. **"Force push blocked"**
   - Solution: Use regular push or temporarily disable protection

## 📚 **Additional Resources**

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**Next Steps:**
1. Set up branch protection rules
2. Create staging branch
3. Configure status checks
4. Set up code owners
5. Test the workflow with a sample PR 