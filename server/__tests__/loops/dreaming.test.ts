import { describe, it, expect } from 'vitest';
import { DreamingLoop } from '../../src/loops/dreaming.js';

describe('DreamingLoop', () => {
  it('should discover connections between moderately similar vector memories', async () => {
    const loop = new DreamingLoop(null as any);

    const vecA = [1, 0.5, 0.2, 0];
    const vecB = [0.6, 1, 0, 0.2];
    const vecC = [0, 0, 0, 1];

    const memories = [
      { id: 'mem-1', title: 'Quantum Computing', content: 'Qubits and entanglement algorithms', vector: vecA },
      { id: 'mem-2', title: 'Quantum Cryptography', content: 'Key distribution and quantum security', vector: vecB },
      { id: 'mem-3', title: 'Baking Sourdough', content: 'Flour, water, wild yeast fermentation', vector: vecC },
    ];

    const connections = await loop.discoverConnections(memories, 5);
    expect(connections.length).toBeGreaterThan(0);
    expect(connections[0].memoryIds).toContain('mem-1');
    expect(connections[0].memoryIds).toContain('mem-2');
  });

  it('should return empty connections for fewer than 2 memories', async () => {
    const loop = new DreamingLoop(null as any);
    const connections = await loop.discoverConnections([{ id: '1', title: 'Solo', content: 'Solo memory' }], 5);
    expect(connections).toEqual([]);
  });
});
