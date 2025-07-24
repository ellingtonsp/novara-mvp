# Airtable Schema Issues & Solutions

## 🚨 **Issue Identified: Restricted Select Fields**

### **Problem**
The onboarding signup was failing with the error:
```
Signup failed: Airtable POST failed: Unprocessable Entity - {"error":{"type":"INVALID_MULTIPLE_CHOICE_OPTIONS","message":"Insufficient permissions to create new select option \"retrieval\""}}
```

### **Root Cause**
The Airtable `cycle_stage` field is configured as a **restricted select field** that only allows specific predefined values. The frontend was trying to use values that weren't in the allowed list.

## 📊 **Allowed vs. Rejected Values**

### **Cycle Stage Field**
| Value | Status | Notes |
|-------|--------|-------|
| `considering` | ✅ **ALLOWED** | Just considering IVF |
| `ivf_prep` | ✅ **ALLOWED** | Preparing for IVF |
| `stimulation` | ✅ **ALLOWED** | In stimulation phase |
| `transfer` | ✅ **ALLOWED** | Transfer stage |
| `retrieval` | ❌ **REJECTED** | Not in allowed list |
| `egg_retrieval` | ❌ **REJECTED** | Not in allowed list |
| `tww` | ❌ **REJECTED** | Not in allowed list |
| `pregnant` | ❌ **REJECTED** | Not in allowed list |
| `between_cycles` | ❌ **REJECTED** | Not in allowed list |

### **Primary Need Field**
| Value | Status | Notes |
|-------|--------|-------|
| `emotional_support` | ✅ **ALLOWED** | Emotional support |
| `medication_guidance` | ✅ **ALLOWED** | Medication guidance |
| `financial_planning` | ✅ **ALLOWED** | Financial planning |
| `procedure_info` | ✅ **ALLOWED** | Procedure information |
| `community` | ✅ **ALLOWED** | Community connection |

## 🔧 **Solution Applied**

### **1. Frontend Updates**
Updated `frontend/src/components/NovaraLanding.tsx` to only use allowed values:

```tsx
// Before (causing errors)
<SelectItem value="retrieval">Around retrieval</SelectItem>
<SelectItem value="tww">Two-week wait</SelectItem>
<SelectItem value="pregnant">Pregnant</SelectItem>
<SelectItem value="between_cycles">Between cycles</SelectItem>

// After (working)
// Removed all rejected values, keeping only:
<SelectItem value="considering">Just considering IVF</SelectItem>
<SelectItem value="ivf_prep">Preparing for IVF</SelectItem>
<SelectItem value="stimulation">In stimulation phase</SelectItem>
<SelectItem value="transfer">Transfer stage</SelectItem>
```

### **2. Schema Validation**
Created comprehensive validation scripts:
- `scripts/airtable-schema-validator.js` - Validates all frontend values
- `scripts/test-simple-airtable.js` - Tests specific field values
- `scripts/find-allowed-values.js` - Discovers allowed values

### **3. Automated Validation**
Added schema validation to deployment pipeline:
```bash
npm run validate-schema  # New command
npm run pre-deploy       # Now includes schema validation
```

## 🛡️ **Prevention Measures**

### **1. Schema Validation in CI/CD**
The deployment pipeline now includes:
```bash
npm run validate-environments  # Environment validation
npm run validate-schema        # Airtable schema validation
npm run health-check:staging   # Health checks
```

### **2. Frontend Field Value Constants**
Created centralized field value definitions in `scripts/airtable-schema-validator.js`:
```javascript
const FRONTEND_FIELD_VALUES = {
  cycle_stage: [
    'considering',
    'ivf_prep',
    'stimulation',
    'transfer'
  ],
  primary_need: [
    'emotional_support',
    'medication_guidance',
    'financial_planning',
    'procedure_info',
    'community'
  ]
};
```

### **3. Testing Scripts**
Created multiple testing scripts to catch issues early:
- `scripts/test-airtable-schema.js` - Comprehensive schema testing
- `scripts/test-simple-airtable.js` - Quick field value testing
- `scripts/find-allowed-values.js` - Discovery of allowed values

## 📋 **Best Practices**

### **1. Always Test New Field Values**
Before adding new select options to the frontend:
```bash
node scripts/test-simple-airtable.js
```

### **2. Use Schema Validator**
Run schema validation before any deployment:
```bash
npm run validate-schema
```

### **3. Check Airtable Configuration**
When setting up new select fields in Airtable:
- **Restricted**: Only predefined values allowed (current setup)
- **Unrestricted**: New values can be created automatically

### **4. Document Field Values**
Keep field value documentation updated in:
- `scripts/airtable-schema-validator.js`
- This documentation file
- Frontend component comments

## 🔍 **Debugging Schema Issues**

### **1. Identify the Problem**
Look for these error patterns:
```
"INVALID_MULTIPLE_CHOICE_OPTIONS"
"Insufficient permissions to create new select option"
```

### **2. Find Allowed Values**
```bash
node scripts/find-allowed-values.js
```

### **3. Test Specific Values**
```bash
node scripts/test-simple-airtable.js
```

### **4. Validate All Frontend Values**
```bash
npm run validate-schema
```

## 🚀 **Future Improvements**

### **1. Airtable Schema Management**
Consider using Airtable's schema API to:
- Automatically discover allowed values
- Validate schema changes
- Generate frontend constants

### **2. Enhanced Validation**
Add validation for:
- Field types (text, number, date, etc.)
- Required fields
- Field length limits
- Data format requirements

### **3. Schema Documentation**
Create automated schema documentation that:
- Lists all fields and their types
- Shows allowed values for select fields
- Provides examples of valid data

## 📞 **Support**

If you encounter schema issues:
1. Run `npm run validate-schema` to identify the problem
2. Check this documentation for allowed values
3. Update frontend to use only allowed values
4. Test with `node scripts/test-simple-airtable.js`

---

**Remember**: Always validate schema changes before deploying to prevent user-facing errors! 