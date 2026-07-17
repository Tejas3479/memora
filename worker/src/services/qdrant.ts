import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../config.js';
import { QDRANT_COLLECTION } from '@memora/shared';
import { SearchResult } from '@memora/shared';

export class QdrantService {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      url: config.qdrant.url,
      apiKey: config.qdrant.apiKey,
    });
  }

  public async getTimeline(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{ results: SearchResult[]; total: number }> {
    const response = await this.client.scroll(QDRANT_COLLECTION, {
      filter: {
        must: [{ key: 'userId', match: { value: userId } }],
      },
      limit,
      offset,
      with_payload: true,
    });

    const results = response.points.map((point) => {
      const payload = point.payload as any;
      return {
        id: point.id as string,
        content: payload.content || '',
        title: payload.title || '',
        url: payload.url || '',
        source: payload.source || 'web',
        timestamp: payload.timestamp || 0,
        score: 1.0,
        chunkId: payload.chunkId || '',
        metadata: payload.metadata || {},
      };
    });

    return {
      results,
      total: results.length,
    };
  }
}
export default QdrantService;
