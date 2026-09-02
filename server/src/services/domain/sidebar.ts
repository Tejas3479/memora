import { QdrantService } from '../ai/qdrant.js';
import { EmbeddingService } from '../ai/embedding.js';
import { SearchResult } from '@memora/shared';

export class SidebarService {
  private embeddingService: EmbeddingService;

  constructor(
    private qdrantService: QdrantService,
  ) {
    this.embeddingService = new EmbeddingService();
  }

  public async getContextualMemories(
    userId: string,
    currentUrl: string,
    pageContent?: string,
  ): Promise<SearchResult[]> {
    if (!currentUrl) return [];

    // Search Qdrant using page content or URL keywords
    const query = pageContent ? pageContent.slice(0, 200) : currentUrl;
    
    // Generate real query embedding vector
    const queryVector = await this.embeddingService.embedSingle(query);
    
    const results = await this.qdrantService.hybridSearch({
      userId,
      vector: queryVector,
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

  public async getRecentSuggestions(
    userId: string,
    prismaClient: any,
  ): Promise<Array<{ id: string; title: string; source: string; url: string; score: number }>> {
    const recentMemories = await prismaClient.memory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, title: true, source: true, url: true, createdAt: true },
    });

    return recentMemories.map((m: any, idx: number) => ({
      id: m.id,
      title: `Review: ${m.title || 'Untitled capture'}`,
      source: m.source,
      url: m.url,
      score: Math.max(0.4, Number((0.95 - idx * 0.08).toFixed(2))),
    }));
  }
}
export default SidebarService;
