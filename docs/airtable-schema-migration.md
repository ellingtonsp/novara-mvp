# 📊 Airtable Schema Migration Guide

## **Current Tables (Already Exist)**
✅ Users - Complete  
✅ DailyCheckins - Complete  
✅ WeeklyCheckins - Complete  
✅ UserFlags - Complete  

---

## **🚨 Required New Tables**

### **1. FVMAnalytics (Add ASAP)**
**Purpose**: Track all user behavior for FVM metrics and optimization

```
Table Name: FVMAnalytics
Fields:
├── Id (Primary Key - Auto)
├── user_id (Link to "Users" table - Required)
├── event_type (Single Select - Required)
│   Options: onboarding_complete, insight_delivered, insight_opened, 
│           insight_clicked, check_in_completed, feedback_submitted
├── event_timestamp (Date & Time - Required)
├── date (Date - Required, format: YYYY-MM-DD)
├── event_data (Long Text - JSON storage for flexible data)
│
├── -- Event-Specific Fields (Optional) --
├── confidence_scores (Long Text - JSON: {meds: 5, costs: 7, overall: 6})
├── insight_type (Single Line Text - e.g., "onboarding_micro", "daily_insight")
├── insight_title (Single Line Text - e.g., "Your journey, your pace")
├── insight_id (Single Line Text - e.g., "welcome_1753251146511")
├── feedback_type (Single Select: helpful, not_helpful)
├── feedback_context (Single Select: onboarding, checkin, daily_insight)
├── mood_selected (Multiple Select: hopeful, anxious, excited, worried, etc.)
├── confidence_level (Number - 1-10 for check-in confidence)
└── concern_mentioned (Checkbox - boolean for check-in concerns)
```

### **2. InsightEngagement (Add This Week)**
**Purpose**: Track how users interact with insights for optimization

```
Table Name: InsightEngagement  
Fields:
├── Id (Primary Key - Auto)
├── user_id (Link to "Users" table - Required)
├── insight_type (Single Line Text - Required)
├── action (Single Select - Required)
│   Options: viewed, clicked, dismissed, liked, not_helpful, refreshed
├── insight_id (Single Line Text)
├── timestamp (Date & Time - Required)
├── date_submitted (Date - Required)
└── created_at (Created Time - Auto)
```

### **3. UserNudges (Future - For Gentle Reminder System)**
**Purpose**: Manage personalized nudges and reminders

```
Table Name: UserNudges
Fields:
├── Id (Primary Key - Auto)
├── user_id (Link to "Users" table - Required)
├── nudge_type (Single Select - Required)
│   Options: missed_checkin, low_confidence, encouragement, 
│           weekly_reflection, milestone_celebration
├── nudge_content (Long Text - The actual message)
├── scheduled_for (Date & Time)
├── sent_at (Date & Time)
├── opened_at (Date & Time) 
├── clicked_at (Date & Time)
├── status (Single Select)
│   Options: pending, sent, opened, clicked, expired
├── priority (Single Select: low, medium, high)
├── delivery_method (Single Select: email, in_app, both)
└── created_at (Created Time - Auto)
```

---

## **🔄 Migration Steps**

### **Phase 1: Add FVMAnalytics (Do Today)**
1. Create table in Airtable with fields above
2. Update backend to persist events (currently just logging)
3. Test with a few signup flows

### **Phase 2: Add InsightEngagement (This Week)**  
1. Create table in Airtable
2. Update insight tracking endpoints
3. Start collecting engagement data

### **Phase 3: Add UserNudges (Future)**
1. Create table when building nudge system
2. Implement gentle reminder logic
3. Build email/in-app notification system

---

## **📈 Data You'll Start Collecting**

### **FVMAnalytics Examples:**
```json
// Onboarding completion
{
  "event_type": "onboarding_complete",
  "confidence_scores": {"meds": 3, "costs": 7, "overall": 5},
  "primary_need": "medication_guidance",
  "top_concern": "Scared of needles"
}

// Check-in completion  
{
  "event_type": "check_in_completed",
  "mood_selected": ["hopeful", "overwhelmed"],
  "confidence_level": 7,
  "concern_mentioned": true
}

// Insight interaction
{
  "event_type": "insight_opened",
  "insight_type": "onboarding_micro",
  "insight_title": "Your journey, your pace"
}
```

### **InsightEngagement Examples:**
```
action: "viewed" - User saw the insight
action: "liked" - User clicked helpful (✓)
action: "not_helpful" - User clicked not helpful (✗)  
action: "dismissed" - User closed without feedback
```

---

## **🎯 Benefits**

### **Immediate (FVMAnalytics)**
- Track onboarding conversion rates
- Measure insight engagement  
- Identify user drop-off points
- A/B test different insights

### **Soon (InsightEngagement)**
- Optimize insight algorithm
- Identify most/least helpful insights
- Personalize based on preferences

### **Future (UserNudges)**
- Gentle re-engagement system
- Celebration of milestones
- Proactive support for struggling users

---

## **🚀 Ready to Implement**

All the tracking code is already in place in the frontend and backend - we just need to persist it to these tables instead of console logging.

Want me to help you set up the FVMAnalytics table first? It's a simple update to make the events persistent. 