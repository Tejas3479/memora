import { describe, it, expect } from 'vitest';
import app from '../../src/index.js';

describe('Integration Webhook Endpoints', () => {
  it('should answer Slack url_verification challenge', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/webhooks/slack',
      payload: {
        type: 'url_verification',
        challenge: 'slack-test-challenge-token-12345',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.challenge).toBe('slack-test-challenge-token-12345');
  });

  it('should return 200 ok for bot events without crashing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/webhooks/slack',
      payload: {
        event: {
          type: 'message',
          bot_id: 'B12345',
          text: 'bot announcement',
        },
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.ok).toBe(true);
  });
});
