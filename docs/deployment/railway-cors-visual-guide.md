# Railway CORS Setup - Visual Guide

## 🚀 Quick 3-Step Setup

### Step 1: Open Railway Variables
```
Railway Dashboard → Your Project → Click Service → Variables Tab
```

### Step 2: Add ALLOWED_ORIGINS
Click "New Variable" and add:

| Variable Name | Value |
|--------------|--------|
| ALLOWED_ORIGINS | `https://novarafertility.com,https://www.novarafertility.com` |

### Step 3: Save & Auto-Deploy
Click "Add" → Railway automatically redeploys → Done! ✅

---

## 📸 Visual Step-by-Step

### 1️⃣ Navigate to Your Service
```
┌─────────────────────────────────────┐
│  Railway Dashboard                  │
│                                     │
│  Projects:                          │
│  ┌────────────────┐                │
│  │ 🚂 novara-mvp  │ ← Click this   │
│  └────────────────┘                │
│                                     │
│  Services:                          │
│  ┌─────────────────────────┐       │
│  │ 🟢 novara-mvp-production│ ← Then this
│  └─────────────────────────┘       │
└─────────────────────────────────────┘
```

### 2️⃣ Go to Variables Tab
```
┌─────────────────────────────────────┐
│  Service: novara-mvp-production     │
│                                     │
│  [Settings] [Variables] [Logs]      │
│              ↑                      │
│         Click this tab              │
└─────────────────────────────────────┘
```

### 3️⃣ Add New Variable
```
┌─────────────────────────────────────┐
│  Environment Variables              │
│                                     │
│  [+ New Variable]  ← Click this     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Variable name:              │   │
│  │ ALLOWED_ORIGINS             │   │
│  │                             │   │
│  │ Value:                      │   │
│  │ https://novarafertility.com,│   │
│  │ https://www.novarafertility │   │
│  │ .com                        │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Add] ← Click to save              │
└─────────────────────────────────────┘
```

### 4️⃣ Automatic Deployment
```
┌─────────────────────────────────────┐
│  🔄 Deploying...                    │
│                                     │
│  Railway automatically:             │
│  ✓ Detects the change               │
│  ✓ Rebuilds your service            │
│  ✓ Deploys with new CORS settings   │
│                                     │
│  Status: Deploying → Active 🟢      │
│  (Usually takes 1-2 minutes)        │
└─────────────────────────────────────┘
```

---

## 🧪 Quick Test

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Visit https://www.novarafertility.com
4. Try to log in

**✅ Success looks like:**
```
Request URL: https://novara-mvp-production.up.railway.app/api/auth/login
Status: 200 OK
```

**❌ CORS Error looks like:**
```
Access to fetch at 'https://novara-mvp...' from origin 
'https://www.novarafertility.com' has been blocked by CORS policy
```

---

## 🎯 Pro Tip: Multiple Environments

Set different origins for each environment:

**Production Service:**
```
ALLOWED_ORIGINS=https://novarafertility.com,https://www.novarafertility.com
```

**Staging Service:**
```
ALLOWED_ORIGINS=https://staging.novarafertility.com,https://test.novarafertility.com
```

**Development Service:**
```
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200
```

---

## 🆘 Need Help?

Check Railway logs:
1. Click on your service
2. Go to "Deployments" tab
3. Click latest deployment
4. Search for "CORS" in logs

You'll see messages like:
```
✅ CORS: Allowed origin https://www.novarafertility.com
❌ CORS: Rejected origin https://unknown-site.com
```