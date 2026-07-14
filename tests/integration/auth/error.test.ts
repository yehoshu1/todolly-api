import { describe, it, expect, beforeAll } from 'vitest';
import { request } from '../../../test/utils';
import { nanoid } from 'nanoid';

const TEST_EMAIL = `autherr-${nanoid()}@example.com`;
const TEST_PASSWORD = 'password123';

describe('Auth Error Cases', () => {
  beforeAll(async () => {
    await request('/auth/register', {
      method: 'POST',
      body: { email: TEST_EMAIL, name: 'Test User', password: TEST_PASSWORD },
    });
  });

  it('should return 400 when registering with an existing email', async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: { email: TEST_EMAIL, name: 'Test User', password: TEST_PASSWORD },
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('User with this email already exists');
  });

  it('should return 400 when password is missing on register', async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: { email: `nopass-${nanoid()}@example.com`, name: 'No Pass' },
    });
    expect(res.status).toBe(400);
  });

  it('should return 401 when logging in with non-existent user', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: `nope-${nanoid()}@example.com`, password: TEST_PASSWORD },
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('should return 401 when logging in with wrong password', async () => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email: TEST_EMAIL, password: 'wrongpassword' },
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('should return 401 when accessing profile without token', async () => {
    const res = await request('/auth/profile', { method: 'GET' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authorization header is required');
  });

  it('should return 401 when accessing profile with invalid token', async () => {
    const res = await request('/auth/profile', {
      method: 'GET',
      headers: { Authorization: 'Bearer bad.token' },
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token format');
  });

  it('should return 200 on profile with valid token', async () => {
    const login = await request('/auth/login', {
      method: 'POST',
      body: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const token = login.body.token;
    const res = await request('/auth/profile', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('email', TEST_EMAIL);
  });
});
