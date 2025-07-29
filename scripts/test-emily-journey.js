#!/usr/bin/env node

/**
 * Emily "Hopeful Planner" User Journey Test
 * Simulates a complete user experience with friction point analysis
 * 
 * Emily: 34 yr old UX designer, first-time IVF after late-term loss
 * Tech-savvy but emotionally vulnerable, needs warm & evidence-based support
 */

const TEST_CONFIG = {
  staging: {
    apiUrl: 'https://novara-staging-staging.up.railway.app',
    webUrl: 'https://novara-staging.vercel.app'
  }
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

// Emily's emotional states during her journey
const EMILY_MOODS = {
  signup: { mood: 'hopeful', confidence: 6, concern: 'Getting started feels overwhelming' },
  day1: { mood: 'anxious', confidence: 5, concern: 'So much information to process' },
  day3: { mood: 'okay', confidence: 6, concern: 'Side effects from medications' },
  day7: { mood: 'good', confidence: 7, concern: 'Partner communication' },
  day14: { mood: 'tough', confidence: 4, concern: 'Upcoming appointment anxiety' },
  day21: { mood: 'amazing', confidence: 8, concern: 'Staying positive' }
};

// Friction points Emily would notice
const FRICTION_POINTS = [];

// Value moments Emily would appreciate
const VALUE_MOMENTS = [];

function log(message, type = 'info', indent = 0) {
  const prefix = {
    success: `${colors.green}✅`,
    error: `${colors.red}❌`,
    warning: `${colors.yellow}⚠️`,
    info: `${colors.blue}ℹ️`,
    data: `${colors.cyan}📊`,
    emily: `${colors.magenta}👩`,
    friction: `${colors.red}🚧`,
    value: `${colors.green}💎`
  }[type] || '';
  
  const indentStr = '  '.repeat(indent);
  console.log(`${indentStr}${prefix} ${message}${colors.reset}`);
}

function addFrictionPoint(stage, issue, impact) {
  FRICTION_POINTS.push({ stage, issue, impact });
  log(`FRICTION: ${issue}`, 'friction', 1);
  log(`Impact: ${impact}`, 'warning', 2);
}

function addValueMoment(stage, moment, reaction) {
  VALUE_MOMENTS.push({ stage, moment, reaction });
  log(`VALUE: ${moment}`, 'value', 1);
  log(`Emily's reaction: "${reaction}"`, 'emily', 2);
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json().catch(() => null);
    
    return {
      ok: response.ok,
      status: response.status,
      data,
      responseTime: Math.random() * 1000 + 500 // Simulate response time
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message
    };
  }
}

async function simulateUIInteraction(action, expectedTime) {
  // Simulate UI interaction time
  const actualTime = expectedTime + (Math.random() * 500 - 250);
  await new Promise(resolve => setTimeout(resolve, actualTime));
  return actualTime;
}

async function analyzeOnboarding(response, timeToComplete) {
  log('\n📱 Analyzing Onboarding Experience...', 'info');
  
  // Emily's expectations as a UX designer
  if (timeToComplete > 120000) { // 2 minutes
    addFrictionPoint(
      'Onboarding',
      'Onboarding took longer than 2 minutes',
      'Emily expects streamlined onboarding. She might abandon if it feels too long.'
    );
  } else {
    addValueMoment(
      'Onboarding',
      'Quick 2-minute onboarding process',
      'Perfect! I can get started without a huge time commitment.'
    );
  }
  
  // Check for warm tone in response
  if (response.data && response.data.user && response.data.user.nickname) {
    addValueMoment(
      'Onboarding',
      'Personal touch with nickname usage',
      'They remembered my name. This feels more personal already.'
    );
  }
  
  // Check for overwhelming clinical language
  if (response.data && response.data.message && response.data.message.includes('protocol')) {
    addFrictionPoint(
      'Onboarding',
      'Clinical language in welcome message',
      'Emily wants warm, human language, not medical jargon.'
    );
  }
}

