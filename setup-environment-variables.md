# Novara MVP - Environment Variables Setup Guide

## 🚨 **Critical Fixes Needed**

Based on the production regression test, these environment variables need to be configured:

### **1. 🔑 Airtable API Key (CRITICAL - Blocking user registration)**

**Problem:** Current Airtable API key is invalid/expired  
**Impact:** Users cannot register or login  

**Steps to Fix:**
1. **Go to [airtable.com/account](https://airtable.com/account)**
2. **Click "Generate API key" or "Personal access tokens"**
3. **Copy the new API key**
4. **Go to [Railway Dashboard](https://railway.app)**
5. **Navigate to your Novara Backend project**
6. **Go to Variables tab**
7. **Update `AIRTABLE_API_KEY`** with the new key
8. **The service will auto-redeploy**

### **2. 📊 Google Analytics (Missing analytics tracking)**

**Problem:** GA4 environment variable not set in Vercel  
**Impact:** No user analytics or tracking  

**Steps to Fix:**
1. **Go to [Vercel Dashboard](https://vercel.com)**
2. **Navigate to your Novara MVP project**
3. **Go to Settings → Environment Variables**
4. **Add new variable:**
   - **Name:** `VITE_GA_MEASUREMENT_ID`
   - **Value:** `G-QP9XJD6QFS`
   - **Environment:** Production (and Preview if desired)
5. **Click "Save"**
6. **Go to Deployments tab**
7. **Click "Redeploy" on the latest deployment**

### **3. 🚂 Railway Environment Variables Checklist**

Ensure these are set in Railway:

```env
AIRTABLE_API_KEY=your_new_airtable_token_here
AIRTABLE_BASE_ID=your_airtable_base_id_here
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=production
```

**To Check/Update:**
1. Go to [Railway Dashboard](https://railway.app)
2. Navigate to Novara Backend project
3. Click Variables tab
4. Verify all variables are present and correct

### **4. 🎯 Vercel Environment Variables Checklist**

Ensure this is set in Vercel:

```env
VITE_GA_MEASUREMENT_ID=G-QP9XJD6QFS
```

**To Check/Update:**
1. Go to [Vercel Dashboard](https://vercel.com)
2. Navigate to Novara MVP project
3. Go to Settings → Environment Variables
4. Verify GA4 measurement ID is set

## **🧪 Testing After Fixes**

After making these changes, run the test again:

```bash
node fix-and-test-production.js
```

**Expected Results:**
- ✅ Airtable Write Access: User creation successful
- ✅ Google Analytics GA4: GA4 script detected
- ✅ User Authentication: Login successful
- ✅ Daily Check-in: Check-in saved

## **📋 Priority Order**

1. **🔥 CRITICAL:** Fix Airtable API key (blocks all user functionality)
2. **🎯 HIGH:** Add GA4 environment variable (needed for analytics)
3. **⚡ MEDIUM:** Redeploy frontend (ensures all components are deployed)

## **🔍 Verification Steps**

After making changes:

1. **Test user registration:** Try signing up at https://novara-mvp.vercel.app
2. **Check analytics:** Open browser dev tools and look for GA4 requests
3. **Test daily check-in:** Complete a check-in flow
4. **Verify insights:** Ensure insights are generated

## **📞 Need Help?**

If you encounter issues:
1. Check the Railway logs for backend errors
2. Check Vercel deployment logs for frontend issues
3. Verify Airtable base ID and table structure
4. Run the production test script again

---

**Last Updated:** December 2024  
**Test Script:** `fix-and-test-production.js` 