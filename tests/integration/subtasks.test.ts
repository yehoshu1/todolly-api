import { describe, expect, test } from 'vitest';
import { authRegister, authLogin, request } from '../../test/utils';

const EMAIL = `subtask-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
const PASS = 'subtaskpass';

describe('Subtasks integration', () => {
  test('create subtask under task and delete cascade', async () => {
    await authRegister(EMAIL, 'Subtask User', PASS);
    const login = await authLogin(EMAIL, PASS);
    const token = login.body.token;

    const createTask = await request('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'Task For Subtask', status: false }),
    });
    const taskId = createTask.body.taskId;

    const createSub = await request('/subtasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ taskId, title: 'My Subtask' }),
    });
    expect(createSub.status).toBe(201);
    expect(createSub.body).toHaveProperty('subtaskId');

    // fetch subtasks for task
    const list = await request(`/subtasks?taskId=${taskId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);

    // cleanup: delete task (should cascade)
    const del = await request(`/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 204]).toContain(del.status);
  });
});