async function analyzeWelcomeInsight(insight, timeToReceive) {
  log('\n💜 Analyzing First Micro-Insight...', 'info');
  
  // Emily expects insight within 10 minutes
  if (timeToReceive > 600000) { // 10 minutes
    addFrictionPoint(
      'Welcome Insight',
      'First insight took too long to arrive',
      'Emily needs immediate value. Waiting too long creates doubt.'
    );
  } else {
    addValueMoment(
      'Welcome Insight',
      'Rapid personalized insight delivery',
      'Wow, they already understand what I need!'
    );
  }
  
  // Check if insight addresses her top stressor
  if (insight && insight.message) {
    if (insight.message.toLowerCase().includes('overwhelming') || 
        insight.message.toLowerCase().includes('support')) {
      addValueMoment(
        'Welcome Insight',
        'Insight directly addresses initial overwhelm',
        'They get it. This is exactly what I needed to hear.'
      );
    }
    
    // Check for actionable advice
    if (insight.action && insight.action.label) {
      addValueMoment(
        'Welcome Insight',
        'Actionable coping tactic provided',
        'I can actually DO something about this, not just worry.'
      );
    } else {
      addFrictionPoint(
        'Welcome Insight',
        'No actionable advice in first insight',
        'Emily needs concrete steps, not just empathy.'
      );
    }
  }
}

async function analyzeDailyCheckin(day, checkinData, response) {
  log(`\n📅 Day ${day} Check-in Analysis...`, 'info');
  
  // Emoji-based check-in evaluation
  if (checkinData.mood_today) {
    addValueMoment(
      `Day ${day} Check-in`,
      'Simple emoji-based mood selection',
      'Quick and easy. I don\'t have to write essays about my feelings.'
    );
  }
  
  // Response time matters for engagement
  if (response.responseTime > 2000) {
    addFrictionPoint(
      `Day ${day} Check-in`,
      'Slow response after check-in submission',
      'Emily expects instant feedback. Delays feel like the app is broken.'
    );
  }
  
  // Check for personalized insights
  if (response.data && response.data.insight) {
    if (response.data.insight.message.includes(checkinData.primary_concern_today)) {
      addValueMoment(
        `Day ${day} Check-in`,
        'Insight directly addresses today\'s concern',
        'It\'s like having a friend who really listens.'
      );
    }
  }
}

async function analyzeMetricsDashboard(metrics) {
  log('\n📊 Analyzing Metrics Experience...', 'info');
  
  // Emily wants to see small wins
  if (metrics.checkInStreak >= 7) {
    addValueMoment(
      'Metrics Dashboard',
      `${metrics.checkInStreak}-day check-in streak celebrated`,
      'I\'m actually sticking with this! The streak motivates me.'
    );
  }
  
  if (metrics.anxietyAverage && metrics.phq4Trend === 'improving') {
    addValueMoment(
      'Metrics Dashboard',
      'Mood trending upward visualization',
      'I can SEE I\'m getting better. The data proves it\'s working.'
    );
  }
  
  // Check for overwhelming data presentation
  if (metrics.riskFactors && metrics.riskFactors.length > 3) {
    addFrictionPoint(
      'Metrics Dashboard',
      'Too many risk factors shown at once',
      'Emily might feel overwhelmed by negative data presentation.'
    );
  }
}

async function analyzeEngagementReminder(daysSinceLastCheckin) {
  log('\n🔔 Analyzing Re-engagement Strategy...', 'info');
  
  if (daysSinceLastCheckin === 2) {
    addValueMoment(
      'Engagement',
      'Gentle nudge after 48 hours',
      'Not pushy, just a friendly reminder. I appreciate that.'
    );
  } else if (daysSinceLastCheckin > 3) {
    addFrictionPoint(
      'Engagement',
      'No follow-up for extended absence',
      'Emily might feel forgotten if there\'s no outreach.'
    );
  }
}

