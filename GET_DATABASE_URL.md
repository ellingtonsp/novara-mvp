# How to Get Your PostgreSQL DATABASE_URL from Railway

## Quick Steps:

1. **Go to Railway Dashboard**
   - https://railway.app/dashboard

2. **Select Your Project**
   - Click on "novara-mvp"

3. **Select Staging Environment**
   - Make sure you're in the "staging" environment (top dropdown)

4. **Click on PostgreSQL Service**
   - You should see a PostgreSQL database service you just created
   - It might be named "PostgreSQL" or similar

5. **Go to Connect Tab**
   - Click on the PostgreSQL service
   - Click the "Connect" tab
   - You'll see connection details

6. **Copy DATABASE_URL**
   - Look for "DATABASE_URL" or "Connection String"
   - It looks like: `postgresql://postgres:password@host.railway.app:5432/railway`
   - Click the copy button

## Then Run Setup:

```bash
# Option 1: Set DATABASE_URL and run
cd ~/Library/Mobile\ Documents/com~apple~CloudDocs/novara-mvp
DATABASE_URL="paste-your-url-here" node backend/scripts/setup-postgres-staging.js

# Option 2: If you can link Railway service
railway run -s postgres node backend/scripts/setup-postgres-staging.js
```

## What This Does:

1. Creates all tables with proper schema
2. Includes ALL Enhanced form fields
3. Sets up indexes for performance
4. Verifies everything is ready

## After Setup:

Your staging environment will automatically:
- Detect PostgreSQL and use it instead of Airtable
- Save ALL 18 Enhanced form fields
- No more localStorage-only data!

The backend logs will show:
```
🐘 Using PostgreSQL database
```

Instead of:
```
🌩️ Using Airtable for production (legacy)
```