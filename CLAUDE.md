# CLAUDE.md

**Version:** 2.0.0  
**Last Updated:** 2025-08-02

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚡ Quick Reference
- **Ports**: Frontend: 4200, Backend: 9002
- **Database**: PostgreSQL only (no SQLite/Airtable)
- **Git Flow**: develop → staging → main
- **Hotfix**: Create from main, PR to main, backport to staging/develop
- **Before Deploy**: Run BugBot validation, test on staging, verify external services
- **Testing**: Run `npm test` locally before commits
- **Documentation**: See [GIT_WORKFLOW.md](./GIT_WORKFLOW.md) for detailed git processes

## 🚨 CRITICAL RULES - READ FIRST

### NEVER Do These:
- **NEVER** deploy features requiring external services (OAuth, APIs) without configuration
- **NEVER** modify .env files directly (they are hidden from Cursor)
- **NEVER** commit secrets or API keys to git
- **NEVER** use Railway interactive commands (`railway environment`, `railway link` without parameters) - they require interactive input which breaks automation
- **NEVER** break legacy functions unless explicitly requested

### ALWAYS Do These:
- **ALWAYS** test features in develop environment before staging
- **ALWAYS** verify external service configuration before deploying features that need them
- **ALWAYS** update .env.example files when adding new environment variables
- **ALWAYS** run BugBot validation before and after deployments
- **ALWAYS** align work with current sprint priorities from [roadmap](./docs/roadmap/)
- **ALWAYS** use ports 4200 (frontend) and 9002 (backend) exclusively

### Improvement Guidelines:
- If you fail to fix a UI problem based on my feedback, rethink the approach for that element and implement a better solution

## 🔄 Git & Deployment Rules

### Git Workflow
- **NEVER** commit directly to `main` or `staging` branches
- **NEVER** merge feature branches directly to `main` - MUST go through develop → staging → main
- **ALWAYS** create feature branches from `develop` branch: `feature/EPIC-ID-description`
- **ALWAYS** target PRs to `develop` branch (not main!)
- **ALWAYS** follow the branch flow: `develop` → `staging` → `main` (production)
- See [GIT_WORKFLOW.md](./GIT_WORKFLOW.md) for detailed git workflow

### Deployment Pipeline
- Railway deployments are handled via GitHub integration
- Vercel deployments: `staging` branch → staging env, `main` branch → production
- **ALWAYS** verify deployments complete successfully

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

## ✅ Pre-Deployment Checklist

### Before ANY Deployment
- [ ] All tests passing locally (`npm test`)
- [ ] Feature tested on develop environment
- [ ] No console errors in browser
- [ ] Database migrations tested (if applicable)
- [ ] Environment variables documented in `.env.example`
- [ ] Error handling implemented for edge cases
- [ ] BugBot validation passed
- [ ] Documentation updated (if applicable)

### Additional for Staging → Production
- [ ] Tested on staging environment for at least 24 hours
- [ ] External service configurations verified (OAuth, APIs)
- [ ] Performance impact assessed
- [ ] Rollback plan documented
- [ ] Team notified of deployment window

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
  7. Backport fix to staging and develop branches
- **Emergency Rollback**: Use git revert to undo problematic commits
- **Communication**: Alert team immediately if production issues occur

## 🧪 Testing Requirements
- **ALWAYS** run tests before committing code
- **ALWAYS** test locally on ports 4200 (frontend) and 9002 (backend)
- **NEVER** deploy untested code to staging or production
- **ALWAYS** verify no regressions in related functionality

### Testing Commands
```bash
# Unit tests
npm test

# API endpoint tests
./scripts/test-endpoints.js

# Full regression test
./scripts/test-regression.sh
```

## 🔄 Handling Merge Conflicts
- **ALWAYS** pull latest from target branch before creating new branches
- **NEVER** force push to shared branches (develop, staging, main)
- **ALWAYS** test thoroughly after resolving conflicts

