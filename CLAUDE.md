# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL RULES - READ FIRST

### NEVER Do These:
- **NEVER** commit directly to `main` or `staging` branches
- **NEVER** merge feature branches directly to `main` - MUST go through develop → staging → main
- **NEVER** deploy features requiring external services (OAuth, APIs) without configuration
- **NEVER** modify .env files directly (they are hidden from Cursor)
- **NEVER** commit secrets or API keys to git
- **NEVER** use Railway interactive commands (`railway environment`, `railway link` without parameters)
- **NEVER** break legacy functions unless explicitly requested

### ALWAYS Do These:
- **ALWAYS** create feature branches from `develop` branch: `feature/EPIC-ID-description`
- **ALWAYS** target PRs to `develop` branch (not main!)
- **ALWAYS** follow the git workflow: develop → staging → main
- **ALWAYS** test features in develop environment before staging
- **ALWAYS** verify external service configuration before deploying features that need them
- **ALWAYS** update .env.example files when adding new environment variables
- **ALWAYS** run BugBot validation before and after deployments
- **ALWAYS** align work with current sprint priorities from roadmap
- **ALWAYS** use stable ports: Frontend 4200, Backend 9002
- **ALWAYS** be sure to follow safe port guidance in our documentation

### Improvement Guidelines:
- If you fail to fix a UI problem based on my feedback, rethink the approach for that element and implement a better solution

## 🔥 INCIDENT PREVENTION - Lessons from Social Login Deployment

### Pre-Deployment Checklist for New Features:
1. **External Services Check**
   - Does the feature require OAuth providers? (Apple, Google, etc.)
   - Does it need API keys or external service configuration?
   - Are all required credentials configured in staging AND production?
   - Is there graceful degradation if services are unavailable?

2. **Feature Readiness Verification**
   - Has the feature been tested in develop environment?
   - Are all UI components working without errors?
   - Have you verified the feature works end-to-end?
   - Is there proper error handling for all edge cases?

3. **Git Workflow Compliance**
   - Did you create the feature branch from `develop`?
   - Is your PR targeting `develop` (not main or staging)?
   - Has the feature been merged to develop and tested there first?
   - Only after develop testing: develop → staging → main

4. **Configuration Management**
   - Are feature flags in place to disable incomplete features?
   - Can the feature be toggled off without code changes?
   - Have you documented all required environment variables?

### When Things Go Wrong:
- **Hotfix Process**: Create branch from main, fix issue, PR directly to main
- **Emergency Rollback**: Use git revert to undo problematic commits
- **Communication**: Alert team immediately if production issues occur

## ⚠️ CRITICAL: Before Adding New Fields

When adding new fields to any table (especially daily_checkins):
1. **Add to Airtable** in both staging and production
2. **Add to PRODUCTION_AIRTABLE_SCHEMA** in backend/server.js
3. **Add to response objects** in the relevant endpoints
4. **Run pre-deployment check**: `node backend/scripts/pre-deployment-check.js`

Missing step 2 will cause silent failures - fields won't save!

## Common Development Commands

### Local Development (Stable Ports)
```bash
# Start stable development environment (Frontend: 4200, Backend: 9002)
./scripts/start-dev-stable.sh

# Or manually:
cd backend && npm run local  # Backend on port 9002
cd frontend && npm run dev   # Frontend on port 4200
```

## Git Workflow & Deployment Notes
- Follow the branch flow: `develop` → `staging` → `main` (production)
- Create all feature branches from `develop`
- See GIT_WORKFLOW.md for detailed git workflow
- Railway deployments are handled via GitHub
- Vercel deployments: `staging` branch → staging env, `main` branch → production

## Backend and Data Handling Rules
- All forms require true backend endpoints
- Never default to localStorage and if localStorage might be best, confirm first
- Critical app data for insights must only be stored in the database