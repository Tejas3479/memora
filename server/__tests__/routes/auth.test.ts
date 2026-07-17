import { describe, it, expect, vi } from 'vitest';
import app from '../../src/index.js';

describe('Auth Routes integration tests', () => {
  it('should block protected /auth/me route if token is missing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/auth/me',
    });
    
    expect(response.statusCode).toBe(401);
  });

  it('should return health status code 200', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).status).toBe('OK');
  });
});
