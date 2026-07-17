import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../../config.js';
import { QDRANT_COLLECTION } from '@memora/shared';
import { SearchResult, HybridSearchParams } from '@memora/shared';

export interface QdrantPoint {
  id: string;
  vector: number[];
  payload: {
    userId: string;
    chunkId: string;
    source: string;
    url: string;
    title: string;
    content: string;
    timestamp: number;
    metadata: Record<string, any>;
    folderId?: string;
    teamId?: string;
  };
}

export class QdrantService {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      url: config.qdrant.url,
      apiKey: config.qdrant.apiKey,
    });
  }

  public async ensureCollection(): Promise<void> {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some((c) => c.name === QDRANT_COLLECTION);
      
      if (!exists) {
        await this.client.createCollection(QDRANT_COLLECTION, {
          vectors: {
            size: config.embedding.dimension,
            distance: 'Cosine',
          },
          hnsw_config: {
            m: 16,
            ef_construct: 200,
          },
          quantization_config: {
            scalar: {
              type: 'int8',
              quantile: 0.99,
              always_ram: true,
            },
          },
        });

        // Setup indexes
        await this.client.createPayloadIndex(QDRANT_COLLECTION, {
          field_name: 'userId',
          field_schema: 'keyword',
        });
        await this.client.createPayloadIndex(QDRANT_COLLECTION, {
          field_name: 'source',
          field_schema: 'keyword',
        });
        await this.client.createPayloadIndex(QDRANT_COLLECTION, {
          field_name: 'timestamp',
          field_schema: 'integer',
        });
        await this.client.createPayloadIndex(QDRANT_COLLECTION, {
          field_name: 'folderId',
          field_schema: 'keyword',
        });
      }
    } catch (err) {
      console.error('[QdrantService] ensureCollection failed:', err);
    }
  }

  public async upsertMemories(points: QdrantPoint[]): Promise<void> {
    await this.client.upsert(QDRANT_COLLECTION, {
      wait: true,
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload,
      })),
    });
  }

  public async hybridSearch(params: HybridSearchParams): Promise<SearchResult[]> {
    const filterConditions: any[] = [
      {
        key: 'userId',
        match: { value: params.userId },
      },
    ];

    if (params.filters) {
      if (params.filters.source) {
        filterConditions.push({
          key: 'source',
          match: { value: params.filters.source },
        });
      }
      if (params.filters.folderId) {
        filterConditions.push({
          key: 'folderId',
          match: { value: params.filters.folderId },
        });
      }
      if (params.filters.dateFrom || params.filters.dateTo) {
        const range: any = {};
        if (params.filters.dateFrom) {
          range.gte = Math.floor(new Date(params.filters.dateFrom).getTime() / 1000);
        }
        if (params.filters.dateTo) {
          range.lte = Math.floor(new Date(params.filters.dateTo).getTime() / 1000);
        }
        filterConditions.push({
          key: 'timestamp',
          range,
        });
      }
    }

    // Dense search parameters
    const response = await this.client.search(QDRANT_COLLECTION, {
      vector: params.vector,
      filter: {
        must: filterConditions,
      },
      limit: params.limit || 10,
      with_payload: true,
    });

    return response.map((point) => {
      const payload = point.payload as any;
      return {
        id: point.id as string,
        content: payload.content || '',
        title: payload.title || '',
        url: payload.url || '',
        source: payload.source || 'web',
        timestamp: payload.timestamp || 0,
        score: point.score,
        chunkId: payload.chunkId || '',
        metadata: payload.metadata || {},
      };
    });
  }

  public async getTimeline(
    userId: string,
    limit: number,
    offset: number,
    source?: string,
  ): Promise<{ results: SearchResult[]; total: number }> {
    const filterConditions: any[] = [
      {
        key: 'userId',
        match: { value: userId },
      },
    ];

    if (source) {
      filterConditions.push({
        key: 'source',
        match: { value: source },
      },);
    }

    const response = await this.client.scroll(QDRANT_COLLECTION, {
      filter: {
        must: filterConditions,
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
      total: results.length, // Scroll limit output
    };
  }

  public async deleteMemory(userId: string, pointId: string): Promise<void> {
    await this.client.delete(QDRANT_COLLECTION, {
      filter: {
        must: [
          { key: 'userId', match: { value: userId } },
          { has_id: [pointId] },
        ],
      },
    });
  }

  public async getMemory(pointId: string): Promise<SearchResult | null> {
    const res = await this.client.retrieve(QDRANT_COLLECTION, {
      ids: [pointId],
    });
    if (res.length === 0) return null;
    const point = res[0];
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
  }
}
export default QdrantService;
