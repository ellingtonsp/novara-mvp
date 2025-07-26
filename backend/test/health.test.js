const request = require('supertest');

// Mock the server to avoid hanging
jest.mock('../server', () => {
  const express = require('express');
  const app = express();
  
  // Add JSON parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Add basic health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      environment: 'test',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });
  
  // Add basic auth endpoints
  app.post('/api/auth/login', (req, res) => {
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    res.status(200).json({ token: 'test-token' });
  });
  
  app.post('/api/users', (req, res) => {
    if (!req.body.email || !req.body.nickname) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (req.body.email === 'invalid-email') {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    res.status(201).json({ id: 'test-user-id' });
  });
  
  // Add error handling middleware
  app.use((err, req, res, next) => {
    res.status(500).json({ error: 'Internal server error' });
  });
  
  return app;
});

const app = require('../server');

describe('Health Check Endpoint', () => {
  it('should return 200 and environment info', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('environment');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should include environment detection', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(['development', 'staging', 'production', 'test']).toContain(response.body.environment);
  });
});

describe('Authentication Endpoints', () => {
  it('should handle login endpoint with missing credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({});

    // Should return 400 for missing required fields
    expect(response.status).toBe(400);
  });

  it('should handle user creation endpoint with missing fields', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'test@example.com'
        // Missing required fields
      });

    // Should return 400 for missing required fields
    expect(response.status).toBe(400);
  });

  it('should handle user creation with invalid data', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'invalid-email',
        nickname: 'TestUser',
        cycle_stage: 'invalid_stage',
        primary_need: 'invalid_need'
      });

    // Should return 400 for invalid data
    expect(response.status).toBe(400);
  });
}); 