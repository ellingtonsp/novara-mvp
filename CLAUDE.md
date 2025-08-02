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
- **Hotfix Process**: 
  1. Create hotfix branch from main: `hotfix/description`
  2. Fix the issue
  3. Test locally (Frontend: 4200, Backend: 9002)
  4. Deploy and test on staging environment
  5. After verification, PR directly to main
  6. Deploy to production
- **Emergency Rollback**: Use git revert to undo problematic commits
- **Communication**: Alert team immediately if production issues occur

## ⚠️ CRITICAL: Before Adding New Fields

When adding new fields to any table (especially daily_checkins):
1. **Add to PostgreSQL schema** via migration script
2. **Update database schema documentation**
3. **Add to response objects** in the relevant endpoints
4. **Test the migration** in local environment first

Always test schema changes locally before deploying!

## ⚠️ CRITICAL DATABASE INFORMATION

**ALL ENVIRONMENTS USE POSTGRESQL - NO SQLITE OR AIRTABLE**
- Local: PostgreSQL (postgresql://localhost:5432/novara_local)
- Staging: PostgreSQL (Railway)
- Production: PostgreSQL (Railway)

Never write code for SQLite or Airtable - these are deprecated and not used in any environment.

## Common Development Commands

### Local Development (PostgreSQL + Stable Ports)
```bash
# Start development with PostgreSQL (matching staging/production)
./scripts/start-local.sh

# This runs:
# - Backend on port 9002 with PostgreSQL (same as staging/prod)
# - Frontend on port 4200
# - Database: postgresql://localhost:5432/novara_local
# - True environment parity with PostgreSQL!
```

## Git Workflow & Deployment Notes
- Follow the branch flow: `develop` → `staging` → `main` (production)
- Create all feature branches from `develop`
- See GIT_WORKFLOW.md for detailed git workflow
- Railway deployments are handled via GitHub
- Vercel deployments: `staging` branch → staging env, `main` branch → production

### 📚 Documentation Fast-Track Workflow
Documentation changes can be fast-tracked to production:
1. **Separate commits**: Never mix documentation and code changes
2. **Use prefix**: Start documentation commits with `docs:`
3. **Automatic handling**: GitHub Actions will detect docs-only PRs
4. **Fast deployment**: Documentation can skip staging if needed

#### Documentation Commit Guidelines:
```bash
# ✅ Good - documentation only
git add docs/ *.md
git commit -m "docs: update deployment guide"

# ❌ Bad - mixed commit
git add docs/ backend/
git commit -m "update docs and fix API"
```

The pre-commit hook will prevent mixed commits automatically.

## Bug Handling Process

When fixing bugs, follow this systematic approach:

### 1. Investigation Phase
- Read the bug file in `/docs/bugs/BUG-XXX-*.md` for full context
- Test locally to reproduce the issue
- Identify root cause before implementing fixes
- Consider architectural solutions over quick patches

### 2. Implementation Phase
- Create clean, maintainable fixes
- Test thoroughly in local environment (Frontend: 4200, Backend: 9002)
- Ensure no regression in related functionality
- Get user confirmation that the bug is actually fixed

### 3. Documentation Phase (REQUIRED)
After confirming a bug is fixed, ALWAYS update documentation:

1. **Update the individual bug file** (`/docs/bugs/BUG-XXX-*.md`):
   - Change Status from "🔄 Open" to "✅ Resolved"
   - Add Resolution section with:
     - Date resolved
     - Solution summary
     - Technical details of the fix
     - List of files modified
   
2. **Update the main tracking file** (`/docs/bugs/README.md`):
   - Update bug counts in the status table
   - Add the bug to the appropriate "Resolved" section
   - Include a brief summary with the fix approach

### 4. Bug Priority Levels
- **🔴 Large**: User-blocking, data loss, security issues
- **🟡 Medium**: Feature degradation, UX friction
- **🟢 Small**: Visual polish, minor improvements

## Backend and Data Handling Rules
- All forms require true backend endpoints
- Never default to localStorage and if localStorage might be best, confirm first
- Critical app data for insights must only be stored in the database

## 🔧 Troubleshooting Common Issues

### Express Route Ordering (501 Not Implemented Error)
**Problem**: Getting 501 errors when calling endpoints that should exist
**Root Cause**: Express route ordering - parameterized routes (`:id`) must come AFTER specific routes
**Solution**: Always define specific routes before parameterized routes

```javascript
// ❌ WRONG - Will cause 501 errors
router.get('/:checkinId', handler);  // This catches ALL requests
router.get('/last-values', handler);  // Never reached!
router.get('/questions', handler);    // Never reached!

// ✅ CORRECT - Specific routes first
router.get('/last-values', handler);  // Specific route
router.get('/questions', handler);    // Specific route
router.get('/:checkinId', handler);  // Parameterized route last
```

### Rate Limiting Issues ("Too Many Requests")
**Problem**: Production returns 429 "Too many requests" errors
**Root Cause**: Mismatched rate limits between legacy and refactored servers
**Solution**: Ensure rate limits match across all environments

```javascript
// config/index.js
rateLimiting: {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: process.env.NODE_ENV === 'production' ? 500 : 100, // Match legacy
}
```

### Missing Endpoints After Refactor
**Problem**: Frontend calls fail with 404 after switching to refactored server
**Root Cause**: Endpoints not implemented in refactored server
**Solution**: Implement all endpoints used by frontend before switching servers

Required endpoints checklist:
- [ ] GET /api/checkins/last-values
- [ ] GET /api/checkins/questions
- [ ] POST /api/daily-checkin-enhanced
- [ ] PUT /api/checkins/:checkinId (critical for updates)
- [ ] GET /api/users/profile
- [ ] PATCH /api/users/cycle-stage
- [ ] PATCH /api/users/medication-status

### Testing Before Production Deployment
Always run these checks before deploying:
```bash
# 1. Run endpoint tests
cd backend && npm run test:endpoints

# 2. Verify refactored server starts
./scripts/verify-refactored-server.sh

# 3. Test all endpoints on staging
./scripts/test-staging-endpoints.js

# 4. Run pre-deployment checks
./scripts/pre-deployment-final-check.sh
```