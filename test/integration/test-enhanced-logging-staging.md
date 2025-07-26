# 🔍 Test Enhanced Airtable Logging - Staging Environment

## 🎯 **Purpose**
Test the enhanced Airtable logging to identify why check-ins appear to save but don't persist in production.

## 📋 **Pre-Test Setup**
1. ✅ Enhanced logging deployed to staging
2. ✅ Staging environment accessible
3. ✅ Airtable credentials configured in staging

---

## 🧪 **Test Steps**

### **Step 1: Access Staging Environment**
```bash
# Staging URLs
Frontend: https://novara-mvp-staging.vercel.app
Backend: https://novara-staging-staging.up.railway.app
```

### **Step 2: Monitor Backend Logs**
Open Railway Dashboard → Staging Backend Service → Logs tab to monitor real-time logs.

### **Step 3: Submit Test Check-in**
1. Open staging frontend: https://novara-mvp-staging.vercel.app
2. Complete onboarding or login with existing user
3. Submit a daily check-in with these test values:
   - **Mood**: "test-enhanced-logging"
   - **Confidence**: 7
   - **Primary Concern**: "Testing enhanced logging"
   - **Additional Notes**: "This is a test for enhanced logging"

### **Step 4: Monitor Enhanced Logs**
In Railway logs, look for these enhanced log entries:

#### **Expected Request Logs:**
```
🌩️ Production: Making POST request to Airtable: https://api.airtable.com/v0/appEOWvLjCn5c7Ght/DailyCheckins
🌩️ Base ID: appEOWvLjCn5c7Ght
🌩️ Has API Key: true
🌩️ Request Data: {
  "fields": {
    "user_id": ["recXXXXXXXXXXXXX"],
    "mood_today": "test-enhanced-logging",
    "confidence_today": 7,
    "primary_concern_today": "Testing enhanced logging",
    "date_submitted": "2025-07-24"
  }
}
```

#### **Expected Success Response:**
```
✅ Production: Airtable POST request successful 201
✅ Response Status: 201
✅ Response Data: {
  "id": "recYYYYYYYYYYYYY",
  "fields": {
    "user_id": ["recXXXXXXXXXXXXX"],
    "mood_today": "test-enhanced-logging",
    "confidence_today": 7,
    "primary_concern_today": "Testing enhanced logging",
    "date_submitted": "2025-07-24"
  },
  "createdTime": "2025-07-24T..."
}
```

#### **Expected Error Response (if issue persists):**
```
❌ Production: Airtable POST request failed
❌ Error Status: 422
❌ Error Data: {
  "error": {
    "type": "INVALID_VALUE_FOR_COLUMN",
    "message": "Invalid value for column 'user_id'"
  }
}
❌ Error Message: Request failed with status code 422
```

### **Step 5: Verify Data Persistence**
1. Wait 30 seconds after check-in submission
2. Refresh the insights modal or daily check-in page
3. Check if the check-in appears in the count
4. Look for "0 check-ins analyzed" vs actual count

### **Step 6: Test Retrieval**
Monitor logs for check-in retrieval requests:
```
🌩️ Production: Making GET request to Airtable: https://api.airtable.com/v0/appEOWvLjCn5c7Ght/DailyCheckins?filterByFormula=SEARCH('recXXXXXXXXXXXXX',ARRAYJOIN({user_id}))&maxRecords=7
```

---

## 📊 **Expected Results**

### **✅ Success Scenario:**
- Enhanced logs show successful POST (201) with valid record ID
- Enhanced logs show successful GET with check-ins returned
- Frontend shows correct check-in count (not "0 check-ins analyzed")
- Data persists after refresh

### **❌ Issue Identified:**
- Enhanced logs show successful POST but failed GET
- Enhanced logs show field validation errors
- Enhanced logs show authentication/permission errors
- Enhanced logs show rate limiting errors

---

## 🔍 **What to Look For**

### **1. Field Validation Issues:**
- Field name mismatches (case sensitivity)
- Field type mismatches (text vs number vs date)
- Required field validation failures
- Linked record format issues

### **2. Authentication Issues:**
- API key permissions (read-only vs read-write)
- Base ID mismatches
- Expired or invalid API keys

### **3. Data Format Issues:**
- Date format mismatches (YYYY-MM-DD vs other formats)
- Linked record array format issues
- Special characters in field values

### **4. Rate Limiting:**
- Too many requests in short time
- Airtable API quota exceeded

---

## 📝 **Documentation**

### **Record Your Findings:**
1. **Request Data**: Copy the exact request data from logs
2. **Response Data**: Copy the exact response data from logs
3. **Error Messages**: Note any error messages or status codes
4. **Timing**: Note when requests are made and responses received
5. **Persistence**: Document whether data persists after submission

### **Screenshots:**
- Railway logs showing enhanced logging output
- Frontend showing check-in count before/after
- Any error messages displayed to user

---

## 🚨 **Critical Questions to Answer**

1. **Does the POST request succeed?** (Status 201)
2. **Does the response contain a valid record ID?**
3. **Does the GET request find the created record?**
4. **Are there any field validation errors?**
5. **Are there any authentication errors?**
6. **Does the data persist after refresh?**

---

## 📞 **Next Steps**

After completing this test:
1. Share the enhanced log output
2. Document any error messages found
3. Note the exact behavior observed
4. Provide screenshots of logs and frontend

This will help identify the exact root cause of the check-in storage issue. 