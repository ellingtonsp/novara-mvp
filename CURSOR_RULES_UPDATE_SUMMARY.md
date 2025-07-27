# Cursor Rules Update Summary

## 🎯 Updates Made: July 27, 2025

### 📋 **Purpose**
Updated cursor rules to address:
1. **A/B Testing Validation Requirements**
2. **Legacy Function Protection**
3. **Database Schema Health & Consistency**

---

## 🔄 **Files Updated**

### 1. **`.cursor/rules/development.mdc`**
**Added**: MANDATORY A/B TESTING VALIDATION section

#### **New Requirements:**
- **ALWAYS conduct thorough A/B test validation** for any split testing features
- **Test distribution balance**: Run 20+ iterations to verify 50/50 split (within 30% variance)
- **Validate session consistency**: Same session ID must always return same path
- **Test both paths end-to-end**: Verify complete user journeys for each path
- **Check analytics tracking**: Ensure PostHog events fire correctly for each path

#### **A/B Test Validation Checklist:**
```bash
# 1. Distribution Test
node test-AB-distribution-validation.js

# 2. Path A Validation  
node test-path-A-validation.js

# 3. Path B Validation
node test-path-B-validation.js

# 4. End-to-End Journey Test
node test-AB-end-to-end.js

# 5. Analytics Validation
node test-AB-analytics.js
```

#### **Required Validation Steps:**
1. **Distribution Balance**: 40-60% split for each path
2. **Session Consistency**: Same session = same path every time
3. **User Journey A**: Complete flow from start to finish
4. **User Journey B**: Complete flow from start to finish  
5. **Analytics Events**: All events fire with correct properties
6. **No Regressions**: Existing functionality still works

#### **Legacy Function Protection:**
- **ALWAYS verify no legacy functions are broken** when adding new features
- **Test existing user journeys** after implementing new features
- **Run comprehensive regression tests** before deployment
- **Only replace legacy functions** when explicitly requested to do so
- **Document any breaking changes** and provide migration paths

### 2. **`.cursor/rules/database.mdc`**
**Added**: Schema Health & Consistency section

#### **New Database Rules:**
- **ALWAYS verify schema consistency** between environments
- **ALWAYS use correct table names** (check existing schema first)

#### **Schema Validation Commands:**
```bash
# Check SQLite schema
sqlite3 backend/data/novara-local.db ".schema"

# Validate table names
node scripts/validate-schema.js

# Check Airtable schema
node scripts/airtable-schema-validator.js
```

#### **Before Making Database Changes:**
1. **Check existing schema** in both environments
2. **Verify table names** are consistent
3. **Test schema changes** in local environment first
4. **Validate data types** match between environments
5. **Run migration tests** before deployment

---

## 🛠️ **New Tools Created**

### **`scripts/validate-schema.js`**
**Purpose**: Validates database schema consistency and table names

**Features:**
- ✅ Validates all expected tables are present
- ✅ Validates user table structure and columns
- ✅ Checks for unexpected tables/columns
- ✅ Provides detailed validation report
- ✅ Uses same `better-sqlite3` library as backend

**Usage:**
```bash
cd backend && node ../scripts/validate-schema.js
```

**Expected Output:**
```
🗄️ Schema Validation
===================
✅ Database connected successfully

📋 Found Tables:
  - users
  - daily_checkins
  - insights
  - insight_engagement
  - fmv_analytics

🔍 Validating Expected Tables:
  ✅ users
  ✅ daily_checkins
  ✅ insights
  ✅ insight_engagement
  ✅ fmv_analytics

👥 Validating Users Table Structure:
  Found columns: id, email, nickname, confidence_meds, confidence_costs, confidence_overall, primary_need, cycle_stage, top_concern, timezone, email_opt_in, status, created_at, medication_status, medication_status_updated, baseline_completed, onboarding_path

🔍 Validating Expected User Columns:
  ✅ id
  ✅ email
  ✅ nickname
  ✅ confidence_meds
  ✅ confidence_costs
  ✅ confidence_overall
  ✅ primary_need
  ✅ cycle_stage
  ✅ top_concern
  ✅ timezone
  ✅ email_opt_in
  ✅ status
  ✅ medication_status
  ✅ medication_status_updated
  ✅ baseline_completed
  ✅ onboarding_path
  ✅ created_at

📊 Validation Summary:
====================
✅ Tables Found: 5/5
✅ User Columns: 17/17
✅ All Expected Tables: YES
✅ All Expected Columns: YES

🎉 Schema validation PASSED!
All expected tables and columns are present.
```

---

## 🎯 **Impact & Benefits**

### **A/B Testing Validation**
- **Prevents incomplete A/B test implementations**
- **Ensures proper distribution balance**
- **Validates both user journeys work correctly**
- **Protects against analytics tracking issues**

### **Legacy Function Protection**
- **Prevents breaking existing functionality**
- **Ensures regression testing is performed**
- **Maintains system stability**
- **Documents breaking changes properly**

### **Schema Health & Consistency**
- **Prevents table name mismatches**
- **Ensures schema consistency between environments**
- **Validates database changes before deployment**
- **Provides clear validation tools**

---

## 📋 **Implementation Checklist**

### **For A/B Testing Features:**
- [ ] Run distribution validation (20+ iterations)
- [ ] Test session consistency
- [ ] Validate both user journeys end-to-end
- [ ] Check analytics events fire correctly
- [ ] Run regression tests on existing functionality
- [ ] Document validation results

### **For Database Changes:**
- [ ] Run schema validation script
- [ ] Check existing schema in both environments
- [ ] Verify table names match expectations
- [ ] Test schema changes locally first
- [ ] Validate data types match between environments
- [ ] Run migration tests before deployment

### **For New Features:**
- [ ] Test existing user journeys still work
- [ ] Run comprehensive regression tests
- [ ] Verify no legacy functions are broken
- [ ] Document any breaking changes
- [ ] Provide migration paths if needed

---

## 🚀 **Next Steps**

1. **Use these rules** for all future A/B testing implementations
2. **Run schema validation** before any database changes
3. **Follow legacy function protection** guidelines
4. **Update validation scripts** as schema evolves
5. **Document any additional validation requirements**

---

## ✅ **Validation Complete**

**Status**: ✅ **CURSOR RULES UPDATED**  
**Date**: July 27, 2025  
**Impact**: Enhanced development workflow with mandatory validation requirements

**The cursor rules now include comprehensive A/B testing validation, legacy function protection, and database schema health requirements.** 