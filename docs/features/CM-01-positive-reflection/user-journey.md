# CM-01 User Journey Documentation
## Positive-Reflection NLP & Dynamic Copy

**Feature:** CM-01 Positive-Reflection NLP & Dynamic Copy  
**Sprint:** 1 (Priority 1, 3 SP)  
**Status:** ✅ **IMPLEMENTED**  
**Date:** 2025-07-25  

---

## 🎯 User Journey Overview

The CM-01 feature enhances the daily check-in experience by recognizing positive sentiment and responding with celebratory, acknowledging language. This addresses the feedback that "good days feel ignored."

---

## 👤 Primary User Personas

### **Emily "Hopeful Planner"**
- **Context**: Logging a good day after positive IVF consultation  
- **Goal**: Feel acknowledged and motivated to continue journey  
- **Pain Point**: App previously felt clinical and didn't celebrate wins  

### **Alex "One-and-Done"**  
- **Context**: Partner was supportive, medication going well  
- **Goal**: Quick check-in that recognizes positive momentum  
- **Pain Point**: Generic responses didn't match emotional state  

---

## 🗺️ Complete User Journey

### **Phase 1: Daily Check-In Entry**

#### **Step 1: Mood Selection**
```
User Action: Selects "hopeful" from mood options
System: Captures mood_today = "hopeful"
Experience: Standard mood selection interface
```

#### **Step 2: Confidence Rating**
```
User Action: Slides confidence to 8/10
System: Captures confidence_today = 8
Experience: Visual slider with immediate feedback
```

#### **Step 3: Universal Journey Reflection** *(NEW)*
```
User Action: Types "Felt very supported by my partner today!"
System: Captures journey_reflection_today text
Experience: Universal text field always visible (regardless of confidence)
```

#### **Step 4: Dynamic Dimension Questions** *(ENHANCED)*
```
User Experience: 
- Questions cycle through dimensions (medication, financial, overall)
- Positive momentum captured: "What's building your confidence?"  
- Previous struggles followed up: "How is X feeling today?"
System: Generates personalized questions based on 9-day rotation + user history
```

### **Phase 2: Sentiment Analysis (Background)**

#### **Step 5: Client-Side Processing**
```
System Process:
1. Combines journey_reflection_today + mood + dimension responses
2. Runs VADER sentiment analysis locally (<150ms)
3. Classifies: "Felt very supported" → positive (confidence: 0.68)
4. No data sent to external services (privacy-first)
```

#### **Step 6: Data Storage**
```
System Process:
1. Saves complete check-in data to database
2. Stores sentiment analysis results
3. Fires PostHog analytics event: sentiment_scored
```

### **Phase 3: Insight Generation & Response**

#### **Step 7: Sentiment-Based Insight** *(NEW)*
```
System Logic:
- Detects positive sentiment (≥0.3 compound score)
- Triggers celebratory copy variant selection
- Selects appropriate celebratory emoji (🎉 💜 🌟)

Previous: "Stephen, feeling overwhelmed makes complete sense"
Enhanced: "✨ Stephen, feeling supported is beautiful! Partner connection can be such a source of strength during this journey. 💜"
```

#### **Step 8: Personalized Message Display**
```
User Experience:
- Sees celebratory insight card with appropriate emoji
- Tone matches their positive emotional state  
- Feels acknowledged and validated for positive moment
- More likely to continue consistent check-ins
```

### **Phase 4: Engagement & Tracking**

#### **Step 9: User Response**
```
User Options:
- Mark as "Helpful" (tracked for success metrics)
- Dismiss (tracked for improvement)
- Take suggested action (if provided)

Analytics: All interactions tracked for optimization
```

---

## 📊 Success Metrics Journey

### **Target Outcomes:**
- **Users reporting mood ≥8 who mark insight "Helpful"**: 40% → **≥55%**
- **D7 retention among users with ≥1 positive day**: 45% → **≥55%**

### **Key Measurement Points:**
1. **Sentiment Detection Accuracy**: ≥85% precision for positive sentiment
2. **Response Time**: <150ms for sentiment classification  
3. **User Satisfaction**: "Helpful" rating on positive day insights
4. **Retention Impact**: 7-day retention rates for positive sentiment users

---

## 🔄 Alternative Journey Paths

### **Path A: Negative Sentiment Day**
```
Input: "Not feeling too great today"
Sentiment: negative (confidence: 1.0)
Response: Supportive, empathetic language (unchanged from baseline)
Experience: Appropriate emotional support maintained
```

### **Path B: Neutral Sentiment Day**  
```
Input: "Same as usual, managing medications"
Sentiment: neutral (confidence: 0.8)
Response: Informational, status-checking language (unchanged)
Experience: Baseline experience preserved
```

### **Path C: Mixed Sentiment Day**
```
Input: "Partner supportive but worried about costs"  
Sentiment: neutral (slight positive lean)
Response: Balanced acknowledgment of complexity
Experience: Nuanced understanding of emotional state
```

---

## 💡 Key Improvements Over Previous Journey

### **Before CM-01:**
- ❌ All users got same generic emotional complexity response
- ❌ Positive days felt ignored or minimized  
- ❌ No sentiment awareness in copy selection
- ❌ Limited text input opportunities (only low confidence users)

### **After CM-01:**
- ✅ Sentiment-aware response generation
- ✅ Celebratory language for positive experiences  
- ✅ Universal reflection field for all users
- ✅ Dynamic dimension cycling ensures comprehensive coverage
- ✅ Enhanced data triangulation for better insights

---

## 🚀 Future Journey Enhancements

### **Phase 2 Opportunities:**
- **Personalized emoji selection** based on user preferences
- **Streak recognition** for consecutive positive days
- **Partner/support system acknowledgment** when mentioned
- **Contextual celebrations** based on cycle stage milestones

### **Advanced NLP Features:**
- **Entity recognition** for specific IVF terminology
- **Emotion granularity** beyond positive/negative/neutral
- **Temporal sentiment tracking** across user journey
- **Predictive insight generation** based on sentiment patterns

---

## 🔗 Related Documentation

- **Functional Logic**: [functional-logic.md](./functional-logic.md)
- **API Endpoints**: [api-endpoints.md](./api-endpoints.md)  
- **Database Schema**: [database-schema.md](./database-schema.md)
- **Testing Scenarios**: [testing-scenarios.md](./testing-scenarios.md)
- **Deployment Notes**: [deployment-notes.md](./deployment-notes.md)
- **Downstream Impact**: [downstream-impact.md](./downstream-impact.md) 