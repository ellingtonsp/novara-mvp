# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL RULES - READ FIRST

### NEVER Do These:
- **NEVER** commit directly to `main` or `staging` branches
- **NEVER** modify .env files directly (they are hidden from Cursor)
- **NEVER** commit secrets or API keys to git
- **NEVER** use Railway interactive commands (`railway environment`, `railway link` without parameters)
- **NEVER** break legacy functions unless explicitly requested

### ALWAYS Do These:
- **ALWAYS** create feature branches from `develop` branch: `feature/EPIC-ID-description`
- **ALWAYS** target PRs to `develop` branch (not main!)
- **ALWAYS** follow the git workflow: develop → staging → main
- **ALWAYS** update .env.example files when adding new environment variables
- **ALWAYS** run BugBot validation before and after deployments
- **ALWAYS** align work with current sprint priorities from roadmap
- **ALWAYS** use stable ports: Frontend 4200, Backend 9002
- **ALWAYS** be sure to follow safe port guidance in our documentation

### Improvement Guidelines:
- If you fail to fix a UI problem based on my feedback, rethink the approach for that element and implement a better solution

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