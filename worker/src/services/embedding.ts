import { config } from '../config.js';
import { createLogger } from '@memora/shared';

const logger = createLogger('WorkerEmbedding');

export async function embedText(text: string): Promise<number[]> {
  const voyageKey = process.env.VOYAGE_API_KEY;
  const size = 1024;

  if (voyageKey) {
    try {
      const res = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${voyageKey}`,
        },
        body: JSON.stringify({
          model: 'voyage-3.5',
          input: [text],
        }),
      });
      if (res.ok) {
        const body = await res.json();
        if (body.data && body.data[0]?.embedding) {
          return body.data[0].embedding;
        }
      }
    } catch (err) {
      logger.warn('Voyage embedding failed, using deterministic fallback', err);
    }
  }

  // Deterministic normalized embedding vector matching Qdrant dimension
  const vec = new Array(size).fill(0);
  for (let i = 0; i < text.length; i++) {
    const idx = (text.charCodeAt(i) * 31 + i) % size;
    vec[idx] += 1 / (1 + (i % 7));
  }
  const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vec.map((v) => v / mag);
}
