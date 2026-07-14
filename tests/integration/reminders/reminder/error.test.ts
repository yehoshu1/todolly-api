import { describe, it, expect, beforeAll } from 'vitest';
import { request } from '../../../../test/utils';
import { nanoid } from 'nanoid';

const TEST_EMAIL = `remerr-${nanoid()}@example.com`;
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

describe('Reminders Error Cases (reminder route)', () => {
  beforeAll(async () => {
    await registerAndLogin();
  });

  it('should return 401 when no authorization header is provided (GET /reminders/:id)', async () => {
    const res = await request(`/reminders/${nanoid()}`, { method: 'GET' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authorization header is required');
  });

  it('should return 401 when token format is invalid', async () => {
    const res = await request(`/reminders/${nanoid()}`, {
      method: 'GET',
      headers: { Authorization: 'Bearer bad.token' },
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token format');
  });

  it('should return 400 when updating a non-existent reminder (invalid param)', async () => {
    const res = await request(`/reminders/${nanoid()}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}` },
      body: { title: 'Updated' },
    });
    expect(res.status).toBe(400);
  });

  it('should return 404 when deleting a non-existent reminder', async () => {
    const res = await request(`/reminders/${nanoid()}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Reminder not found or access denied');
  });

  it('should return 404 when accessing another user\'s reminder', async () => {
    // User A creates task + reminder
    const createTask = await request('/tasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: { title: 'A Task', description: 'D' },
    });
    const taskId = createTask.body.taskId;
    const createRem = await request(`/tasks/${taskId}/reminders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: { title: 'Rem', description: 'D', remindAt: new Date(Date.now() + 86400000).toISOString() },
    });
    const reminderId = createRem.body.reminderId;

    // User B tries to access
    const emailB = `remb-${nanoid()}@example.com`;
    await request('/auth/register', {
      method: 'POST',
      body: { email: emailB, name: 'B', password: TEST_PASSWORD },
    });
    const loginB = await request('/auth/login', {
      method: 'POST',
      body: { email: emailB, password: TEST_PASSWORD },
    });
    const tokenB = loginB.body.token;

    const res = await request(`/reminders/${reminderId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Reminder not found or access denied');
  });

  it('should return 404 when creating reminder for non-existent task', async () => {
    const res = await request('/reminders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: { taskId: nanoid(), title: 'Rem', description: 'D', remindAt: new Date(Date.now() + 86400000).toISOString() },
    });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Task not found');
  });

  it('should return 403 when creating reminder for another user\'s task', async () => {
    const createTask = await request('/tasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: { title: 'A Task', description: 'D' },
    });
    const taskId = createTask.body.taskId;

    const emailB = `remb2-${nanoid()}@example.com`;
    await request('/auth/register', {
      method: 'POST',
      body: { email: emailB, name: 'B', password: TEST_PASSWORD },
    });
    const loginB = await request('/auth/login', {
      method: 'POST',
      body: { email: emailB, password: TEST_PASSWORD },
    });
    const tokenB = loginB.body.token;

    const res = await request('/reminders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: { taskId, title: 'Rem', description: 'D', remindAt: new Date(Date.now() + 86400000).toISOString() },
    });
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Cannot create reminder for task not owned by you');
  });

  it('should return 200 with empty array when user has no reminders', async () => {
    const emailC = `remc-${nanoid()}@example.com`;
    await request('/auth/register', {
      method: 'POST',
      body: { email: emailC, name: 'C', password: TEST_PASSWORD },
    });
    const loginC = await request('/auth/login', {
      method: 'POST',
      body: { email: emailC, password: TEST_PASSWORD },
    });
    const tokenC = loginC.body.token;

    const res = await request('/reminders', {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenC}` },
    });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });
});
