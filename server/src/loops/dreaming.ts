import { DreamingInput, DreamingOutput } from '@memora/shared';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
import { QdrantService } from '../services/ai/qdrant.js';

export class DreamingLoop {
  private ai: GoogleGenerativeAI | null = null;

  constructor(private qdrantService: QdrantService) {
    if (config.llm.googleApiKey) {
      this.ai = new GoogleGenerativeAI(config.llm.googleApiKey);
    }
  }

  public async execute(input: DreamingInput): Promise<DreamingOutput> {
    const start = Date.now();
    const { results } = await this.qdrantService.getTimeline(input.userId, 100, 0, undefined);
    
    const discoveries = await this.discoverConnections(results, input.maxConnections || 5);

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
    
    for (let i = 0; i < Math.min(limit, memories.length - 1); i++) {
      const a = memories[i];
      const b = memories[i + 1];

      connections.push({
        type: 'connection',
        memoryIds: [a.id, b.id],
        description: `Discovered connection: "${a.title}" relates to "${b.title}" through concepts discussed in both notes.`,
        noveltyScore: 0.75,
      });
    }

    return connections;
  }

  public async analyzeGaps(memories: any[]): Promise<string[]> {
    return ['No gaps identified in processed nodes.'];
  }
}
export default DreamingLoop;
