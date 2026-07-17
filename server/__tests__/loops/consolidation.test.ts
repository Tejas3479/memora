import { describe, it, expect } from 'vitest';
import { ConsolidationLoop } from '../../src/loops/consolidation.js';

describe('ConsolidationLoop', () => {
  it('should group matching similar words array keys', async () => {
    const loop = new ConsolidationLoop(null as any);
    
    const memories = [
      { id: '1', content: 'Testing duplicate documents with similar text context' },
      { id: '2', content: 'Testing duplicate documents with similar text context details' },
      { id: '3', content: 'Unrelated content text details' },
    ];

    const duplicates = await loop.findDuplicates(memories);
    
    expect(duplicates.length).toBe(1);
    expect(duplicates[0]).toContain('1');
    expect(duplicates[0]).toContain('2');
  });
});
