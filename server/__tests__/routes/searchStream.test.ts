import { describe, it, expect, vi } from 'vitest';
import { SynthesisService } from '../../src/services/ai/synthesis.js';

describe('Search Synthesis Streaming with AbortSignal', () => {
  it('should stream fallback chunks and honor AbortSignal', async () => {
    const synthesis = new SynthesisService();
    const chunks = [
      {
        id: 'm-1',
        title: 'Architecture Spec',
        content: 'Fastify and React Query integration',
        url: 'https://example.com/spec',
        source: 'web',
        timestamp: 1000,
        score: 0.95,
        chunkId: 'c-1',
        metadata: {},
      },
    ];

    const stream = synthesis.synthesizeStream('What is the tech stack?', chunks);
    const tokens: string[] = [];
    for await (const chunk of stream) {
      tokens.push(chunk);
    }

    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.join('')).toContain('Fastify and React Query integration');
  });

  it('should abort generation when signal is already aborted', async () => {
    const synthesis = new SynthesisService();
    const controller = new AbortController();
    controller.abort();

    const chunks = [
      {
        id: 'm-1',
        title: 'Note',
        content: 'Content',
        url: '',
        source: 'note',
        timestamp: 1000,
        score: 0.9,
        chunkId: 'c-1',
        metadata: {},
      },
    ];

    const stream = synthesis.synthesizeStream('Query', chunks, controller.signal);
    const tokens: string[] = [];
    for await (const chunk of stream) {
      tokens.push(chunk);
    }

    expect(tokens).toHaveLength(0);
  });
});
