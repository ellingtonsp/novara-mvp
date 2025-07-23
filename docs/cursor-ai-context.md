# Cursor AI Project Context

## 🎯 **Project Overview**
**Novara MVP** - Emotionally intelligent IVF support app with React frontend, Node.js backend, and Airtable database.

## 🏗️ **Architecture**
- **Frontend:** React + TypeScript + Vite (deployed on Vercel)
- **Backend:** Node.js + Express (deployed on Railway)
- **Database:** Airtable (user data, analytics, insights)
- **Authentication:** JWT tokens
- **Deployment:** Vercel (frontend) + Railway (backend)

## 📁 **Key Files & Their Purpose**

### **Configuration Files**
- `vercel.json` - Root Vercel deployment config (builds frontend)
- `frontend/vite.config.ts` - Vite build configuration (no base path)
- `backend/railway.toml` - Railway backend deployment config
- `frontend/railway.toml` - Railway frontend backup config

### **API & Data Flow**
- `frontend/src/lib/api.ts` - API client (connects to Railway backend)
- `backend/server.js` - Express server with all endpoints
- `backend/routes/` - API route handlers
- `backend/models/` - Data models and Airtable integration

### **Core Components**
- `frontend/src/components/NovaraLanding.tsx` - Main app component
- `frontend/src/contexts/AuthContext.tsx` - User authentication state
- `frontend/src/components/DailyCheckinForm.tsx` - Daily check-in form
- `frontend/src/components/DailyInsightsDisplay.tsx` - Insights display

## 🔧 **Current Production URLs**
- **Frontend:** https://novara-mvp.vercel.app
- **Backend:** https://novara-mvp-production.up.railway.app
- **Health Check:** https://novara-mvp-production.up.railway.app/api/health

## 🚨 **Common Issues & Quick Fixes**

### **1. Vercel 404 Errors**
- **Cause:** Vite base path configuration
- **Fix:** Remove `base: '/novara-mvp/'` from `vite.config.ts`

### **2. Railway Build Failures**
- **Cause:** Package-lock.json out of sync
- **Fix:** `rm package-lock.json && npm install`

### **3. API Connection Issues**
- **Cause:** Backend URL changed
- **Fix:** Update `frontend/src/lib/api.ts` with current Railway URL

### **4. TypeScript Build Errors**
- **Cause:** Unused variables
- **Fix:** Comment out unused variables

## 📋 **Environment Variables**

### **Backend (Railway)**
```
NODE_ENV=production
PORT=$PORT
AIRTABLE_API_KEY=your_key
AIRTABLE_BASE_ID=your_base_id
JWT_SECRET=your_secret
```

### **Frontend (Vercel)**
```
VITE_API_URL=https://novara-mvp-production.up.railway.app
```

## 🎯 **Development Workflow**

### **Local Development**
```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run dev
```

### **Production Deployment**
```bash
# Push to main branch triggers auto-deployment
git add .
git commit -m "Description"
git push
```

### **Testing**
```bash
# Backend health
curl https://novara-mvp-production.up.railway.app/api/health

# Frontend status
curl -I https://novara-mvp.vercel.app
```

## 🔍 **Debugging Strategy**

### **1. Identify Issue Type**
- **Build Error:** Check package.json, dependencies, TypeScript
- **Runtime Error:** Check server logs, API responses
- **Deployment Error:** Check platform-specific configs

### **2. Check Logs**
- **Vercel:** Dashboard → Deployments → Build Logs
- **Railway:** Dashboard → Deployments → Runtime Logs

### **3. Verify Configuration**
- **Frontend:** `vercel.json`, `vite.config.ts`, `package.json`
- **Backend:** `railway.toml`, `package.json`, environment variables

## 📚 **Key Patterns**

### **Error Handling**
```typescript
try {
  const response = await apiClient.makeRequest(endpoint, options);
  return response.success ? { success: true, data: response.data } : { success: false, error: response.error };
} catch (error) {
  return { success: false, error: 'Network error' };
}
```

### **API Client Pattern**
```typescript
const API_BASE_URL = 'https://novara-mvp-production.up.railway.app';

export const apiClient = {
  async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    // Implementation
  }
};
```

### **Build Configuration**
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite"
}
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

## 📞 **Support Resources**
- **Vercel:** Built-in chat in dashboard
- **Railway:** Built-in chat in dashboard
- **Airtable:** Email support
- **Documentation:** `docs/production-deployment-guide.md`

---

**Last Updated:** July 23, 2025
**Status:** Production Ready
**Repository:** https://github.com/ellingtonsp/novara-mvp 