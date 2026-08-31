import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgenticSearchGraph } from '../../src/agents/agenticSearchGraph.js';
import { QdrantService } from '../../src/services/ai/qdrant.js';
import { SynthesisService } from '../../src/services/ai/synthesis.js';

describe('AgenticSearchGraph Reasoning Engine', () => {
  let qdrantMock: QdrantService;
  let synthesisMock: SynthesisService;
  let graph: AgenticSearchGraph;

  beforeEach(() => {
    qdrantMock = new QdrantService();
    synthesisMock = new SynthesisService();
    graph = new AgenticSearchGraph(qdrantMock, synthesisMock);
  });

  it('should fallback decompose compound queries cleanly', async () => {
    const subQueries = await graph.decomposeQuery('Q3 roadmap goals and engineering feedback from Sarah');
    expect(subQueries.length).toBeGreaterThanOrEqual(2);
    expect(subQueries).toContain('Q3 roadmap goals');
    expect(subQueries).toContain('engineering feedback from Sarah');
  });

  it('should execute planAndRetrieve across multiple hops and deduplicate results', async () => {
    vi.spyOn(qdrantMock, 'hybridSearch').mockImplementation(async (params) => {
      if (params.query.includes('Roadmap')) {
        return [
          { id: 'm-1', title: 'Roadmap Doc', content: 'Q3 goals', url: '', source: 'doc', timestamp: 100, score: 0.9, chunkId: 'c1', metadata: {} },
          { id: 'm-shared', title: 'Launch Plan', content: 'Shared note', url: '', source: 'doc', timestamp: 100, score: 0.8, chunkId: 'c2', metadata: {} },
        ];
      }
      return [
        { id: 'm-2', title: 'Feedback Note', content: 'Sarah feedback', url: '', source: 'slack', timestamp: 100, score: 0.85, chunkId: 'c3', metadata: {} },
        { id: 'm-shared', title: 'Launch Plan', content: 'Shared note', url: '', source: 'doc', timestamp: 100, score: 0.8, chunkId: 'c2', metadata: {} },
      ];
    });

    const retrieved = await graph.planAndRetrieve({
      userId: 'user-123',
      query: 'Roadmap goals and feedback note',
    });

    expect(retrieved.subQueries).toHaveLength(2);
    // Result set must deduplicate m-shared
    expect(retrieved.results).toHaveLength(3);
    const ids = retrieved.results.map((r) => r.id);
    expect(ids).toContain('m-1');
    expect(ids).toContain('m-2');
    expect(ids).toContain('m-shared');
  });
});
