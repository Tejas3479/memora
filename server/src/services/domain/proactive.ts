import { Redis } from 'ioredis';
import { config } from '../../config.js';
import { QdrantService } from '../ai/qdrant.js';
import { SearchResult } from '@memora/shared';

export class ProactiveService {
  private redis: Redis;

  constructor(
    private qdrantService: QdrantService,
  ) {
    this.redis = new Redis(config.redis.url);
  }

  public async processContext(
    userId: string,
    context: { type: string; identifier: string; recentText?: string },
  ): Promise<SearchResult[]> {
    // Generate context queries based on recent text or identifiers
    const query = context.recentText || `Context for ${context.type} ${context.identifier}`;
    
    // Perform standard search with threshold filtering
    // (In a real setup, we would generate an embedding for context query first)
    // For demo/simplicity, we search using a dummy/zero vector or placeholder search
    // Since we require embedding vector for hybridSearch, let's create a placeholder
    const placeholderVector = new Array(config.embedding.dimension).fill(0.1);
    
    const results = await this.qdrantService.hybridSearch({
      userId,
      vector: placeholderVector,
      query,
      limit: 5,
    });

    // Save context interaction to Redis history
    const contextKey = `user:${userId}:contexts`;
    await this.redis.zadd(contextKey, Date.now(), JSON.stringify({
      type: context.type,
      identifier: context.identifier,
      timestamp: Date.now(),
    }));
    // Cap history at 50
    await this.redis.zremrangebyrank(contextKey, 0, -51);

    return results;
  }

  public async publishToUser(userId: string, memories: SearchResult[]): Promise<void> {
    const channel = `proactive:${userId}`;
    await this.redis.publish(channel, JSON.stringify({
      type: 'proactive_memory',
      data: memories,
    }));
  }

  public async getRecentContexts(userId: string, limit = 10): Promise<any[]> {
    const contextKey = `user:${userId}:contexts`;
    const members = await this.redis.zrevrange(contextKey, 0, limit - 1);
    return members.map((m: any) => JSON.parse(m));
  }
}
export default ProactiveService;
