import { describe, it, expect } from 'vitest';
import { TextChunker } from '../../src/services/ai/chunker.js';

describe('TextChunker', () => {
  it('should split long text into overlap chunks correctly', () => {
    const chunker = new TextChunker({ chunkSize: 50, chunkOverlap: 10 });
    const text = 'This is a long piece of text that should be split into smaller blocks with overlap.';
    const results = chunker.chunk(text, { source: 'test' });
    
    expect(results.length).toBeGreaterThan(1);
    expect(results[0].text.length).toBeLessThanOrEqual(55);
    expect(results[0].metadata.source).toBe('test');
  });

  it('should handle short text as a single chunk', () => {
    const chunker = new TextChunker();
    const results = chunker.chunk('Short text', { test: true });
    
    expect(results.length).toBe(1);
    expect(results[0].text).toBe('Short text');
  });

  it('should throw error on empty text input', () => {
    const chunker = new TextChunker();
    expect(() => chunker.chunk('', {})).toThrow();
  });
});
