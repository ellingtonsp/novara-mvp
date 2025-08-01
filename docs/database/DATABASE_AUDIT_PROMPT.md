# Database Documentation Audit Prompt

This prompt is designed to guide a comprehensive audit and cleanup of all database-related documentation in the Novara MVP codebase to eliminate confusion about which database and schema are in use.

## The Prompt

```
You are tasked with performing a critical database documentation audit and cleanup for the Novara MVP codebase. This is a high-priority task to eliminate confusion about database systems and schemas.

## CRITICAL CONTEXT
The codebase has undergone a major database evolution:
- PAST: Used SQLite (local), Airtable (staging/prod), and a "daily_checkins" table (Schema V1)
- PRESENT: Uses ONLY PostgreSQL in ALL environments with "health_events" table (Schema V2)
- PROBLEM: Documentation still references legacy systems, causing developer confusion and bugs

## YOUR MISSION
Systematically audit and update ALL documentation to reflect the current reality:
1. PostgreSQL is the ONLY database used in ALL environments (local, staging, production)
2. Schema V2 with "health_events" table is the ONLY schema in use
3. SQLite, Airtable, and "daily_checkins" table are COMPLETELY DEPRECATED

## STEP-BY-STEP INSTRUCTIONS

### Step 1: Find All Documentation Files
Use Glob to find all documentation files:
- Pattern: "**/*.md"
- Pattern: "**/docs/**/*"
- Pattern: "**/*.txt"
- Pattern: "**/README*"

### Step 2: Search for Legacy References
Use Grep to find ALL occurrences of:
- "sqlite" (case insensitive)
- "airtable" (case insensitive)
- "daily_checkins" or "daily_checkin" (case insensitive)
- "schema v1" or "schema_v1" or "schemav1" (case insensitive)
- "USE_SCHEMA_V2" (this flag should be removed as V2 is the only schema)
- Any database-related environment variables that might reference old systems

### Step 3: Search Code Comments
Use Grep to find misleading comments in code files:
- Pattern: "sqlite|airtable|daily_checkins" in "**/*.ts", "**/*.js", "**/*.py"
- Focus on comments that might confuse developers about which database to use

### Step 4: Update Each File
For each file containing legacy references:

1. **Replace SQLite references** with:
   "PostgreSQL (used in all environments including local development)"

2. **Remove Airtable references** entirely or replace with:
   "PostgreSQL (previously Airtable, now deprecated)"

3. **Replace daily_checkins references** with:
   "health_events (formerly daily_checkins in deprecated Schema V1)"

4. **Remove conditional schema logic** like:
   - "if USE_SCHEMA_V2" → Remove condition, keep V2 code
   - "Schema V1 vs V2" comparisons → State only V2 exists

5. **Add clarity statements** where appropriate:
   "IMPORTANT: PostgreSQL is the ONLY database used in ALL environments. Schema V2 (health_events table) is the ONLY schema in use."

### Step 5: Create/Update Key Documentation

1. **Create or update /docs/database/CURRENT_SETUP.md**:
   ```markdown
   # Current Database Setup - AUTHORITATIVE REFERENCE

   ## Database System
   **PostgreSQL** - Used in ALL environments without exception:
   - Local Development: PostgreSQL (postgresql://localhost:5432/novara_local)
   - Staging: PostgreSQL (Railway)
   - Production: PostgreSQL (Railway)

   ## Schema Version
   **Schema V2 ONLY** - The health_events table is the primary data store
   
   ## Deprecated Systems (DO NOT USE)
   - ❌ SQLite - NEVER used anymore
   - ❌ Airtable - NEVER used anymore
   - ❌ daily_checkins table (Schema V1) - NEVER used anymore
   - ❌ USE_SCHEMA_V2 flag - REMOVED (V2 is the only schema)

   Last updated: [current date]
   ```

2. **Update CLAUDE.md** to include at the top:
   ```markdown
   ## 🚨 DATABASE TRUTH - READ FIRST
   **ALL ENVIRONMENTS USE POSTGRESQL - NO EXCEPTIONS**
   - Schema: V2 (health_events table) ONLY
   - Never reference: SQLite, Airtable, daily_checkins, or Schema V1
   - No conditional schema logic - V2 is the only schema
   ```

### Step 6: Verification Checklist
After updates, verify:
- [ ] Zero references to SQLite remain (except in migration history)
- [ ] Zero references to Airtable remain (except in migration history)
- [ ] Zero references to daily_checkins remain (except in migration history)
- [ ] Zero conditional USE_SCHEMA_V2 checks remain
- [ ] All database references clearly state "PostgreSQL only"
- [ ] All schema references clearly state "Schema V2 (health_events) only"

### Step 7: Summary Report
Create a summary report listing:
1. Total files updated
2. Types of changes made
3. Any concerning code that might still assume legacy systems
4. Recommendations for code refactoring if needed

## IMPORTANT REMINDERS
- Be thorough - even one missed reference can cause confusion
- When in doubt, err on the side of clarity and repetition
- Update code comments, not just documentation files
- Ensure NO ambiguity remains about the database setup
- PostgreSQL and Schema V2 are the ONLY truth

Begin with Step 1 and proceed systematically through all steps.
```

## Purpose

This prompt ensures that:
- All legacy database references are removed
- PostgreSQL is clearly established as the only database
- Schema V2 (health_events) is the only schema referenced
- No confusion can arise in future development
- A single source of truth is established for database documentation

## When to Use

Run this audit:
- After major database migrations
- When onboarding new developers
- Periodically to ensure documentation accuracy
- Whenever database-related confusion arises

## Expected Outcome

After running this audit, the codebase should have:
- Zero ambiguity about database systems
- Consistent documentation across all files
- Clear deprecation warnings for legacy systems
- An authoritative reference document
- Updated code comments that reflect current reality