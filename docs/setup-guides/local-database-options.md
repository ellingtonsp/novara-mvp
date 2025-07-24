# Local Database Options for Production Parity

## Current Production Schema (Airtable)

### Tables Overview
1. **Users** - User profiles, confidence scores, preferences
2. **DailyCheckins** - Daily mood/confidence tracking 
3. **Insights** - Generated personalized insights storage
4. **InsightEngagement** - User interaction analytics
5. **FMVAnalytics** - General application analytics

### Schema Details
```javascript
// Users Table
{
  id: "recXXXXXXXXXXXXX",  // Airtable record ID
  email: "user@example.com",
  nickname: "Jane",
  confidence_meds: 7,       // 1-10 scale
  confidence_costs: 4,      // 1-10 scale  
  confidence_overall: 6,    // 1-10 scale
  primary_need: "emotional_support",
  cycle_stage: "ivf_prep",
  top_concern: "medication timing",
  timezone: "America/New_York",
  email_opt_in: true,
  status: "active",
  created_at: "2025-01-01T00:00:00.000Z"
}

// DailyCheckins Table
{
  id: "recYYYYYYYYYYYYY",
  user_id: ["recXXXXXXXXXXXXX"], // Linked record array
  mood_today: "hopeful, anxious",
  confidence_today: 7,
  primary_concern_today: "side effects",
  medication_confidence_today: 6,
  financial_stress_today: 5,
  journey_readiness_today: 8,
  user_note: "Feeling optimistic today",
  date_submitted: "2025-01-15",
  created_at: "2025-01-15T10:30:00.000Z"
}

// Insights Table
{
  id: "recZZZZZZZZZZZZZ",
  user_id: ["recXXXXXXXXXXXXX"],
  insight_type: "daily_insight",
  insight_title: "Your confidence is building",
  insight_message: "Based on your recent check-ins...",
  insight_id: "daily_1642267800000",
  date: "2025-01-15",
  context_data: "{\"checkins_count\": 5}",
  action_label: "Learn more",
  action_type: "link",
  status: "active"
}
```

## Option 1: SQLite (Recommended for Local Development)

### ✅ **Advantages**
- **File-based**: No server setup required
- **Production parity**: Relational structure matches production logic
- **Fast queries**: Excellent performance for development
- **Zero configuration**: Works out of the box
- **Portable**: Database file can be shared/backed up easily

### 📊 **Implementation**

#### 1. Install Dependencies
```bash
cd backend
npm install sqlite3 better-sqlite3 --save-dev
```

