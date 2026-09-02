import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgenticSearchGraph, reciprocalRankFusion } from '../../src/agents/agenticSearchGraph.js';
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

  it('should rank items present across multiple lists higher using RRF', () => {
    const list1 = [
      { id: 'item-a', title: 'A', content: 'A', url: '', source: 'note', timestamp: 1, score: 0.7, chunkId: 'c1', metadata: {} },
      { id: 'item-multi', title: 'Multi', content: 'Multi', url: '', source: 'note', timestamp: 1, score: 0.6, chunkId: 'c2', metadata: {} },
    ];
    const list2 = [
      { id: 'item-multi', title: 'Multi', content: 'Multi', url: '', source: 'note', timestamp: 1, score: 0.6, chunkId: 'c2', metadata: {} },
      { id: 'item-b', title: 'B', content: 'B', url: '', source: 'note', timestamp: 1, score: 0.7, chunkId: 'c3', metadata: {} },
    ];

    const fused = reciprocalRankFusion([list1, list2]);
    expect(fused.length).toBe(3);
    // item-multi appears in both lists so its RRF score must place it top
    expect(fused[0].id).toBe('item-multi');
  });
});
