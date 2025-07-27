#!/usr/bin/env node

/**
 * 🧪 ON-01 A/B Distribution Validation Test
 * Tests the A/B test distribution logic that's used in the browser
 */

const fetch = require('node-fetch').default || require('node-fetch');

const BASE_URL = 'http://localhost:9002';

// Simulate the same logic as abTestUtils.ts
function getOnboardingPath(sessionId = null) {
  // Use the same deterministic logic as the frontend
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  const sessionHash = sessionId.split('_').pop() || sessionId;
  const sessionBasedSplit = sessionHash.charCodeAt(0) % 2 === 0;
  
  return {
    path: sessionBasedSplit ? 'test' : 'control',
    sessionId: sessionId
  };
}

async function testABDistribution() {
  console.log('🧪 ON-01 A/B Distribution Validation Test');
  console.log('==========================================');
  console.log('Testing A/B test distribution logic');
  console.log('');
  
  const ITERATIONS = 20;
  const pathCounts = { test: 0, control: 0 };
  const sessionIds = [];
  
  console.log(`Running ${ITERATIONS} iterations to test distribution...`);
  console.log('');
  
  for (let i = 0; i < ITERATIONS; i++) {
    // Generate session ID using the same logic as abTestUtils
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionIds.push(sessionId);
    
    // Use the same deterministic logic as abTestUtils
    const result = getOnboardingPath(sessionId);
    pathCounts[result.path]++;
    
    console.log(`  Iteration ${i + 1}: Session ${sessionId.substring(0, 20)}... → ${result.path}`);
  }
  
  console.log('');
  console.log('📊 DISTRIBUTION RESULTS:');
  console.log('========================');
  console.log(`Test path: ${pathCounts.test}/${ITERATIONS} (${Math.round(pathCounts.test/ITERATIONS*100)}%)`);
  console.log(`Control path: ${pathCounts.control}/${ITERATIONS} (${Math.round(pathCounts.control/ITERATIONS*100)}%)`);
  
  const variance = Math.abs(pathCounts.test - pathCounts.control) / ITERATIONS;
  const isBalanced = variance <= 0.3; // Allow 30% variance for small sample
  
  console.log(`Variance: ${Math.round(variance*100)}%`);
  console.log(`Balanced: ${isBalanced ? '✅' : '❌'}`);
  
  // Test session consistency
  console.log('');
  console.log('🔄 SESSION CONSISTENCY TEST:');
  console.log('============================');
  
  const testSessionId = sessionIds[0];
  const consistencyResults = [];
  
  for (let i = 0; i < 5; i++) {
    const result = getOnboardingPath(testSessionId);
    consistencyResults.push(result.path);
  }
  
  const isConsistent = consistencyResults.every(path => path === consistencyResults[0]);
  console.log(`Session ID: ${testSessionId.substring(0, 20)}...`);
  console.log(`Results: ${consistencyResults.join(', ')}`);
  console.log(`Consistent: ${isConsistent ? '✅' : '❌'}`);
  
  // Test browser-like session generation
  console.log('');
  console.log('🌐 BROWSER-LIKE SESSION TEST:');
  console.log('=============================');
  
  const browserSessions = [];
  for (let i = 0; i < 10; i++) {
    // Simulate browser session ID generation
    const browserSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const result = getOnboardingPath(browserSessionId);
    browserSessions.push(result.path);
  }
  
  const browserTestCount = browserSessions.filter(path => path === 'test').length;
  const browserControlCount = browserSessions.filter(path => path === 'control').length;
  
  console.log(`Browser sessions - Test: ${browserTestCount}, Control: ${browserControlCount}`);
  console.log(`Distribution: ${Math.round(browserTestCount/10*100)}% test, ${Math.round(browserControlCount/10*100)}% control`);
  
  // Summary
  console.log('');
  console.log('📋 A/B DISTRIBUTION VALIDATION RESULTS:');
  console.log('=======================================');
  console.log(`✅ Distribution Balance: ${isBalanced ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Session Consistency: ${isConsistent ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Browser Simulation: ${browserTestCount > 0 && browserControlCount > 0 ? 'PASS' : 'FAIL'}`);
  
  const allPassed = isBalanced && isConsistent && browserTestCount > 0 && browserControlCount > 0;
  
  console.log(`\n🎯 Overall Result: ${allPassed ? '✅ A/B DISTRIBUTION WORKING' : '❌ A/B DISTRIBUTION ISSUES'}`);
  
  if (allPassed) {
    console.log('\n🚀 A/B test distribution is working correctly!');
    console.log('Users will be distributed roughly 50/50 between test and control paths.');
  } else {
    console.log('\n⚠️ Issues detected in A/B distribution - need investigation');
  }
  
  return allPassed;
}

// Run the test
testABDistribution(); 