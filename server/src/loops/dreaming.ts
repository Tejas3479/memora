import { DreamingInput, DreamingOutput } from '@memora/shared';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
import { QdrantService } from '../services/ai/qdrant.js';
import { EmbeddingService } from '../services/ai/embedding.js';
import { prisma } from '../prisma.js';
import { Redis } from 'ioredis';
import crypto from 'crypto';

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    mA += a[i] * a[i];
    mB += b[i] * b[i];
  }
  return dot / (Math.sqrt(mA) * Math.sqrt(mB)) || 0;
}

export class DreamingLoop {
  private ai: GoogleGenerativeAI | null = null;
  private embeddingService: EmbeddingService;

  constructor(private qdrantService: QdrantService) {
    if (config.llm.googleApiKey) {
      this.ai = new GoogleGenerativeAI(config.llm.googleApiKey);
    }
    this.embeddingService = new EmbeddingService();
  }

  public async execute(input: DreamingInput): Promise<DreamingOutput> {
    const start = Date.now();
    const { results } = await this.qdrantService.getTimeline(input.userId, 100, 0, undefined);
    
    const discoveries = await this.discoverConnections(results, input.maxConnections || 5);

    // Persist discoveries as new Memory entries and in Qdrant
    for (const discovery of discoveries) {
      try {
        const dreamUrl = `dream://${crypto.randomUUID()}`;
        const memoryRecord = await prisma.memory.create({
          data: {
            userId: input.userId,
            title: `Dream Insight: ${discovery.type.toUpperCase()}`,
            content: discovery.description,
            source: 'NOTE',
            url: dreamUrl,
            metadata: {
              isDream: true,
              type: discovery.type,
              connectedMemoryIds: discovery.memoryIds,
              noveltyScore: discovery.noveltyScore,
            },
          },
        });

        const embedding = await this.embeddingService.embedSingle(discovery.description);
        await this.qdrantService.upsertMemories([{
          id: crypto.randomUUID(),
          vector: embedding,
          payload: {
            userId: input.userId,
            chunkId: crypto.randomUUID(),
            source: 'note',
            url: dreamUrl,
            title: `Dream Insight: ${discovery.type.toUpperCase()}`,
            content: discovery.description,
            timestamp: Math.floor(Date.now() / 1000),
            metadata: {
              isDream: true,
              memoryId: memoryRecord.id,
              connectedMemoryIds: discovery.memoryIds,
              noveltyScore: discovery.noveltyScore,
            },
          },
        }]);
      } catch (err) {
        console.warn('[DreamingLoop] Failed to persist dream memory:', err);
      }
    }

    // Cache discoveries in Redis if available
    try {
      const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
      if (!isTest && discoveries.length > 0) {
        const redis = new Redis(config.redis.url, { lazyConnect: true, enableOfflineQueue: false });
        redis.on('error', () => {});
        const cacheKey = `user:${input.userId}:dream_cards`;
        await redis.set(cacheKey, JSON.stringify(discoveries), 'EX', 86400 * 7);
        await redis.quit().catch(() => {});
      }
    } catch (err) {
      // Graceful fallback for offline Redis
    }

    return {
      discoveries,
      newEdgesCreated: discoveries.length,
      processingTimeMs: Date.now() - start,
    };
  }

  public async discoverConnections(
    memories: any[],
    limit: number,
  ): Promise<Array<{ type: 'connection' | 'pattern' | 'insight'; memoryIds: string[]; description: string; noveltyScore: number }>> {
    if (memories.length < 2) return [];
    
    // Ensure vectors exist for comparison
    const embeddedMemories = await Promise.all(
      memories.map(async (m) => {
        if (m.vector && m.vector.length > 0) return m;
        const vec = await this.embeddingService.embedSingle(m.content || m.title || '');
        return { ...m, vector: vec };
      })
    );

    const connections: Array<{ type: 'connection' | 'pattern' | 'insight'; memoryIds: string[]; description: string; noveltyScore: number }> = [];
    const visited = new Set<string>();

    for (let i = 0; i < embeddedMemories.length && connections.length < limit; i++) {
      const a = embeddedMemories[i];
      if (!a.vector || a.vector.length === 0) continue;

      for (let j = i + 1; j < embeddedMemories.length && connections.length < limit; j++) {
        const b = embeddedMemories[j];
        if (!b.vector || b.vector.length === 0) continue;

        const similarity = cosineSimilarity(a.vector, b.vector);

        // Moderate similarity: not identical (not duplicate), but conceptually related
        if (similarity > 0.50 && similarity < 0.85) {
          const pairKey = [a.id, b.id].sort().join('-');
          if (visited.has(pairKey)) continue;
          visited.add(pairKey);

          let description = `Speculative connection between "${a.title}" and "${b.title}": both explore interconnected ideas.`;
          let type: 'connection' | 'pattern' | 'insight' = 'connection';

          if (this.ai) {
            try {
              const model = this.ai.getGenerativeModel({ model: config.llm.model });
              const prompt = `You are a dream association discovery engine. You are analyzing two related memories:\n\nMemory A: ${a.title}\n${a.content}\n\nMemory B: ${b.title}\n${b.content}\n\nProvide a short, 1-2 sentence speculative association or insight card that links these memories. Start directly with the insight.`;
              const response = await model.generateContent([prompt]);
              description = response.response.text().trim() || description;
              type = similarity > 0.70 ? 'insight' : 'connection';
            } catch (err) {
              console.warn('[Dreaming] Gemini speculation failed:', err);
            }
          }

          connections.push({
            type,
            memoryIds: [a.id, b.id],
            description,
            noveltyScore: Number((1.0 - similarity).toFixed(2)),
          });
        }
      }
    }

    return connections;
  }

  public async analyzeGaps(memories: any[]): Promise<string[]> {
    return ['No gaps identified in processed nodes.'];
  }
}
export default DreamingLoop;