#### 2. Database Schema Setup
```sql
-- schema/local-database.sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  confidence_meds INTEGER DEFAULT 5,
  confidence_costs INTEGER DEFAULT 5,
  confidence_overall INTEGER DEFAULT 5,
  primary_need TEXT,
  cycle_stage TEXT,
  top_concern TEXT,
  timezone TEXT,
  email_opt_in BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE daily_checkins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  mood_today TEXT NOT NULL,
  confidence_today INTEGER NOT NULL,
  primary_concern_today TEXT,
  medication_confidence_today INTEGER,
  medication_concern_today TEXT,
  financial_stress_today INTEGER,
  financial_concern_today TEXT,
  journey_readiness_today INTEGER,
  top_concern_today TEXT,
  user_note TEXT,
  date_submitted DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE insights (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  insight_type TEXT NOT NULL,
  insight_title TEXT NOT NULL,
  insight_message TEXT NOT NULL,
  insight_id TEXT NOT NULL,
  date DATE NOT NULL,
  context_data TEXT,
  action_label TEXT,
  action_type TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE insight_engagement (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  insight_type TEXT NOT NULL,
  action TEXT NOT NULL,
  insight_id TEXT,
  timestamp DATE NOT NULL,
  date_submitted DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE fmv_analytics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_timestamp DATE NOT NULL,
  date DATE NOT NULL,
  event_data TEXT,
  insight_type TEXT,
  insight_title TEXT,
  insight_id TEXT,
  feedback_type TEXT,
  feedback_context TEXT,
  mood_selected TEXT,
  confidence_level INTEGER,
  concern_mentioned BOOLEAN,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

#### 3. Database Adapter
```javascript
// backend/database/sqlite-adapter.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class SQLiteAdapter {
  constructor() {
    const dbPath = path.join(__dirname, '../data/novara-local.db');
    
    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.db = new Database(dbPath);
    this.initSchema();
  }

  initSchema() {
    const schemaPath = path.join(__dirname, '../schema/local-database.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      this.db.exec(schema);
    }
  }

  // User operations
  createUser(userData) {
    const id = `rec${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, nickname, confidence_meds, confidence_costs, confidence_overall, 
                        primary_need, cycle_stage, top_concern, timezone, email_opt_in, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id, userData.email, userData.nickname, userData.confidence_meds, userData.confidence_costs,
      userData.confidence_overall, userData.primary_need, userData.cycle_stage, userData.top_concern,
      userData.timezone, userData.email_opt_in, userData.status
    );
    
    return { id, ...userData };
  }

  findUserByEmail(email) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  }

  // Check-in operations  
  createCheckin(checkinData) {
    const id = `rec${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const stmt = this.db.prepare(`
      INSERT INTO daily_checkins (id, user_id, mood_today, confidence_today, primary_concern_today,
                                 medication_confidence_today, medication_concern_today, financial_stress_today,
                                 financial_concern_today, journey_readiness_today, top_concern_today,
                                 user_note, date_submitted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id, checkinData.user_id, checkinData.mood_today, checkinData.confidence_today,
      checkinData.primary_concern_today, checkinData.medication_confidence_today,
      checkinData.medication_concern_today, checkinData.financial_stress_today,
      checkinData.financial_concern_today, checkinData.journey_readiness_today,
      checkinData.top_concern_today, checkinData.user_note, checkinData.date_submitted
    );
    
    return { id, ...checkinData };
  }

  getUserCheckins(userId, limit = 7) {
    const stmt = this.db.prepare(`
      SELECT * FROM daily_checkins 
      WHERE user_id = ? 
      ORDER BY date_submitted DESC 
      LIMIT ?
    `);
    return stmt.all(userId, limit);
  }

  // Insight operations
  createInsight(insightData) {
    const id = `rec${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const stmt = this.db.prepare(`
      INSERT INTO insights (id, user_id, insight_type, insight_title, insight_message, insight_id,
                           date, context_data, action_label, action_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id, insightData.user_id, insightData.insight_type, insightData.insight_title,
      insightData.insight_message, insightData.insight_id, insightData.date,
      insightData.context_data, insightData.action_label, insightData.action_type,
      insightData.status
    );
    
    return { id, ...insightData };
  }

  // Analytics operations
  createAnalyticsEvent(analyticsData) {
    const id = `rec${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const stmt = this.db.prepare(`
      INSERT INTO fmv_analytics (id, user_id, event_type, event_timestamp, date, event_data,
                                insight_type, insight_title, insight_id, feedback_type,
                                feedback_context, mood_selected, confidence_level, concern_mentioned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id, analyticsData.user_id, analyticsData.event_type, analyticsData.event_timestamp,
      analyticsData.date, analyticsData.event_data, analyticsData.insight_type,
      analyticsData.insight_title, analyticsData.insight_id, analyticsData.feedback_type,
      analyticsData.feedback_context, analyticsData.mood_selected, analyticsData.confidence_level,
      analyticsData.concern_mentioned
    );
    
    return { id, ...analyticsData };
  }
}

module.exports = SQLiteAdapter;
```

#### 4. Environment Detection
```javascript
// backend/database/database-factory.js
const SQLiteAdapter = require('./sqlite-adapter');

function createDatabase() {
  const environment = process.env.NODE_ENV || 'development';
  
  if (environment === 'development' || environment === 'staging') {
    console.log('🗄️ Using SQLite database for local development');
    return new SQLiteAdapter();
  } else {
    console.log('🌩️ Using Airtable for production');
    return null; // Use existing Airtable implementation
  }
}

module.exports = { createDatabase };
```

## Option 2: PostgreSQL with Docker (Full Production Parity)

### ✅ **Advantages**
- **Identical to production**: Many companies use PostgreSQL in production
- **Advanced features**: Full-text search, JSON columns, complex queries
- **Containerized**: Easy setup with Docker Compose
- **Scalable**: Can handle any production workload

### 📋 **Implementation**

#### 1. Docker Compose Setup
```yaml
# docker-compose.local.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: novara_local
      POSTGRES_USER: novara_dev
      POSTGRES_PASSWORD: novara_dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./schema/postgres-schema.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U novara_dev -d novara_local"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

#### 2. PostgreSQL Schema
```sql
-- schema/postgres-schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT ('rec' || replace(uuid_generate_v4()::text, '-', '')),
  email VARCHAR(255) UNIQUE NOT NULL,
  nickname VARCHAR(100) NOT NULL,
  confidence_meds INTEGER DEFAULT 5 CHECK (confidence_meds >= 1 AND confidence_meds <= 10),
  confidence_costs INTEGER DEFAULT 5 CHECK (confidence_costs >= 1 AND confidence_costs <= 10),
  confidence_overall INTEGER DEFAULT 5 CHECK (confidence_overall >= 1 AND confidence_overall <= 10),
  primary_need VARCHAR(100),
  cycle_stage VARCHAR(50),
  top_concern TEXT,
  timezone VARCHAR(50),
  email_opt_in BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

CREATE TABLE daily_checkins (
  id TEXT PRIMARY KEY DEFAULT ('rec' || replace(uuid_generate_v4()::text, '-', '')),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood_today TEXT NOT NULL,
  confidence_today INTEGER NOT NULL CHECK (confidence_today >= 1 AND confidence_today <= 10),
  primary_concern_today TEXT,
  medication_confidence_today INTEGER CHECK (medication_confidence_today >= 1 AND medication_confidence_today <= 10),
  medication_concern_today TEXT,
  financial_stress_today INTEGER CHECK (financial_stress_today >= 1 AND financial_stress_today <= 10),
  financial_concern_today TEXT,
  journey_readiness_today INTEGER CHECK (journey_readiness_today >= 1 AND journey_readiness_today <= 10),
  top_concern_today TEXT,
  user_note TEXT,
  date_submitted DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_checkins_user_date ON daily_checkins(user_id, date_submitted DESC);
CREATE INDEX idx_checkins_date ON daily_checkins(date_submitted DESC);
```

## Option 3: JSON File Database (Simplest)

### ✅ **Advantages**
- **Zero setup**: No additional dependencies
- **Human readable**: Easy to inspect/debug
- **Git-friendly**: Can be version controlled
- **Fast prototyping**: Immediate development workflow

### ⚠️ **Limitations**
- **Not scalable**: Performance degrades with size
- **No transactions**: Race conditions possible
- **No complex queries**: Limited filtering capabilities

### 📄 **Implementation**
```javascript
// backend/database/json-adapter.js
const fs = require('fs');
const path = require('path');

class JSONAdapter {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.ensureDataDir();
    this.loadData();
  }

  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  loadData() {
    this.data = {
      users: this.loadTable('users'),
      dailyCheckins: this.loadTable('daily_checkins'),
      insights: this.loadTable('insights'),
      insightEngagement: this.loadTable('insight_engagement'),
      fmvAnalytics: this.loadTable('fmv_analytics')
    };
  }

  loadTable(tableName) {
    const filePath = path.join(this.dataDir, `${tableName}.json`);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    return [];
  }

  saveTable(tableName) {
    const filePath = path.join(this.dataDir, `${tableName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(this.data[tableName], null, 2));
  }

  generateId() {
    return `rec${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }

  createUser(userData) {
    const user = { id: this.generateId(), ...userData, created_at: new Date().toISOString() };
    this.data.users.push(user);
    this.saveTable('users');
    return user;
  }

  findUserByEmail(email) {
    return this.data.users.find(user => user.email === email);
  }
}

module.exports = JSONAdapter;
```

## Recommended Implementation Strategy

### Phase 1: SQLite Setup (Immediate)
1. Implement SQLite adapter with production schema
2. Add environment detection in server.js
3. Update scripts to use local database in development

### Phase 2: Docker PostgreSQL (Optional)
1. Add Docker Compose for teams wanting full production parity
2. Implement PostgreSQL adapter
3. Database migration scripts

### Phase 3: Testing & Validation
1. Automated tests comparing local vs production behavior
2. Data seeding scripts for consistent test scenarios
3. Performance benchmarking

## Integration with Current Workflow

### Updated Start Script
```bash
# scripts/start-staging.sh modifications
# Add database setup before backend start:

echo "🗄️ Setting up local database..."
cd backend

# Initialize SQLite database if it doesn't exist
if [ ! -f "data/novara-local.db" ]; then
    echo "📊 Creating local SQLite database..."
    node scripts/init-database.js
fi

# Seed with test data
echo "🌱 Seeding test data..."
node scripts/seed-test-data.js

echo "✅ Local database ready"
```

### Environment Variables Update
```bash
# Local development with SQLite
NODE_ENV=development
USE_LOCAL_DATABASE=true
DATABASE_TYPE=sqlite
DATABASE_PATH=./data/novara-local.db

# Local development with PostgreSQL
NODE_ENV=development  
USE_LOCAL_DATABASE=true
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://novara_dev:novara_dev_password@localhost:5432/novara_local

# Production (unchanged)
NODE_ENV=production
AIRTABLE_API_KEY=...
AIRTABLE_BASE_ID=...
```

## Next Steps

**Immediate Priority:**
1. **Implement SQLite option** - Fastest path to local database parity
2. **Update server.js** - Add database abstraction layer
3. **Test data seeding** - Create realistic test scenarios
4. **Documentation update** - Include database setup in local development guides

**Would you like me to implement the SQLite option first?** It provides the best balance of simplicity and production parity for your immediate needs. 