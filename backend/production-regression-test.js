const axios = require('axios');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com' 
    : 'http://localhost:3000',
  TEST_USER_EMAIL: `test-regression-${Date.now()}@example.com`,
  TEST_USER_NICKNAME: 'RegressionTest',
  TIMEOUT: 10000
};

class ProductionRegressionTest {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
    this.authToken = null;
    this.testUserId = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : '📋';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runTest(testName, testFunction) {
    try {
      this.log(`Running: ${testName}`);
      await testFunction();
      this.results.passed++;
      this.results.tests.push({ name: testName, status: 'PASSED' });
      this.log(`PASSED: ${testName}`, 'success');
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ 
        name: testName, 
        status: 'FAILED', 
        error: error.message 
      });
      this.log(`FAILED: ${testName} - ${error.message}`, 'error');
    }
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    const config = {
      method,
      url: `${CONFIG.BASE_URL}${endpoint}`,
      timeout: CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    if (this.authToken) {
      config.headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await axios(config);
    return response.data;
  }

  // Test 1: Health Check
  async testHealthCheck() {
    const response = await this.makeRequest('GET', '/api/health');
    if (response.status !== 'ok') {
      throw new Error('Health check failed');
    }
    if (!response.airtable || !response.jwt) {
      throw new Error('Missing required health check components');
    }
  }

  // Test 2: User Registration
  async testUserRegistration() {
    const userData = {
      email: CONFIG.TEST_USER_EMAIL,
      nickname: CONFIG.TEST_USER_NICKNAME,
      confidence_meds: 7,
      confidence_costs: 5,
      confidence_overall: 6,
      primary_need: 'emotional_support',
      top_concern: 'Regression testing',
      cycle_stage: 'ivf_prep'
    };

    const response = await this.makeRequest('POST', '/api/users', userData);
    
    if (!response.user || !response.user.id) {
      throw new Error('User registration failed - no user ID returned');
    }
    
    this.testUserId = response.user.id;
    this.log(`Test user created with ID: ${this.testUserId}`);
  }

  // Test 3: User Login
  async testUserLogin() {
    const loginData = {
      email: CONFIG.TEST_USER_EMAIL
    };

    const response = await this.makeRequest('POST', '/api/auth/login', loginData);
    
    if (!response.token) {
      throw new Error('Login failed - no token returned');
    }
    
    this.authToken = response.token;
    this.log('Authentication token received');
  }

  // Test 4: Micro-Insight Generation
  async testMicroInsightGeneration() {
    const insightData = {
      email: CONFIG.TEST_USER_EMAIL,
      nickname: CONFIG.TEST_USER_NICKNAME
    };

    const response = await this.makeRequest('POST', '/api/insights/micro', insightData);
    
    if (!response.insights || response.insights.length === 0) {
      throw new Error('Micro-insight generation failed - no insights returned');
    }
    
    const insight = response.insights[0];
    if (!insight.title || !insight.content) {
      throw new Error('Invalid insight structure');
    }
    
    this.log(`Generated micro-insight: "${insight.title}"`);
  }

  // Test 5: Daily Insights
  async testDailyInsights() {
    const response = await this.makeRequest('GET', '/api/insights/daily');
    
    if (!response.insights) {
      throw new Error('Daily insights endpoint failed');
    }
    
    this.log(`Retrieved ${response.insights.length} daily insights`);
  }

  // Test 6: Personalized Questions
  async testPersonalizedQuestions() {
    const response = await this.makeRequest('GET', '/api/checkins/questions');
    
    if (!response.questions || response.questions.length === 0) {
      throw new Error('No personalized questions returned');
    }
    
    if (response.questions.length < 3) {
      throw new Error('Insufficient personalized questions generated');
    }
    
    this.log(`Generated ${response.questions.length} personalized questions`);
  }

  // Test 7: Daily Check-in Submission
  async testDailyCheckin() {
    const checkinData = {
      mood_today: 'hopeful, excited',
      confidence_today: 7,
      primary_concern_today: 'Regression testing workflow'
    };

    const response = await this.makeRequest('POST', '/api/checkins', checkinData);
    
    if (!response.success) {
      throw new Error('Daily check-in submission failed');
    }
    
    this.log('Daily check-in submitted successfully');
  }

  // Test 8: Enhanced Check-in
  async testEnhancedCheckin() {
    const enhancedData = {
      mood_today: 'optimistic, focused',
      confidence_today: 8,
      financial_stress_today: 4,
      medication_confidence_today: 6
    };

    const response = await this.makeRequest('POST', '/api/daily-checkin-enhanced', enhancedData);
    
    if (!response.insight) {
      throw new Error('Enhanced check-in failed - no insight returned');
    }
    
    this.log('Enhanced check-in completed successfully');
  }

  // Test 9: Analytics Event Tracking
  async testAnalyticsTracking() {
    const eventData = {
      event_type: 'regression_test',
      test_timestamp: new Date().toISOString(),
      test_data: { purpose: 'Production verification' }
    };

    const response = await this.makeRequest('POST', '/api/analytics/events', eventData);
    
    if (!response.success) {
      throw new Error('Analytics event tracking failed');
    }
    
    this.log('Analytics event tracked successfully');
  }

  // Test 10: Insight Engagement
  async testInsightEngagement() {
    const engagementData = {
      insight_type: 'regression_test',
      action: 'viewed',
      insight_id: 'test_insight_' + Date.now()
    };

    const response = await this.makeRequest('POST', '/api/insights/engagement', engagementData);
    
    if (!response.success) {
      throw new Error('Insight engagement tracking failed');
    }
    
    this.log('Insight engagement tracked successfully');
  }

  // Test 11: Airtable Connectivity
  async testAirtableConnectivity() {
    // This is tested implicitly through user registration and data operations
    // But we can add a specific connectivity test
    const response = await this.makeRequest('GET', '/api/health');
    
    if (response.airtable !== 'connected') {
      throw new Error('Airtable connectivity issue detected');
    }
    
    this.log('Airtable connectivity verified');
  }

  // Test 12: Database Operations
  async testDatabaseOperations() {
    // Test that we can retrieve user data
    const response = await this.makeRequest('GET', '/api/users/me');
    
    if (!response.user) {
      throw new Error('Unable to retrieve user profile data');
    }
    
    if (response.user.email !== CONFIG.TEST_USER_EMAIL) {
      throw new Error('User profile data mismatch');
    }
    
    this.log('Database operations verified');
  }

  // Cleanup: Remove test user
  async cleanup() {
    try {
      this.log('Cleaning up test data...');
      // Note: You might want to implement a cleanup endpoint
      // For now, we'll just log that cleanup should be manual
      this.log('⚠️  Manual cleanup required: Remove test user ' + CONFIG.TEST_USER_EMAIL);
    } catch (error) {
      this.log('Cleanup failed: ' + error.message, 'error');
    }
  }

  // Run all tests
  async runAllTests() {
    this.log('🚀 Starting Production Regression Test Suite');
    this.log(`Testing against: ${CONFIG.BASE_URL}`);
    
    const startTime = Date.now();

    // Core Infrastructure Tests
    await this.runTest('Health Check', () => this.testHealthCheck());
    await this.runTest('Airtable Connectivity', () => this.testAirtableConnectivity());

    // User Management Tests
    await this.runTest('User Registration', () => this.testUserRegistration());
    await this.runTest('User Login', () => this.testUserLogin());
    await this.runTest('Database Operations', () => this.testDatabaseOperations());

    // Core Feature Tests
    await this.runTest('Micro-Insight Generation', () => this.testMicroInsightGeneration());
    await this.runTest('Daily Insights', () => this.testDailyInsights());
    await this.runTest('Personalized Questions', () => this.testPersonalizedQuestions());

    // User Interaction Tests
    await this.runTest('Daily Check-in', () => this.testDailyCheckin());
    await this.runTest('Enhanced Check-in', () => this.testEnhancedCheckin());

    // Analytics Tests
    await this.runTest('Analytics Tracking', () => this.testAnalyticsTracking());
    await this.runTest('Insight Engagement', () => this.testInsightEngagement());

    // Cleanup
    await this.cleanup();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Results Summary
    this.log('\n🏁 Regression Test Results:');
    this.log(`Duration: ${duration} seconds`);
    this.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    this.log(`Passed: ${this.results.passed}`, 'success');
    this.log(`Failed: ${this.results.failed}`, this.results.failed > 0 ? 'error' : 'success');

    if (this.results.failed > 0) {
      this.log('\n❌ Failed Tests:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          this.log(`  - ${test.name}: ${test.error}`, 'error');
        });
    }

    const successRate = ((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1);
    this.log(`\n📊 Success Rate: ${successRate}%`);

    if (this.results.failed === 0) {
      this.log('\n🎉 All tests passed! System is ready for production.', 'success');
      process.exit(0);
    } else {
      this.log('\n⚠️  Some tests failed. Please review before deploying to production.', 'error');
      process.exit(1);
    }
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  const tester = new ProductionRegressionTest();
  tester.runAllTests().catch(error => {
    console.error('❌ Test suite failed to run:', error.message);
    process.exit(1);
  });
}

module.exports = ProductionRegressionTest; 