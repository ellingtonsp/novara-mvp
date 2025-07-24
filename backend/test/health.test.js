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

    expect(['development', 'staging', 'production']).toContain(response.body.environment);
  });
});

describe('Authentication Endpoints', () => {
  it('should allow login endpoint access', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword'
      });

    // Should return 401 for invalid credentials, not 404
    expect(response.status).toBe(401);
  });

  it('should allow user creation endpoint access', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'test@example.com',
        nickname: 'TestUser',
        cycle_stage: 'considering',
        primary_need: 'emotional_support'
      });

    // Should return 400 for missing required fields, not 404
    expect(response.status).toBe(400);
  });
}); 