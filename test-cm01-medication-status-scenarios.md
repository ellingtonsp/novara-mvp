# CM-01 Medication Status Flag - Testing Guide

## 🎯 **Problem Solved**

**Issue**: Not all patients are actively taking medications during their fertility journey. Some are in consultation phases, waiting periods, or between cycles.

**Previous Problem**: 
- Asking medication confidence questions when patients aren't on meds created confusion
- Mixed sentiment analysis incorrectly flagged "not applicable" as concerning
- No differentiation between "confused about meds I'm taking" vs "not taking meds"

**Solution**: Medication status flag with conditional question logic.

---

## 🧪 **Test Scenarios**

### **Scenario 1: New Patient - No Medication Status Set**
**Input:**
- First check-in for new patient
- `user.medication_status` is undefined/null

**Expected Result:**
- Medication status question appears first:
  - "Are you currently taking fertility medications?"
  - Options: "Yes, currently taking medications" | "Starting medications soon" | "Not taking medications yet" | "Between medication cycles"
- Required field - must be answered to proceed

### **Scenario 2: Patient Currently Taking Medications**
**Input:**
- `user.medication_status = 'taking'`
- Medication dimension is focus

**Expected Result:**
- Shows: "How confident are you feeling about your medication protocol today?" (slider)
- Follow-up: Medication concern or momentum question based on confidence
- Sentiment analysis works as before for medication confusion

### **Scenario 3: Patient Not Currently on Medications**
**Input:**
- `user.medication_status = 'not_taking'`
- Medication dimension is focus

**Expected Result:**
- Shows: "How prepared do you feel for when you start medications?" (slider)
- Follow-up: "Any questions or concerns about upcoming medications?" (text)
- Low readiness (≤3) triggers mixed sentiment with preparation-specific copy

### **Scenario 4: Patient Starting Soon**
**Input:**
- `user.medication_status = 'starting_soon'`
- Medication readiness: 2/10
- Preparation concern: "Really nervous about injections"

**Expected Result:**
- **Sentiment**: `mixed`
- **Critical Concerns**: `["medication_preparation"]`
- **Copy Variant**: Medication preparation variant
- **Title**: "It's natural to feel uncertain about starting medications"
- **Message**: Acknowledges preparation anxiety as normal and common

### **Scenario 5: Between Cycles**
**Input:**
- `user.medication_status = 'between_cycles'`
- General positive mood but readiness concerns

**Expected Result:**
- Uses preparation readiness questions
- Can trigger mixed sentiment for cycle preparation anxiety
- Differentiated from active medication confusion

---

## 🔬 **Technical Implementation**

### **Backend Changes:**
1. **Question Generation Logic**: Modified `generatePersonalizedCheckInQuestions()` to check `user.medication_status`
2. **Conditional Questions**: Different questions based on medication status
3. **New Question Types**: `medication_readiness_today`, `medication_preparation_concern`

### **Frontend Changes:**
1. **Sentiment Analysis**: Added `medication_readiness_today` to confidence factors
2. **Critical Concerns**: New `medication_preparation` concern type
3. **Copy Variants**: Specialized variants for preparation anxiety

### **Analytics Enhancement:**
```javascript
confidence_factors: {
  medication: 8,              // For patients on medications
  medication_readiness: 2,    // For patients not on medications
  overall: 7
}

critical_concerns: ["medication_preparation"]  // vs ["medication"]
```

---

## 🎯 **Copy Variant Examples**

### **Active Medication Confusion:**
- **Title**: "Your positivity is beautiful, but let's clear up that medication confusion"
- **Context**: Patient taking medications, low confidence (≤3)
- **Action**: "Get medication clarity"

### **Preparation Anxiety:**
- **Title**: "It's natural to feel uncertain about starting medications"
- **Context**: Patient not on medications, low readiness (≤3)
- **Action**: "Medication preparation guide"

### **Between Cycles:**
- **Title**: "Preparation anxiety is so common in this journey"
- **Context**: Patient between cycles, preparation concerns
- **Action**: "What to expect with medications"

---

## 🚀 **Testing Steps**

### **1. Test New Patient Flow**
1. Create new user account
2. Complete onboarding
3. Submit first check-in
4. **Verify**: Medication status question appears and is required

### **2. Test Status-Based Questions**
1. Set different medication statuses in user profile
2. Submit check-ins when medication is the focus dimension
3. **Verify**: Appropriate questions shown based on status

### **3. Test Sentiment Analysis**
1. Submit check-in with:
   - `medication_status: 'starting_soon'`
   - `medication_readiness_today: 2`
   - `medication_preparation_concern: "Really scared about injections"`
   - `journey_reflection_today: "Feeling hopeful but nervous"`
2. **Verify**: Mixed sentiment detected with preparation-specific copy

### **4. Test Analytics**
1. Check browser console for analytics events
2. **Verify**: `confidence_factors.medication_readiness` tracked
3. **Verify**: `critical_concerns: ["medication_preparation"]` logged

---

## ✅ **Success Criteria**

- [x] **Conditional Logic**: Questions adapt based on medication status
- [x] **No Confusion**: Patients not on meds don't get inappropriate medication confidence questions
- [x] **Preparation Support**: Specialized copy for pre-medication anxiety
- [x] **Analytics Distinction**: Different tracking for active vs preparation concerns
- [x] **Patient-First**: No patient sees irrelevant or confusing questions

---

## 🔄 **Future Profile Management**

This temporary solution prepares for robust profile management by:
- Establishing medication status data structure
- Creating conditional question patterns
- Building specialized copy variant system
- Setting up analytics tracking for different concern types

When full profile management is implemented, this status flag can be managed through user settings rather than one-time questions.

---

This enhancement ensures **every patient gets relevant, helpful questions** regardless of where they are in their medication journey! 🎯 