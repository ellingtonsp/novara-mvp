# PostgreSQL Migration Plan

## Overview
Migrate from Airtable + SQLite to PostgreSQL for all environments, eliminating schema mismatches and data integrity issues.

## Phase 1: Planning & Design (Day 1)

### 1.1 Database Schema Design
```sql
-- Core tables with proper constraints and types
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    confidence_meds INTEGER DEFAULT 5 CHECK (confidence_meds BETWEEN 1 AND 10),
    confidence_costs INTEGER DEFAULT 5 CHECK (confidence_costs BETWEEN 1 AND 10),
    confidence_overall INTEGER DEFAULT 5 CHECK (confidence_overall BETWEEN 1 AND 10),
    primary_need VARCHAR(50),
    cycle_stage VARCHAR(50),
    top_concern VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',
    email_opt_in BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active',
    medication_status VARCHAR(50),
    medication_status_updated TIMESTAMP,
    baseline_completed BOOLEAN DEFAULT false,
    onboarding_path VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE daily_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Core fields (currently working)
    mood_today VARCHAR(20) NOT NULL,
    confidence_today INTEGER NOT NULL CHECK (confidence_today BETWEEN 1 AND 10),
    medication_taken VARCHAR(20) DEFAULT 'not tracked',
    user_note TEXT,
    primary_concern_today VARCHAR(50),
    date_submitted DATE NOT NULL,
    
    -- Enhanced fields (currently lost in localStorage)
    anxiety_level INTEGER CHECK (anxiety_level BETWEEN 1 AND 10),
    side_effects TEXT[], -- PostgreSQL array type
    missed_doses INTEGER,
    injection_confidence INTEGER CHECK (injection_confidence BETWEEN 1 AND 10),
    appointment_within_3_days BOOLEAN,
    appointment_anxiety INTEGER CHECK (appointment_anxiety BETWEEN 1 AND 10),
    coping_strategies_used TEXT[],
    partner_involved_today BOOLEAN,
    wish_knew_more_about TEXT[],
    
    -- PHQ-4 Assessment
    phq4_score INTEGER,
    phq4_anxiety INTEGER,
    phq4_depression INTEGER,
    
    -- Sentiment analysis
    sentiment VARCHAR(20),
    sentiment_confidence DECIMAL(3,2),
    sentiment_scores JSONB,
    sentiment_processing_time INTEGER,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(user_id, date_submitted)
);

-- Indexes for performance
CREATE INDEX idx_checkins_user_date ON daily_checkins(user_id, date_submitted DESC);
CREATE INDEX idx_checkins_date ON daily_checkins(date_submitted DESC);
CREATE INDEX idx_users_email ON users(email);

-- Additional tables
CREATE TABLE insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL,
    insight_title TEXT NOT NULL,
    insight_message TEXT NOT NULL,
    insight_id VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    context_data JSONB,
    action_label VARCHAR(100),
    action_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE auth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.2 Migration Strategy
1. **Parallel Running**: Keep Airtable running while testing PostgreSQL
2. **Data Sync**: Build tool to sync existing Airtable data to PostgreSQL
3. **Gradual Cutover**: Test with staging first, then production
4. **Rollback Plan**: Keep Airtable data for 30 days after migration

## Phase 2: Infrastructure Setup (Day 1)

### 2.1 Railway PostgreSQL Setup
```yaml
# railway.toml
[environments.production]
  DATABASE_URL = "${{ PGDATABASE_URL }}"
  
[environments.staging]  
  DATABASE_URL = "${{ PGDATABASE_URL }}"
```

### 2.2 Connection Pooling
```javascript
// db/postgres.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

module.exports = pool;
```

### 2.3 Migration Tool Setup
```bash
npm install --save pg
npm install --save-dev db-migrate db-migrate-pg
```

## Phase 3: Backend Updates (Day 2)

### 3.1 Database Adapter
```javascript
// database/postgres-adapter.js
class PostgresAdapter {
  constructor(pool) {
    this.pool = pool;
  }
  
  async createUser(userData) {
    const { email, nickname, ...otherFields } = userData;
    const query = `
      INSERT INTO users (email, nickname, ${Object.keys(otherFields).join(', ')})
      VALUES ($1, $2, ${Object.keys(otherFields).map((_, i) => `$${i + 3}`).join(', ')})
      RETURNING *
    `;
    const values = [email, nickname, ...Object.values(otherFields)];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }
  
