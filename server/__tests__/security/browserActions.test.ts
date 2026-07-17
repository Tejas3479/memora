import { describe, it, expect } from 'vitest';
import app from '../../src/index.js';

describe('Browser actions security allowlist test', () => {
  it('should block non-allowlisted browser actions with 401 (if no auth) or 403 (with auth validation placeholder)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/browser/action',
      payload: {
        action: 'EXECUTE_SH_COMMAND_DISALLOWED',
        data: {},
      },
    });

    expect([401, 403]).toContain(response.statusCode);
  });
});
