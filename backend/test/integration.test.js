/**
 * Integration Tests for New Endpoints
 * End-to-end workflow testing for the refactored server endpoints
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { testUsers, testCheckins, requestPayloads } = require('./fixtures/test-data');

// Mock all dependencies - same as endpoints.test.js
const mockUserService = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  initialize: jest.fn(),
};

const mockCheckinService = {
  getUserCheckins: jest.fn(),
  findByUserAndDate: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  initialize: jest.fn(),
};

const mockInsightsService = {
  initialize: jest.fn(),
};

const mockQuestionGenerator = {
  generatePersonalizedCheckInQuestions: jest.fn(),
  getMedicationStatusFromCycleStage: jest.fn(),
};

const mockDatabase = {
  initializeDatabase: jest.fn(),
};

// Mock all service modules
jest.mock('../services/user-service', () => mockUserService);
jest.mock('../services/checkin-service', () => mockCheckinService);
jest.mock('../services/insights-service', () => mockInsightsService);
jest.mock('../utils/question-generator', () => mockQuestionGenerator);
jest.mock('../config/database', () => mockDatabase);

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { email: 'test@example.com', userId: 'test-user-123' };
    next();
  },
  generateToken: jest.fn(() => 'mock-jwt-token'),
}));

jest.mock('../config', () => ({
  port: 9002,
  nodeEnv: 'test',
  database: { usePostgres: true, useSchemaV2: true },
  cors: { origin: '*' },
  jwt: { secret: 'test-secret' },
  sentry: { dsn: null },
  airtable: { apiKey: null },
  redis: { url: null },
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
}));

const app = require('../server-refactored');

describe('Integration Tests - Complete Workflows', () => {
  const mockUser = testUsers.stimulationUser;
  const mockCheckin = testCheckins.todayCheckin;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful responses
    mockUserService.findByEmail.mockResolvedValue(mockUser);
    mockUserService.update.mockResolvedValue(mockUser);
    mockCheckinService.getUserCheckins.mockResolvedValue({ records: [mockCheckin] });
    mockCheckinService.findByUserAndDate.mockResolvedValue(null);
    mockCheckinService.create.mockResolvedValue(mockCheckin);
    mockQuestionGenerator.generatePersonalizedCheckInQuestions.mockReturnValue([
      { id: 'mood_today', text: 'How are you feeling?', required: true },
      { id: 'confidence_today', text: 'Rate confidence 1-10', required: true },
    ]);
    mockQuestionGenerator.getMedicationStatusFromCycleStage.mockReturnValue('taking');
  });

  describe('Complete Check-in Workflow', () => {
    it('should complete full enhanced check-in workflow', async () => {
      // Step 1: Get personalized questions
      const questionsResponse = await request(app)
        .get('/api/checkins/questions')
        .expect(200);

      expect(questionsResponse.body.success).toBe(true);
      expect(questionsResponse.body.questions).toBeDefined();

      // Step 2: Get last values for form defaults
      const lastValuesResponse = await request(app)
        .get('/api/checkins/last-values')
        .expect(200);

      expect(lastValuesResponse.body.success).toBe(true);
      expect(lastValuesResponse.body.hasValues).toBe(true);

      // Step 3: Submit enhanced check-in
      const checkinData = {
        ...requestPayloads.validEnhancedCheckin,
        // Use some values from last check-in
        user_note: lastValuesResponse.body.lastValues.user_note,
      };

      const checkinResponse = await request(app)
        .post('/api/daily-checkin-enhanced')
        .send(checkinData)
        .expect(201);

      expect(checkinResponse.body.success).toBe(true);
      expect(checkinResponse.body.checkin.checkin_type).toBe('enhanced');

      // Verify service calls
      expect(mockQuestionGenerator.generatePersonalizedCheckInQuestions).toHaveBeenCalledWith(mockUser);
      expect(mockCheckinService.getUserCheckins).toHaveBeenCalledWith(mockUser.id, 1);
      expect(mockCheckinService.findByUserAndDate).toHaveBeenCalled();
      expect(mockCheckinService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          checkin_type: 'enhanced',
          mood_today: checkinData.mood_today,
          confidence_today: checkinData.confidence_today,
        })
      );
    });

    it('should handle check-in with cycle stage update', async () => {
      const checkinWithCycleUpdate = {
        ...requestPayloads.validEnhancedCheckin,
        cycle_stage_update: 'transfer',
      };

      const response = await request(app)
        .post('/api/daily-checkin-enhanced')
        .send(checkinWithCycleUpdate)
        .expect(201);

      expect(response.body.success).toBe(true);

      // Verify cycle stage was updated
      expect(mockUserService.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          cycle_stage: 'transfer',
          cycle_stage_updated: expect.any(String),
        })
      );
    });
  });

  describe('User Profile Management Workflow', () => {
    it('should complete profile update workflow', async () => {
      // Step 1: Get current profile
      const profileResponse = await request(app)
        .get('/api/users/profile')
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.cycle_stage).toBe(mockUser.cycle_stage);
      expect(profileResponse.body.medication_status).toBe(mockUser.medication_status);

      // Step 2: Update cycle stage
      const newCycleStage = 'retrieval';
      const cycleUpdateResponse = await request(app)
        .patch('/api/users/cycle-stage')
        .send({ cycle_stage: newCycleStage })
        .expect(200);

      expect(cycleUpdateResponse.body.success).toBe(true);
      expect(cycleUpdateResponse.body.cycle_stage).toBe(newCycleStage);
      expect(cycleUpdateResponse.body.derived_medication_status).toBe('taking');

      // Step 3: Update medication status
      const newMedicationStatus = 'not_taking';
      const medicationUpdateResponse = await request(app)
        .patch('/api/users/medication-status')
        .send({ medication_status: newMedicationStatus })
        .expect(200);

      expect(medicationUpdateResponse.body.success).toBe(true);
      expect(medicationUpdateResponse.body.medication_status).toBe(newMedicationStatus);

      // Verify service calls
      expect(mockUserService.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ cycle_stage: newCycleStage })
      );
      expect(mockUserService.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({ medication_status: newMedicationStatus })
      );
    });
  });

  describe('New User Onboarding Workflow', () => {
    it('should handle new user with no check-in history', async () => {
      // Mock new user scenario
      const newUser = testUsers.newUser;
      mockUserService.findByEmail.mockResolvedValue(newUser);
      mockCheckinService.getUserCheckins.mockResolvedValue({ records: [] });

      // Step 1: Get personalized questions (should work for new users)
      const questionsResponse = await request(app)
        .get('/api/checkins/questions')
        .expect(200);

      expect(questionsResponse.body.success).toBe(true);

      // Step 2: Get last values (should return no values)
      const lastValuesResponse = await request(app)
        .get('/api/checkins/last-values')
        .expect(200);

      expect(lastValuesResponse.body.success).toBe(true);
      expect(lastValuesResponse.body.hasValues).toBe(false);

      // Step 3: Submit first check-in
      const firstCheckinResponse = await request(app)
        .post('/api/daily-checkin-enhanced')
        .send(requestPayloads.minimalCheckin)
        .expect(201);

      expect(firstCheckinResponse.body.success).toBe(true);
      expect(firstCheckinResponse.body.checkin).toBeDefined();
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should handle duplicate check-in gracefully', async () => {
      // Mock existing check-in for today
      mockCheckinService.findByUserAndDate.mockResolvedValue(mockCheckin);

      const duplicateResponse = await request(app)
        .post('/api/daily-checkin-enhanced')
        .send(requestPayloads.validEnhancedCheckin)
        .expect(409);

      expect(duplicateResponse.body.success).toBe(false);
      expect(duplicateResponse.body.error).toContain('already submitted');
      expect(duplicateResponse.body.existing_checkin).toBeDefined();
    });

    it('should handle service failures gracefully', async () => {
      // Mock service failure
      mockUserService.findByEmail.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/users/profile')
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should validate input data across endpoints', async () => {
      // Test invalid cycle stage
      await request(app)
        .patch('/api/users/cycle-stage')
        .send({ cycle_stage: 'invalid_stage' })
        .expect(400);

      // Test invalid medication status
      await request(app)
        .patch('/api/users/medication-status')
        .send({ medication_status: 'invalid_status' })
        .expect(400);

      // Test invalid check-in data
      await request(app)
        .post('/api/daily-checkin-enhanced')
        .send(requestPayloads.invalidCheckins.invalidConfidence)
        .expect(400);
    });
  });

  describe('Data Consistency Workflows', () => {
    it('should maintain consistency across related endpoints', async () => {
      const updatedUser = { ...mockUser, cycle_stage: 'pregnant' };
      mockUserService.update.mockResolvedValue(updatedUser);
      mockUserService.findByEmail.mockResolvedValue(updatedUser);

      // Update cycle stage
      await request(app)
        .patch('/api/users/cycle-stage')
        .send({ cycle_stage: 'pregnant' })
        .expect(200);

      // Verify profile reflects the change
      const profileResponse = await request(app)
        .get('/api/users/profile')
        .expect(200);

      expect(profileResponse.body.cycle_stage).toBe('pregnant');

      // Verify questions adapt to new cycle stage
      const questionsResponse = await request(app)
        .get('/api/checkins/questions')
        .expect(200);

      expect(questionsResponse.body.success).toBe(true);
      // Question generator should have been called with updated user
      expect(mockQuestionGenerator.generatePersonalizedCheckInQuestions).toHaveBeenCalledWith(
        expect.objectContaining({ cycle_stage: 'pregnant' })
      );
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle multiple concurrent requests', async () => {
      const concurrentRequests = [
        request(app).get('/api/users/profile'),
        request(app).get('/api/checkins/questions'),
        request(app).get('/api/checkins/last-values'),
      ];

      const responses = await Promise.all(concurrentRequests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should handle large check-in payloads', async () => {
      const largeCheckin = {
        ...requestPayloads.validEnhancedCheckin,
        user_note: 'A'.repeat(1000), // Large note
        journey_reflection_today: 'B'.repeat(500),
      };

      const response = await request(app)
        .post('/api/daily-checkin-enhanced')
        .send(largeCheckin)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should filter undefined values in check-in data', async () => {
      const checkinWithUndefined = {
        ...requestPayloads.validEnhancedCheckin,
        undefined_field: undefined,
        null_field: null,
        empty_string: '',
      };

      await request(app)
        .post('/api/daily-checkin-enhanced')
        .send(checkinWithUndefined)
        .expect(201);

      const createCall = mockCheckinService.create.mock.calls[0][0];
      expect(createCall).not.toHaveProperty('undefined_field');
      expect(createCall).toHaveProperty('null_field', null);
      expect(createCall).toHaveProperty('empty_string', '');
    });
  });

  describe('Security and Validation', () => {
    it('should require authentication for all endpoints', async () => {
      // Mock authentication failure
      const mockAuth = require('../middleware/auth');
      const originalAuth = mockAuth.authenticateToken;
      mockAuth.authenticateToken = jest.fn((req, res, next) => {
        res.status(401).json({ success: false, error: 'Unauthorized' });
      });

      const protectedEndpoints = [
        { method: 'get', path: '/api/checkins/last-values' },
        { method: 'get', path: '/api/checkins/questions' },
        { method: 'post', path: '/api/daily-checkin-enhanced' },
        { method: 'get', path: '/api/users/profile' },
        { method: 'patch', path: '/api/users/cycle-stage' },
        { method: 'patch', path: '/api/users/medication-status' },
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
      }

      // Restore original auth
      mockAuth.authenticateToken = originalAuth;
    });

    it('should validate confidence rating bounds', async () => {
      const testCases = [
        { confidence_today: 0, expectStatus: 400 },
        { confidence_today: 1, expectStatus: 201 },
        { confidence_today: 10, expectStatus: 201 },
        { confidence_today: 11, expectStatus: 400 },
        { confidence_today: -1, expectStatus: 400 },
      ];

      for (const testCase of testCases) {
        const payload = {
          ...requestPayloads.minimalCheckin,
          confidence_today: testCase.confidence_today,
        };

        await request(app)
          .post('/api/daily-checkin-enhanced')
          .send(payload)
          .expect(testCase.expectStatus);
      }
    });
  });
});