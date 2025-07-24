const request = require('supertest');

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