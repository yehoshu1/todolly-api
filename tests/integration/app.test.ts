import { describe, it, expect } from 'vitest';
import { request } from '@test/utils';

describe('App routes', () => {
  it('should return welcome message on GET /', async () => {
    const res = await request('/', { method: 'GET' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  it('should return OpenAPI doc on GET /doc', async () => {
    const res = await request('/doc', { method: 'GET' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('openapi');
    expect(res.body).toHaveProperty('info');
  });

  it('should return 404 for unknown route', async () => {
    const res = await request('/nonexistent-route-xyz', { method: 'GET' });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message', 'Route not found');
  });

  it('should return Scalar UI HTML on GET /scalar', async () => {
    const res = await request('/scalar', { method: 'GET' });
    expect(res.status).toBe(200);
  });
});
