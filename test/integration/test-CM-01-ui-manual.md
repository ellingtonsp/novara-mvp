# CM-01 Manual UI Test Script
## Positive-Reflection NLP & Dynamic Copy

**Test Date:** 2025-07-25  
**Environment:** Local Development  
**Test Type:** Manual UI Testing  
**Tester:** User  
**Status:** ✅ **FIXED** - Sentiment analysis thresholds adjusted for better positive detection

---

## 🎯 Pre-Test Setup

### 1. Start Local Development Environment
```bash
# Navigate to project root
cd /Users/stephen/Library/Mobile\ Documents/com~apple~CloudDocs/novara-mvp

# Start both frontend and backend with stable ports
./scripts/start-dev-stable.sh

# Wait for servers to start (check both are running)
curl -s http://localhost:9002/api/health | jq '.status'
curl -s http://localhost:4200 | head -1
```

**Expected Results:**
- Backend health check returns `"ok"`
- Frontend returns `<!doctype html>`

### 2. **CRITICAL: Clear Browser Cache**
Since the sentiment analysis fix has been applied, you need to clear your browser cache to ensure the new code is loaded:

**Chrome/Edge:**
- Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows) for hard refresh
- Or open DevTools (F12) → Right-click refresh button → "Empty Cache and Hard Reload"

**Safari:**
- Press `Cmd+Option+R` for hard refresh
- Or Safari → Develop → Empty Caches

**Firefox:**
- Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows) for hard refresh

### 3. Open Browser and Navigate
```bash
# Open browser to local development
open http://localhost:4200
```

---

## 🧪 Test Suite 1: Positive Sentiment Detection

### Test 1.1: High-Positive Text with Excitement
**Scenario:** User submits very positive text with high confidence

**Steps:**
1. Navigate to the daily check-in form
2. Set **Mood** to: `excited`
3. Set **Confidence** to: `8`
4. Set **Medication Confidence** to: `6`
5. Enter **Medication Concern/Note**: `Having such an amazing day! Feeling so blessed and grateful for this journey!`
6. Click **Submit**

**Expected Results:**
- ✅ **Sentiment Analysis**: Should classify as `positive` (not neutral)
- ✅ **Confidence**: Should be high (≥80%)
- ✅ **Compound Score**: Should be ≥0.3
- ✅ **PostHog Event**: `sentiment_scored` should fire with `sentiment: 'positive'`
- ✅ **Insight Card**: Should show celebratory copy variant with 🎉 emoji

**Success Criteria:**
- Sentiment is classified as `positive` (not `neutral`)
- Confidence is ≥80%
- PostHog event fires correctly
- Insight shows celebratory message

### Test 1.2: Moderate-Positive Text
**Scenario:** User submits moderately positive text

**Steps:**
1. Set **Mood** to: `hopeful`
2. Set **Confidence** to: `7`
3. Set **Medication Confidence** to: `5`
4. Enter **Medication Concern/Note**: `Feeling optimistic about the treatment plan and grateful for the support`
5. Click **Submit**

**Expected Results:**
- ✅ **Sentiment Analysis**: Should classify as `positive`
- ✅ **Confidence**: Should be moderate to high
- ✅ **Insight Card**: Should show celebratory copy variant

### Test 1.3: Positive Text with Emojis
**Scenario:** User submits positive text with emojis

**Steps:**
1. Set **Mood** to: `excited`
2. Set **Confidence** to: `9`
3. Set **Medication Confidence** to: `7`
4. Enter **Medication Concern/Note**: `Amazing progress today! 🎉 Feeling so blessed! ❤️`
5. Click **Submit**

**Expected Results:**
- ✅ **Sentiment Analysis**: Should classify as `positive`
- ✅ **Confidence**: Should be very high (≥90%)
- ✅ **Insight Card**: Should show celebratory copy with emojis

---

## 🧪 Test Suite 2: Neutral Sentiment Handling

### Test 2.1: Neutral Text
**Scenario:** User submits neutral text

**Steps:**
1. Set **Mood** to: `neutral`
2. Set **Confidence** to: `5`
3. Set **Medication Confidence** to: `5`
4. Enter **Medication Concern/Note**: `Just checking in today, nothing special to report`
5. Click **Submit**

**Expected Results:**
- ✅ **Sentiment Analysis**: Should classify as `neutral`
- ✅ **Insight Card**: Should show standard insight (not celebratory)

### Test 2.2: Mixed Sentiment
**Scenario:** User submits text with mixed emotions