### Conflict Resolution Process
1. Pull latest from target branch: `git pull origin develop`
2. Resolve conflicts locally using your preferred merge tool
3. Test all affected functionality
4. Commit with clear message: `git commit -m "resolve: merge conflicts with develop"`
5. Push resolved changes: `git push origin feature/your-branch`

## 🤖 CI/CD Integration
- GitHub Actions run automatically on all PRs
- Required checks must pass before merge is allowed
- BugBot validation runs pre and post-deployment

### Deployment Triggers
- Push to `staging` branch → Vercel staging deployment
- Push to `main` branch → Vercel production deployment
- Railway deployments triggered via GitHub integration

### BugBot Validation
BugBot is our automated validation tool that checks:
- All critical endpoints are responding
- Database connectivity is working
- External services are configured correctly
- No regression in core functionality

Run manually with: `./scripts/run-bugbot.sh`

## ⚠️ CRITICAL DATABASE INFORMATION

**ALL ENVIRONMENTS USE POSTGRESQL - NO SQLITE OR AIRTABLE**
- Local: PostgreSQL (postgresql://localhost:5432/novara_local)
- Staging: PostgreSQL (Railway)
- Production: PostgreSQL (Railway)

Never write code for SQLite or Airtable - these are deprecated and not used in any environment.

## ⚠️ CRITICAL: Before Adding New Fields

When adding new fields to any table (especially daily_checkins):
1. **Add to PostgreSQL schema** via migration script
2. **Update database schema documentation**
3. **Add to response objects** in the relevant endpoints
4. **Test the migration** in local environment first

Always test schema changes locally before deploying!

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

## 📐 Architecture Decision Records (ADR)

### Why PostgreSQL Only?
- **Decision**: All environments use PostgreSQL exclusively
- **Rationale**: Ensures consistent behavior across development, staging, and production
- **Alternatives Rejected**: SQLite (different SQL dialect), Airtable (API limitations)

### Why Ports 4200/9002?
- **Decision**: Frontend on 4200, Backend on 9002
- **Rationale**: Avoids conflicts with common development tools (React: 3000, Rails: 3000, Vue: 8080)
- **Benefits**: Consistent across all developer machines, no port conflicts

### Why Three-Branch Strategy?
- **Decision**: develop → staging → main workflow
- **Rationale**: Multiple safety gates prevent untested code reaching production
- **Benefits**: 
  - develop: Integration testing
  - staging: User acceptance testing
  - main: Production-ready code only

### Why BugBot Validation?
- **Decision**: Automated validation tool for deployments
- **Rationale**: Human error in deployment checks caused production incidents
- **Benefits**: Consistent validation, catches configuration issues early

## 🚫 Common Mistakes to Avoid

Based on past incidents:
1. **Deploying OAuth features without credentials** - Always verify external service configuration
2. **Mixing documentation and code commits** - Use separate commits for clarity
3. **Skipping develop environment** - Always test in develop before staging
4. **Using wrong ports** - Stick to 4200/9002 to avoid conflicts
5. **Force pushing to shared branches** - Never force push to develop/staging/main
6. **Ignoring test failures** - All tests must pass before deployment
7. **Forgetting to update bug documentation** - Always document bug resolutions

## 📖 Related Documentation
- [GIT_WORKFLOW.md](./GIT_WORKFLOW.md) - Detailed git workflow and branching strategy
- [/docs/roadmap/](./docs/roadmap/) - Current sprint priorities and epic planning
- [/docs/bugs/](./docs/bugs/) - Bug tracking and resolution history
- [DEPLOYMENT_ARCHITECTURE.md](./docs/DEPLOYMENT_ARCHITECTURE.md) - Infrastructure details
- [ENVIRONMENT_SETUP_GUIDE.md](./docs/ENVIRONMENT_SETUP_GUIDE.md) - Local setup instructions