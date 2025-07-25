/**
 * Time Simulation Test Framework
 * 
 * This module provides utilities for testing time-dependent features:
 * - Question rotation over time
 * - Streak calculations
 * - Weekly insight generation
 * - Cycle stage progression
 * - Medication status transitions
 */

const { expect } = require('@jest/globals');

class TimeSimulator {
  constructor(startDate = new Date()) {
    this.currentDate = new Date(startDate);
    this.originalDateNow = Date.now;
    this.originalDateConstructor = global.Date;
    this.isActive = false;
  }

  /**
   * Start time simulation - overrides Date.now() and new Date()
   */
  start() {
    if (this.isActive) return;
    
    const simulator = this;
    
    // Override Date.now()
    Date.now = () => simulator.currentDate.getTime();
    
    // Override Date constructor
    global.Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          super(simulator.currentDate);
        } else {
          super(...args);
        }
      }
      
      static now() {
        return simulator.currentDate.getTime();
      }
    };
    
    // Copy static methods
    Object.getOwnPropertyNames(this.originalDateConstructor).forEach(name => {
      if (typeof this.originalDateConstructor[name] === 'function' && name !== 'now') {
        global.Date[name] = this.originalDateConstructor[name];
      }
    });
    
    this.isActive = true;
    console.log(`🕐 Time simulation started at: ${this.currentDate.toISOString()}`);
  }

  /**
   * Stop time simulation - restore original Date behavior
   */
  stop() {
    if (!this.isActive) return;
    
    Date.now = this.originalDateNow;
    global.Date = this.originalDateConstructor;
    this.isActive = false;
    console.log(`🕐 Time simulation stopped`);
  }

  /**
   * Advance time by specified amount
   */
  advanceTime({ days = 0, hours = 0, minutes = 0, weeks = 0 }) {
    const totalMs = (weeks * 7 * 24 * 60 * 60 * 1000) + 
                   (days * 24 * 60 * 60 * 1000) + 
                   (hours * 60 * 60 * 1000) + 
                   (minutes * 60 * 1000);
    
    this.currentDate.setTime(this.currentDate.getTime() + totalMs);
    console.log(`⏭️  Time advanced to: ${this.currentDate.toISOString()}`);
    return this.currentDate;
  }

  /**
   * Set specific date
   */
  setDate(date) {
    this.currentDate = new Date(date);
    console.log(`📅 Time set to: ${this.currentDate.toISOString()}`);
    return this.currentDate;
  }

  /**
   * Get current simulated date
   */
  getCurrentDate() {
    return new Date(this.currentDate);
  }

  /**
   * Get current date as ISO string
   */
  getCurrentISO() {
    return this.currentDate.toISOString();
  }

  /**
   * Get current date as YYYY-MM-DD string
   */
  getCurrentDateString() {
    return this.currentDate.toISOString().split('T')[0];
  }
}

/**
 * Test User Factory - creates test users with different profiles
 */
class TestUserFactory {
  static createUser(overrides = {}) {
    const defaultUser = {
      id: 'rec_test_user_' + Date.now(),
      email: 'test@example.com',
      nickname: 'TestUser',
      confidence_meds: 5,
      confidence_costs: 5,
      confidence_overall: 5,
      primary_need: 'medical_clarity',
      cycle_stage: 'ivf_prep',
      top_concern: 'medication timing',
      timezone: 'America/New_York',
      email_opt_in: true,
      status: 'active',
      created_at: new Date().toISOString()
    };

    return { ...defaultUser, ...overrides };
  }

  static createNewUser() {
    return this.createUser({
      cycle_stage: 'considering',
      confidence_meds: 3,
      confidence_costs: 4,
      confidence_overall: 3
    });
  }

  static createStimulationUser() {
    return this.createUser({
      cycle_stage: 'stimulation',
      confidence_meds: 6,
      confidence_costs: 5,
      confidence_overall: 6
    });
  }

