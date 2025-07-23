# Quick Fix Reference Card

## 🚨 **Emergency Fixes (Most Common Issues)**

### **1. Vercel 404 Error**
**Problem:** Frontend shows 404 NOT_FOUND
**Quick Fix:**
```bash
# Check vite.config.ts - remove base path
# Ensure vercel.json exists in root
git add .
git commit -m "Fix Vercel deployment"
git push
```

### **2. Railway Build Fails (Exit Code 240)**
**Problem:** npm ci fails during Railway deployment
**Quick Fix:**
```bash
cd backend
rm package-lock.json
npm install
git add package-lock.json
git commit -m "Fix package-lock.json"
git push
```

### **3. TypeScript Build Errors**
**Problem:** Unused variable errors
**Quick Fix:**
```typescript
// Comment out unused variables
// const unusedVar = value; // Commented for future use
```

### **4. API Connection Fails**
**Problem:** Frontend can't connect to backend
**Quick Fix:**
```bash
# Check current Railway URL
curl https://novara-mvp-production.up.railway.app/api/health

# Update frontend/src/lib/api.ts with correct URL
# Rebuild and redeploy
```

### **5. CORS Errors**
**Problem:** Browser shows CORS policy errors
**Quick Fix:**
```javascript
// In backend/server.js - ensure CORS is configured
app.use(cors({
  origin: ['https://novara-mvp.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
```

## 🔧 **One-Liner Diagnostics**

### **Check Backend Health**
```bash
curl https://novara-mvp-production.up.railway.app/api/health
```

### **Check Frontend Status**
```bash
curl -I https://novara-mvp.vercel.app
```

### **Local Backend Test**
```bash
cd backend && npm start
```

### **Local Frontend Test**
```bash
cd frontend && npm run dev
```

### **Build Test**
```bash
cd frontend && npm run build
```

## 📋 **Configuration Checklist**

### **Vercel (Frontend)**
- [ ] `vercel.json` in root directory
- [ ] `frontend/vite.config.ts` has no base path
- [ ] `frontend/package.json` has correct build script
- [ ] Environment variables set in Vercel dashboard

### **Railway (Backend)**
- [ ] `backend/railway.toml` exists
- [ ] `backend/package.json` has correct start script
- [ ] Environment variables set in Railway dashboard
- [ ] `backend/package-lock.json` is up to date

### **API Configuration**
- [ ] `frontend/src/lib/api.ts` has correct backend URL
- [ ] Backend CORS is configured for frontend domain
- [ ] JWT secret is set in environment variables

## 🚀 **Deployment Commands**

### **Force Redeploy Frontend**
```bash
git commit --allow-empty -m "Force Vercel rebuild"
git push
```

### **Force Redeploy Backend**
```bash
git commit --allow-empty -m "Force Railway rebuild"
git push
```

### **Rollback Last Change**
```bash
git revert HEAD
git push
```

## 📞 **Quick Support**

### **Vercel Issues**
- Check: Dashboard → Deployments → Build Logs
- Support: Built-in chat in dashboard

### **Railway Issues**
- Check: Dashboard → Deployments → Runtime Logs
- Support: Built-in chat in dashboard

### **Airtable Issues**
- Check: Dashboard → API documentation
- Support: Email support

## 🎯 **Common Patterns**

### **Error Handling**
```typescript
try {
  const response = await apiClient.makeRequest(endpoint, options);
  return response.success ? { success: true, data: response.data } : { success: false, error: response.error };
} catch (error) {
  return { success: false, error: 'Network error' };
}
```

### **Environment Detection**
```typescript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://novara-mvp-production.up.railway.app'
  : 'http://localhost:3000';
```

---

**Remember:** Always test locally first, then deploy incrementally! 