import { SearchResult, GraphNode, GraphNodeType } from '@memora/shared';

export class ZepService {
  private url: string;
  private apiKey: string;
  private endpoint: string;
  private isEnabled = false;

  constructor() {
    this.url = process.env.ZEP_API_URL || '';
    this.apiKey = process.env.ZEP_API_KEY || '';
    if (this.url && this.apiKey) {
      this.isEnabled = true;
    }
    this.endpoint = process.env.ZEP_API_URL || 'http://localhost:8000';
  }

  public async addMemoryToGraph(memoryId: string, text: string, metadata: any): Promise<void> {
    console.log('[ZepService] Add memory fact to graph:', memoryId);
    try {
      const response = await fetch(`${this.endpoint}/api/v1/sessions/${metadata.userId || 'default'}/memories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          facts: [text],
          metadata: {
            memoryId,
            ...metadata,
          },
        }),
      });

      if (!response.ok) {
        console.warn(`[ZepService] Zep server responded with status ${response.status}: ${await response.text()}`);
      }
    } catch (err) {
      console.warn('[ZepService] Failed to connect to Zep service:', err);
    }
  }

  public async queryGraph(userId: string, query: string, limit: number = 5): Promise<any[]> {
    console.log('[ZepService] Query graph for user:', userId, 'query:', query);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(`${this.endpoint}/api/v1/sessions/${userId || 'default'}/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: query,
          limit,
        }),
      });

      if (!response.ok) {
        throw new Error(`Zep responded with ${response.status}`);
      }

      const body = await response.json();
      return body.results || [];
    } catch (err) {
      console.warn('[ZepService] Failed to query Zep:', err);
      return [];
    }
  }

  public async getTemporalContext(userId: string, timeRange: { start: Date; end: Date }): Promise<any[]> {
    return [];
  }
}
export default ZepService;
