import { describe, it, expect, vi } from 'vitest';
import { EmbeddingService } from '../../src/services/ai/embedding.js';

describe('EmbeddingService', () => {
  it('should generate deterministic fallback embeddings when local model is not loaded', async () => {
    const service = new EmbeddingService();
    const vec = await service.embedSingle('Test statement for local fallback mock vectors');
    
    expect(vec.length).toBe(384);
    expect(vec[0]).toBeTypeOf('number');
  });

  it('should process multi-sentence inputs and return multi-vector array output', async () => {
    const service = new EmbeddingService();
    const results = await service.embed(['First sentence', 'Second sentence']);
    
    expect(results.length).toBe(2);
    expect(results[0].length).toBe(384);
  });
});
