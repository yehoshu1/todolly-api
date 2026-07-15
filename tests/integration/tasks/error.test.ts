import { describe, it, expect, beforeAll } from 'vitest';
import { request } from '@test/utils';
import { nanoid } from 'nanoid';

const TEST_EMAIL = `taskerr-${nanoid()}@example.com`;
const TEST_PASSWORD = 'password123';

let authToken: string;

async function registerAndLogin() {
  await request('/auth/register', {
    method: 'POST',
    body: { email: TEST_EMAIL, name: 'Test User', password: TEST_PASSWORD },
  });
  const login = await request('/auth/login', {
    method: 'POST',
    body: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });
  authToken = login.body.token;
}

describe('Tasks Error Cases', () => {
  beforeAll(async () => {
    await registerAndLogin();
  });

  it('should return 401 when no authorization header is provided (GET /tasks)', async () => {
    const res = await request('/tasks', { method: 'GET' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authorization header is required');
  });

  it('should return 401 when no authorization header is provided (POST /tasks)', async () => {
    const res = await request('/tasks', {
      method: 'POST',
      body: { title: 'T', description: 'D' },
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authorization header is required');
  });

  it('should return 401 when token is missing after Bearer prefix', async () => {
    const res = await request('/tasks', {
      method: 'GET',
      headers: { Authorization: 'Bearer ' },
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token format');
  });

  it('should return 401 when token format is invalid', async () => {
    const res = await request('/tasks', {
      method: 'GET',
      headers: { Authorization: 'Bearer invalid.token.here' },
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token format');
  });

  it('should return 404 when getting a non-existent task', async () => {
    const res = await request(`/tasks/${nanoid()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Task not found or access denied');
  });

  it('should return 404 when updating a non-existent task', async () => {
    const res = await request(`/tasks/${nanoid()}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}` },
      body: { title: 'Updated' },
    });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Task not found or access denied');
  });

  it('should return 404 when deleting a non-existent task', async () => {
    const res = await request(`/tasks/${nanoid()}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Task not found or access denied');
  });

  it('should return 404 when getting subtasks for a non-existent task', async () => {
    const res = await request(`/tasks/${nanoid()}/subtasks`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Task not found or access denied');
  });

  it('should return 404 when accessing another user\'s task', async () => {
    // Create task as user A
    const create = await request('/tasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: { title: 'A Task', description: 'D' },
    });
    const taskId = create.body.taskId;

    // Register user B
    const emailB = `userb-${nanoid()}@example.com`;
    await request('/auth/register', {
      method: 'POST',
      body: { email: emailB, name: 'B', password: TEST_PASSWORD },
    });
    const loginB = await request('/auth/login', {
      method: 'POST',
      body: { email: emailB, password: TEST_PASSWORD },
    });
    const tokenB = loginB.body.token;

    const res = await request(`/tasks/${taskId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Task not found or access denied');
  });

  it('should return 200 with empty array when user has no tasks', async () => {
    const emailC = `userc-${nanoid()}@example.com`;
    await request('/auth/register', {
      method: 'POST',
      body: { email: emailC, name: 'C', password: TEST_PASSWORD },
    });
    const loginC = await request('/auth/login', {
      method: 'POST',
      body: { email: emailC, password: TEST_PASSWORD },
    });
    const tokenC = loginC.body.token;

    const res = await request('/tasks', {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenC}` },
    });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });
});
