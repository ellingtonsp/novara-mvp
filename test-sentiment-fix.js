// Test script to verify CM-01 sentiment analysis fix
const { analyzeCheckinSentiment } = require('./frontend/src/lib/sentiment.ts');

console.log('🧪 Testing CM-01 Sentiment Analysis Fix\n');

// Test cases that should trigger different sentiment responses
const testCases = [
  {
    name: "Positive sentiment (should show celebratory copy)",
    data: {
      mood_today: ["excited", "hopeful"],
      journey_reflection_today: "Feeling really grateful and positive about this journey!",
      confidence_today: 8
    }
  },
  {
    name: "Negative sentiment (should show supportive copy)",
    data: {
      mood_today: ["exhausted", "worried"],
      journey_reflection_today: "I'm feeling really exhausted and overwhelmed today",
      confidence_today: 3
    }
  },
  {
    name: "Neutral sentiment (should show neutral copy)",
    data: {
      mood_today: ["tired"],
      journey_reflection_today: "Having an okay day, nothing special",
      confidence_today: 5
    }
  }
];

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`Input: ${JSON.stringify(testCase.data, null, 2)}`);
  
  try {
    const result = analyzeCheckinSentiment(testCase.data);
    console.log(`Result: ${result.sentiment} (confidence: ${result.confidence.toFixed(3)})`);
    console.log(`Scores:`, result.scores);
    console.log(`Processing time: ${result.processingTime.toFixed(2)}ms`);
    console.log('---\n');
  } catch (error) {
    console.error(`Error: ${error.message}\n`);
  }
});

console.log('✅ Sentiment analysis test completed'); 