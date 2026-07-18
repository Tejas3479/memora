import { SearchResult } from '@memora/shared';
import { QdrantService } from '../services/ai/qdrant.js';
import { EmbeddingService } from '../services/ai/embedding.js';
import { StateGraph, Annotation } from '@langchain/langgraph';

// Define state annotation
const ProactiveAgentState = Annotation.Root({
  userId: Annotation<string>(),
  context: Annotation<any>(),
  contextQuery: Annotation<string>({ reducer: (x, y) => y, default: () => '' }),
  results: Annotation<SearchResult[]>({ reducer: (x, y) => y, default: () => [] }),
});

type StateType = typeof ProactiveAgentState.State;

export class ProactiveGraph {
  private embeddingService: EmbeddingService;
  private graph: any;

  constructor(private qdrantService: QdrantService) {
    this.embeddingService = new EmbeddingService();
    this.graph = this.compileGraph();
  }

  private compileGraph() {
    const workflow = new StateGraph(ProactiveAgentState)
      .addNode('detectContext', async (state: StateType) => {
        const contextQuery = state.context.recentText || `Channel activity on ${state.context.channelId}`;
        return { contextQuery };
      })
      .addNode('searchMemories', async (state: StateType) => {
        if (!state.contextQuery) return { results: [] };
        
        const queryVector = await this.embeddingService.embedSingle(state.contextQuery);
        const searchResults = await this.qdrantService.hybridSearch({
          userId: state.userId,
          vector: queryVector,
          query: state.contextQuery,
          limit: 5,
        });
        return { results: searchResults };
      })
      .addNode('rankRelevance', async (state: StateType) => {
        const sorted = [...state.results].sort((a, b) => (b.score || 0) - (a.score || 0));
        return { results: sorted };
      });

    return workflow
      .addEdge('__start__', 'detectContext')
      .addEdge('detectContext', 'searchMemories')
      .addEdge('searchMemories', 'rankRelevance')
      .addEdge('rankRelevance', '__end__')
      .compile();
  }

  public async run(input: { userId: string; context: any }): Promise<SearchResult[]> {
    const finalState = await this.graph.invoke({
      userId: input.userId,
      context: input.context,
      contextQuery: '',
      results: [],
    });

    return finalState.results;
  }
}
export default ProactiveGraph;
