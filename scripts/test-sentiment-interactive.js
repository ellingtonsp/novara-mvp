#!/usr/bin/env node

/**
 * Interactive Sentiment Analysis Test
 * Tests CM-01 sentiment analysis with various inputs
 */

// Import the sentiment analysis function
const { analyzeSentiment, analyzeCheckinSentiment } = require('../frontend/src/lib/sentiment.ts');

// Test cases for sentiment analysis
const testCases = [
  {
    name: "Positive Celebration",
    text: "Amazing news today! Insurance approved our treatment. Feeling so blessed and grateful for this journey! 🎉",
    expected: "positive"
  },
  {
    name: "Mixed Emotions",
    text: "Feeling hopeful about our chances but frustrated with the medication schedule. It's so confusing!",
    expected: "mixed"
  },
  {
    name: "Negative Struggle",
    text: "The medication protocol is so overwhelming. I don't understand any of this.",
    expected: "negative"
  },
  {
    name: "Neutral Reflection",
    text: "Just another day in the process. Taking it one step at a time.",
    expected: "neutral"
  },
  {
    name: "Hopeful Progress",
    text: "Feeling more confident! The support group really helped. Starting to feel like I can do this.",
    expected: "positive"
  }
];

function testSentimentAnalysis() {
  console.log("🧠 CM-01 Sentiment Analysis Test");
  console.log("================================\n");
  
  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    console.log(`Input: "${testCase.text}"`);
    
    try {
      const result = analyzeSentiment(testCase.text);
      
      console.log(`Result: ${result.sentiment} (confidence: ${(result.confidence * 100).toFixed(1)}%)`);
      console.log(`Scores: positive=${result.scores.positive}, neutral=${result.scores.neutral}, negative=${result.scores.negative}, compound=${result.scores.compound}`);
      console.log(`Processing time: ${result.processingTime.toFixed(2)}ms`);
      
      if (result.criticalConcerns && result.criticalConcerns.length > 0) {
        console.log(`Critical concerns detected: ${result.criticalConcerns.join(', ')}`);
      }
      
      const isCorrect = result.sentiment === testCase.expected;
      console.log(`✅ Expected: ${testCase.expected}, Got: ${result.sentiment} ${isCorrect ? '✓' : '✗'}`);
      console.log('');
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}\n`);
    }
  });
}

function testCheckinSentiment() {
  console.log("📝 Check-in Sentiment Analysis Test");
  console.log("==================================\n");
  
  const checkinData = {
    mood_today: "hopeful, frustrated",
    confidence_today: 7,
    user_note: "Feeling hopeful about our chances but frustrated with the medication schedule. It's so confusing!",
    journey_reflection_today: "This is harder than I expected but I'm learning."
  };
  
  console.log("Check-in data:");
  console.log(JSON.stringify(checkinData, null, 2));
  console.log("");
  
  try {
    const result = analyzeCheckinSentiment(checkinData);
    
    console.log(`Sentiment: ${result.sentiment}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`Scores: ${JSON.stringify(result.scores)}`);
    console.log(`Processing time: ${result.processingTime.toFixed(2)}ms`);
    
    if (result.criticalConcerns && result.criticalConcerns.length > 0) {
      console.log(`Critical concerns: ${result.criticalConcerns.join(', ')}`);
    }
    
    console.log("");
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
  }
}

// Run tests
console.log("🚀 Starting CM-01 Sentiment Analysis Tests\n");

testSentimentAnalysis();
testCheckinSentiment();

console.log("✅ Tests completed!");
console.log("\n📱 Now try the manual demo in the browser:");
console.log("   http://localhost:4200/");
console.log("\n📋 Follow the guide in: scripts/manual-temporal-demo.md"); 