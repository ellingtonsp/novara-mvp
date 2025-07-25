# Cursor AI Troubleshooting Guide

## 🎯 **Purpose**
This guide helps Cursor AI tools quickly identify and resolve common issues encountered during Novara MVP development and deployment.

## 📁 **Project Structure Overview**

```
novara-mvp/
├── backend/                 # Node.js Express API
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   ├── railway.toml        # Railway deployment config
│   ├── routes/             # API route handlers
│   ├── models/             # Data models
│   └── utils/              # Utility functions
├── frontend/               # React TypeScript app
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── lib/           # API client, utilities
│   │   └── contexts/      # React contexts
│   ├── package.json       # Frontend dependencies
│   ├── vite.config.ts     # Vite configuration
│   └── railway.toml       # Railway frontend config
├── vercel.json            # Root Vercel deployment config
├── docs/                  # Documentation
└── README.md              # Project overview
```

## 🚨 **Common Issues & Solutions**

### **1. Railway Deployment Issues**

#### **Issue: npm ci --only=production exit code 240**
**Symptoms:** Build fails with exit code 240 during Railway deployment
**Root Cause:** Package.json and package-lock.json out of sync
**Solution:**
```bash
cd backend
rm package-lock.json
npm install
git add package-lock.json
git commit -m "Fix package-lock.json dependency conflicts"
git push
```

#### **Issue: Railway backend URL changes**
**Symptoms:** 404 errors when accessing backend API
**Root Cause:** Railway generates new URLs after redeployment
**Solution:**
1. Check Railway dashboard for current URL
2. Update `frontend/src/lib/api.ts` with new URL
3. Rebuild and redeploy frontend

#### **Issue: Railway service not found**
**Symptoms:** CLI shows "Project does not have any services"
**Solution:**
```bash
railway link
railway status
railway domain
```

### **2. Vercel Deployment Issues**

#### **Issue: 404 errors on Vercel**
**Symptoms:** Frontend shows 404 NOT_FOUND error
**Root Cause:** Vite base path configuration
**Solution:**
1. Remove `base: '/novara-mvp/'` from `frontend/vite.config.ts`
2. Create root-level `vercel.json`:
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### **Issue: Asset paths incorrect**
**Symptoms:** CSS/JS files not loading
**Root Cause:** Incorrect base path in Vite config
**Solution:** Ensure `vite.config.ts` has no base path:
```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

### **3. TypeScript Build Issues**

#### **Issue: Unused variable errors**
**Symptoms:** `TS6133: 'variableName' is declared but its value is never read`
**Solution:** Comment out unused variables or remove them:
```typescript
// const unusedVariable = value; // Commented out for future use
```

#### **Issue: Import path errors**
**Symptoms:** Module resolution failures
**Solution:** Check `vite.config.ts` alias configuration:
```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
}
```

### **4. API Connection Issues**

#### **Issue: CORS errors**
**Symptoms:** Browser console shows CORS policy errors
**Solution:** Ensure backend CORS is configured:
```javascript
app.use(cors({
  origin: ['https://novara-mvp.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
```

#### **Issue: API endpoints not responding**
**Symptoms:** 404 errors on API calls
**Solution:** Check backend routes and ensure server is running:
```bash
curl https://novara-mvp-production.up.railway.app/api/health
```

### **5. Airtable Integration Issues**

#### **Issue: Unprocessable Entity errors**
**Symptoms:** 422 errors when saving to Airtable
**Root Cause:** Invalid data format or missing required fields
**Solution:** Check Airtable schema and ensure all required fields are provided

#### **Issue: Airtable connection failures**
**Symptoms:** "Airtable not connected" in health check
**Solution:** Verify environment variables:
```bash
AIRTABLE_API_KEY=your_key
AIRTABLE_BASE_ID=your_base_id
```

## 🔧 **Quick Diagnostic Commands**

### **Backend Health Check**
```bash
curl https://novara-mvp-production.up.railway.app/api/health
```

### **Frontend Status Check**
```bash
curl -I https://novara-mvp.vercel.app
```

### **Local Development**
```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run dev
```

### **Build Verification**
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

## 📋 **Environment Variables Checklist**

### **Backend (Railway)**
```
NODE_ENV=production
PORT=$PORT
AIRTABLE_API_KEY=your_airtable_key
AIRTABLE_BASE_ID=your_base_id
JWT_SECRET=your_jwt_secret
```

### **Frontend (Vercel)**
```
VITE_API_URL=https://novara-mvp-production.up.railway.app
```

## 🚀 **Deployment Pipeline**

### **Vercel Frontend**
1. Push to `main` branch
2. Vercel auto-detects changes
3. Runs `cd frontend && npm install && npm run build`
4. Serves `frontend/dist` directory

### **Railway Backend**
1. Push to `main` branch
2. Railway auto-detects changes
3. Runs `npm install --omit=dev`
4. Starts with `npm start`

## 🔍 **Debugging Workflow**

### **1. Identify Issue Type**
- **Build Error:** Check package.json, dependencies, TypeScript
- **Runtime Error:** Check server logs, API responses
- **Deployment Error:** Check platform-specific configs

### **2. Check Logs**
- **Vercel:** Dashboard → Deployments → Build Logs
- **Railway:** Dashboard → Deployments → Runtime Logs
- **Local:** Terminal output

### **3. Verify Configuration**
- **Frontend:** `vercel.json`, `vite.config.ts`, `package.json`
- **Backend:** `railway.toml`, `package.json`, environment variables

### **4. Test Incrementally**
- Test locally first
- Test backend API independently
- Test frontend build independently
- Test full deployment

## 📚 **Key Files Reference**

### **Configuration Files**
- `vercel.json` - Vercel deployment configuration
- `frontend/vite.config.ts` - Vite build configuration
- `backend/railway.toml` - Railway backend configuration
- `frontend/railway.toml` - Railway frontend configuration

### **API Files**
- `frontend/src/lib/api.ts` - API client configuration
- `backend/server.js` - Express server setup
- `backend/routes/` - API route handlers

### **Documentation**
- `docs/production-deployment-guide.md` - Complete deployment guide
- `README.md` - Project overview
- `docs/troubleshooting/production-status-summary.md` - Current status

## 🎯 **Common Patterns**

### **Error Handling Pattern**
```typescript
try {
  const response = await apiClient.makeRequest(endpoint, options);
  if (!response.success) {
    console.error('API Error:', response.error);
    return { success: false, error: response.error };
  }
  return { success: true, data: response.data };
} catch (error) {
  console.error('Request failed:', error);
  return { success: false, error: 'Network error' };
}
```

### **Environment Detection Pattern**
```typescript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://novara-mvp-production.up.railway.app'
  : 'http://localhost:3000';
```

### **Build Configuration Pattern**
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite"
}
```

## 🚨 **Emergency Procedures**

### **Rollback Deployment**
```bash
git revert HEAD
git push
```

### **Force Rebuild**
```bash
# Clear build cache and redeploy
git commit --allow-empty -m "Force rebuild"
git push
```

### **Database Backup**
```bash
# Export Airtable data
# Use Airtable export feature in dashboard
```

## 📞 **Support Resources**

- **Vercel Support:** Built-in chat in dashboard
- **Railway Support:** Built-in chat in dashboard
- **Airtable Support:** Email support
- **GitHub Issues:** Project-specific issues

---

**Last Updated:** July 23, 2025
**Version:** 1.0
**Status:** Production Ready 