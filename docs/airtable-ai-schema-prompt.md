# Airtable AI Schema Creation Prompt
**For Novara MVP - CM-01 & AN-01 Features**

---

## 🤖 **PROMPT FOR AIRTABLE AI ASSISTANT:**

Please create the following database schema enhancements for our fertility tracking application. **Only add the fields and tables listed below** - do not modify existing schema:

### **1. ENHANCE EXISTING `DailyCheckins` TABLE**
Add these new fields to the existing DailyCheckins table:

**CM-01 Sentiment Analysis Fields:**
- `journey_reflection_today` → Long text (for universal sentiment capture)
- `sentiment` → Single select: positive, negative, neutral
- `sentiment_confidence` → Number (decimal, 0.0 to 1.0)  
- `sentiment_scores` → Long text (for JSON sentiment data)
- `sentiment_processing_time` → Number (decimal, milliseconds)

**CM-01 Dynamic Questionnaire Fields:**
- `medication_confidence_today` → Number (1-10 scale)
- `medication_concern_today` → Long text
- `medication_momentum` → Long text (positive medication experiences)
- `financial_stress_today` → Number (1-10 scale)  
- `financial_concern_today` → Long text
- `financial_momentum` → Long text (positive financial developments)
- `journey_readiness_today` → Number (1-10 scale)
- `top_concern_today` → Long text  
- `journey_momentum` → Long text (positive journey experiences)

### **2. ENHANCE EXISTING `Users` TABLE**
Add these new fields:

**CM-01 Medication Status Tracking:**
- `medication_status` → Single select: starting_soon, currently_taking, completed, paused
- `medication_status_updated` → Date & time (when status was last changed)

### **3. CREATE NEW `FMVAnalytics` TABLE**
**Purpose:** Track user behavior and application analytics (AN-01 feature)

**Required Fields:**
- `user_id` → Link to "Users" table (required)
- `event_type` → Single select: signup_completed, checkin_submitted, insight_viewed, insight_clicked, feedback_submitted, page_visited, session_started, medication_status_updated
- `event_timestamp` → Date & time (required)  
- `date` → Date (required, format: YYYY-MM-DD)
- `event_data` → Long text (JSON storage for flexible event data)

**Optional Analytics Fields:**
- `insight_type` → Single line text (e.g., "daily_insight", "onboarding_micro")
- `insight_title` → Single line text
- `insight_id` → Single line text (e.g., "daily_1753482891498")
- `feedback_type` → Single select: helpful, not_helpful, dismiss
- `feedback_context` → Single select: checkin, insight, onboarding
- `mood_selected` → Multiple select: hopeful, anxious, excited, worried, frustrated, confident, overwhelmed, grateful, uncertain, optimistic
- `confidence_level` → Number (1-10 for user confidence ratings)
- `concern_mentioned` → Checkbox (boolean for whether user mentioned concerns)

### **4. FIELD CONFIGURATION NOTES:**

**Single Select Options to Create:**

`sentiment` options:
- positive
- negative  
- neutral

`medication_status` options:
- starting_soon
- currently_taking
- completed
- paused

`event_type` options:
- signup_completed
- checkin_submitted
- insight_viewed
- insight_clicked
- feedback_submitted
- page_visited
- session_started
- medication_status_updated

`feedback_type` options:
- helpful
- not_helpful
- dismiss

`feedback_context` options:
- checkin
- insight
- onboarding

`mood_selected` options (multiple select):
- hopeful
- anxious
- excited
- worried
- frustrated
- confident
- overwhelmed
- grateful
- uncertain
- optimistic

### **5. VALIDATION REQUIREMENTS:**

**Number Field Constraints:**
- `sentiment_confidence`: Must be between 0.0 and 1.0
- `medication_confidence_today`: Must be between 1 and 10
- `financial_stress_today`: Must be between 1 and 10  
- `journey_readiness_today`: Must be between 1 and 10
- `confidence_level`: Must be between 1 and 10

**Required Field Settings:**
- `FMVAnalytics.user_id`: Required
- `FMVAnalytics.event_type`: Required
- `FMVAnalytics.event_timestamp`: Required
- `FMVAnalytics.date`: Required

**Date Format:**
- All date fields should use YYYY-MM-DD format
- All datetime fields should include timezone support

---

**IMPORTANT:** This schema supports fertility journey tracking with sentiment analysis, medication status monitoring, and comprehensive user analytics. All fields are designed for HIPAA compliance and user privacy protection. 