**Steps:**
1. Set **Mood** to: `anxious`
2. Set **Confidence** to: `6`
3. Set **Medication Confidence** to: `4`
4. Enter **Medication Concern/Note**: `Feeling hopeful about the process but worried about the costs`
5. Click **Submit**

**Expected Results:**
- ✅ **Sentiment Analysis**: Should classify as `neutral` (mixed emotions)
- ✅ **Insight Card**: Should show standard insight

---

## 🧪 Test Suite 3: Negative Sentiment Handling

### Test 3.1: Negative Text
**Scenario:** User submits negative text

**Steps:**
1. Set **Mood** to: `overwhelmed`
2. Set **Confidence** to: `3`
3. Set **Medication Confidence** to: `2`
4. Enter **Medication Concern/Note**: `Feeling really discouraged and exhausted by this process`
5. Click **Submit**

**Expected Results:**
- ✅ **Sentiment Analysis**: Should classify as `negative`
- ✅ **Insight Card**: Should show empathetic insight (not celebratory)

---

## 🧪 Test Suite 4: Edge Cases & Performance

### Test 4.1: Empty Text
**Scenario:** User submits check-in with no text

**Steps:**
1. Set **Mood** to: `neutral`
2. Set **Confidence** to: `5`
3. Set **Medication Confidence** to: `5`
4. Leave **Medication Concern/Note** empty
5. Click **Submit**

**Expected Results:**
- ✅ **Sentiment Analysis**: Should classify as `neutral` (fallback)
- ✅ **Processing Time**: Should be <150ms

### Test 4.2: Very Long Text
**Scenario:** User submits very long text

**Steps:**
1. Set **Mood** to: `excited`
2. Set **Confidence** to: `8`
3. Set **Medication Confidence** to: `6`
4. Enter **Medication Concern/Note**: A very long positive message (copy from below)
5. Click **Submit**

**Long Test Text:**
```
Having such an incredible and amazing day today! I'm feeling so blessed and grateful for this beautiful journey we're on. The support from our medical team has been absolutely wonderful, and I'm so excited about the progress we're making. Every step forward fills me with hope and joy, and I can't help but feel optimistic about what's ahead. This journey has taught me so much about patience, strength, and the power of love. I'm so thankful for my partner and our amazing support network. The little victories along the way make all the challenges worthwhile, and I'm feeling so positive about our future. Today was just perfect in so many ways!
```

**Expected Results:**
- ✅ **Sentiment Analysis**: Should classify as `positive`
- ✅ **Processing Time**: Should be <150ms
- ✅ **Insight Card**: Should show celebratory copy

### Test 4.3: Performance Test
**Scenario:** Test processing speed

**Steps:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Submit a check-in with positive text
4. Check the processing time in the console logs

**Expected Results:**
- ✅ **Processing Time**: Should be <150ms
- ✅ **No Errors**: Should complete without errors

---

## 🔍 Debugging & Troubleshooting

### If Positive Sentiment Test Still Fails:

1. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for sentiment analysis logs
   - Check for any errors

2. **Verify Code Changes:**
   ```bash
   # Check if the fix is applied
   grep -n "0.3" frontend/src/lib/sentiment.ts
   ```

3. **Force Browser Refresh:**
   - Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Or clear browser cache completely

4. **Check Network Tab:**
   - Look for any failed requests
   - Verify sentiment analysis is running

### Common Issues:

1. **Browser Cache**: Most common issue - browser using old code
2. **Network Errors**: Check if API calls are failing
3. **JavaScript Errors**: Check console for syntax errors

---

## 📊 Success Criteria Summary

### ✅ **All Tests Must Pass:**
- [ ] Positive sentiment correctly classified (≥85% precision)
- [ ] Neutral sentiment correctly classified
- [ ] Negative sentiment correctly classified
- [ ] Processing time <150ms
- [ ] PostHog events fire correctly
- [ ] Celebratory copy shows for positive sentiment
- [ ] Standard copy shows for neutral/negative sentiment

### 📈 **Performance Targets:**
- **Sentiment Analysis**: <150ms processing time
- **UI Response**: <500ms total time
- **PostHog Events**: All events fire successfully

---

## 🎯 **Test Completion Checklist**

- [ ] All 6 test scenarios completed
- [ ] Positive sentiment working correctly
- [ ] Neutral sentiment working correctly
- [ ] Negative sentiment working correctly
- [ ] Performance targets met
- [ ] PostHog events firing
- [ ] Copy variants displaying correctly
- [ ] No console errors
- [ ] No network errors

**Test Status:** ⏳ **Ready for Testing**  
**Next Steps:** Run through all test scenarios and report results 