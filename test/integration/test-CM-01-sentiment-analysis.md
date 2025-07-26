# CM-01: Positive-Reflection NLP & Dynamic Copy Testing Script

**Testing Date:** _________________  
**Environment:** [ ] Local [ ] Staging [ ] Production  
**Tester:** _________________  

## Pre-Test Setup

### 1. Environment Validation
- [ ] Application is running on correct environment
- [ ] PostHog analytics are configured and working
- [ ] User is logged in successfully
- [ ] Developer console is open for debugging

### 2. Browser Console Commands
```javascript
// Test sentiment analysis directly in console
import { testSentimentAnalysis } from './lib/sentiment';
testSentimentAnalysis();

// Test copy variants
import { testCopyVariants } from './lib/copy-variants';
testCopyVariants();
```

## Test Scenarios

### Scenario 1: Positive Sentiment Detection & Celebratory Copy

**Objective:** Verify positive sentiment triggers celebratory copy with emojis

#### Test Case 1.1: High Positive Sentiment
**Setup:**
1. Navigate to daily check-in form
2. Select positive moods: `hopeful`, `grateful`
3. Set confidence slider to: `9/10`
4. Add user note: `"I'm so excited and hopeful about this journey! Feeling absolutely blessed today! 🌟"`

**Expected Results:**
- [ ] Sentiment analysis completes in <150ms (check console logs)
- [ ] Insight displays celebratory title with emoji (🎉, 💜, 🌟, 🎊, or ⭐)
- [ ] Message is upbeat and acknowledging (not generic)
- [ ] `sentiment_scored` event fires in PostHog
- [ ] Console shows: `🎉 CM-01: Celebratory insight displayed for positive sentiment`

**Validation Checklist:**
- [ ] Insight title contains celebratory language
- [ ] Insight message is longer and more enthusiastic than neutral
- [ ] Emoji is present in the insight
- [ ] Tone feels genuinely celebratory, not patronizing
- [ ] Analytics event tracked (check PostHog or console)

#### Test Case 1.2: Moderate Positive Sentiment
**Setup:**
1. Select moods: `hopeful`
2. Set confidence: `7/10`
3. Add note: `"Feeling good about things today, grateful for the support"`

**Expected Results:**
- [ ] Positive sentiment detected
- [ ] Celebratory copy displayed (may be gentler than high positive)
- [ ] Emoji present
- [ ] Analytics tracked

#### Test Case 1.3: Positive Mood Only (No Text)
**Setup:**
1. Select moods: `hopeful`, `grateful`, `excited`
2. Set confidence: `8/10`
3. Leave user note empty

**Expected Results:**
- [ ] Positive sentiment inferred from mood selection
- [ ] Celebratory copy triggered
- [ ] Processing time <150ms

### Scenario 2: Neutral & Negative Sentiment (Unchanged Behavior)

**Objective:** Verify neutral/negative flows remain unchanged

#### Test Case 2.1: Neutral Sentiment
**Setup:**
1. Select mood: `tired`
2. Set confidence: `5/10`
3. Add note: `"Having an okay day, nothing special to report"`

**Expected Results:**
- [ ] Neutral sentiment detected
- [ ] Standard supportive copy displayed (unchanged from current)
- [ ] No celebratory emoji or language
- [ ] Tone remains supportive but not celebratory

#### Test Case 2.2: Negative Sentiment
**Setup:**
1. Select moods: `anxious`, `overwhelmed`
2. Set confidence: `3/10`
3. Add note: `"Feeling really stressed and worried about everything"`

**Expected Results:**
- [ ] Negative sentiment detected
- [ ] Compassionate, supportive copy (unchanged from current)
- [ ] No celebratory elements
- [ ] Appropriate supportive tone

### Scenario 3: Performance Validation

**Objective:** Verify <150ms processing requirement