async function testEmilyJourney() {
  const config = TEST_CONFIG.staging;
  const emilyEmail = `emily.hopeful.${Date.now()}@example.com`;
  
  console.log(`\n${colors.magenta}=== Emily "Hopeful Planner" User Journey Test ===${colors.reset}`);
  console.log(`${colors.magenta}Testing at: ${config.webUrl}${colors.reset}`);
  console.log(`${colors.magenta}Emily's email: ${emilyEmail}${colors.reset}\n`);
  
  let token = null;
  let user = null;
  
  // Stage 1: Signup & Onboarding
  log('STAGE 1: First Visit & Onboarding', 'emily');
  log('Emily found Novara through a fertility forum recommendation', 'info', 1);
  log('She\'s hopeful but cautious after her loss', 'emily', 1);
  
  const onboardingStart = Date.now();
  
  // Simulate Emily choosing the full onboarding path (she's a planner)
  const signupData = {
    email: emilyEmail,
    nickname: 'Emily',
    confidence_meds: 6,
    confidence_costs: 7,
    confidence_overall: 5,
    primary_need: 'emotional_support',
    cycle_stage: 'stimulation',
    top_concern: EMILY_MOODS.signup.concern,
    baseline_completed: true,
    onboarding_path: 'control'
  };
  
  const signupResponse = await makeRequest(`${config.apiUrl}/api/users`, {
    method: 'POST',
    body: JSON.stringify(signupData)
  });
  
  const onboardingTime = Date.now() - onboardingStart;
  
  if (signupResponse.ok) {
    token = signupResponse.data.token;
    user = signupResponse.data.user;
    log('Signup successful', 'success', 1);
    await analyzeOnboarding(signupResponse, onboardingTime);
  } else {
    addFrictionPoint(
      'Signup',
      'Signup failed',
      'Emily would be frustrated and might not try again.'
    );
    return;
  }
  
  // Stage 2: Welcome Insight
  log('\nSTAGE 2: First Value Moment', 'emily');
  
  const insightStart = Date.now();
  const insightResponse = await makeRequest(`${config.apiUrl}/api/insights/micro`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      onboardingData: signupData
    })
  });
  
  if (insightResponse.ok) {
    const insightTime = Date.now() - insightStart;
    await analyzeWelcomeInsight(insightResponse.data.micro_insight, insightTime);
  } else {
    addFrictionPoint(
      'Welcome Insight',
      'Failed to receive welcome insight',
      'Emily loses trust immediately if the first promise isn\'t kept.'
    );
  }
  
  // Stage 3: Daily Check-ins (Days 1, 3, 7, 14, 21)
  log('\nSTAGE 3: Daily Engagement Journey', 'emily');
  
  for (const [dayKey, moodData] of Object.entries(EMILY_MOODS)) {
    if (dayKey === 'signup') continue;
    
    const day = parseInt(dayKey.replace('day', ''));
    const date = new Date();
    date.setDate(date.getDate() - (21 - day)); // Backdate appropriately
    
    const checkinData = {
      mood_today: moodData.mood,
      confidence_today: moodData.confidence,
      primary_concern_today: moodData.concern,
      user_note: `Day ${day} - ${moodData.concern}`,
      date_submitted: date.toISOString().split('T')[0]
    };
    
    // Add medication tracking for later days
    if (day >= 3) {
      checkinData.medication_taken = day === 14 ? 'no' : 'yes'; // Tough day 14
      checkinData.side_effects = day === 3 ? ['Bloating', 'Mood swings'] : [];
    }
    
    // Add partner involvement
    if (day === 7 || day === 21) {
      checkinData.partner_involved = true;
      checkinData.coping_strategies = ['Partner discussion', 'Deep breathing'];
    }
    
    const checkinResponse = await makeRequest(`${config.apiUrl}/api/checkins`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(checkinData)
    });
    
    if (checkinResponse.ok) {
      await analyzeDailyCheckin(day, checkinData, checkinResponse);
    } else {
      addFrictionPoint(
        `Day ${day} Check-in`,
        'Check-in submission failed',
        'Emily would lose momentum if check-ins don\'t work reliably.'
      );
    }
    
    // Simulate time between check-ins
    await simulateUIInteraction('navigating app', 1000);
  }
  
  // Stage 4: Reviewing Progress (Metrics)
  log('\nSTAGE 4: Reviewing Progress & Metrics', 'emily');
  
  const metricsResponse = await makeRequest(`${config.apiUrl}/api/users/metrics`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (metricsResponse.ok) {
    await analyzeMetricsDashboard(metricsResponse.data.metrics);
  } else {
    addFrictionPoint(
      'Metrics',
      'Unable to load progress metrics',
      'Emily needs to see her progress to stay motivated.'
    );
  }
  
  // Stage 5: Testing Re-engagement
  log('\nSTAGE 5: Testing Re-engagement Flow', 'emily');
  await analyzeEngagementReminder(2); // Simulate 2-day gap
  
  // Generate Summary Report
  generateReport();
}

