import request from 'supertest';
import app from '../server';
import { disconnectDatabase } from '../config/database';
import { runSeed } from '../seed';

describe('Upvia API Endpoints Integration Test', () => {
  beforeAll(async () => {
    await runSeed(false);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('GET /health should return 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /api/v1/auth/login should authenticate student demo user and return JWT tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student@upvia.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe('student@upvia.com');
  });

  it('POST /api/v1/auth/login should reject bad password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student@upvia.com',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/opportunities should return list of published opportunities', async () => {
    const res = await request(app).get('/api/v1/opportunities');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.pagination).toBeDefined();
  });
});
