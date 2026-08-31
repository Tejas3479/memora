import { describe, it, expect } from 'vitest';
import app from '../../src/index.js';

describe('Loops API Routes Integration Tests', () => {
  it('should reject unauthenticated loop trigger', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '\/api\/loops\/trigger',
      payload: { loopType: 'DREAMING' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('should reject unauthenticated loop history fetch', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '\/api\/loops\/history',
    });
    expect(response.statusCode).toBe(401);
  });

  it('should reject unauthenticated loop status query', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '\/api\/loops\/status\/test-loop-id',
    });
    expect(response.statusCode).toBe(401);
  });
});
