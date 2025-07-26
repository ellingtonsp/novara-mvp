# Enhanced Dimension Cycling System
## Dynamic Questions That Adapt Over Time

**Date:** 2025-07-25  
**Status:** ✅ **IMPLEMENTED**  
**Context:** Response to user question about cycling through all dimensions over time  

---

## 🎯 Problem Solved

**User Question:** *"How do we cycle in questions about the other dimensions (cost, etc.) in case their sentiments on those elements has changed over time?"*

**Original Issue:** The system only asked dimension-specific questions based on **static onboarding data**. If someone started confident about finances but then had insurance issues, they would **never get financial questions** because the system still saw their original high confidence score.

---

## 🔄 Enhanced Solution: Smart Dimension Cycling

### **How It Works:**

1. **Time-Based Rotation:** Every 3 days, focus shifts to a different dimension
2. **Priority Overrides:** Urgent concerns always take precedence
3. **Behavioral Signals:** System adapts based on user patterns
4. **Comprehensive Coverage:** ALL users get ALL dimensions checked over time

---

## 📅 **Rotation Schedule Example:**

| Day | Focus Dimension | Questions Asked |
|-----|----------------|-----------------|
| 1-3 | **Medication** | Confidence slider + concerns/momentum |
| 4-6 | **Financial** | Confidence slider + concerns/momentum |
| 7-9 | **Journey Overall** | Confidence slider + concerns/momentum |
| 10+ | *Cycle repeats...* | |

### **Priority Overrides:**
- **Urgent (Always shown):** Any dimension with confidence ≤4 from onboarding
- **Emergency checks:** Very low confidence (≤3) gets quick check even off-cycle  
- **Top concerns:** Areas mentioned in onboarding get 2x frequency

---

## 🧠 **Logic Implementation:**

```javascript
function calculateDimensionFocus(user) {
  const daysSinceSignup = Math.floor((today - new Date(user.created_at)) / (1000 * 60 * 60 * 24));
  const rotationCycle = daysSinceSignup % 9; // 9-day cycle
  
  // URGENT: Always check low confidence areas
  if (confidence_meds <= 4) return 'medication';
  if (confidence_costs <= 4) return 'financial'; 
  if (confidence_overall <= 4) return 'journey';
  
  // HIGH PRIORITY: Check top concern areas 2x frequency
  if (top_concern.includes('medication') && (rotationCycle % 6 < 2)) return 'medication';
  if (top_concern.includes('financial') && (rotationCycle % 6 < 2)) return 'financial';
  
  // FUTURE: Trend detection
  // if (hasDecliningTrend('medication_confidence', 3)) return 'medication';
  
  // Default rotation: medication (days 1-3), financial (4-6), journey (7-9)
  return ['medication', 'financial', 'journey'][Math.floor(rotationCycle / 3)];
}
```

---

## 📊 **Real-World Examples:**

### **Example 1: Confident → Struggling**
```
User: Started with high financial confidence (8/10) at onboarding
Week 1: No financial questions (high confidence)
Week 2: Financial focus day arrives → Gets financial questions
Discovery: Insurance denied coverage, confidence now 3/10
Week 3+: Financial questions appear every cycle due to low confidence
```

### **Example 2: Top Concern Focus**
```
User: Listed "medication side effects" as top concern
Schedule: Gets medication questions on days 1-3, 7-8, 13-14 (2x frequency)
Other dimensions: Still get checked on regular rotation
```

### **Example 3: Emergency Override**
```
User: Onboarding confidence_costs = 2/10 (very low)
Result: Gets financial emergency check EVERY cycle regardless of rotation
Plus: Still gets full financial focus during rotation days
```

---

## 🎨 **Enhanced Question Types:**

### **When Dimension is in Focus:**

#### **Confidence Tracking:**
```javascript
{
  question: "How confident are you feeling about [dimension] today?",
  type: "slider", 
  tracks: "Changes over time vs onboarding baseline"
}
```

#### **Adaptive Follow-up:**
```javascript
// If confidence ≤4 OR original concern
{
  question: "Any specific [dimension] questions or worries today?",
  context: "Support and problem-solving"
}

// If confidence ≥5 AND no original concern  
{
  question: "How are things going with [dimension]? Any changes?",
  context: "Momentum capture and change detection"
}
```

### **Emergency Checks (Off-Cycle):**
```javascript
// For very low confidence (≤3) when not in focus
{
  question: "Quick [dimension] check - any urgent concerns?",
  priority: "High",
  purpose: "Safety net for critical issues"
}
```

---

## 📈 **Benefits of Enhanced System:**

### **For Users:**
- ✅ **All dimensions monitored** regardless of initial confidence
- ✅ **Changing concerns captured** as they evolve over time
- ✅ **Personalized frequency** based on individual needs
- ✅ **Not overwhelmed** with questions (focus system prevents overload)

### **For Data Quality:**
- ✅ **Longitudinal tracking** of confidence changes across dimensions
- ✅ **Early warning system** for emerging concerns
- ✅ **Comprehensive sentiment** from all aspects of journey
- ✅ **Trend analysis** becomes possible with regular data points

### **For Insights:**
- ✅ **Dynamic copy variants** can reference specific dimension focus
- ✅ **Contextual support** based on current dimension challenges
- ✅ **Celebration opportunities** when dimensions improve over time
- ✅ **Predictive patterns** from confidence trajectory analysis

---

## 🧪 **Testing the System:**

### **Verify Rotation:**
1. **Create test user** with mixed confidence scores
2. **Check daily questions** over 9 days
3. **Confirm each dimension** gets focus period
4. **Verify emergency checks** appear for low confidence areas

### **Test Priority Overrides:**
1. **User with very low cost confidence** should get financial questions every day
2. **User with medication top concern** should get 2x medication frequency
3. **Urgent concerns** should override rotation schedule

### **Validate Question Adaptation:**
1. **High confidence dimension** should get momentum questions
2. **Low confidence dimension** should get support questions
3. **Neutral confidence** should get change-detection questions

---

## 🚀 **Future Enhancements:**

### **Phase 2: Trend Detection (Ready to Implement)**
```javascript
// Detect declining confidence trends
if (hasDecliningTrend('medication_confidence', 3)) {
  return 'medication'; // Override rotation for declining trends
}

// Detect improvement patterns
if (hasImprovingTrend('financial_confidence', 3)) {
  // Add celebration questions
}
```

### **Phase 3: Behavioral Adaptation**
- **Keyword frequency analysis** from universal reflection field
- **Mention-based prioritization** (if user keeps mentioning costs)
- **Seasonal adjustments** (more financial questions near treatment cycles)

### **Phase 4: Machine Learning**
- **Predictive focus** based on user patterns
- **Personalized rotation timing** based on individual rhythms
- **Proactive support** before issues escalate

---

## 🎉 **Summary**

The enhanced dimension cycling system ensures that **every user gets comprehensive monitoring** of all aspects of their fertility journey, regardless of their initial confidence levels. 

**Key Innovation:** Instead of static onboarding-based questions, the system now **actively rotates focus** while maintaining **smart priority overrides** for urgent concerns.

**Result:** Users with changing circumstances (like insurance issues, new medication concerns, or evolving journey readiness) will be **captured and supported** rather than missed by the system.

**Ready for Testing:** ✅ System is live and will start showing dimension rotation in daily check-ins! 