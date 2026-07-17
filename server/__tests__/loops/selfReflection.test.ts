import { describe, it, expect } from 'vitest';
import { SelfReflectionLoop } from '../../src/loops/selfReflection.js';

describe('SelfReflectionLoop', () => {
  it('should calculate proper timing triggers', () => {
    const loop = new SelfReflectionLoop();
    const lastWeek = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const recent = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

    expect(loop.shouldRun('user-id', lastWeek)).toBe(true);
    expect(loop.shouldRun('user-id', recent)).toBe(false);
  });
});
