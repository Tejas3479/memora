import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
import { SelfReflectionInput, SelfReflectionOutput } from '@memora/shared';

export class SelfReflectionLoop {
  private ai: GoogleGenerativeAI | null = null;

  constructor() {
    if (config.llm.googleApiKey) {
      this.ai = new GoogleGenerativeAI(config.llm.googleApiKey);
    }
  }

  public async execute(input: SelfReflectionInput): Promise<SelfReflectionOutput> {
    if (!this.ai) {
      return {
        insights: [
          {
            type: 'pattern',
            description: 'No active Google API Key. Self-reflection skipped.',
            confidence: 0,
            relatedMemories: [],
          },
        ],
        qualityScore: 0.5,
        suggestedActions: [],
      };
    }

    try {
      const model = this.ai.getGenerativeModel({ model: config.llm.model });
      const prompt = `You are a self-reflection cognitive engine. Examine these memory logs from IDs: ${input.recentMemoryIds.join(', ')}
Identify patterns, gaps in knowledge, and suggestions. Return a JSON matching this structure:
{
  insights: Array<{
    type: 'pattern' | 'gap' | 'recommendation';
    description: string;
    confidence: number;
    relatedMemories: string[];
  }>;
  qualityScore: number; // 0.0 - 1.0
  suggestedActions: string[];
}`;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}') + 1;
      return JSON.parse(text.slice(start, end)) as SelfReflectionOutput;
    } catch (err) {
      console.error('[SelfReflectionLoop] Error during reflection execution:', err);
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
