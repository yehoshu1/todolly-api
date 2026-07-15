import { describe, expect, test } from 'vitest';
import { authRegister, authLogin, request } from '@test/utils';

describe('End-to-end flows', () => {
  test('full user flow', async () => {
    const email = `e2e-${Date.now()}@example.com`;
    const pass = 'e2epass';
    const reg = await authRegister(email, 'E2E User', pass);
    expect([200, 201]).toContain(reg.status);
    const token = reg.body.token;

    const createTask = await request('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'E2E Task', status: false }),
    });
    expect(createTask.status).toBe(201);
    const taskId = createTask.body.taskId;

    const createSub = await request('/subtasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ taskId, title: 'E2E Subtask' }),
    });
    expect(createSub.status).toBe(201);

    const remindAt = new Date(Date.now() + 60000).toISOString();
    const createRem = await request('/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ taskId, remindAt, message: 'E2E reminder' }),
    });
    expect(createRem.status).toBe(201);

    const tasks = await request('/tasks', { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
    expect(tasks.status).toBe(200);
    expect(Array.isArray(tasks.body)).toBe(true);
  });
});
