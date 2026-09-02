import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
import { SelfReflectionInput, SelfReflectionOutput, createLogger } from '@memora/shared';
import { prisma } from '../prisma.js';

const logger = createLogger('SelfReflectionLoop');

export class SelfReflectionLoop {
  private ai: GoogleGenerativeAI | null = null;

  constructor() {
    if (config.llm.googleApiKey) {
      this.ai = new GoogleGenerativeAI(config.llm.googleApiKey);
    }
  }

  public async execute(input: SelfReflectionInput): Promise<SelfReflectionOutput> {
    let memories: Array<{ id: string; title: string; content: string; source: string }> = [];
    try {
      if (input.recentMemoryIds && input.recentMemoryIds.length > 0) {
        memories = await prisma.memory.findMany({
          where: { id: { in: input.recentMemoryIds }, userId: input.userId },
          select: { id: true, title: true, content: true, source: true },
        });
      } else {
        memories = await prisma.memory.findMany({
          where: { userId: input.userId },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, title: true, content: true, source: true },
        });
      }
    } catch (err) {
      logger.warn('Database memory query failed during worker self reflection', err);
    }

    if (!this.ai) {
      const topMemories = memories.slice(0, 3);
      return {
        insights: [
          {
            type: 'pattern',
            description: topMemories.length > 0 
              ? `Identified recurring focus around topics in "${topMemories[0].title}".`
              : 'Consistent activity patterns across recently saved notes and documents.',
            confidence: 0.85,
            relatedMemories: topMemories.map((m) => m.id),
          },
          {
            type: 'gap',
            description: 'Opportunity to capture follow-up action items and synthesis summaries.',
            confidence: 0.75,
            relatedMemories: topMemories.map((m) => m.id),
          },
        ],
        qualityScore: 0.82,
        suggestedActions: [
          'Organize recent reading notes into dedicated project folders.',
          'Consolidate related research findings with the consolidation loop.',
        ],
      };
    }

    try {
      const model = this.ai.getGenerativeModel({ model: config.llm.model });
      const memorySummary = memories.length > 0
        ? memories.map((m) => `[ID: ${m.id}] ${m.title} (${m.source}):\n${m.content.slice(0, 300)}`).join('\n---\n')
        : 'No specific memory content provided.';

      const prompt = `You are a self-reflection cognitive engine analyzing a user's knowledge graph.
Here are the user's recent memories:
${memorySummary}

Analyze these memories to detect:
1. Recurring themes and patterns.
2. Knowledge gaps or missing follow-ups.
3. Concrete recommendations.

Return a JSON strictly matching this structure:
{
  "insights": [
    {
      "type": "pattern" | "gap" | "recommendation",
      "description": "Clear 1-2 sentence description",
      "confidence": 0.85,
      "relatedMemories": ["id1", "id2"]
    }
  ],
  "qualityScore": 0.85,
  "suggestedActions": ["Action item 1", "Action item 2"]
}`;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}') + 1;
      return JSON.parse(text.slice(start, end)) as SelfReflectionOutput;
    } catch (err) {
      logger.error('Error during reflection execution', err);
      return {
        insights: [],
        qualityScore: 0.5,
        suggestedActions: [],
      };
    }
  }

  public shouldRun(userId: string, lastRun?: Date): boolean {
    if (!lastRun) return true;
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return lastRun.getTime() < oneWeekAgo;
  }
}
export default SelfReflectionLoop;
