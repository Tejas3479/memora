import { QdrantService } from '../ai/qdrant.js';
import { SearchResult } from '@memora/shared';

export class SidebarService {
  constructor(
    private qdrantService: QdrantService,
  ) {}

  public async getContextualMemories(
    userId: string,
    currentUrl: string,
    pageContent?: string,
  ): Promise<SearchResult[]> {
    if (!currentUrl) return [];

    // Search Qdrant using page content or URL keywords
    const query = pageContent ? pageContent.slice(0, 200) : currentUrl;
    
    // Perform standard search with threshold filtering (placeholder vector)
    const placeholderVector = new Array(384).fill(0.1);
    
    const results = await this.qdrantService.hybridSearch({
      userId,
      vector: placeholderVector,
      query,
      limit: 5,
    });

    return results;
  }

  public async getSuggestedActions(
    userId: string,
    memories: SearchResult[],
  ): Promise<Array<{ action: string; description: string }>> {
    const actions: Array<{ action: string; description: string }> = [];
    
    if (memories.length > 0) {
      const topMem = memories[0];
      actions.push({
        action: 'LINK_MEMORY',
        description: `Link current page to existing memory: "${topMem.title}"`,
      });
      actions.push({
        action: 'ENRICH_NOTE',
        description: `Enrich associated note on topic: "${topMem.title}"`,
      });
    } else {
      actions.push({
        action: 'CREATE_FOLDER',
        description: 'Create a new topic folder for this domain',
      });
    }

    return actions;
  }
}
export default SidebarService;
