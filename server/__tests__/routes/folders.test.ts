import { describe, it, expect } from 'vitest';
import app from '../../src/index.js';

describe('Folder Routes API integration tests', () => {
  it('should reject unauthenticated folder listing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/folders',
    });
    expect(response.statusCode).toBe(401);
  });

  it('should reject unauthenticated memory assignment to folder', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/folders/test-folder-id/memories',
      payload: { memoryIds: ['mem-1'] },
    });
    expect(response.statusCode).toBe(401);
  });
});