#### Test Case 3.1: Performance Benchmark
**Setup:**
1. Open browser developer tools → Performance tab
2. Start recording
3. Submit check-in with long text: Repeat "I'm feeling really excited and hopeful about this amazing journey" 20 times

**Expected Results:**
- [ ] Total sentiment processing <150ms (check console: `🎭 CM-01: Sentiment analysis result`)
- [ ] No UI lag or delay
- [ ] Performance acceptable on mobile devices

### Scenario 4: Analytics Validation

**Objective:** Verify sentiment_scored events are properly tracked

#### Test Case 4.1: PostHog Event Validation
**Setup:**
1. Submit positive check-in
2. Check browser console for analytics logs
3. Verify PostHog dashboard (if accessible)

**Expected Results:**
- [ ] Console shows: `🎭 CM-01: Tracking sentiment_scored event`
- [ ] Event payload includes:
  - [ ] `user_id`
  - [ ] `sentiment: 'positive'`
  - [ ] `confidence` value
  - [ ] `mood_score`
  - [ ] `processing_time_ms`
  - [ ] `text_sources` array
  - [ ] `sentiment_scores` object

### Scenario 5: Edge Cases

#### Test Case 5.1: Mixed Sentiment
**Setup:**
1. Add note: `"Happy about progress but really worried about the costs"`
2. Mixed moods: `hopeful`, `anxious`
3. Confidence: `6/10`

**Expected Results:**
- [ ] System handles mixed sentiment gracefully
- [ ] Returns valid sentiment classification
- [ ] Appropriate copy variant selected

#### Test Case 5.2: Empty Input
**Setup:**
1. Minimal input: only required fields
2. Confidence: `5/10`
3. No user note or concerns

**Expected Results:**
- [ ] Neutral sentiment inferred
- [ ] No errors in processing
- [ ] Standard supportive copy

#### Test Case 5.3: Special Characters & Emojis
**Setup:**
1. Note with emojis: `"Feeling amazing today! 🎉❤️✨ So grateful!"`
2. Positive moods and high confidence

**Expected Results:**
- [ ] Emojis processed correctly
- [ ] Positive sentiment detected
- [ ] No parsing errors

## Success Metrics Validation

### CM-01 Requirements Checklist
- [ ] **Performance:** Sentiment classification <150ms average
- [ ] **Accuracy:** Positive sentiment properly detected (subjective validation)
- [ ] **Copy Variants:** Celebratory copy with emoji for positive sentiment
- [ ] **Analytics:** `sentiment_scored` event fires with correct properties
- [ ] **User Experience:** Positive days feel acknowledged and celebrated
- [ ] **Unchanged Flows:** Neutral/negative responses remain supportive

### User Experience Assessment
**Rate each aspect (1-5 scale):**

| Aspect | Rating | Notes |
|--------|--------|-------|
| Celebratory copy feels genuine (not patronizing) | ___/5 | |
| Positive moments feel acknowledged | ___/5 | |
| Emoji usage enhances experience | ___/5 | |
| Performance is smooth and fast | ___/5 | |
| Overall improvement vs. previous version | ___/5 | |

## Bug Report Section

### Issues Found
| Priority | Issue Description | Steps to Reproduce | Environment |
|----------|------------------|-------------------|-------------|
| High/Med/Low | | | |
| High/Med/Low | | | |
| High/Med/Low | | | |

### Console Errors
```
[Paste any console errors here]
```

### Unexpected Behavior
```
[Describe any unexpected behavior]
```

## Test Summary

**Total Test Cases:** 11  
**Passed:** ___/11  
**Failed:** ___/11  
**Blocked:** ___/11  

**Overall Assessment:**
- [ ] ✅ Ready for production deployment
- [ ] ⚠️ Minor issues - deploy with monitoring
- [ ] ❌ Major issues - requires fixes before deployment

**Deployment Recommendation:**
_________________________________________________________________

**Tester Signature:** _________________________ **Date:** ___________ 