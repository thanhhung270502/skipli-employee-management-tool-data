import { describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { createApp } from './app';

describe('Health API', () => {
  const app = createApp();

  it('GET /api/health returns 200 with success payload', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Skipli API');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('404 handler', () => {
  const app = createApp();

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown-route');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('not found');
  });
});

describe('Owner auth validation', () => {
  const app = createApp();

  it('POST /api/owner/create-new-access-code rejects empty body', async () => {
    const res = await request(app).post('/api/owner/create-new-access-code').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/owner/validate-access-code rejects missing access code', async () => {
    const res = await request(app)
      .post('/api/owner/validate-access-code')
      .send({ phoneNumber: '+1234567890' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Employee auth validation', () => {
  const app = createApp();

  it('POST /api/employee/login-email rejects invalid email', async () => {
    const res = await request(app).post('/api/employee/login-email').send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/employee/setup-account rejects missing fields', async () => {
    const res = await request(app).post('/api/employee/setup-account').send({ inviteToken: 'abc' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('Protected routes', () => {
  const app = createApp();

  it('GET /api/owner/employees requires auth token', async () => {
    const res = await request(app).get('/api/owner/employees');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('token');
  });

  it('GET /api/employee/tasks requires auth token', async () => {
    const res = await request(app).get('/api/employee/tasks');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('Task validation', () => {
  const app = createApp();

  it('POST /api/owner/tasks requires auth token', async () => {
    const res = await request(app).post('/api/owner/tasks').send({ title: 'Test task' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
