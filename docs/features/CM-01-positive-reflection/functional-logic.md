# CM-01: Functional Logic & Technical Implementation

## System Architecture

### Data Flow Sequence

```
1. User submits check-in form
2. Frontend performs sentiment analysis (client-side)
3. Sentiment data sent to backend with check-in
4. Backend stores sentiment data in Airtable
5. Frontend generates appropriate copy variant
6. Analytics events tracked in PostHog
7. User sees sentiment-appropriate insight
```

## Core Components

### 1. Sentiment Analysis Engine (`frontend/src/lib/sentiment.ts`)

**Technology Stack:**
- VADER (Valence Aware Dictionary and sEntiment Reasoner) algorithm
- Enhanced lexicon with fertility-specific terms
- Client-side processing for <150ms performance

**Key Functions:**
- `analyzeSentiment(text: string)` - Core sentiment classification
- `analyzeCheckinSentiment(data)` - Check-in specific analysis
- `testSentimentAnalysis()` - Development validation

**Sentiment Classification Logic:**
```typescript
if (compound >= 0.5) → 'positive'
if (compound <= -0.05) → 'negative'
else → 'neutral'
```

**Performance Optimizations:**
- Phrase matching before word-level analysis
- Efficient tokenization with regex cleanup
- Performance.now() timing for validation

### 2. Copy Variant Engine (`frontend/src/lib/copy-variants.ts`)

**Celebratory Copy Variants (5 variants):**
- High energy: "You're absolutely glowing today! ✨"
- Gratitude focus: "What a wonderful day to check in! 💜"
- Strength emphasis: "Your strength is absolutely shining! 🌟"
- Celebration theme: "Celebrating YOU today! 🎊"
- Energy recognition: "This is the energy we love to see! ⭐"

**Copy Selection Logic:**
```typescript
if (sentiment === 'positive') {
  if (mood_score >= 9 && confidence >= 0.8) → use highest energy variant
  else if (mood_score >= 7 && confidence >= 0.6) → rotate top 3 variants
  else → rotate all positive variants
}
```

### 3. Analytics Integration (`frontend/src/lib/analytics.ts`)

**New Event: `sentiment_scored`**
```typescript
interface SentimentScoredEvent {
  user_id: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  mood_score: number;
  processing_time_ms: number;
  text_sources: string[];
  sentiment_scores: {
    positive: number;
    neutral: number;
    negative: number;
    compound: number;
  };
}
```

### 4. Backend Integration (`backend/server.js`)

**Enhanced Check-in Endpoint:**
- Accepts `sentiment_analysis` in request body
- Stores sentiment data in Airtable DailyCheckins table
- Returns sentiment-aware success messages

**New Database Fields:**
- `sentiment`: Sentiment classification
- `sentiment_confidence`: Confidence score
- `sentiment_scores`: JSON string of detailed scores
- `sentiment_processing_time`: Performance metric

## Business Logic Rules

### 1. Sentiment Detection Rules

**Positive Sentiment Triggers:**
- VADER compound score ≥ 0.5
- High confidence ratings (≥8/10) infer positive sentiment
- Positive mood combinations: hopeful + grateful, excited + confident

**Fertility-Specific Terms:**
- Positive: blessed, miracle, journey, progress, breakthrough, resilient
- Negative: failed, setback, exhausted, hopeless, defeated

### 2. Copy Selection Rules

**Positive Sentiment (CM-01 Requirement):**
- Always use celebratory copy variants
- Include emoji (🎉, 💜, 🌟, 🎊, ⭐)
- Personalize with user name when available
- Acknowledge specific achievements mentioned

**Neutral/Negative Sentiment:**
- Maintain current supportive copy
- No changes to existing user experience
- Consistent compassionate tone

### 3. Performance Requirements

**Client-Side Processing:**
- Sentiment analysis must complete in <150ms
- Offline capability (fallback to neutral)
- No external API dependencies

**Accuracy Requirements:**
- ≥85% precision for positive sentiment detection
- ≥85% recall for positive sentiment detection
- Validated against fertility-specific test cases

## Error Handling

### Sentiment Analysis Failures
```typescript
// Graceful degradation
if (sentimentAnalysis.processingTime > 150) {
  fallbackToNeutral();
}

if (sentimentError) {
  logError(sentimentError);
  useFallbackInsight();
}
```

### Analytics Failures
- Sentiment analysis continues even if PostHog fails
- Console logging for debugging
- No user experience impact

### Backend Integration
- Frontend continues with local sentiment processing
- Backend gracefully handles missing sentiment data
- Fallback to existing insight generation

## Data Privacy & Security

### Client-Side Processing
- Raw text never sent to external services
- Only sentiment labels stored server-side
- HIPAA-compliant data handling

### Analytics Data
- No raw user text in PostHog events
- Only sentiment classifications and scores
- User ID linkage for analysis

## Testing Strategy

### Unit Tests (`frontend/src/lib/sentiment.test.ts`)
- Performance validation (<150ms requirement)
- Accuracy validation (≥85% precision/recall)
- Edge case handling (empty text, special characters)
- Consistency testing (same input → same output)

### Integration Tests
- Full check-in flow with sentiment analysis
- Analytics event tracking validation
- Backend sentiment data storage
- Copy variant selection accuracy

### User Testing (`test/integration/test-CM-01-sentiment-analysis.md`)
- Comprehensive manual test scenarios
- User experience validation
- Performance assessment
- Success metrics validation

## Monitoring & Observability

### Performance Metrics
- Sentiment processing time (target: <150ms)
- Copy variant distribution
- User engagement with celebratory copy

### Analytics Events
- `sentiment_scored` event frequency
- Sentiment distribution across users
- Celebratory copy effectiveness

### Error Monitoring
- Sentiment analysis failures
- Performance degradation alerts
- User experience impact tracking

## Future Enhancements

### Phase 2 Roadmap
- DistilBERT fine-tuning when dataset ≥2k entries
- Real-time sentiment feedback collection
- Personalized sentiment threshold tuning
- A/B testing for copy variant effectiveness

### Scalability Considerations
- WebWorker implementation for heavy processing
- Sentiment model caching
- Progressive enhancement for older browsers 