import { ConsolidationInput, ConsolidationOutput } from '@memora/shared';
import { QdrantService } from '../services/qdrant.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

export class ConsolidationLoop {
  private ai: GoogleGenerativeAI | null = null;

  constructor(private qdrantService: QdrantService) {
    if (config.llm.googleApiKey) {
      this.ai = new GoogleGenerativeAI(config.llm.googleApiKey);
    }
  }

  public async execute(input: ConsolidationInput): Promise<ConsolidationOutput> {
    const { results } = await this.qdrantService.getTimeline(input.userId, 100, 0);
    const duplicates = await this.findDuplicates(results);

    let summariesCreated = 0;
    if (duplicates.length > 0 && this.ai) {
      for (const group of duplicates) {
        const matchingMemories = results.filter((r) => group.includes(r.id));
        await this.createSummary(matchingMemories);
        summariesCreated++;
      }
    }

    return {
      summariesCreated,
      memoriesMerged: duplicates.reduce((acc, g) => acc + g.length, 0),
      duplicatesRemoved: Math.max(0, duplicates.length - 1),
      newGraphEdges: duplicates.length * 2,
    };
  }

  public async findDuplicates(memories: any[]): Promise<string[][]> {
    const groups: string[][] = [];
    const visited = new Set<string>();

    for (let i = 0; i < memories.length; i++) {
      const a = memories[i];
      if (visited.has(a.id)) continue;

      const currentGroup = [a.id];
      for (let j = i + 1; j < memories.length; j++) {
        const b = memories[j];
        if (visited.has(b.id)) continue;

        const wordsA = new Set(a.content.toLowerCase().split(/\s+/));
        const wordsB = new Set(b.content.toLowerCase().split(/\s+/));
        const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
        const similarity = intersection.size / Math.max(wordsA.size, wordsB.size);

        if (similarity > 0.8) {
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
    if (!this.ai) return 'Consolidated memory summary';
    const model = this.ai.getGenerativeModel({ model: config.llm.model });
    const content = memories.map((m) => m.content).join('\n---\n');
    const response = await model.generateContent(
      `Summarize the following consolidated documents into one cohesive record:\n\n${content}`
    );
    return response.response.text();
  }
}
export default ConsolidationLoop;
