import { describe, expect, test } from 'vitest';
import { authRegister, authLogin, request } from '@test/utils';

const EMAIL = `reminder-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
const PASS = 'reminderpass';

describe('Reminders integration', () => {
  test('create and delete reminder', async () => {
    await authRegister(EMAIL, 'Reminder User', PASS);
    const login = await authLogin(EMAIL, PASS);
    const token = login.body.token;

    const createTask = await request('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'Task With Reminder', status: false }),
    });
    const taskId = createTask.body.taskId;

    const remindAt = new Date(Date.now() + 3600 * 1000).toISOString();
    const createRem = await request('/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ taskId, remindAt, message: 'Ping' }),
    });
    expect(createRem.status).toBe(201);
    expect(createRem.body).toHaveProperty('reminderId');

    const del = await request(`/reminders/${createRem.body.reminderId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 204]).toContain(del.status);
  });
});
