# 🧪 Frontend Authentication Fix Testing Script

## Pre-Test Setup

### 1. Start Local Environment [[memory:4173922]]
```bash
# Use stable port strategy to avoid conflicts
./scripts/start-dev-stable.sh
```

### 2. Wait for Both Services
- ✅ Backend: http://localhost:9002/api/health
- ✅ Frontend: http://localhost:4200

---

## 🎯 Test Scenario: Complete User Journey

### Step 1: Create New Test User
1. **Open Frontend**: http://localhost:4200
2. **Click "Get Started"** 
3. **Fill Out Onboarding Form**:
   - **Email**: `testuser-auth-fix@local.test`
   - **Nickname**: `AuthFixTester` 
   - **Confidence Levels**: Set varied levels (e.g., meds: 3, costs: 7, overall: 5)
   - **Primary Need**: Select any option
   - **Top Concern**: Enter something specific like "Testing authentication"
   - **Cycle Stage**: Select any stage

4. **Submit Signup** → Should auto-login and redirect to dashboard

### Step 2: Verify Welcome State
**✅ Expected Results**:
- Welcome message shows: `"Welcome to Novara, AuthFixTester!"`
- **❌ Should NOT see**: Any reference to "Monkey"
- Daily insights area should show: "Complete a few check-ins to unlock daily insights"

### Step 3: Submit First Check-In
1. **Select Moods**: Choose multiple moods (e.g., "hopeful, anxious")
2. **Set Confidence**: Move slider to any value (e.g., 6/10)
3. **Fill Personalized Questions**: Answer any additional questions based on your onboarding
4. **Click "Complete Enhanced Check-in"**

**✅ Expected Results**:
- Success message appears
- Immediate insight shows with your **actual nickname** (`AuthFixTester`)
- **❌ Should NOT see**: "Monkey" anywhere in the insight
- Form resets for next check-in

### Step 4: Check Daily Insights Panel  
1. **Look at Daily Insights section** (should appear after first check-in)

**✅ Expected Results**:
- Insight title includes **your nickname**: `"AuthFixTester, [insight message]"`
- Analysis shows: **"1 check-ins analyzed"** (not 0)
- **❌ Should NOT see**: 
  - "Monkey" in title or message
  - "0 check-ins analyzed"
  - Generic fallback messages

### Step 5: Submit Second Check-In
1. **Change moods**: Select different moods  
2. **Adjust confidence**: Set different value
3. **Submit again**

**✅ Expected Results**:
- New insight generated
- Analysis now shows: **"2 check-ins analyzed"**  
- Insight references **your data and patterns**
- Still uses **your correct nickname**

### Step 6: Refresh Page Test
1. **Refresh browser** (F5 or Cmd+R)
2. **Wait for page to reload**

**✅ Expected Results**:
- Still logged in (JWT working)
- Dashboard shows **your nickname** in welcome message
- Daily insights still show **correct check-in count**
- **❌ Should NOT see**: Authentication errors or "Monkey" fallback

---

## 🔍 Verification Checklist

### ✅ Authentication Working Correctly
- [ ] User signup creates account with correct details
- [ ] Auto-login after signup works
- [ ] JWT token persists across page refreshes
- [ ] Welcome messages use actual user nickname
- [ ] No fallback to "monkey@gmail.com" test account

### ✅ Check-In System Working  
- [ ] Check-ins submit successfully to `/api/checkins` endpoint
- [ ] Immediate insights use correct user name
- [ ] Form resets properly after submission
- [ ] No errors in browser console

### ✅ Daily Insights Working
- [ ] Insights show after first check-in
- [ ] Check-in count increments correctly (1, then 2, etc.)
- [ ] Insight content is personalized to actual user
- [ ] Analysis data references correct user ID

### ❌ No "Monkey" References
- [ ] No "Monkey" in insight titles
- [ ] No "Monkey" in insight messages  
- [ ] No "Monkey" in welcome messages
- [ ] No "monkey@gmail.com" in network requests (check browser dev tools)

---

## 🚨 Troubleshooting

### If You See "Monkey" References:
1. **Check Network Tab**: Look for API calls to old `/api/daily-checkin-enhanced` 
2. **Check Console**: Look for authentication errors
3. **Verify Branch**: Ensure you're on `staging` branch with latest fixes

### If Check-in Count Shows 0:
1. **Check Backend Logs**: Look for user lookup errors
2. **Verify Database**: Ensure SQLite database has your user record
3. **Check API Response**: Look at `/api/insights/daily` response in Network tab

### If Authentication Fails:
1. **Clear Browser Data**: Clear localStorage and cookies
2. **Check JWT Token**: Verify token exists in localStorage
3. **Restart Services**: Kill and restart both frontend and backend

---

## 📊 Success Criteria

### 🎉 Test PASSES if:
- ✅ All user interactions use **correct nickname** ("AuthFixTester")
- ✅ Check-in count **increments properly** (1, 2, 3...)
- ✅ Insights are **personalized** to actual user data
- ✅ **Zero "Monkey" references** anywhere in the UI
- ✅ Authentication works **consistently** across page refreshes

### ❌ Test FAILS if:
- Any "Monkey" references appear
- Check-in count stays at 0
- Generic/fallback insights instead of personalized ones
- Authentication errors or token issues

---

## 🎯 Expected Timeline
- **Setup**: 2 minutes
- **Testing**: 5-8 minutes  
- **Verification**: 2 minutes
- **Total**: ~10 minutes

**When test passes**: Authentication fix is working correctly! ✅  
**When test fails**: Need to debug specific failure points above. ❌ 