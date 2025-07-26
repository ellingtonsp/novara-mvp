# 🎭 Manual Temporal Events Demo Guide

## 🚀 **Demo Setup**

The browser should now be open at `http://localhost:4200/`. Let's walk through some temporal events to demonstrate CM-01 sentiment analysis and dynamic copy generation.

## 📋 **Demo Scenarios**

### **Scenario 1: Positive Progression Journey**

**Step 1: User Registration**
- Click "Get Started" or "Sign Up"
- Use email: `temporal-demo-1@example.com`
- Nickname: `TemporalDemo1`
- Set confidence levels:
  - Medications: `3/10` (low)
  - Costs: `4/10` (low)
  - Overall: `4/10` (low)
- Primary need: `medical_clarity`
- Cycle stage: `considering`

**Step 2: Day 1 Check-in (Negative Sentiment)**
- Mood: `worried`
- Confidence: `3/10`
- Notes: `"Feeling overwhelmed about starting this journey. Everything feels so uncertain."`
- **Expected**: Neutral/supportive copy (not celebratory)

**Step 3: Day 3 Check-in (Improving)**
- Mood: `anxious`
- Confidence: `4/10`
- Notes: `"Still nervous but starting to understand the process better. Doctor was helpful."`
- **Expected**: Slightly more supportive copy

**Step 4: Day 5 Check-in (Positive Turn)**
- Mood: `hopeful`
- Confidence: `6/10`
- Notes: `"Feeling more confident! The support group really helped. Starting to feel like I can do this."`
- **Expected**: More encouraging copy

**Step 5: Day 7 Check-in (Celebratory)**
- Mood: `excited`
- Confidence: `8/10`
- Notes: `"Amazing news today! Insurance approved our treatment. Feeling so blessed and grateful for this journey! 🎉"`
- **Expected**: Celebratory copy with emojis

---

### **Scenario 2: Mixed Emotions Journey**

**Step 1: New User Registration**
- Email: `temporal-demo-2@example.com`
- Nickname: `TemporalDemo2`
- Confidence levels: `6/10` across the board
- Primary need: `emotional_support`
- Cycle stage: `ivf_prep`

**Step 2: Mixed Emotions Check-in**
- Mood: `hopeful, frustrated`
- Confidence: `7/10`
- Notes: `"Feeling hopeful about our chances but frustrated with the medication schedule. It's so confusing!"`
- **Expected**: Balanced copy acknowledging both emotions

**Step 3: Another Mixed Check-in**
- Mood: `excited, worried`
- Confidence: `8/10`
- Notes: `"Great progress on the protocol! But still worried about side effects. Taking it one day at a time."`
- **Expected**: Supportive copy with celebration and reassurance

---

### **Scenario 3: Confidence Building Journey**

**Step 1: New User Registration**
- Email: `temporal-demo-3@example.com`
- Nickname: `TemporalDemo3`
- Confidence levels: `2/10` across the board (very low)
- Primary need: `medical_clarity`
- Cycle stage: `stimulation`

**Step 2: Initial Struggle**
- Mood: `overwhelmed`
- Confidence: `2/10`
- Notes: `"The medication protocol is so overwhelming. I don't understand any of this."`
- **Expected**: Gentle, supportive copy (not celebratory)

**Step 3: Progress**
- Mood: `frustrated`
- Confidence: `3/10`
- Notes: `"Still struggling with the injections. This is harder than I expected."`
- **Expected**: Encouraging copy about persistence

**Step 4: Breakthrough**
- Mood: `hopeful`
- Confidence: `5/10`
- Notes: `"Getting better at the injections! Nurse was so encouraging today."`
- **Expected**: Celebratory copy about progress

**Step 5: Confidence Achievement**
- Mood: `confident`
- Confidence: `7/10`
- Notes: `"Feeling much more confident! The routine is becoming second nature."`
- **Expected**: Strong celebratory copy with emojis

---

## 🎯 **What to Observe**

### **CM-01 Sentiment Analysis Features:**
1. **Performance**: Check browser console for sentiment analysis timing (<150ms)
2. **Accuracy**: Notice how copy changes based on sentiment
3. **Mixed Emotions**: See how "hopeful, frustrated" is handled
4. **Progression**: Watch copy evolve from supportive to celebratory

### **Dynamic Copy Variants:**
1. **Celebratory**: Look for emojis (🎉, 💜, ✨) and upbeat language
2. **Supportive**: Notice gentle, acknowledging language
3. **Neutral**: See balanced, informative responses

### **Temporal Patterns:**
1. **Confidence Building**: Copy should become more celebratory as confidence increases
2. **Emotional Complexity**: Mixed emotions should get balanced responses
3. **Journey Progression**: Language should reflect the user's stage and progress

---

## 🔍 **Browser Developer Tools**

Open DevTools (F12) and check:

**Console Tab:**
- Look for sentiment analysis logs
- Check processing times
- Monitor API calls

**Network Tab:**
- Watch `/api/checkins` calls
- Monitor `/api/insights/daily` responses
- Check for `sentiment_scored` analytics events

**Performance Tab:**
- Monitor sentiment analysis speed
- Check overall page performance

---

## 📊 **Expected Results**

### **Positive Sentiment Triggers:**
- High confidence (7-10)
- Positive keywords: "amazing", "blessed", "grateful", "excited"
- Emojis in text
- **Result**: Celebratory copy with emojis

### **Neutral Sentiment:**
- Mixed emotions: "hopeful, frustrated"
- Moderate confidence (4-6)
- Balanced language
- **Result**: Supportive, acknowledging copy

### **Negative Sentiment:**
- Low confidence (1-3)
- Negative keywords: "overwhelmed", "confused", "worried"
- **Result**: Gentle, supportive copy (not celebratory)

---

## 🎉 **Demo Success Indicators**

✅ **Sentiment Analysis Working:**
- Fast processing (<150ms)
- Accurate classification
- Mixed emotion detection

✅ **Dynamic Copy Working:**
- Copy changes based on sentiment
- Celebratory language for positive sentiment
- Supportive language for neutral/negative

✅ **Temporal Patterns:**
- Copy evolves with user progress
- Confidence changes reflected in language
- Journey stage awareness

✅ **Performance:**
- Smooth user experience
- No console errors
- Fast API responses

---

## 🚨 **Troubleshooting**

**If sentiment analysis isn't working:**
- Check browser console for errors
- Verify the sentiment.ts file is loaded
- Check network tab for API calls

**If copy isn't changing:**
- Verify check-in data includes sentiment analysis
- Check the copy-variants.ts file
- Look for console errors in sentiment processing

**If performance is slow:**
- Check sentiment analysis timing in console
- Verify API response times
- Look for blocking operations

---

## 📝 **Demo Notes**

This demonstration shows how CM-01:
1. **Analyzes sentiment** in real-time from user input
2. **Generates dynamic copy** based on sentiment and confidence
3. **Tracks temporal patterns** across multiple check-ins
4. **Provides empathetic responses** that match user emotional state
5. **Celebrates progress** when appropriate
6. **Supports users** through challenging moments

The system should feel responsive, accurate, and emotionally intelligent! 🎯 