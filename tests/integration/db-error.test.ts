import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import db from '../../src/database';
import { request } from '@test/utils';
import { nanoid } from 'nanoid';

const TEST_EMAIL = `dberr-${nanoid()}@example.com`;
const TEST_PASSWORD = 'password123';

let authToken: string;

describe('Database Error Handling', () => {
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

  afterAll(() => {
    vi.restoreAllMocks();
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

  it('should return 500 when DB fails on GET /tasks', async () => {
    mockDbToThrow();
    const res = await request('/tasks', {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(500);
    vi.restoreAllMocks();
  });

  it('should return 500 when DB fails on POST /tasks', async () => {
    mockDbToThrow();
    const res = await request('/tasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: { title: 'T', description: 'D' },
    });
    expect(res.status).toBe(500);
    vi.restoreAllMocks();
  });

  it('should return 500 when DB fails on GET /subtasks', async () => {
    mockDbToThrow();
    const res = await request('/subtasks', {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(500);
    vi.restoreAllMocks();
  });

  it('should return 500 when DB fails on POST /subtasks', async () => {
    mockDbToThrow();
    const res = await request('/subtasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: { taskId: nanoid(), title: 'T', description: 'D' },
    });
    expect(res.status).toBe(500);
    vi.restoreAllMocks();
  });

  it('should return 500 when DB fails on GET /reminders', async () => {
    mockDbToThrow();
    const res = await request('/reminders', {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(500);
    vi.restoreAllMocks();
  });

  it('should return 500 when DB fails on POST /reminders', async () => {
    mockDbToThrow();
    const res = await request('/reminders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: { taskId: nanoid(), title: 'Rem', description: 'D', remindAt: new Date(Date.now() + 86400000).toISOString() },
    });
    expect(res.status).toBe(500);
    vi.restoreAllMocks();
  });
});
