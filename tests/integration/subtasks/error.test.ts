import { describe, it, expect, beforeAll } from 'vitest';
import { request } from '../../../test/utils';
import { nanoid } from 'nanoid';

const TEST_EMAIL = `suberr-${nanoid()}@example.com`;
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

describe('Subtasks Error Cases', () => {
  beforeAll(async () => {
    await registerAndLogin();
  });

  it('should return 401 when no authorization header is provided (GET /subtasks)', async () => {
    const res = await request('/subtasks', { method: 'GET' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authorization header is required');
  });

  it('should return 401 when no authorization header is provided (POST /subtasks)', async () => {
    const res = await request('/subtasks', {
      method: 'POST',
      body: { taskId: nanoid(), title: 'T', description: 'D' },
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authorization header is required');
  });

  it('should return 401 when token format is invalid', async () => {
    const res = await request('/subtasks', {
      method: 'GET',
      headers: { Authorization: 'Bearer bad.token' },
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token format');
  });

  it('should return 404 when creating subtask for non-existent task', async () => {
    const res = await request('/subtasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: { taskId: nanoid(), title: 'T', description: 'D' },
    });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Task not found');
  });

  it('should return 403 when creating subtask for another user\'s task', async () => {
    // User A creates a task
    const createTask = await request('/tasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: { title: 'A Task', description: 'D' },
    });
    const taskId = createTask.body.taskId;

    // User B tries to create subtask on A's task
    const emailB = `subb-${nanoid()}@example.com`;
    await request('/auth/register', {
      method: 'POST',
      body: { email: emailB, name: 'B', password: TEST_PASSWORD },
    });
    const loginB = await request('/auth/login', {
      method: 'POST',
      body: { email: emailB, password: TEST_PASSWORD },
    });
    const tokenB = loginB.body.token;

    const res = await request('/subtasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
      body: { taskId, title: 'T', description: 'D' },
    });
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Cannot create subtask for task not owned by you');
  });

  it('should return 200 with empty array when user has no subtasks', async () => {
    const emailC = `subc-${nanoid()}@example.com`;
    await request('/auth/register', {
      method: 'POST',
      body: { email: emailC, name: 'C', password: TEST_PASSWORD },
    });
    const loginC = await request('/auth/login', {
      method: 'POST',
      body: { email: emailC, password: TEST_PASSWORD },
    });
    const tokenC = loginC.body.token;

    const res = await request('/subtasks', {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenC}` },
    });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('should return 404 when updating a non-existent subtask', async () => {
    const res = await request(`/subtasks/${nanoid()}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}` },
      body: { title: 'Updated' },
    });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Subtask not found or access denied');
  });

  it('should return 404 when deleting a non-existent subtask', async () => {
    const res = await request(`/subtasks/${nanoid()}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Subtask not found or access denied');
  });

  it('should return 404 when accessing another user\'s subtask', async () => {
    // User A creates task + subtask
    const createTask = await request('/tasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: { title: 'A Task', description: 'D' },
    });
    const taskId = createTask.body.taskId;
    const createSub = await request('/subtasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: { taskId, title: 'Sub', description: 'D' },
    });
    const subtaskId = createSub.body.subtaskId;

    // User B tries to access
    const emailB = `subb2-${nanoid()}@example.com`;
    await request('/auth/register', {
      method: 'POST',
      body: { email: emailB, name: 'B', password: TEST_PASSWORD },
    });
    const loginB = await request('/auth/login', {
      method: 'POST',
      body: { email: emailB, password: TEST_PASSWORD },
    });
    const tokenB = loginB.body.token;

    const res = await request(`/subtasks/${subtaskId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Subtask not found or access denied');
  });
});
