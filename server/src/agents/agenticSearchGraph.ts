import { GoogleGenerativeAI } from '@google/generative-ai';
import { SearchResponse, SearchResult } from '@memora/shared';
import { QdrantService } from '../services/ai/qdrant.js';
import { EmbeddingService } from '../services/ai/embedding.js';
import { SynthesisService } from '../services/ai/synthesis.js';
import { config } from '../config.js';
import { StateGraph, Annotation } from '@langchain/langgraph';

// Define the state annotation
const SearchAgentState = Annotation.Root({
  userId: Annotation<string>(),
  query: Annotation<string>(),
  filters: Annotation<any>(),
  queries: Annotation<string[]>({ reducer: (x, y) => y, default: () => [] }),
  rawResults: Annotation<SearchResult[]>({ reducer: (x, y) => y, default: () => [] }),
  synthesizedAnswer: Annotation<any>({ reducer: (x, y) => y, default: () => null }),
});

type StateType = typeof SearchAgentState.State;

export class AgenticSearchGraph {
  private embeddingService: EmbeddingService;
  private ai: GoogleGenerativeAI | null = null;
  private graph: any;

  constructor(
    private qdrantService: QdrantService,
    private synthesisService: SynthesisService,
  ) {
    this.embeddingService = new EmbeddingService();
    if (config.llm.googleApiKey) {
      this.ai = new GoogleGenerativeAI(config.llm.googleApiKey);
    }
    this.graph = this.compileGraph();
  }

  /**
   * Decomposes complex, multi-hop, or compound questions into 1-4 targeted sub-queries.
   */
  public async decomposeQuery(query: string): Promise<string[]> {
    if (!this.ai) {
      return this.fallbackDecompose(query);
    }

    try {
      const model = this.ai.getGenerativeModel({ model: config.llm.model });
      const prompt = `You are Memora's Agentic Search Planner.
Given the user's inquiry, decompose it into 1 to 4 distinct, keyword-rich sub-queries to retrieve all necessary context from a personal vector database.
If the query is already simple and atomic, return a single item.

Return ONLY a valid JSON array of strings with NO extra text or markdown formatting.
Example: ["Q3 roadmap release goals", "engineering team launch feedback from Sarah"]

User Query: "${query}"

JSON Array:`;

      const res = await model.generateContent(prompt);
      const text = res.response.text().trim();
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((q) => String(q).trim()).filter(Boolean);
      }
      return this.fallbackDecompose(query);
    } catch (err) {
      console.warn('[AgenticSearchGraph] LLM query decomposition failed, using fallback:', err);
      return this.fallbackDecompose(query);
    }
  }

  private fallbackDecompose(query: string): string[] {
    if (query.toLowerCase().includes(' and ') || query.toLowerCase().includes(' or ') || query.includes(';')) {
      const parts = query
        .split(/\band\b|\bor\b|;/gi)
        .map((p) => p.trim())
        .filter((p) => p.length > 2);
      if (parts.length > 0) return parts;
    }
    return [query.trim()];
  }

  private compileGraph() {
    const workflow = new StateGraph(SearchAgentState)
      .addNode('planSearch', async (state: StateType) => {
        const queries = await this.decomposeQuery(state.query);
        return { queries };
      })
      .addNode('executeSearch', async (state: StateType) => {
        const results: SearchResult[] = [];
        for (const q of state.queries) {
          const queryVector = await this.embeddingService.embedSingle(q);
          const res = await this.qdrantService.hybridSearch({
            userId: state.userId,
            vector: queryVector,
            query: q,
            filters: state.filters,
            limit: 5,
          });
          results.push(...res);
        }
        return { rawResults: results };
      })
      .addNode('mergeAndDeduplicate', async (state: StateType) => {
        const seen = new Set<string>();
        const deduplicated = state.rawResults.filter((r) => {
          if (seen.has(r.id)) return false;
          seen.add(r.id);
          return true;
        });
        return { rawResults: deduplicated };
      })
      .addNode('synthesize', async (state: StateType) => {
        const answer = await this.synthesisService.synthesize(state.query, state.rawResults);
        return { synthesizedAnswer: answer };
      });

    return workflow
      .addEdge('__start__', 'planSearch')
      .addEdge('planSearch', 'executeSearch')
      .addEdge('executeSearch', 'mergeAndDeduplicate')
      .addEdge('mergeAndDeduplicate', 'synthesize')
      .addEdge('synthesize', '__end__')
      .compile();
  }

  /**
   * Runs the planning and retrieval steps of the agentic graph, returning candidate results and sub-queries.
   * Useful for SSE streaming search routes.
   */
  public async planAndRetrieve(input: {
    userId: string;
    query: string;
    filters?: any;
  }): Promise<{ results: SearchResult[]; subQueries: string[] }> {
    const subQueries = await this.decomposeQuery(input.query);
    const results: SearchResult[] = [];

    await Promise.all(
      subQueries.map(async (q) => {
        try {
          const queryVector = await this.embeddingService.embedSingle(q);
          const res = await this.qdrantService.hybridSearch({
            userId: input.userId,
            vector: queryVector,
            query: q,
            filters: input.filters,
            limit: 5,
          });
          results.push(...res);
        } catch (err) {
          console.warn(`[AgenticSearchGraph] Search failed for sub-query "${q}":`, err);
        }
      }),
    );

    // Deduplicate candidate results
    const seen = new Set<string>();
    const deduplicated = results.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    return {
      results: deduplicated,
      subQueries,
    };
  }

  public async run(input: { userId: string; query: string; filters?: any }): Promise<SearchResponse> {
    const start = Date.now();
    const finalState = await this.graph.invoke({
      userId: input.userId,
      query: input.query,
      filters: input.filters,
      queries: [],
      rawResults: [],
      synthesizedAnswer: null,
    });

    return {
      results: finalState.rawResults,
      synthesizedAnswer: finalState.synthesizedAnswer,
      total: finalState.rawResults.length,
      took: Date.now() - start,
    };
  }
}
export default AgenticSearchGraph;
