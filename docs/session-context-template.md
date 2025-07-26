# Session Context Template
# Copy this at the start of each new session to maintain context

## 🎯 Current Session Context

### Environment Status
- **Working Directory**: `/Users/stephen/Library/Mobile Documents/com~apple~CloudDocs/novara-mvp`
- **Current Branch**: [CHECK WITH `git branch`]
- **Railway Context**: [CHECK WITH `railway status`]
- **Target Environment**: [staging/production/development]

### Active URLs
- **Staging Frontend**: https://novara-bd6xsx1ru-novara-fertility.vercel.app
- **Staging Backend**: https://novara-staging-staging.up.railway.app
- **Production Frontend**: https://novara-mvp.vercel.app
- **Production Backend**: https://novara-mvp-production.up.railway.app

### Recent Changes
- [List recent commits/changes]
- [List any pending deployments]
- [List any known issues]

### Current Task
- [Describe what we're working on]
- [List any constraints or requirements]

## 🚨 Critical Rules to Follow

### Deployment Safety
- NEVER use `vercel --prod` for staging work
- ALWAYS verify Railway context before deployment
- ALWAYS follow Development → Staging → Production workflow
- NEVER bypass staging testing

### Context Verification
```bash
# Always run these at session start
git branch
railway status
pwd
```

### User Preferences
- Strict DevOps workflow adherence
- Comprehensive testing before production
- Explicit user approval for production changes
- Stable port strategy (4200/9002) for local development

## 📋 Session Checklist

- [ ] Verified current working directory
- [ ] Checked git branch
- [ ] Verified Railway environment/service
- [ ] Confirmed target environment
- [ ] Reviewed recent changes
- [ ] Understood current task
- [ ] Confirmed user approval for any production changes 