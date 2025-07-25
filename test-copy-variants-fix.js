// Test script to verify CM-01 copy variants fix
const { generateSentimentBasedInsight } = require('./frontend/src/lib/copy-variants.ts');

console.log('🎭 Testing CM-01 Copy Variants Fix\n');

// Test cases for different sentiment types
const testCases = [
  {
    name: "Positive sentiment - should show celebratory copy with 🎉",
    data: {
      sentiment: 'positive',
      confidence: 0.85,
      mood_score: 8,
      user_name: 'Sarah'
    }
  },
  {
    name: "Negative sentiment - should show supportive copy",
    data: {
      sentiment: 'negative',
      confidence: 0.75,
      mood_score: 3,
      user_name: 'Sarah'
    }
  },
  {
    name: "Neutral sentiment - should show neutral copy",
    data: {
      sentiment: 'neutral',
      confidence: 0.60,
      mood_score: 5,
      user_name: 'Sarah'
    }
  }
];

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`Input: ${JSON.stringify(testCase.data, null, 2)}`);
  
  try {
    const result = generateSentimentBasedInsight(testCase.data);
    console.log(`Title: ${result.title}`);
    console.log(`Message: ${result.message}`);
    console.log(`Action: ${result.action?.label || 'None'}`);
    console.log(`Sentiment Data:`, result.sentiment_data);
    console.log('---\n');
  } catch (error) {
    console.error(`Error: ${error.message}\n`);
  }
});

console.log('✅ Copy variants test completed'); 