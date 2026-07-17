import { describe, it, expect } from 'vitest';
import app from '../../src/index.js';

describe('Search Routes API integration tests', () => {
  it('should block queries without token verification with 401 status', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/search',
      payload: {
        query: 'What was that Qdrant article?',
      },
    });

    expect(response.statusCode).toBe(401);
  });
});
