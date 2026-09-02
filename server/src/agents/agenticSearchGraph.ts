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
  iterationCount: Annotation<number>({ reducer: (x, y) => y, default: () => 0 }),
  isSufficient: Annotation<boolean>({ reducer: (x, y) => y, default: () => false }),
  synthesizedAnswer: Annotation<any>({ reducer: (x, y) => y, default: () => null }),
});

type StateType = typeof SearchAgentState.State;

/**
 * Fuses and re-ranks search results using Reciprocal Rank Fusion (RRF).
 * rrfScore = sum(1 / (k + rank)) with standard k = 60.
 */
export function reciprocalRankFusion(resultLists: SearchResult[][], k: number = 60): SearchResult[] {
  const scoreMap = new Map<string, { item: SearchResult; rrfScore: number; bestScore: number }>();

  for (const list of resultLists) {
    list.forEach((item, index) => {
      const rank = index + 1;
      const rrfIncrement = 1 / (k + rank);
      const existing = scoreMap.get(item.id);

      const currentScore = item.score ?? 0;
      if (!existing) {
        scoreMap.set(item.id, {
          item: { ...item },
          rrfScore: rrfIncrement,
          bestScore: currentScore,
        });
      } else {
        existing.rrfScore += rrfIncrement;
        existing.bestScore = Math.max(existing.bestScore, currentScore);
        if ((item.content?.length || 0) > (existing.item.content?.length || 0)) {
          existing.item = { ...item };
        }
      }
    });
  }

  // Sort candidates by combined RRF score
  return Array.from(scoreMap.values())
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .map(({ item, rrfScore, bestScore }) => ({
      ...item,
      score: Math.min(1, Math.round((bestScore * 0.6 + rrfScore * 20 * 0.4) * 1000) / 1000),
    }));
}

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

  /**
   * Reformulates and widens queries when the initial retrieval yields poor relevance.
   */
  public async reformulateQuery(query: string): Promise<string[]> {
    const stopWords = new Set(['what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how', 'is', 'was', 'are', 'were', 'the', 'a', 'an', 'in', 'on', 'at', 'about']);
    const keywords = query
      .replace(/[^\w\s]/gi, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w.toLowerCase()));

    if (keywords.length > 0) {
      return [keywords.join(' '), query];
    }
    return [query];
  }

  private compileGraph() {
    const workflow = new StateGraph(SearchAgentState)
      .addNode('planSearch', async (state: StateType) => {
        const queries = await this.decomposeQuery(state.query);
        return { queries, iterationCount: 0 };
      })
      .addNode('executeSearch', async (state: StateType) => {
        const resultLists: SearchResult[][] = [];
        for (const q of state.queries) {
          try {
            const queryVector = await this.embeddingService.embedSingle(q);
            const res = await this.qdrantService.hybridSearch({
              userId: state.userId,
              vector: queryVector,
              query: q,
              filters: state.filters,
              limit: 5,
            });
            resultLists.push(res);
          } catch (err) {
            console.warn(`[AgenticSearchGraph] Search error for "${q}":`, err);
          }
        }
        const fused = reciprocalRankFusion(resultLists);
        return { rawResults: fused };
      })
      .addNode('evaluateRetrieval', async (state: StateType) => {
        const hasResults = state.rawResults.length > 0;
        const topScore = hasResults ? (state.rawResults[0].score || 0) : 0;
        const isSufficient = hasResults && (topScore >= 0.4 || state.iterationCount >= 1);
        return { isSufficient };
      })
      .addNode('reformulate', async (state: StateType) => {
        const reformulatedQueries = await this.reformulateQuery(state.query);
        return {
          queries: reformulatedQueries,
          iterationCount: (state.iterationCount || 0) + 1,
        };
      })
      .addNode('synthesize', async (state: StateType) => {
        const answer = await this.synthesisService.synthesize(state.query, state.rawResults);
        return { synthesizedAnswer: answer };
      });

    return workflow
      .addEdge('__start__', 'planSearch')
      .addEdge('planSearch', 'executeSearch')
      .addEdge('executeSearch', 'evaluateRetrieval')
      .addConditionalEdges(
        'evaluateRetrieval',
        (state: StateType) => (state.isSufficient ? 'synthesize' : 'reformulate'),
        {
          synthesize: 'synthesize',
          reformulate: 'reformulate',
        },
      )
      .addEdge('reformulate', 'executeSearch')
      .addEdge('synthesize', '__end__')
      .compile();
  }

  /**
   * Runs the planning, retrieval, and RRF re-ranking steps of the agentic graph,
   * returning candidate results and sub-queries.
   */
  public async planAndRetrieve(input: {
    userId: string;
    query: string;
    filters?: any;
  }): Promise<{ results: SearchResult[]; subQueries: string[] }> {
    const subQueries = await this.decomposeQuery(input.query);
    const resultLists: SearchResult[][] = [];

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
          resultLists.push(res);
        } catch (err) {
          console.warn(`[AgenticSearchGraph] Search failed for sub-query "${q}":`, err);
        }
      }),
    );

    const fusedResults = reciprocalRankFusion(resultLists);

    return {
      results: fusedResults,
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
      iterationCount: 0,
      isSufficient: false,
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
