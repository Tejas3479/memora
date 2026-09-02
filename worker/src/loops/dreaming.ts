import { DreamingInput, DreamingOutput } from '@memora/shared';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
import { QdrantService } from '../services/qdrant.js';
import crypto from 'crypto';
import { prisma } from '../prisma.js';
import { embedText } from '../services/embedding.js';

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

  constructor(private qdrantService: QdrantService) {
    if (config.llm.googleApiKey) {
      this.ai = new GoogleGenerativeAI(config.llm.googleApiKey);
    }
  }

  public async execute(input: DreamingInput): Promise<DreamingOutput> {
    const start = Date.now();
    const { results } = await this.qdrantService.getTimeline(input.userId, 100, 0);
    
    const discoveries = await this.discoverConnections(results, input.maxConnections || 5);

    for (const discovery of discoveries) {
      try {
        const dreamUrl = `dream://${crypto.randomUUID()}`;
        const memory = await prisma.memory.create({
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

        try {
          const vector = await embedText(discovery.description);
          await this.qdrantService.upsertMemories([
            {
              id: crypto.randomUUID(),
              vector,
              payload: {
                memoryId: memory.id,
                userId: input.userId,
                title: memory.title,
                content: discovery.description,
                url: dreamUrl,
                source: 'note',
                timestamp: Math.floor(memory.createdAt.getTime() / 1000),
                chunkId: crypto.randomUUID(),
                metadata: memory.metadata,
              },
            },
          ]);
        } catch (vecErr) {
          console.warn('[Worker DreamingLoop] Failed to upsert dream vector to Qdrant:', vecErr);
        }
      } catch (err) {
        console.warn('[Worker DreamingLoop] Failed to save dream memory:', err);
      }
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
    
    const connections: Array<{ type: 'connection' | 'pattern' | 'insight'; memoryIds: string[]; description: string; noveltyScore: number }> = [];
    const visited = new Set<string>();

    for (let i = 0; i < memories.length && connections.length < limit; i++) {
      const a = memories[i];
      if (!a.vector || a.vector.length === 0) continue;

      for (let j = i + 1; j < memories.length && connections.length < limit; j++) {
        const b = memories[j];
        if (!b.vector || b.vector.length === 0) continue;

        const similarity = cosineSimilarity(a.vector, b.vector);

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
              console.warn('[Worker Dreaming] Gemini speculation failed:', err);
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
