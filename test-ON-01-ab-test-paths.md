# ON-01 A/B Test Path Testing Guide

## 🧪 **Quick Test Commands**

### **Test Control Path (6-question onboarding)**
```bash
# In frontend/.env.development
VITE_FORCE_ONBOARDING_PATH=control
```
**Expected Console**: `🧪 A/B Test: FORCED PATH = control`

### **Test Path (3-question Fast Lane)**
```bash
# In frontend/.env.development
VITE_FORCE_ONBOARDING_PATH=test
```
**Expected Console**: `🧪 A/B Test: FORCED PATH = test`

### **Random Path (50/50 split)**
```bash
# In frontend/.env.development
VITE_FORCE_ONBOARDING_PATH=
```
**Expected Console**: `🧪 A/B Test: Using deterministic session-based split = control/test`

## 🔄 **Testing Different Paths**

### **Method 1: Environment Variable (Recommended)**
1. Edit `frontend/.env.development`
2. Set `VITE_FORCE_ONBOARDING_PATH=control` or `test`
3. Refresh browser
4. Check console for forced path log

### **Method 2: Browser Console (Development Only)**
1. Open browser console (F12)
2. Run: `window.sessionStorage.clear()`
3. Refresh page
4. Check console for fresh path assignment

### **Method 3: A/B Test Storage Clear (Recommended)**
1. Open browser console (F12)
2. Run: `window.clearAllABTestStorage && window.clearAllABTestStorage()`
3. Refresh page
4. Check console for fresh path assignment

### **Method 4: Incognito Mode**
1. Open new incognito window
2. Visit http://localhost:4200
3. Check console for path assignment
4. Close incognito window
5. Open new incognito window for fresh session

## 📊 **Expected Console Output**

### **Forced Control:**
```
🧪 A/B Test: FORCED PATH = control
🧪 A/B Test: Development mode - not caching forced path
🧪 ON-01: Initialized A/B test path = control
```

### **Forced Test:**
```
🧪 A/B Test: FORCED PATH = test
🧪 A/B Test: Development mode - not caching forced path
🧪 ON-01: Initialized A/B test path = test
```

### **Random (Default):**
```
🧪 A/B Test: Using deterministic session-based split = control/test
🧪 A/B Test: Cached path decision = control/test
🧪 ON-01: Initialized A/B test path = control/test
```

## 🎯 **Success Criteria**
- ✅ Different paths show different console logs
- ✅ Forced paths work consistently
- ✅ Random paths show 50/50 distribution over multiple tests
- ✅ No console errors

## 🚀 **Next Steps**
Once you can successfully test different paths, we can proceed to Step 1.3: Database Integration 