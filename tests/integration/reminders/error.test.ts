import { describe, it, expect } from 'vitest';
import { request } from '@test/utils';
import { nanoid } from 'nanoid';

const TEST_EMAIL = `test-${nanoid()}@example.com`;
const TEST_PASSWORD = 'password123';

let authToken: string;

// Helper function to register and login a user
async function registerAndLogin() {
  // Register a new user
  await request('/auth/register', {
    method: 'POST',
    body: {
      email: TEST_EMAIL,
      name: 'Test User',
      password: TEST_PASSWORD,
    },
  });

  // Login the user
  const loginResponse = await request('/auth/login', {
    method: 'POST',
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    },
  });

  authToken = loginResponse.body.token;
}

describe('Reminder Error Cases', () => {
  beforeAll(async () => {
    await registerAndLogin();
  });

  it('should return 401 when no authorization header is provided', async () => {
    const response = await request(`/reminders`, {
      method: 'GET',
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authorization header is required');
  });

  it('should return 401 when an invalid token is provided', async () => {
    const response = await request(`/reminders`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer invalidtoken',
      },
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid token format');
  });

  it('should return 404 when the reminder does not exist', async () => {
    const response = await request(`/reminders/999999`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Reminder not found or access denied');
  });

  it('should return 401 when the user does not have access to the reminder', async () => {
    // Create a task for the authenticated user
    const createTaskResponse = await request('/tasks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: {
        title: 'Test Task',
        description: 'Test Description',
      },
    });

    const taskId = createTaskResponse.body.taskId;

    // Create a reminder for the task
    const createReminderResponse = await request(`/tasks/${taskId}/reminders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: {
        title: 'Test Reminder',
        description: 'Test Description',
        remindAt: new Date(Date.now() + 86400000).toISOString(),
      },
    });

    const reminderId = createReminderResponse.body.reminderId;

    // Register and login a new user
    const newUserEmail = `new-${nanoid()}@example.com`;
    await request('/auth/register', {
      method: 'POST',
      body: {
        email: newUserEmail,
        name: 'New User',
        password: TEST_PASSWORD,
      },
    });

    const newUserLoginResponse = await request('/auth/login', {
      method: 'POST',
      body: {
        email: newUserEmail,
        password: TEST_PASSWORD,
      },
    });

    const newUserToken = newUserLoginResponse.body.token;

    // Try to access the reminder with the new user
    const response = await request(`/reminders/${reminderId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${newUserToken}`,
      },
    });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Reminder not found or access denied');
  });
});
