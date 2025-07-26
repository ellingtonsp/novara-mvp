# 🧪 CM-01 Local Testing Guide

## Quick Start: Test Positive Sentiment

### **Test Case 1: High Positive Sentiment** 
1. **Go to**: http://localhost:4200
2. **Login/Register** with any test user
3. **Navigate to Daily Check-in**
4. **Select moods**: `hopeful`, `grateful`
5. **Set confidence**: `9/10`
6. **Add user note**: `"I'm so excited and hopeful about this journey! Feeling absolutely blessed today! 🌟"`
7. **Submit check-in**

**Expected Results:**
- ✅ Console shows: `🎭 CM-01: Sentiment analysis result: { sentiment: 'positive' }`
- ✅ Console shows: `🎉 CM-01: Celebratory insight displayed for positive sentiment`
- ✅ Insight has celebratory title with emoji (🎉, 💜, 🌟, 🎊, or ⭐)
- ✅ Message is upbeat and enthusiastic
- ✅ Console shows: `🎭 CM-01: Tracking sentiment_scored event`

---

## Test Cases to Validate

### **Positive Sentiment Variations**
```
Text: "Feeling really grateful for all the support today"
Expected: Positive sentiment, celebratory copy

Text: "Great progress, everything is going amazing!"
Expected: Positive sentiment, emoji in insight

Text: "Blessed and thankful for this miracle journey"
Expected: Positive sentiment, upbeat language
```

### **Neutral Sentiment (Should be unchanged)**
```
Mood: tired
Confidence: 5/10
Text: "Having an okay day, nothing special"
Expected: Standard supportive copy, no celebration
```

### **Negative Sentiment (Should be unchanged)**
```
Mood: anxious, overwhelmed  
Confidence: 3/10
Text: "Feeling really stressed and worried"
Expected: Compassionate copy, no celebratory elements
```

---

## Browser Console Validation

Open DevTools → Console and look for these logs:

```
🎭 CM-01: Sentiment analysis result: {
  sentiment: 'positive',
  confidence: 0.85,
  processingTime: 15.2
}

🎉 CM-01: Celebratory insight displayed for positive sentiment

🎭 CM-01: Tracking sentiment_scored event: {
  user_id: "rec123...",
  sentiment: "positive",
  confidence: 0.85,
  mood_score: 9,
  processing_time_ms: 15.2
}
```

---

## Performance Validation

- ⏱️ **Sentiment processing should be <150ms** (check console logs)
- 🚀 **No UI lag during check-in submission**
- 📱 **Test on mobile viewport** (responsive design)

---

## Quick Fixes if Issues

### If sentiment not detected:
1. Check browser console for errors
2. Verify text contains positive words
3. Try: "I'm feeling amazing and hopeful today!"

### If celebratory copy not showing:
1. Ensure sentiment is classified as 'positive' in console
2. Check for JavaScript errors
3. Verify insight component renders

### If analytics not tracking:
1. Check PostHog configuration in console
2. Look for `🎯 AN-01 DEBUG` logs
3. Verify user is identified

---

## Success Checklist

- [ ] Positive sentiment triggers celebratory copy with emoji
- [ ] Neutral/negative sentiment shows standard supportive copy  
- [ ] Processing time <150ms (check console)
- [ ] Analytics events tracked (sentiment_scored)
- [ ] No JavaScript errors in console
- [ ] Mobile responsive design works
- [ ] Multiple positive texts work consistently

**If all checkboxes pass: ✅ CM-01 is working correctly!** 