  async createCheckin(checkinData) {
    // Include ALL fields from Enhanced form
    const fields = Object.keys(checkinData);
    const values = Object.values(checkinData);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO daily_checkins (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }
}
```

### 3.2 Remove Schema Whitelist
- Delete `PRODUCTION_AIRTABLE_SCHEMA` completely
- No more silent field dropping
- All fields from frontend saved to database

## Phase 4: Data Migration (Day 2)

### 4.1 Migration Script
```javascript
// scripts/migrate-airtable-to-postgres.js
async function migrateData() {
  console.log('Starting Airtable to PostgreSQL migration...');
  
  // 1. Fetch all users from Airtable
  const airtableUsers = await fetchAirtableUsers();
  
  // 2. Insert users into PostgreSQL
  for (const user of airtableUsers) {
    await postgresAdapter.createUser(mapAirtableUserToPostgres(user));
  }
  
  // 3. Fetch all check-ins from Airtable
  const airtableCheckins = await fetchAirtableCheckins();
  
  // 4. Insert check-ins into PostgreSQL
  for (const checkin of airtableCheckins) {
    await postgresAdapter.createCheckin(mapAirtableCheckinToPostgres(checkin));
  }
}
```

### 4.2 Data Validation
```javascript
// Verify data integrity after migration
async function validateMigration() {
  const airtableCount = await getAirtableRecordCount();
  const postgresCount = await getPostgresRecordCount();
  
  if (airtableCount.users !== postgresCount.users) {
    throw new Error('User count mismatch');
  }
  
  if (airtableCount.checkins !== postgresCount.checkins) {
    throw new Error('Check-in count mismatch');
  }
}
```

## Phase 5: Frontend Updates (Day 3)

### 5.1 Update Enhanced Form
```javascript
// Remove localStorage pattern
const handleSubmit = async () => {
  // Send ALL data to backend
  const checkinData = {
    mood_today: selectedMood,
    confidence_today: confidence,
    medication_taken: tookMedications ? 'yes' : 'no',
    user_note: userNote,
    date_submitted: todayString,
    
    // Now these actually get saved!
    anxiety_level: anxietyLevel,
    side_effects: sideEffects,
    missed_doses: missedDoses,
    injection_confidence: injectionConfidence,
    appointment_within_3_days: hasAppointment,
    appointment_anxiety: appointmentAnxiety,
    coping_strategies_used: copingStrategies,
    partner_involved_today: partnerInvolved,
    wish_knew_more_about: infoNeeds,
    phq4_score: phq4Result?.totalScore,
    phq4_anxiety: phq4Result?.anxietyScore,
    phq4_depression: phq4Result?.depressionScore
  };
  
  // One API call, all data saved
  await api.createCheckin(checkinData);
};
```

### 5.2 Remove localStorage Dependencies
- Delete all `localStorage.setItem` for check-in data
- Update components that read from localStorage
- Fetch data from API instead

## Phase 6: Testing & Validation (Day 3)

### 6.1 Test Plan
1. **Unit Tests**: Test all database operations
2. **Integration Tests**: Test API endpoints with PostgreSQL
3. **E2E Tests**: Test full user flows
4. **Data Validation**: Ensure no data loss
5. **Performance Tests**: Verify query performance

### 6.2 Staging Validation
```bash
# Deploy to staging
railway environment staging
railway up

# Run validation suite
npm run test:staging
npm run validate:migration
```

## Phase 7: Production Migration (Day 4)

### 7.1 Migration Checklist
- [ ] Backup Airtable data
- [ ] Put app in maintenance mode
- [ ] Run migration script
- [ ] Validate data integrity
- [ ] Update environment variables
- [ ] Deploy new backend code
- [ ] Deploy new frontend code
- [ ] Test critical paths
- [ ] Remove maintenance mode

### 7.2 Rollback Plan
If issues arise:
1. Switch `DATABASE_URL` back to Airtable adapter
2. Deploy previous backend version
3. Investigate and fix issues
4. Retry migration

## Benefits After Migration

1. **No Schema Mismatches**: Same database everywhere
2. **All Data Saved**: No more localStorage-only fields
3. **Data Integrity**: Foreign keys, constraints, transactions
4. **Better Performance**: Optimized queries, indexes
5. **Easier Development**: Standard PostgreSQL tools
6. **Future Features**: Full-text search, JSONB queries, etc.

## Timeline
- **Day 1**: Schema design, Railway setup
- **Day 2**: Backend updates, migration scripts
- **Day 3**: Frontend updates, testing
- **Day 4**: Production migration

## Risk Mitigation
1. **Parallel Running**: Keep Airtable as backup
2. **Gradual Migration**: Staging first, then production
3. **Data Validation**: Multiple checkpoints
4. **Rollback Ready**: Can switch back quickly
5. **User Communication**: Notify about maintenance window