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

## Common Development Commands

### Local Development (Stable Ports)
```bash
# Start stable development environment (Frontend: 4200, Backend: 9002)
./scripts/start-dev-stable.sh

# Or manually:
cd backend && npm run local  # Backend on port 9002
cd frontend && npm run dev   # Frontend on port 4200
```

### Testing Commands
```bash
# Run quick test suite (non-hanging, ~10s)
npm test
npm run test:fast          # ~7s

# Run comprehensive tests
npm run test:full           # All tests
npm run test:frontend       # Frontend only
npm run test:backend        # Backend only
npm run test:coverage       # With coverage

# Run single test
cd frontend && npm test -- path/to/test.test.tsx
cd backend && npm test -- path/to/test.test.js

# A/B Testing Validation (MANDATORY for split testing features)
node test-AB-distribution-validation.js  # Verify 50/50 split
node test-path-A-validation.js          # Test path A
node test-path-B-validation.js          # Test path B
node test-AB-end-to-end.js             # Full journey test
node test-AB-analytics.js              # Analytics validation
```

### Validation & Health Checks
```bash
# Pre-development validation
npm run bugbot:local        # Check environment before development
npm run health-check        # Run health checks for all environments

# Pre-deployment validation
npm run bugbot:pre-deploy   # Comprehensive pre-deploy checks
npm run pre-deploy         # Validate environments, schema, and health

# Post-deployment validation
npm run bugbot:post-deploy  # Verify deployment success
```

### Build Commands
```bash
# Frontend builds
cd frontend
npm run build              # Production build
npm run build:staging      # Staging build
npx tsc --noEmit          # TypeScript type checking

# Lint
cd frontend && npm run lint
```

### Deployment Commands
```bash
# Railway Backend Deployment (MANDATORY METHOD)
# Deployments are handled automatically via GitHub Actions
# DO NOT use railway CLI commands - they cause build issues

# To deploy: Push to appropriate branch
git push origin main           # Triggers production deployment via GitHub Actions
git push origin staging        # Triggers staging deployment via GitHub Actions

# Manual deployment troubleshooting only:
# Check GitHub Actions status in repository
# Retrigger failed deployments through GitHub interface

# Deployment validation
npm run pre-deploy         # Run before deployment
npm run bugbot:post-deploy staging|production  # Run after deployment
```

## High-Level Architecture

### Project Structure
- **Monorepo** with separate frontend and backend directories
- **Frontend**: React 19 + TypeScript + Vite, deployed to Vercel
- **Backend**: Node.js 20 + Express, deployed to Railway
- **Database**: SQLite (local), Airtable (staging/production)

### Core Application Flow
1. **User Registration**: 5-step onboarding survey with A/B testing
2. **Authentication**: JWT-based with automatic token refresh
3. **Daily Check-ins**: Mood tracking with confidence sliders
4. **AI Insights**: Personalized support messages based on user state
5. **Analytics**: PostHog event tracking throughout user journey

### Key Architectural Patterns

#### Frontend Architecture
- **Component Structure**: Feature-based organization in `src/components/`
- **State Management**: React Context (AuthContext) for global state
- **API Integration**: Custom fetch wrapper with interceptors in `src/lib/api.ts`
- **PWA Support**: Service worker with offline capabilities
- **A/B Testing**: Session-based split testing with PostHog tracking

#### Backend Architecture
- **Middleware Stack**: Security → Validation → Performance → Business Logic
- **Database Adapters**: Polymorphic design supporting SQLite and Airtable
- **Error Handling**: Centralized error middleware with Sentry integration
- **Caching**: Redis-backed caching for performance optimization
- **API Design**: RESTful endpoints with Joi validation

### Environment Configuration
- **Never modify .env files directly** - they are hidden from Cursor
- **Always update .env.example files** with new variables
- **Environment hierarchy**: development → staging → stable → production
- **Database IDs**: 
  - Staging: `appEOWvLjCn5c7Ght`
  - Production: `app5QWCcVbCnVg2Gg`
  - Local: SQLite at `backend/data/novara-local.db`

### Critical Development Rules

#### Branch Strategy (MANDATORY)
```bash
# ALWAYS create feature branches from development
git checkout development
git checkout -b feature/EPIC-ID-description

# NEVER commit directly to main or staging
# Follow PR workflow: feature → development → staging → stable → main
```

#### Feature Development Process
1. **Documentation First**: Create comprehensive docs in `docs/features/`
   - Required files: README.md, user-journey.md, api-endpoints.md, openapi.yaml, functional-logic.md, database-schema.md, migration.sql/js, mapping.ts, feature-flags.json, ci-updates.md, deployment-notes.md, testing-guide.md
2. **Implementation**: Follow existing patterns, include tests
3. **Validation**: Run BugBot and health checks before PR
4. **Progressive Integration**: Through all environments

#### Sprint Alignment
- **Always map work to Epic/Story IDs** for strategic context
- **Check current sprint priorities** in roadmap before starting work
- **Update roadmap status** after feature completion

#### A/B Testing Requirements
- Test distribution balance (40-60% split)
- Session consistency validation
- Complete user journey testing for both paths
- Analytics event verification
- No regression in existing functionality

### Database Schema Patterns
- **Users Table**: Core user data with authentication
- **Check-ins Table**: Daily emotional state tracking
- **Insights Table**: AI-generated personalized messages
- **Analytics Table**: Event tracking and user behavior
- **Waitlist Table**: Pre-launch user collection

### Security Considerations
- JWT tokens with 90-day expiry and automatic refresh mechanism
- Input validation on all API endpoints using Joi
- Rate limiting (100 requests per 15 minutes)
- Helmet.js security headers
- CORS configuration for Vercel frontend
- Environment variable validation on startup
- Never share database IDs between environments

### Performance Optimizations
- Frontend code splitting and lazy loading
- Service worker caching for offline support
- Backend response compression
- Database query optimization
- Redis caching for frequently accessed data

### Monitoring & Debugging
- Sentry error tracking (frontend and backend)
- PostHog analytics for user behavior
- BugBot for automated issue detection
- Structured logging with Winston
- Performance monitoring scripts

### Deployment Notes
- Frontend auto-deploys to Vercel on git push
- Backend deploys to Railway via `cd backend && railway up` ONLY
- Database migrations handled through Airtable UI
- Environment variables managed per deployment
- Health checks run automatically post-deployment
- BugBot creates GitHub issues for deployment failures

## Working Preferences

### Development Approach
- User prefers assistant to make all code changes directly
- Use stable port strategy (4200/9002) to avoid conflicts
- Provide streamlined solutions without multiple options
- Always explain the "why" behind recommendations
- Flag potential risks before implementing
- Provide rollback instructions for significant changes

### Session Start Checklist
1. Check current working directory
2. Verify Railway environment and service
3. Verify database configuration matches environment
4. Review recent deployment history
5. Check roadmap alignment
6. Map work to epic/story IDs

### Communication Style
- Be direct and implementation-focused
- Challenge the user if they suggest anti-patterns
- Articulate explanations when applying fixes
- Document all changes comprehensively