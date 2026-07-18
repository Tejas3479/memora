import { SearchResponse, SearchResult } from '@memora/shared';
import { QdrantService } from '../services/ai/qdrant.js';
import { EmbeddingService } from '../services/ai/embedding.js';
import { SynthesisService } from '../services/ai/synthesis.js';
import { StateGraph, Annotation } from '@langchain/langgraph';

// Define the state annotation
const SearchAgentState = Annotation.Root({
  userId: Annotation<string>(),
  query: Annotation<string>(),
  filters: Annotation<any>(),
  queries: Annotation<string[]>({ reducer: (x, y) => y, default: () => [] }),
  rawResults: Annotation<SearchResult[]>({ reducer: (x, y) => y, default: () => [] }),
  synthesizedAnswer: Annotation<any>({ reducer: (x, y) => y, default: () => null }),
});

type StateType = typeof SearchAgentState.State;

export class AgenticSearchGraph {
  private embeddingService: EmbeddingService;
  private graph: any;

  constructor(
    private qdrantService: QdrantService,
    private synthesisService: SynthesisService,
  ) {
    this.embeddingService = new EmbeddingService();
    this.graph = this.compileGraph();
  }

  private compileGraph() {
    const workflow = new StateGraph(SearchAgentState)
      .addNode('planSearch', async (state: StateType) => {
        let queries = [state.query];
        if (state.query.toLowerCase().includes('and')) {
          queries = state.query.split(/\band\b/gi).map((q) => q.trim());
        }
        return { queries };
      })
      .addNode('executeSearch', async (state: StateType) => {
        const results: SearchResult[] = [];
        for (const q of state.queries) {
          const queryVector = await this.embeddingService.embedSingle(q);
          const res = await this.qdrantService.hybridSearch({
            userId: state.userId,
            vector: queryVector,
            query: q,
            filters: state.filters,
            limit: 5,
          });
          results.push(...res);
        }
        return { rawResults: results };
      })
      .addNode('mergeAndDeduplicate', async (state: StateType) => {
        const seen = new Set<string>();
        const deduplicated = state.rawResults.filter((r) => {
          if (seen.has(r.id)) return false;
          seen.add(r.id);
          return true;
        });
        return { rawResults: deduplicated };
      })
      .addNode('synthesize', async (state: StateType) => {
        const answer = await this.synthesisService.synthesize(state.query, state.rawResults);
        return { synthesizedAnswer: answer };
      });

    return workflow
      .addEdge('__start__', 'planSearch')
      .addEdge('planSearch', 'executeSearch')
      .addEdge('executeSearch', 'mergeAndDeduplicate')
      .addEdge('mergeAndDeduplicate', 'synthesize')
      .addEdge('synthesize', '__end__')
      .compile();
  }

  public async run(input: { userId: string; query: string; filters?: any }): Promise<SearchResponse> {
    const start = Date.now();
    const finalState = await this.graph.invoke({
      userId: input.userId,
      query: input.query,
      filters: input.filters,
      queries: [],
      rawResults: [],
      synthesizedAnswer: null,
    });

    return {
      results: finalState.rawResults,
      synthesizedAnswer: finalState.synthesizedAnswer,
      total: finalState.rawResults.length,
      took: Date.now() - start,
    };
  }
}
export default AgenticSearchGraph;
