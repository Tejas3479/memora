import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config.js';
import { SearchResult, SynthesizedAnswer } from '@memora/shared';

export class SynthesisService {
  private ai: GoogleGenerativeAI | null = null;

  constructor() {
    if (config.llm.googleApiKey) {
      this.ai = new GoogleGenerativeAI(config.llm.googleApiKey);
    }
  }

  public async synthesize(query: string, chunks: SearchResult[]): Promise<SynthesizedAnswer> {
    if (chunks.length === 0) {
      return {
        answer: "I couldn't find any memories related to your query.",
        sources: [],
        confidence: 0,
      };
    }

    if (!this.ai) {
      console.warn('[SynthesisService] Google API Key is missing. Using local fallback.');
      return this.fallbackSynthesis(query, chunks);
    }

    try {
      const model = this.ai.getGenerativeModel({ model: config.llm.model });
      const prompt = this.buildSynthesisPrompt(query, chunks);

      const result = await model.generateContent(prompt);
      const answerText = result.response.text();

      // Gather reference sources actually cited in the text in [number] format.
      const sources: Array<{ url: string; title: string; chunkId: string; snippet: string }> = [];
      const matches = answerText.match(/\[\d+\]/g) || [];
      const uniqueIndices = Array.from(new Set(matches.map((m) => parseInt(m.slice(1, -1), 10))));

      for (const idx of uniqueIndices) {
        const chunk = chunks[idx - 1];
        if (chunk) {
          sources.push({
            url: chunk.url,
            title: chunk.title,
            chunkId: chunk.chunkId,
            snippet: chunk.content,
          });
        }
      }

      return {
        answer: answerText,
        sources,
        confidence: Math.max(0.6, 1.0 - (0.05 * (chunks.length - sources.length))),
      };
    } catch (err) {
      console.error('[SynthesisService] Error during synthesis:', err);
      return this.fallbackSynthesis(query, chunks);
    }
  }

  public buildSynthesisPrompt(query: string, chunks: SearchResult[]): string {
    const formattedContext = chunks
      .map((c, i) => `[${i + 1}] Context from "${c.title}" (${c.url}):\n${c.content}`)
      .join('\n\n');

    return `You are Memora's AI synthesis engine. Answer the user's query based ONLY on the provided context items.
If the information is not present, state that you cannot answer from memory.
Always cite the context item using brackets, e.g. [1], [2], corresponding to the item number when explaining a fact.

Context Items:
${formattedContext}

User Query: ${query}

Synthesized Cited Answer:`;
  }

  private fallbackSynthesis(query: string, chunks: SearchResult[]): SynthesizedAnswer {
    // Generate a simple rule-based summary matching chunks
    const snippets = chunks.slice(0, 2).map((c, i) => `"${c.content}" [${i + 1}]`);
    return {
      answer: `[Fallback] Based on your memories:\n${snippets.join('\nand\n')}\n(Set GOOGLE_API_KEY in .env for full AI synthesis).`,
      sources: chunks.slice(0, 2).map((c) => ({
        url: c.url,
        title: c.title,
        chunkId: c.chunkId,
        snippet: c.content,
      })),
      confidence: 0.5,
    };
  }
}
export default SynthesisService;