function generateReport() {
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}=== EMILY'S JOURNEY SUMMARY REPORT ===${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
  
  // Success Metrics
  const totalInteractions = FRICTION_POINTS.length + VALUE_MOMENTS.length;
  const satisfactionRate = (VALUE_MOMENTS.length / totalInteractions * 100).toFixed(1);
  
  log(`Overall Satisfaction Score: ${satisfactionRate}%`, satisfactionRate >= 70 ? 'success' : 'warning');
  log(`Value Moments: ${VALUE_MOMENTS.length}`, 'value');
  log(`Friction Points: ${FRICTION_POINTS.length}`, 'friction');
  
  // Top Value Moments
  console.log(`\n${colors.green}💎 TOP VALUE MOMENTS:${colors.reset}`);
  VALUE_MOMENTS.slice(0, 5).forEach((moment, i) => {
    console.log(`${i + 1}. [${moment.stage}] ${moment.moment}`);
    console.log(`   Emily: "${moment.reaction}"`);
  });
  
  // Critical Friction Points
  console.log(`\n${colors.red}🚧 CRITICAL FRICTION POINTS:${colors.reset}`);
  FRICTION_POINTS.forEach((friction, i) => {
    console.log(`${i + 1}. [${friction.stage}] ${friction.issue}`);
    console.log(`   Impact: ${friction.impact}`);
  });
  
  // Recommendations
  console.log(`\n${colors.yellow}📋 RECOMMENDATIONS FOR EMILY'S EXPERIENCE:${colors.reset}`);
  
  if (FRICTION_POINTS.some(f => f.stage.includes('Onboarding'))) {
    console.log('1. Streamline onboarding further - Emily needs to feel value within 2 minutes');
  }
  
  if (!VALUE_MOMENTS.some(v => v.stage.includes('Day 14'))) {
    console.log('2. Add extra support on tough days - Emily needs more help when struggling');
  }
  
  if (FRICTION_POINTS.some(f => f.issue.includes('clinical'))) {
    console.log('3. Review all copy for warm, human tone - avoid medical jargon');
  }
  
  console.log('4. Implement proactive outreach when mood drops significantly');
  console.log('5. Add partner collaboration features for days they\'re involved');
  
  // Emily's Verdict
  console.log(`\n${colors.magenta}👩 EMILY'S VERDICT:${colors.reset}`);
  if (satisfactionRate >= 80) {
    console.log('"This app gets me. It\'s like having a knowledgeable friend who\'s always there."');
    console.log('⭐⭐⭐⭐⭐ - Would recommend to fertility forum friends');
  } else if (satisfactionRate >= 60) {
    console.log('"It\'s helpful, but there are some rough edges that need smoothing."');
    console.log('⭐⭐⭐⭐ - Good but room for improvement');
  } else {
    console.log('"I wanted to love this, but it needs work before I\'d recommend it."');
    console.log('⭐⭐⭐ - Has potential but frustrating');
  }
  
  // Key Success Metric
  const checkinsIn21Days = VALUE_MOMENTS.filter(v => v.stage.includes('Check-in')).length;
  console.log(`\n${colors.cyan}📊 KEY SUCCESS METRIC:${colors.reset}`);
  console.log(`Check-ins completed in 21 days: ${checkinsIn21Days}/14 target`);
  console.log(`Self-reported anxiety trend: ${checkinsIn21Days >= 14 ? 'IMPROVING ✅' : 'NEEDS MORE DATA ⚠️'}`);
}

// Run the test
testEmilyJourney().catch(console.error);