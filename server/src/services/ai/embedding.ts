import { config } from '../../config.js';
import { retry } from '../../lib/utils.js';

export class EmbeddingService {
  private mode: 'cloud' | 'local';
  private localExtractor: any = null;

  constructor() {
    this.mode = config.embedding.mode;
  }

  public async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    
    if (this.mode === 'local') {
      return this.embedLocal(texts);
    } else {
      if (!config.embedding.voyageApiKey) {
        console.warn('[EmbeddingService] Voyage API key missing, falling back to local extractor.');
        return this.embedLocal(texts);
      }
      return this.embedCloud(texts);
    }
  }

  public async embedSingle(text: string): Promise<number[]> {
    const res = await this.embed([text]);
    return res[0];
  }

  public async rerank(query: string, documents: string[]): Promise<Array<{ index: number; score: number }>> {
    if (documents.length === 0) return [];

    if (!config.embedding.voyageApiKey || this.mode === 'local') {
      // Local fallback reranker: Simple Jaccard similarity sort
      const results = documents.map((doc, idx) => {
        const wordsQuery = new Set(query.toLowerCase().split(/\s+/));
        const wordsDoc = new Set(doc.toLowerCase().split(/\s+/));
        const intersection = new Set([...wordsQuery].filter((w) => wordsDoc.has(w)));
        const score = intersection.size / Math.max(wordsQuery.size, wordsDoc.size) || 0;
        return { index: idx, score };
      });
      return results.sort((a, b) => b.score - a.score);
    }

    return retry(async () => {
      const response = await fetch('https://api.voyageai.com/v1/rerank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.embedding.voyageApiKey}`,
        },
        body: JSON.stringify({
          model: 'rerank-2',
          query,
          documents,
        }),
      });

      if (!response.ok) {
        throw new Error(`Voyage Rerank API responded with status ${response.status}: ${await response.text()}`);
      }

      const body = await response.json();
      return body.data.map((d: any) => ({
        index: d.index,
        score: d.relevance_score,
      }));
    }, { attempts: 3, delay: 1000, backoff: 'exponential' });
  }

  public async embedImage(base64Image: string): Promise<number[]> {
    if (!config.embedding.voyageApiKey || this.mode === 'local') {
      const vec = new Array(config.embedding.dimension).fill(0).map(() => Math.random());
      const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
      return vec.map((v) => v / mag);
    }

    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

    return retry(async () => {
      const response = await fetch('https://api.voyageai.com/v1/multimodal/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.embedding.voyageApiKey}`,
        },
        body: JSON.stringify({
          model: 'voyage-multimodal-3',
          input: [
            {
              content: [
                {
                  type: 'image',
                  image: base64Data,
                }
              ]
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`Voyage Multimodal API responded with status ${response.status}: ${await response.text()}`);
      }

      const body = await response.json();
      return body.data[0].embedding;
    }, { attempts: 3, delay: 1000, backoff: 'exponential' });
  }

  private async embedCloud(texts: string[]): Promise<number[][]> {
    return retry(async () => {
      const response = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.embedding.voyageApiKey}`,
        },
        body: JSON.stringify({
          model: 'voyage-3.5',
          input: texts,
        }),
      });

      if (!response.ok) {
        throw new Error(`Voyage API responded with status ${response.status}: ${await response.text()}`);
      }

      const body = await response.json();
      return body.data.map((d: any) => d.embedding);
    }, { attempts: 3, delay: 1000, backoff: 'exponential' });
  }

  private async embedLocal(texts: string[]): Promise<number[][]> {
    try {
      // Dynamic import to avoid holding up bootstrap if package isn't loaded
      // @ts-ignore
      const { pipeline } = await import('@huggingface/transformers');
      if (!this.localExtractor) {
        this.localExtractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      }
      
      const results: number[][] = [];
      for (const text of texts) {
        const output = await this.localExtractor(text, { pooling: 'mean', normalize: true });
        results.push(Array.from(output.data));
      }
      return results;
    } catch (err) {
      console.warn('[EmbeddingService] Local transformers import failed, using deterministic fallback:', err);
      // Fallback: Return a simple deterministic vector of 384 dimensions
      return texts.map((txt) => {
        const vec = new Array(384).fill(0);
        for (let i = 0; i < txt.length; i++) {
          const code = txt.charCodeAt(i);
          vec[i % 384] += code / 1000;
        }
        // Normalize
        const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
        return vec.map((v) => v / mag);
      });
    }
  }
}
export default EmbeddingService;
