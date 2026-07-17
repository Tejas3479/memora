import { SearchResult } from '@memora/shared';
import { QdrantService } from '../services/ai/qdrant.js';
import { EmbeddingService } from '../services/ai/embedding.js';

export class ProactiveGraph {
  private embeddingService: EmbeddingService;

  constructor(private qdrantService: QdrantService) {
    this.embeddingService = new EmbeddingService();
  }

  public async run(input: { userId: string; context: any }): Promise<SearchResult[]> {
    const states = ['detect_context', 'search_memories', 'rank_relevance', 'deliver'];
    let contextQuery = '';
    let results: SearchResult[] = [];

    for (const state of states) {
      switch (state) {
        case 'detect_context':
          contextQuery = input.context.recentText || `Channel activity on ${input.context.channelId}`;
          break;
        case 'search_memories':
          const queryVector = await this.embeddingService.embedSingle(contextQuery);
          results = await this.qdrantService.hybridSearch({
            userId: input.userId,
            vector: queryVector,
            query: contextQuery,
            limit: 5,
          });
          break;
        case 'rank_relevance':
          // Sort results based on score descending
          results.sort((a, b) => (b.score || 0) - (a.score || 0));
          break;
        case 'deliver':
          // Deliver state - finalizes results to push
          break;
      }
    }

    return results;
  }
}
export default ProactiveGraph;
