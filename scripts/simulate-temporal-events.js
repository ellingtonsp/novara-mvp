#!/usr/bin/env node

/**
 * Temporal Events Simulation for CM-01 Testing
 * Demonstrates sentiment analysis and dynamic copy generation
 */

const API_BASE = 'http://localhost:9002';

// Test scenarios with different temporal patterns
const testScenarios = [
  {
    name: "Positive Progression (Week 1)",
    user: {
      email: "temporal-test-1@example.com",
      nickname: "TemporalTest1",
      confidence_meds: 3,
      confidence_costs: 4,
      confidence_overall: 4,
      primary_need: "medical_clarity",
      cycle_stage: "considering"
    },
    checkins: [
      {
        day: 1,
        mood: "worried",
        confidence: 3,
        note: "Feeling overwhelmed about starting this journey. Everything feels so uncertain.",
        expected_sentiment: "negative"
      },
      {
        day: 3,
        mood: "anxious",
        confidence: 4,
        note: "Still nervous but starting to understand the process better. Doctor was helpful.",
        expected_sentiment: "neutral"
      },
      {
        day: 5,
        mood: "hopeful",
        confidence: 6,
        note: "Feeling more confident! The support group really helped. Starting to feel like I can do this.",
        expected_sentiment: "positive"
      },
      {
        day: 7,
        mood: "excited",
        confidence: 8,
        note: "Amazing news today! Insurance approved our treatment. Feeling so blessed and grateful for this journey! 🎉",
        expected_sentiment: "positive"
      }
    ]
  },
  {
    name: "Mixed Emotions Journey (Week 2)",
    user: {
      email: "temporal-test-2@example.com",
      nickname: "TemporalTest2",
      confidence_meds: 6,
      confidence_costs: 7,
      confidence_overall: 6,
      primary_need: "emotional_support",
      cycle_stage: "ivf_prep"
    },
    checkins: [
      {
        day: 1,
        mood: "hopeful, frustrated",
        confidence: 7,
        note: "Feeling hopeful about our chances but frustrated with the medication schedule. It's so confusing!",
        expected_sentiment: "mixed"
      },
      {
        day: 3,
        mood: "excited, worried",
        confidence: 8,
        note: "Great progress on the protocol! But still worried about side effects. Taking it one day at a time.",
        expected_sentiment: "mixed"
      },
      {
        day: 5,
        mood: "grateful",
        confidence: 9,
        note: "Feeling so grateful for all the support. This community is amazing!",
        expected_sentiment: "positive"
      }
    ]
  },
  {
    name: "Confidence Building (Week 3)",
    user: {
      email: "temporal-test-3@example.com",
      nickname: "TemporalTest3",
      confidence_meds: 2,
      confidence_costs: 3,
      confidence_overall: 2,
      primary_need: "medical_clarity",
      cycle_stage: "stimulation"
    },
    checkins: [
      {
        day: 1,
        mood: "overwhelmed",
        confidence: 2,
        note: "The medication protocol is so overwhelming. I don't understand any of this.",
        expected_sentiment: "negative"
      },
      {
        day: 3,
        mood: "frustrated",
        confidence: 3,
        note: "Still struggling with the injections. This is harder than I expected.",
        expected_sentiment: "negative"
      },
      {
        day: 5,
        mood: "hopeful",
        confidence: 5,
        note: "Getting better at the injections! Nurse was so encouraging today.",
        expected_sentiment: "positive"
      },
      {
        day: 7,
        mood: "confident",
        confidence: 7,
        note: "Feeling much more confident! The routine is becoming second nature.",
        expected_sentiment: "positive"
      }
    ]
  }
];

async function createUser(userData) {
  try {
    const response = await fetch(`${API_BASE}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error(`User creation failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`✅ Created user: ${userData.nickname} (${userData.email})`);
    return result.user;
  } catch (error) {
    console.error(`❌ Failed to create user ${userData.nickname}:`, error.message);
    return null;
  }
}

async function submitCheckin(user, checkinData, dayOffset = 0) {
  try {
    // Calculate date with offset
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    const dateStr = date.toISOString().split('T')[0];
    
    const checkinPayload = {
      mood_today: checkinData.mood,
      confidence_today: checkinData.confidence,
      user_note: checkinData.note,
      date_submitted: dateStr
    };
    
    const response = await fetch(`${API_BASE}/api/checkins`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify(checkinPayload)
    });
    
    if (!response.ok) {
      throw new Error(`Check-in failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`✅ Day ${checkinData.day}: ${checkinData.mood} (${checkinData.confidence}/10)`);
    console.log(`   Note: "${checkinData.note.substring(0, 50)}..."`);
    
    return result;
  } catch (error) {
    console.error(`❌ Failed to submit check-in for day ${checkinData.day}:`, error.message);
    return null;
  }
}

async function getInsights(user) {
  try {
    const response = await fetch(`${API_BASE}/api/insights/daily`, {
      headers: { 'Authorization': `Bearer ${user.token}` }
    });
    
    if (!response.ok) {
      throw new Error(`Insights fetch failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`📊 Latest insight: ${result.insight?.title || 'No insight available'}`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to fetch insights:`, error.message);
    return null;
  }
}

async function simulateScenario(scenario) {
  console.log(`\n🎭 SIMULATING: ${scenario.name}`);
  console.log(`=====================================`);
  
  // Create user
  const user = await createUser(scenario.user);
  if (!user) return;
  
  // Submit check-ins in chronological order (oldest first)
  const sortedCheckins = [...scenario.checkins].sort((a, b) => a.day - b.day);
  
  for (const checkin of sortedCheckins) {
    await submitCheckin(user, checkin, 7 - checkin.day); // Days ago
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    
    // Get insights after each check-in
    const insights = await getInsights(user);
    if (insights?.insight) {
      console.log(`   💡 Insight: "${insights.insight.message}"`);
    }
    console.log('');
  }
  
  console.log(`✅ Completed simulation for ${scenario.name}\n`);
}

async function main() {
  console.log(`🚀 TEMPORAL EVENTS SIMULATION`);
  console.log(`=============================`);
  console.log(`API Base: ${API_BASE}`);
  console.log(`Time: ${new Date().toLocaleString()}\n`);
  
  // Test API health first
  try {
    const healthResponse = await fetch(`${API_BASE}/api/health`);
    if (!healthResponse.ok) {
      throw new Error('API not responding');
    }
    console.log(`✅ API Health Check: OK\n`);
  } catch (error) {
    console.error(`❌ API Health Check Failed: ${error.message}`);
    console.log(`Please ensure the backend is running on port 9002`);
    process.exit(1);
  }
  
  // Run all scenarios
  for (const scenario of testScenarios) {
    await simulateScenario(scenario);
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between scenarios
  }
  
  console.log(`🎉 ALL SIMULATIONS COMPLETE!`);
  console.log(`\n📱 Check the browser at http://localhost:4200/ to see the interactions`);
  console.log(`🔍 Look for users with emails starting with "temporal-test-"`);
}

// Run the simulation
main().catch(console.error); 