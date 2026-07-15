import { describe, expect, test, beforeAll } from 'vitest';
import { Hono } from 'hono';
import { authMiddleware, getAuthenticatedUser } from '../../src/middleware/auth';
import { authRegister, authLogin } from '@test/utils';
import { generateToken } from '../../src/database/lib/jwt';

const EMAIL = `mw-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
const PASS = 'mwpass';

describe('Auth middleware', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    const reg = await authRegister(EMAIL, 'MW User', PASS);
    expect([200, 201]).toContain(reg.status);
    token = reg.body.token;
    userId = reg.body.user?.id ?? reg.body.id;
  });

  test('rejects request without Authorization header', async () => {
    const app = new Hono();
    app.use('*', authMiddleware);
    app.get('/me', (c) => c.json({ ok: true }));

    const res = await app.request('/me');
    expect(res.status).toBe(401);
  });

  test('rejects request with malformed token', async () => {
    const app = new Hono();
    app.use('*', authMiddleware);
    app.get('/me', (c) => c.json({ ok: true }));

    const res = await app.request('/me', {
      headers: { Authorization: 'Bearer not-a-real-token' },
    });
    expect(res.status).toBe(401);
  });

  test('allows request with valid token and sets user', async () => {
    const app = new Hono();
    app.use('*', authMiddleware);
    app.get('/me', (c) => {
      const user = getAuthenticatedUser(c);
      return c.json({ user });
    });

    const res = await app.request('/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('user');
    expect(body.user).toHaveProperty('email', EMAIL);
  });

  test('rejects token for non-existent user', async () => {
    // Generate a token for a user id that does not exist in the DB
    const fakeToken = generateToken('nonexistent-user-id-12345');

    const app = new Hono();
    app.use('*', authMiddleware);
    app.get('/me', (c) => c.json({ ok: true }));

    const res = await app.request('/me', {
      headers: { Authorization: `Bearer ${fakeToken}` },
    });
    expect(res.status).toBe(401);
  });

  test('getAuthenticatedUser throws when no user set', async () => {
    const app = new Hono();
    // No auth middleware mounted, so context has no user
    app.get('/me', (c) => {
      try {
        getAuthenticatedUser(c);
        return c.json({ ok: true });
      } catch (err: any) {
        return c.json({ error: err.message }, 401);
      }
    });

    const res = await app.request('/me');
    expect(res.status).toBe(401);
  });
});
