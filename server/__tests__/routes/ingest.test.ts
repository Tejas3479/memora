import { describe, it, expect } from 'vitest';
import app from '../../src/index.js';

describe('Ingest Routes API integration tests', () => {
  it('should reject requests without authentication tokens with 401 status code', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/ingest',
      payload: {
        content: 'Long enough content snippet with details.',
        url: 'https://example.com',
        source: 'web',
        title: 'Scaling vector stores',
        timestamp: new Date().toISOString(),
      },
    });

    expect(response.statusCode).toBe(401);
  });
});
