# Production Monitoring & Error Tracking Setup

## 🎯 **Why Monitoring is Critical**

With staging environment set up, you need production monitoring to:
- ✅ Catch issues before users report them
- ✅ Track performance degradation  
- ✅ Monitor API errors and downtime
- ✅ Get alerts for critical failures

## 🚨 **Quick Monitoring Setup (30 minutes)**

### **Step 1: Set Up Error Tracking with Sentry (15 minutes)**

**Frontend Error Tracking:**
1. **Go to [sentry.io](https://sentry.io)** → Sign up (free tier available)
2. **Create new project** → Select "React"
3. **Install Sentry in frontend:**
   ```bash
   cd frontend
   npm install @sentry/react @sentry/tracing
   ```

4. **Add to `frontend/src/main.tsx`:**
   ```typescript
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: "YOUR_SENTRY_DSN_HERE",
     integrations: [
       new Sentry.BrowserTracing(),
     ],
     tracesSampleRate: 1.0,
     environment: process.env.NODE_ENV || 'production'
   });
   ```

**Backend Error Tracking:**
1. **Install Sentry in backend:**
   ```bash
   cd backend
   npm install @sentry/node @sentry/tracing
   ```

2. **Add to `backend/server.js` (top of file):**
   ```javascript
   const Sentry = require("@sentry/node");
   const Tracing = require("@sentry/tracing");
   
   Sentry.init({
     dsn: "YOUR_SENTRY_DSN_HERE",
     integrations: [
       new Sentry.Integrations.Http({ tracing: true }),
       new Tracing.Integrations.Express({ app }),
     ],
     tracesSampleRate: 1.0,
     environment: process.env.NODE_ENV || 'production'
   });
   
   // RequestHandler creates a separate execution context using domains
   app.use(Sentry.Handlers.requestHandler());
   // TracingHandler creates a trace for every incoming request
   app.use(Sentry.Handlers.tracingHandler());
   ```

3. **Add error handler (before app.listen):**
   ```javascript
   // The error handler must be before any other error middleware and after all controllers
   app.use(Sentry.Handlers.errorHandler());
   ```

### **Step 2: Platform-Native Monitoring (10 minutes)**

**Vercel Monitoring:**
1. **Go to Vercel Dashboard** → Your project → Analytics tab
2. **Enable Speed Insights** (free)
3. **Enable Web Analytics** (free)
4. **Set up Function Logs** → Settings → Functions

**Railway Monitoring:**
1. **Go to Railway Dashboard** → Your backend service
2. **Click "Observability" tab**
3. **Set up Alerts:**
   - CPU usage > 80%
   - Memory usage > 80%
   - Response time > 2s
   - Error rate > 5%

### **Step 3: Uptime Monitoring (5 minutes)**

**Free Uptime Monitoring:**
1. **Go to [uptimerobot.com](https://uptimerobot.com)** (free tier: 50 monitors)
2. **Add HTTP(s) monitor:**
   - **URL:** `https://novara-mvp.vercel.app`
   - **Name:** Novara Frontend
   - **Interval:** Every 5 minutes
3. **Add API monitor:**
   - **URL:** `https://novara-mvp-production.up.railway.app/api/health`
   - **Name:** Novara Backend API
   - **Interval:** Every 5 minutes

## 📊 **Environment Variables for Monitoring**

**Add to Railway (Backend):**
```env
SENTRY_DSN=your_backend_sentry_dsn_here
NODE_ENV=production
```

**Add to Vercel (Frontend):**
```env
VITE_SENTRY_DSN=your_frontend_sentry_dsn_here
VITE_GA_MEASUREMENT_ID=G-QP9XJD6QFS
```

## 🔔 **Alert Configuration**

**Critical Alerts (Immediate Response):**
- Backend API down (5+ minutes)
- Frontend not accessible (5+ minutes)
- Error rate > 10% (15+ minutes)
- Airtable connection failures

**Warning Alerts (Review Within Hours):**
- Response time > 2 seconds
- Memory usage > 80%
- New error types appearing
- User authentication failures

## 📈 **Monitoring Dashboard Setup**

**Create Simple Monitoring Script:**
```javascript
// monitoring-dashboard.js
const monitors = [
  {
    name: 'Frontend',
    url: 'https://novara-mvp.vercel.app',
    expected: 200
  },
  {
    name: 'Backend Health',
    url: 'https://novara-mvp-production.up.railway.app/api/health',
    expected: 200
  },
  {
    name: 'User Registration',
    url: 'https://novara-mvp-production.up.railway.app/api/users',
    method: 'POST',
    expected: 400 // Should fail without data, but API should be accessible
  }
];

async function checkStatus() {
  console.log(`🔍 Monitoring Check - ${new Date().toISOString()}`);
  
  for (const monitor of monitors) {
    try {
      const response = await fetch(monitor.url, { 
        method: monitor.method || 'GET',
        headers: monitor.method === 'POST' ? {'Content-Type': 'application/json'} : {}
      });
      
      const status = response.status === monitor.expected ? '✅' : '❌';
      console.log(`${status} ${monitor.name}: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${monitor.name}: ${error.message}`);
    }
  }
  console.log('');
}

// Run every 5 minutes
setInterval(checkStatus, 5 * 60 * 1000);
checkStatus(); // Run immediately
```

## 🎯 **Post-Setup Validation**

**Test Error Tracking:**
1. **Trigger a test error** in staging
2. **Check Sentry dashboard** for error capture
3. **Verify alerts** are being sent

**Test Uptime Monitoring:**
1. **Temporarily break** staging backend
2. **Verify UptimeRobot** sends alerts
3. **Fix and confirm** recovery notification

## 🚀 **Benefits After Setup**

- ✅ **Proactive Issue Detection:** Know about problems before users
- ✅ **Performance Monitoring:** Track response times and performance
- ✅ **Error Context:** Detailed error information for debugging
- ✅ **Uptime Guarantees:** Ensure 99.9% uptime monitoring
- ✅ **Peace of Mind:** Sleep well knowing your app is monitored

**Total Setup Time:** ~30 minutes
**Monthly Cost:** $0 (using free tiers)
**Value:** Prevents hours of debugging and user frustration 