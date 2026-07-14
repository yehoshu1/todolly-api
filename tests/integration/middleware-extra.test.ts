import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import { authMiddleware, getAuthenticatedUser } from '../../src/middleware/auth';
import * as jwtLib from '../../src/database/lib/jwt';
import { nanoid } from 'nanoid';

describe('Auth Middleware Extra Coverage', () => {
  it('should throw when getAuthenticatedUser is called with no user in context', async () => {
    const app = new Hono();
    app.get('/protected', authMiddleware, (c) => {
      // Call getAuthenticatedUser without setting user (should throw)
      getAuthenticatedUser(c);
      return c.json({ ok: true });
    });

    const res = await app.request('/protected', {
      headers: { Authorization: `Bearer ${jwtLib.generateToken(nanoid())}` },
    });
    expect(res.status).toBe(401);
  });

  it('should return 401 when user is not found in database', async () => {
    // Mock verifyToken to return a valid-looking but non-existent user id
    vi.spyOn(jwtLib, 'verifyToken').mockReturnValue({ id: 'nonexistent-user-id' } as any);

    const app = new Hono();
    app.get('/protected', authMiddleware, (c) => {
      const user = getAuthenticatedUser(c);
      return c.json(user);
    });

    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer fake-token' },
    });
    expect(res.status).toBe(401);
    vi.restoreAllMocks();
  });

  it('should reach onError handler when middleware throws non-HTTPException', async () => {
    // Mock verifyToken to throw a plain Error (not HTTPException)
    vi.spyOn(jwtLib, 'verifyToken').mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const app = new Hono();
    app.get('/protected', authMiddleware, (c) => c.json({ ok: true }));
    app.onError((err, c) => {
      return c.json({ message: 'Internal server error' }, 500);
    });

    const res = await app.request('/protected', {
      headers: { Authorization: 'Bearer fake-token' },
    });
    expect(res.status).toBe(500);
    vi.restoreAllMocks();
  });
});
