import { describe, it, expect } from 'vitest';
import { AutomationService } from '../../src/services/domain/automation.js';

describe('Automation safety validation test', () => {
  it('should evaluate rule conditions correctly matching memory details', () => {
    const service = new AutomationService(null as any);
    const conditions = {
      source: 'slack',
      containsKeyword: 'deploy',
    };
    
    const matched = service.matchConditions(conditions, {
      source: 'slack',
      title: 'Deploy process logs',
    });

    expect(matched).toBe(true);

    const nonMatched = service.matchConditions(conditions, {
      source: 'web',
      title: 'Deploy process logs',
    });

    expect(nonMatched).toBe(false);
  });
});
