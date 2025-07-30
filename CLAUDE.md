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
- **ALWAYS** create feature branches for ALL changes: `feature/EPIC-ID-description`
- **ALWAYS** update .env.example files when adding new environment variables
- **ALWAYS** run BugBot validation before and after deployments
- **ALWAYS** align work with current sprint priorities from roadmap
- **ALWAYS** use stable ports: Frontend 4200, Backend 9002
- **ALWAYS** be sure to follow safe port guidance in our documentation

### Improvement Guidelines:
- If you fail to fix a UI problem based on my feedback, rethink the approach for that element and implement a better solution

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

## Deployment Notes
- Railway deployments are handled via GitHub