import { beforeAll, describe, expect, test } from 'vitest';
import { authRegister, authLogin, request } from '@test/utils';

const TEST_EMAIL = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
const TEST_PASS = 'password123';

describe('Auth integration', () => {
  test('register -> login -> profile', async () => {
    const reg = await authRegister(TEST_EMAIL, 'Test User', TEST_PASS);
    expect([200, 201]).toContain(reg.status);
    expect(reg.body).toHaveProperty('token');

    const token = reg.body.token;

    const login = await authLogin(TEST_EMAIL, TEST_PASS);
    expect([200, 201]).toContain(login.status);
    expect(login.body).toHaveProperty('token');

    const profile = await request('/auth/profile', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(profile.status).toBe(200);
    expect(profile.body).toHaveProperty('user');
    expect(profile.body.user).toHaveProperty('email', TEST_EMAIL);
  });

  test('login with wrong password is rejected', async () => {
    const email = `wrongpw-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
    const reg = await authRegister(email, 'Test User', TEST_PASS);
    expect([200, 201]).toContain(reg.status);

    const wrongLogin = await authLogin(email, 'wrong-password');
    expect(wrongLogin.status).toBe(401);
  });

  test('protected route without token is rejected', async () => {
    const noToken = await request('/tasks', { method: 'GET' });
    expect(noToken.status).toBe(401);
  });
});
