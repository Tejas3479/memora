import { SearchResult } from '@memora/shared';
import { QdrantService } from '../services/ai/qdrant.js';

export class ProactiveGraph {
  constructor(private qdrantService: QdrantService) {}

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
          const dummyVector = new Array(384).fill(0.1);
          results = await this.qdrantService.hybridSearch({
            userId: input.userId,
            vector: dummyVector,
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
