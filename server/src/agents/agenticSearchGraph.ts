import { SearchResponse, SearchResult } from '@memora/shared';
import { QdrantService } from '../services/ai/qdrant.js';
import { SynthesisService } from '../services/ai/synthesis.js';

export class AgenticSearchGraph {
  constructor(
    private qdrantService: QdrantService,
    private synthesisService: SynthesisService,
  ) {}

  public async run(input: { userId: string; query: string; filters?: any }): Promise<SearchResponse> {
    const states = ['parse_query', 'plan_search', 'execute_searches', 'merge_results', 'synthesize'];
    let plan = { queries: [input.query] };
    let rawResults: SearchResult[] = [];
    let start = Date.now();

    for (const state of states) {
      switch (state) {
        case 'parse_query':
          // Identifies keywords, dates, topics
          break;
        case 'plan_search':
          // Decides if it needs to query folders, tags, or distinct phrases
          if (input.query.toLowerCase().includes('and')) {
            plan.queries = input.query.split(/\band\b/gi).map((q) => q.trim());
          }
          break;
        case 'execute_searches':
          // Execute queries sequentially
          const dummyVector = new Array(384).fill(0.1);
          for (const q of plan.queries) {
            const res = await this.qdrantService.hybridSearch({
              userId: input.userId,
              vector: dummyVector,
              query: q,
              filters: input.filters,
              limit: 5,
            });
            rawResults.push(...res);
          }
          break;
        case 'merge_results':
          // Deduplicate based on ID
          const seen = new Set<string>();
          rawResults = rawResults.filter((r) => {
            if (seen.has(r.id)) return false;
            seen.add(r.id);
            return true;
          });
          break;
        case 'synthesize':
          // Call synthesis engine
          break;
      }
    }

    const answer = await this.synthesisService.synthesize(input.query, rawResults);

    return {
      results: rawResults,
      synthesizedAnswer: answer,
      total: rawResults.length,
      took: Date.now() - start,
    };
  }
}
export default AgenticSearchGraph;