  static createPregnantUser() {
    return this.createUser({
      cycle_stage: 'pregnant',
      confidence_meds: 8,
      confidence_costs: 6,
      confidence_overall: 8
    });
  }

  static createBetweenCyclesUser() {
    return this.createUser({
      cycle_stage: 'between_cycles',
      confidence_meds: 4,
      confidence_costs: 3,
      confidence_overall: 4
    });
  }
}

/**
 * Mock Check-in Data Factory
 */
class MockCheckinFactory {
  static createCheckin(user, overrides = {}) {
    const defaultCheckin = {
      id: 'rec_checkin_' + Date.now(),
      user_id: user.id,
      mood_today: ['hopeful', 'anxious'],
      confidence_today: 6,
      primary_concern_today: 'medication timing',
      medication_confidence_today: 5,
      medication_concern_today: 'side effects worry me',
      financial_stress_today: 4,
      financial_concern_today: 'insurance coverage',
      journey_readiness_today: 7,
      user_note: 'Feeling optimistic but nervous',
      date_submitted: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };

    return { ...defaultCheckin, ...overrides };
  }

  static createPositiveCheckin(user) {
    return this.createCheckin(user, {
      mood_today: ['hopeful', 'excited'],
      confidence_today: 8,
      medication_confidence_today: 8,
      medication_concern_today: '',
      financial_stress_today: 6,
      journey_readiness_today: 9,
      user_note: 'Feeling really good about everything today!'
    });
  }

  static createMixedSentimentCheckin(user) {
    return this.createCheckin(user, {
      mood_today: ['hopeful', 'overwhelmed'],
      confidence_today: 7,
      medication_confidence_today: 2, // Critical concern
      medication_concern_today: 'completely confused about dosing schedule',
      financial_stress_today: 6,
      journey_readiness_today: 8,
      user_note: 'Feeling positive overall but really struggling with medications'
    });
  }

  static createNegativeCheckin(user) {
    return this.createCheckin(user, {
      mood_today: ['anxious', 'overwhelmed'],
      confidence_today: 3,
      medication_confidence_today: 2,
      medication_concern_today: 'everything feels wrong',
      financial_stress_today: 2,
      journey_readiness_today: 3,
      user_note: 'Having a really tough day with everything'
    });
  }
}

/**
 * Test Assertion Helpers
 */
class TestAssertions {
  static assertQuestionRotation(questions, expectedRotation) {
    expect(questions).toHaveLength(expectedRotation.length);
    
    expectedRotation.forEach((expectedQuestion, index) => {
      const actualQuestion = questions[index];
      expect(actualQuestion.id).toBe(expectedQuestion.id);
      if (expectedQuestion.context) {
        expect(actualQuestion.context).toBe(expectedQuestion.context);
      }
    });
  }

  static assertSentimentClassification(result, expectedSentiment, expectedConfidence = null) {
    expect(result.sentiment).toBe(expectedSentiment);
    if (expectedConfidence !== null) {
      expect(result.confidence).toBeGreaterThanOrEqual(expectedConfidence);
    }
  }

  static assertCriticalConcerns(result, expectedConcerns) {
    expect(result.criticalConcerns).toEqual(expect.arrayContaining(expectedConcerns));
  }

  static assertCopyVariant(insight, expectedType, shouldContainText = null) {
    expect(insight.type).toBe(expectedType);
    if (shouldContainText) {
      expect(insight.message.toLowerCase()).toContain(shouldContainText.toLowerCase());
    }
  }

  static assertTimeProgression(simulator, expectedDays) {
    const startTime = new Date('2025-01-01T00:00:00.000Z');
    simulator.setDate(startTime);
    
    for (let day = 0; day < expectedDays; day++) {
      const currentDate = simulator.getCurrentDate();
      expect(currentDate.getDate()).toBe(startTime.getDate() + day);
      simulator.advanceTime({ days: 1 });
    }
  }
}

module.exports = {
  TimeSimulator,
  TestUserFactory,
  MockCheckinFactory,
  TestAssertions
}; 