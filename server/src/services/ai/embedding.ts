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
      return this.embedCloud(texts);
    }
  }

  public async embedSingle(text: string): Promise<number[]> {
    const res = await this.embed([text]);
    return res[0];
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
