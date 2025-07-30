# Developer Guide - Refactored Server

## Quick Start

### Running Locally
```bash
# Use refactored server (recommended)
USE_REFACTORED_SERVER=true npm run local

# Use legacy server (if needed)
npm run local
```

### Adding New Routes

1. Create route file in `routes/`:
```javascript
// routes/my-feature.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error-handler');

router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  // Your logic here
  res.json({ success: true });
}));

module.exports = router;
```

2. Mount in `server-refactored.js`:
```javascript
const myFeatureRoutes = require('./routes/my-feature');
app.use('/api/my-feature', myFeatureRoutes);
```

### Adding New Services

1. Create service file in `services/`:
```javascript
// services/my-feature-service.js
class MyFeatureService {
  constructor() {
    this.db = null;
  }

  async initialize() {
    const adapter = getDatabaseAdapter();
    this.db = adapter;
  }

  async doSomething(data) {
    // Business logic here
  }
}

module.exports = new MyFeatureService();
```

2. Initialize in `server-refactored.js`:
```javascript
await myFeatureService.initialize();
```

### Database Operations

Always use the database adapter pattern:

```javascript
const { getDatabaseAdapter } = require('../config/database');

const adapter = getDatabaseAdapter();
if (adapter.isPostgres) {
  // PostgreSQL query
  const result = await adapter.localDb.query('SELECT * FROM ...');
} else if (adapter.isUsingLocalDatabase()) {
  // SQLite query
  const result = await adapter.localDb.db.get('SELECT * FROM ...');
} else {
  // Airtable API call
  const result = await adapter.airtableRequest('TableName', 'GET');
}
```

### Error Handling

Use the asyncHandler wrapper for async routes:

```javascript
router.get('/example', authenticateToken, asyncHandler(async (req, res) => {
  // Errors thrown here are automatically caught
  throw new AppError('Something went wrong', 400);
}));
```

### Authentication

Protected routes automatically get user info:

```javascript
router.get('/protected', authenticateToken, asyncHandler(async (req, res) => {
  const userEmail = req.user.email;
  const userId = req.user.id;
  // Use user info
}));
```

### Logging

Use the centralized logger:

```javascript
const logger = require('../utils/logger');

logger.info('Something happened', { 
  userId: req.user.id,
  action: 'feature_used' 
});

logger.error('Error occurred', { 
  error: error.message,
  stack: error.stack 
});
```

## Common Tasks

### Add a New Field to Check-ins

1. Update `utils/airtable-schema.js`:
```javascript
const PRODUCTION_AIRTABLE_SCHEMA = {
  daily_checkins: [
    // ... existing fields
    'new_field_name'
  ]
};
```

2. Update check-in service and routes as needed

3. Run pre-deployment check:
```bash
node backend/scripts/pre-deployment-check.js
```

### Add Rate Limiting to a Route

```javascript
const { createRateLimiter } = require('../middleware/rate-limit');

// Custom rate limit
const customLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10 // 10 requests per window
});

router.post('/limited', customLimiter, asyncHandler(async (req, res) => {
  // Rate limited logic
}));
```

### Add V2 Endpoints

1. Create in `routes/v2/`:
```javascript
// routes/v2/my-feature.js
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  res.json({ version: 'v2' });
});

module.exports = router;
```

2. Mount in `routes/v2/index.js`:
```javascript
const myFeatureRoutes = require('./my-feature');
router.use('/my-feature', myFeatureRoutes);
```

## Testing

### Run All Tests
```bash
# Test refactored server locally
node backend/test-refactored.js

# Test on staging
node backend/scripts/test-refactored-staging.js
```

### Test Specific Endpoint
```bash
# Create test script
node backend/scripts/test-my-feature.js
```

## Debugging

### Enable Debug Logging
```bash
DEBUG=novara:* npm run local
```

### Check Database Connection
```bash
node backend/scripts/test-postgres-connection.js
```

### Verify Schema
```bash
node backend/scripts/verify-schema.js
```

## Deployment

### Deploy to Staging
1. Push to `staging` branch
2. Railway auto-deploys
3. Verify with tests

### Enable Refactored Server
Set environment variable in Railway:
```
USE_REFACTORED_SERVER=true
```

### Rollback if Needed
Remove or set to false:
```
USE_REFACTORED_SERVER=false
```

## Best Practices

1. **Always use asyncHandler** for async routes
2. **Use services** for business logic, not routes
3. **Test locally** before pushing
4. **Check logs** after deployment
5. **Use feature flags** for new features
6. **Document API changes** in this guide

## Troubleshooting

### "Database not initialized" Error
- Ensure service is initialized in server-refactored.js
- Check DATABASE_URL environment variable

### Authentication Errors
- Verify JWT_SECRET is set
- Check token expiration
- Ensure authenticateToken middleware is used

### Rate Limit Errors
- Check RATE_LIMIT_* environment variables
- Verify rate limiter configuration

### PostgreSQL Connection Issues
- Verify DATABASE_URL format
- Check network connectivity
- Run connection test script

## Support

For issues or questions:
1. Check error logs in Railway
2. Run test scripts to isolate issues
3. Review this guide and REFACTORING_DOCUMENTATION.md
4. Create detailed bug reports with error messages