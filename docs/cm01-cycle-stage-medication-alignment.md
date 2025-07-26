# CM-01 Cycle Stage & Medication Status Alignment

## 🎯 **Problem Solved**

**Previous Issue**: Separate `medication_status` and `cycle_stage` tracking created:
- Duplicate data maintenance
- Inconsistency risk (e.g., `cycle_stage: "stimulation"` but `medication_status: "not_taking"`)
- User confusion managing two status systems
- Complex logic checking both fields

**Solution**: Derive medication status from cycle stage for unified, consistent system.

---

## 🔄 **Unified Status System**

### **Cycle Stage → Medication Status Mapping**

| **Cycle Stage** | **Derived Medication Status** | **Question Focus** | **Copy Variants** |
|-----------------|-------------------------------|-------------------|-------------------|
| `considering` | `not_taking` | Preparation readiness | "Natural to feel uncertain about starting" |
| `ivf_prep` | `starting_soon` | Preparation anxiety | "Preparation anxiety is common" |
| `stimulation` | `taking` | Active medication confidence | "Clear up that medication confusion" |
| `retrieval` | `taking` | Active medication confidence | "Clear up that medication confusion" |
| `transfer` | `taking` | Active medication confidence | "Clear up that medication confusion" |
| `tww` | `taking` | Support medication confidence | "Clear up that medication confusion" |
| `pregnant` | `pregnancy_support` | Pregnancy medication confidence | "Pregnancy medication support" |
| `between_cycles` | `between_cycles` | Next cycle preparation | "Between cycles preparation support" |

---

## 🎯 **Stage-Specific Questions**

### **Preparation Stages** (`considering`, `ivf_prep`)
```javascript
{
  id: 'medication_readiness_today',
  question: 'How prepared do you feel about the medication aspects of IVF?',
  context: 'medication_preparation'
}
```

### **Active Treatment** (`stimulation`, `retrieval`, `transfer`, `tww`)
```javascript
{
  id: 'medication_confidence_today', 
  question: 'How confident are you feeling about your current medications?',
  context: 'medication_active'
}
```

### **Pregnancy** (`pregnant`)
```javascript
{
  id: 'pregnancy_medication_confidence',
  question: 'How confident are you feeling about your pregnancy support medications?',
  context: 'pregnancy_medications'
}
```

### **Between Cycles** (`between_cycles`)
```javascript
{
  id: 'cycle_preparation_confidence',
  question: 'How prepared do you feel for your next cycle medications?',
  context: 'cycle_preparation'
}
```

---

## 🚀 **Smart Stage Updates**

### **Automatic Detection Triggers**
- **Time-based**: Check every 30 days for stage progression
- **Stage-based**: Automatic prompts for fast-changing stages:
  - `stimulation` → `retrieval` (days)
  - `retrieval` → `transfer` (days) 
  - `transfer` → `tww` (weeks)
  - `tww` → `pregnant` or `between_cycles` (weeks)

### **Update Question**
```
"Is your cycle stage still current?"
- No change - still [current stage]
- Just considering IVF
- Preparing for IVF
- In stimulation phase
- Around retrieval
- Transfer stage
- Two-week wait
- Pregnant
- Between cycles
```

---

## 💬 **Enhanced Copy Variants**

### **Stage-Specific Medication Concerns**

**Stimulation Phase** (taking medications):
- **Low confidence**: "Your positivity is beautiful, but let's clear up that stimulation medication confusion"
- **High confidence**: "Your stimulation protocol confidence is strong - that's exactly what this phase needs!"

**Pregnancy** (pregnancy support):
- **Low confidence**: "Your joy about pregnancy is wonderful, and those medication questions are completely normal"
- **High confidence**: "Confident about your pregnancy support routine - your growing strength shows!"

**IVF Prep** (starting soon):
- **Low confidence**: "It's natural to feel uncertain about starting medications"
- **High confidence**: "Your preparation confidence is building beautifully - you're getting ready!"

---

## ✅ **Benefits of Alignment**

### **1. Single Source of Truth**
- `cycle_stage` is the primary status
- Medication behavior derived automatically
- No data inconsistency possible

### **2. Natural User Experience**  
- Users think in terms of "where am I in my journey?" not "medication status"
- Cycle stage updates feel natural vs artificial medication status management
- Questions automatically adapt to stage without user maintenance

### **3. Simplified Logic**
```javascript
// Before: Check both fields
if (user.medication_status === 'taking' && user.cycle_stage === 'stimulation') { ... }

// After: Single source derived automatically  
const medicationStatus = getMedicationStatusFromCycleStage(user.cycle_stage);
if (medicationStatus === 'taking') { ... }
```

### **4. Accurate Sentiment Analysis**
- Mixed sentiment detection based on stage-appropriate expectations
- `stimulation` + low medication confidence = active confusion (needs immediate help)
- `ivf_prep` + low medication readiness = preparation anxiety (needs education)

### **5. Future-Proof**
- Easy to add new cycle stages (e.g., `egg_freezing`, `donor_cycle`)
- Medication logic automatically adapts
- Staging system aligns with medical reality

---

## 🔄 **Migration Strategy**

### **Phase 1: Preserve Existing Data**
- Keep existing `medication_status` for reference
- Add cycle stage derivation logic
- Use derived status for new questions

### **Phase 2: Update Frontend**
- Replace medication status UI with cycle stage updates
- Update API calls to use `/api/users/cycle-stage`
- Show derived medication status in UI for transparency

### **Phase 3: Clean Migration**
- Remove deprecated medication status fields
- Full cycle stage-based system
- Enhanced stage-specific copy variants

---

## 📊 **User Journey Example**

**Week 1**: `considering` → Preparation readiness questions
**Week 4**: Updates to `ivf_prep` → Preparation anxiety support  
**Month 2**: Updates to `stimulation` → Active medication confidence
**Week 10**: Updates to `retrieval` → Retrieval-specific medication support
**Week 11**: Updates to `transfer` → Transfer medication confidence  
**Week 13**: Updates to `tww` → Two-week wait support medication questions
**Week 15**: Updates to `pregnant` → Pregnancy medication confidence

Each stage transition automatically adapts:
- Question wording
- Confidence thresholds
- Sentiment analysis context
- Copy variant selection
- Support resource recommendations

---

This unified system ensures **every patient gets questions perfectly matched to their actual journey stage** while eliminating the complexity and inconsistency risk of dual status tracking! 🎯 