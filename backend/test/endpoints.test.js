/**
 * Comprehensive Test Suite for New Endpoints
 * Tests for the newly implemented refactored server endpoints
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock services and dependencies
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

// Mock the question generator
const mockQuestionGenerator = {
  generatePersonalizedCheckInQuestions: jest.fn(),
  getMedicationStatusFromCycleStage: jest.fn(),
};

// Mock database initialization
const mockDatabase = {
  initializeDatabase: jest.fn(),
};

// Mock all service modules
jest.mock('../services/user-service', () => mockUserService);
jest.mock('../services/checkin-service', () => mockCheckinService);
jest.mock('../services/insights-service', () => mockInsightsService);
jest.mock('../utils/question-generator', () => mockQuestionGenerator);
jest.mock('../config/database', () => mockDatabase);

// Mock middleware
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    // Mock JWT payload
    req.user = { email: 'test@example.com', userId: 'test-user-123' };
    next();
  },
  generateToken: jest.fn(() => 'mock-jwt-token'),
}));

// Mock config
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

// Import the app after mocks are set up
const app = require('../server-refactored');

describe('New Endpoints Integration Tests', () => {
  // Test data fixtures
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    nickname: 'TestUser',
    cycle_stage: 'ivf_prep',
    medication_status: 'taking',
    confidence_meds: 7,
    confidence_costs: 6,
    confidence_overall: 8,
    primary_need: 'emotional_support',
    top_concern: 'medication_side_effects',
    created_at: '2025-01-01T00:00:00Z',
  };

  const mockCheckin = {
    id: 'checkin-123',
    user_id: 'user-123',
    mood_today: 'hopeful',
    confidence_today: 7,
    date_submitted: '2025-01-01',
    journey_reflection_today: 'Feeling optimistic',
    medication_taken: 'yes',
    user_note: 'Good day today',
    created_at: '2025-01-01T10:00:00Z',
  };

  const mockQuestions = [
    {
      id: 'mood_today',
      text: 'How are you feeling today?',
      type: 'mood',
      required: true,
      context: 'baseline',
    },
    {
      id: 'confidence_today',
      text: 'Rate your confidence (1-10)',
      type: 'scale',
      required: true,
      context: 'baseline',
    },
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockUserService.findByEmail.mockResolvedValue(mockUser);
    mockCheckinService.getUserCheckins.mockResolvedValue({ records: [mockCheckin] });
    mockCheckinService.findByUserAndDate.mockResolvedValue(null);
    mockCheckinService.create.mockResolvedValue(mockCheckin);
    mockQuestionGenerator.generatePersonalizedCheckInQuestions.mockReturnValue(mockQuestions);
    mockQuestionGenerator.getMedicationStatusFromCycleStage.mockReturnValue('taking');
  });

  describe('GET /api/checkins/last-values', () => {
    it('should return last check-in values for authenticated user', async () => {
      const response = await request(app)
        .get('/api/checkins/last-values')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        hasValues: true,
        message: 'Last check-in values retrieved successfully',
      });

      expect(response.body.lastValues).toMatchObject({
        mood_today: 'hopeful',
        confidence_today: 7,
        medication_taken: 'yes',
        user_note: 'Good day today',
        last_checkin_date: '2025-01-01',
      });

      expect(mockUserService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockCheckinService.getUserCheckins).toHaveBeenCalledWith('user-123', 1);
    });

    it('should return hasValues: false when no previous check-ins exist', async () => {
      mockCheckinService.getUserCheckins.mockResolvedValue({ records: [] });

      const response = await request(app)
        .get('/api/checkins/last-values')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        hasValues: false,
        message: 'No previous check-ins found',
      });
    });

    it('should return 404 when user not found', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/checkins/last-values')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'User not found',
      });
    });

    it('should calculate days since last check-in correctly', async () => {
      const yesterdayCheckin = {
        ...mockCheckin,
        date_submitted: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      mockCheckinService.getUserCheckins.mockResolvedValue({ records: [yesterdayCheckin] });

      const response = await request(app)
        .get('/api/checkins/last-values')
        .expect(200);

      expect(response.body.lastValues.days_since_last_checkin).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/checkins/questions', () => {
    it('should return personalized questions for authenticated user', async () => {
      const response = await request(app)
        .get('/api/checkins/questions')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        questions: mockQuestions,
      });

      expect(response.body.metadata).toMatchObject({
        total_questions: 2,
        required_questions: 2,
        dimension_focus: 'baseline',
      });

      expect(mockUserService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockQuestionGenerator.generatePersonalizedCheckInQuestions).toHaveBeenCalledWith(mockUser);
    });

    it('should return 404 when user not found', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/checkins/questions')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'User not found',
      });
    });

    it('should handle empty questions array', async () => {
      mockQuestionGenerator.generatePersonalizedCheckInQuestions.mockReturnValue([]);

      const response = await request(app)
        .get('/api/checkins/questions')
        .expect(200);

      expect(response.body.questions).toEqual([]);
      expect(response.body.metadata.total_questions).toBe(0);
    });
  });

  describe('POST /api/daily-checkin-enhanced', () => {
    const validCheckinData = {
      mood_today: 'hopeful',
      confidence_today: 7,
      journey_reflection_today: 'Feeling optimistic about the journey',
      date_submitted: '2025-01-01',
      medication_taken: 'yes',
      user_note: 'Good day today',
      phq4_feeling_nervous: 1,
      phq4_stop_worrying: 1,
      phq4_little_interest: 0,
      phq4_feeling_down: 0,
    };

    it('should create enhanced check-in successfully', async () => {
      const response = await request(app)
        .post('/api/daily-checkin-enhanced')
        .send(validCheckinData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Enhanced check-in completed successfully! 🌟',
      });

      expect(response.body.checkin).toMatchObject({
        id: 'checkin-123',
        mood_today: 'hopeful',
        confidence_today: 7,
        checkin_type: 'enhanced',
      });

      expect(mockCheckinService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          mood_today: 'hopeful',
          confidence_today: 7,
          journey_reflection_today: 'Feeling optimistic about the journey',
          phq4_feeling_nervous: 1,
          checkin_type: 'enhanced',
        })
      );
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = { mood_today: 'hopeful' }; // Missing confidence_today

      const response = await request(app)
        .post('/api/daily-checkin-enhanced')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Missing required fields: mood_today and confidence_today are required',
      });
    });

    it('should return 400 for invalid confidence rating', async () => {
      const invalidData = {
        mood_today: 'hopeful',
        confidence_today: 15, // Invalid range
      };

      const response = await request(app)
        .post('/api/daily-checkin-enhanced')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'confidence_today must be between 1 and 10',
      });
    });

    it('should return 409 for duplicate check-in on same date', async () => {
      mockCheckinService.findByUserAndDate.mockResolvedValue(mockCheckin);

      const response = await request(app)
        .post('/api/daily-checkin-enhanced')
        .send(validCheckinData)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: 'You have already submitted a check-in for today. Please try again tomorrow.',
      });

      expect(response.body.existing_checkin).toMatchObject({
        id: 'checkin-123',
        mood_today: 'hopeful',
        confidence_today: 7,
      });
    });

    it('should handle cycle stage update when provided', async () => {
      const dataWithCycleUpdate = {
        ...validCheckinData,
        cycle_stage_update: 'stimulation',
      };

      await request(app)
        .post('/api/daily-checkin-enhanced')
        .send(dataWithCycleUpdate)
        .expect(201);

      expect(mockUserService.update).toHaveBeenCalledWith('user-123', {
        cycle_stage: 'stimulation',
        cycle_stage_updated: expect.any(String),
      });
    });

    it('should filter out undefined fields from check-in data', async () => {
      const dataWithUndefined = {
        ...validCheckinData,
        undefined_field: undefined,
        empty_field: null,
      };

      await request(app)
        .post('/api/daily-checkin-enhanced')
        .send(dataWithUndefined)
        .expect(201);

      const createCall = mockCheckinService.create.mock.calls[0][0];
      expect(createCall).not.toHaveProperty('undefined_field');
      expect(createCall).toHaveProperty('empty_field', null);
    });

    it('should return 404 when user not found', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/daily-checkin-enhanced')
        .send(validCheckinData)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'User not found',
      });
    });
  });

  describe('GET /api/users/profile', () => {
    it('should return user profile successfully', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        email: 'test@example.com',
        nickname: 'TestUser',
        cycle_stage: 'ivf_prep',
        medication_status: 'taking',
        confidence_meds: 7,
        confidence_costs: 6,
        confidence_overall: 8,
      });

      expect(mockUserService.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should return 404 when user not found', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users/profile')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'User not found',
      });
    });

    it('should include all expected profile fields', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(200);

      const expectedFields = [
        'email', 'nickname', 'confidence_meds', 'confidence_costs',
        'confidence_overall', 'medication_status', 'primary_need',
        'cycle_stage', 'timezone', 'email_opt_in', 'baseline_completed'
      ];

      expectedFields.forEach(field => {
        expect(response.body).toHaveProperty(field);
      });
    });
  });

  describe('PATCH /api/users/cycle-stage', () => {
    it('should update cycle stage successfully', async () => {
      const response = await request(app)
        .patch('/api/users/cycle-stage')
        .send({ cycle_stage: 'stimulation' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Cycle stage updated successfully',
        cycle_stage: 'stimulation',
        derived_medication_status: 'taking',
      });

      expect(mockUserService.update).toHaveBeenCalledWith('user-123', {
        cycle_stage: 'stimulation',
        cycle_stage_updated: expect.any(String),
      });

      expect(mockQuestionGenerator.getMedicationStatusFromCycleStage).toHaveBeenCalledWith('stimulation');
    });

    it('should return 400 for missing cycle_stage', async () => {
      const response = await request(app)
        .patch('/api/users/cycle-stage')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'cycle_stage is required',
      });
    });

    it('should return 400 for invalid cycle_stage', async () => {
      const response = await request(app)
        .patch('/api/users/cycle-stage')
        .send({ cycle_stage: 'invalid_stage' })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid cycle stage',
      });
    });

    it('should validate all allowed cycle stages', async () => {
      const validStages = ['considering', 'ivf_prep', 'stimulation', 'retrieval', 'transfer', 'tww', 'pregnant', 'between_cycles'];
      
      for (const stage of validStages) {
        await request(app)
          .patch('/api/users/cycle-stage')
          .send({ cycle_stage: stage })
          .expect(200);
      }
    });

    it('should return 404 when user not found', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/users/cycle-stage')
        .send({ cycle_stage: 'stimulation' })
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'User not found',
      });
    });
  });

  describe('PATCH /api/users/medication-status', () => {
    it('should update medication status successfully', async () => {
      const response = await request(app)
        .patch('/api/users/medication-status')
        .send({ medication_status: 'starting_soon' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Medication status updated successfully',
        medication_status: 'starting_soon',
      });

      expect(mockUserService.update).toHaveBeenCalledWith('user-123', {
        medication_status: 'starting_soon',
        medication_status_updated: expect.any(String),
      });
    });

    it('should return 400 for missing medication_status', async () => {
      const response = await request(app)
        .patch('/api/users/medication-status')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'medication_status is required',
      });
    });

    it('should return 400 for invalid medication_status', async () => {
      const response = await request(app)
        .patch('/api/users/medication-status')
        .send({ medication_status: 'invalid_status' })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid medication status',
      });
    });

    it('should validate all allowed medication statuses', async () => {
      const validStatuses = ['taking', 'starting_soon', 'not_taking', 'between_cycles', 'finished_treatment', 'pregnancy_support'];
      
      for (const status of validStatuses) {
        await request(app)
          .patch('/api/users/medication-status')
          .send({ medication_status: status })
          .expect(200);
      }
    });

    it('should return 404 when user not found', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .patch('/api/users/medication-status')
        .send({ medication_status: 'starting_soon' })
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'User not found',
      });
    });

    it('should include medication_status_updated timestamp', async () => {
      const response = await request(app)
        .patch('/api/users/medication-status')
        .send({ medication_status: 'not_taking' })
        .expect(200);

      expect(response.body).toHaveProperty('medication_status_updated');
      expect(new Date(response.body.medication_status_updated)).toBeInstanceOf(Date);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockUserService.findByEmail.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/users/profile')
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/daily-checkin-enhanced')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Authentication', () => {
    it('should require authentication for all protected endpoints', async () => {
      // Mock auth middleware to reject request
      const mockAuth = require('../middleware/auth');
      mockAuth.authenticateToken.mockImplementation((req, res, next) => {
        res.status(401).json({ success: false, error: 'Unauthorized' });
      });

      const endpoints = [
        { method: 'get', path: '/api/checkins/last-values' },
        { method: 'get', path: '/api/checkins/questions' },
        { method: 'post', path: '/api/daily-checkin-enhanced' },
        { method: 'get', path: '/api/users/profile' },
        { method: 'patch', path: '/api/users/cycle-stage' },
        { method: 'patch', path: '/api/users/medication-status' },
      ];

      for (const endpoint of endpoints) {
        await request(app)[endpoint.method](endpoint.path)
          .expect(401);
      }

      // Restore mock
      mockAuth.authenticateToken.mockImplementation((req, res, next) => {
        req.user = { email: 'test@example.com', userId: 'test-user-123' };
        next();
      });
    });
  });
});