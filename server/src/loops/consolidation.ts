import { ConsolidationInput, ConsolidationOutput, QDRANT_COLLECTION } from '@memora/shared';
import { QdrantService } from '../services/ai/qdrant.js';
import { EmbeddingService } from '../services/ai/embedding.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
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

export class ConsolidationLoop {
  private ai: GoogleGenerativeAI | null = null;
  private embeddingService: EmbeddingService;

  constructor(private qdrantService: QdrantService) {
    if (config.llm.googleApiKey) {
      this.ai = new GoogleGenerativeAI(config.llm.googleApiKey);
    }
    this.embeddingService = new EmbeddingService();
  }

  public async execute(input: ConsolidationInput): Promise<ConsolidationOutput> {
    // 1. Fetch temporal memories with vectors
    const { results } = await this.qdrantService.getTimeline(input.userId, 100, 0);
    
    // 2. Identify near duplicates based on semantic vector comparison
    const duplicates = await this.findDuplicates(results);

    // 3. Synthesize summary and consolidate Qdrant points
    let summariesCreated = 0;
    let memoriesMerged = 0;
    let duplicatesRemoved = 0;

    if (duplicates.length > 0) {
      for (const group of duplicates) {
        const matchingMemories = results.filter((r) => group.includes(r.id));
        if (matchingMemories.length < 2) continue;

        // Generate cohesive summary
        const summaryText = await this.createSummary(matchingMemories);
        const summaryVector = await this.embeddingService.embedSingle(summaryText);
        const newMemoryId = crypto.randomUUID();

        // Write back consolidated summary
        await this.qdrantService.upsertMemories([{
          id: crypto.randomUUID(),
          vector: summaryVector,
          payload: {
            userId: input.userId,
            chunkId: crypto.randomUUID(),
            source: 'DOCUMENT',
            url: `consolidation://${newMemoryId}`,
            title: `Consolidated Memory: ${matchingMemories[0].title}`,
            content: summaryText,
            timestamp: Math.floor(Date.now() / 1000),
            metadata: {
              consolidatedFrom: group,
              memoryId: newMemoryId,
            },
          },
        }]);

        // Delete duplicates to clear index
        await this.qdrantService.deleteMemories(group);

        summariesCreated++;
        memoriesMerged += group.length;
        duplicatesRemoved += (group.length - 1);
      }
    }

    return {
      summariesCreated,
      memoriesMerged,
      duplicatesRemoved,
      newGraphEdges: summariesCreated * 2,
    };
  }

  public async findDuplicates(memories: any[]): Promise<string[][]> {
    const groups: string[][] = [];
    const visited = new Set<string>();

    for (let i = 0; i < memories.length; i++) {
      const a = memories[i];
      if (visited.has(a.id) || !a.vector || a.vector.length === 0) continue;

      const currentGroup = [a.id];
      for (let j = i + 1; j < memories.length; j++) {
        const b = memories[j];
        if (visited.has(b.id) || !b.vector || b.vector.length === 0) continue;

        const similarity = cosineSimilarity(a.vector, b.vector);

        if (similarity > 0.85) {
          currentGroup.push(b.id);
          visited.add(b.id);
        }
      }
      if (currentGroup.length > 1) {
        groups.push(currentGroup);
        visited.add(a.id);
      }
    }

    return groups;
  }

  public async createSummary(memories: any[]): Promise<string> {
    if (!this.ai) {
      return `Consolidated summary of: ${memories.map((m) => m.title).join(', ')}`;
    }
    const model = this.ai.getGenerativeModel({ model: config.llm.model });
    const content = memories.map((m) => `${m.title}:\n${m.content}`).join('\n---\n');
    const response = await model.generateContent(
      `You are a memory consolidation engine. The user has several highly redundant or related memory entries. Summarize them into a single, cohesive, comprehensive, chronological record that contains all relevant facts and details without repetition:\n\n${content}`
    );
    return response.response.text() || 'Consolidated memory summary';
  }
}
export default ConsolidationLoop;
