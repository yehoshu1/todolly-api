import { describe, expect, test } from 'vitest';
import { authRegister, authLogin, request } from '@test/utils';

const EMAIL = `taskuser-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
const PASS = 'taskpass';

describe('Tasks integration', () => {
  test('CRUD tasks with auth', async () => {
    await authRegister(EMAIL, 'Task User', PASS);
    const login = await authLogin(EMAIL, PASS);
    const token = login.body.token;

    // Create
    const create = await request('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'Test Task', description: 'desc', status: false, priority: 'low' }),
    });
    expect(create.status).toBe(201);
    expect(create.body).toHaveProperty('taskId');
    const taskId = create.body.taskId;

    // Read list
    const list = await request('/tasks', { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);

    // Update
    const update = await request(`/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'Updated Title' }),
    });
    expect([200, 204]).toContain(update.status);

    // Delete
    const del = await request(`/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 204]).toContain(del.status);
  });
});
