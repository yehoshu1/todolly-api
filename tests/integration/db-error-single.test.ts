import { describe, it, expect, vi, beforeAll } from 'vitest';
import db from '../../src/database';
import { request } from '@test/utils';
import { nanoid } from 'nanoid';

const TEST_EMAIL = `dbsingle-${nanoid()}@example.com`;
const TEST_PASSWORD = 'password123';

let authToken: string;

describe('Database Error Handling (single-item routes)', () => {
  beforeAll(async () => {
    await request('/auth/register', {
      method: 'POST',
      body: { email: TEST_EMAIL, name: 'Test User', password: TEST_PASSWORD },
    });
    const login = await request('/auth/login', {
      method: 'POST',
      body: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    authToken = login.body.token;
  });

  function mockDbToThrow() {
    const makeFailingChain = () => {
      const chain: any = {};
      chain.from = () => { throw new Error('DB failure'); };
      chain.where = () => chain;
      chain.limit = () => chain;
      chain.set = () => chain;
      chain.values = () => chain;
      chain.returning = () => chain;
      return chain;
    };
    vi.spyOn(db, 'select').mockImplementation(() => makeFailingChain() as any);
    vi.spyOn(db, 'insert').mockImplementation(() => makeFailingChain() as any);
    vi.spyOn(db, 'update').mockImplementation(() => makeFailingChain() as any);
    vi.spyOn(db, 'delete').mockImplementation(() => makeFailingChain() as any);
  }

  it('should return 500 when DB fails on GET /tasks/:id', async () => {
    mockDbToThrow();
    const res = await request(`/tasks/${nanoid()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(500);
    vi.restoreAllMocks();
  });

  it('should return 500 when DB fails on PUT /tasks/:id', async () => {
    mockDbToThrow();
    const res = await request(`/tasks/${nanoid()}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}` },
      body: { title: 'Updated' },
    });
    expect(res.status).toBe(500);
    vi.restoreAllMocks();
  });

  it('should return 500 when DB fails on DELETE /tasks/:id', async () => {
    mockDbToThrow();
    const res = await request(`/tasks/${nanoid()}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(500);
    vi.restoreAllMocks();
  });

  it('should return 500 when DB fails on GET /tasks/:id/subtasks', async () => {
    mockDbToThrow();
    const res = await request(`/tasks/${nanoid()}/subtasks`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(500);
    vi.restoreAllMocks();
  });

  it('should return 500 when DB fails on GET /subtasks/:id', async () => {
    mockDbToThrow();
    const res = await request(`/subtasks/${nanoid()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(500);
    vi.restoreAllMocks();
  });

  it('should return 500 when DB fails on PUT /subtasks/:id', async () => {
    mockDbToThrow();
    const res = await request(`/subtasks/${nanoid()}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}` },
      body: { title: 'Updated' },
    });
    expect(res.status).toBe(500);
    vi.restoreAllMocks();
  });

  it('should return 500 when DB fails on DELETE /subtasks/:id', async () => {
    mockDbToThrow();
    const res = await request(`/subtasks/${nanoid()}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(500);
    vi.restoreAllMocks();
  });

  it('should return 500 when DB fails on GET /reminders/:id', async () => {
    mockDbToThrow();
    const res = await request(`/reminders/${nanoid()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(500);
    vi.restoreAllMocks();
  });

  it('should return 500 when DB fails on PUT /reminders/:id', async () => {
    mockDbToThrow();
    const res = await request(`/reminders/${nanoid()}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}` },
      body: { title: 'Updated', remindAt: new Date(Date.now() + 86400000).toISOString() },
    });
    expect(res.status).toBe(500);
    vi.restoreAllMocks();
  });

  it('should return 500 when DB fails on DELETE /reminders/:id', async () => {
    mockDbToThrow();
    const res = await request(`/reminders/${nanoid()}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(500);
    vi.restoreAllMocks();
  });
});
