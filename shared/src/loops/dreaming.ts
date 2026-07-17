export type DreamingMode = 'connection-discovery' | 'gap-analysis' | 'creative-synthesis';

export interface DreamingInput {
  userId: string;
  mode: DreamingMode;
  memorySubset?: string[];
  maxConnections?: number;
}

export interface DreamingOutput {
  discoveries: Array<{
    type: 'connection' | 'pattern' | 'insight';
    description: string;
    memoryIds: string[];
    noveltyScore: number;
  }>;
  newEdgesCreated: number;
  processingTimeMs: number;
}

export const DREAMING_CONFIG = {
  schedule: '0 3 * * *',
  maxMemoriesToProcess: 500,
  minNoveltyScore: 0.3,
  connectionModes: ['connection-discovery', 'gap-analysis', 'creative-synthesis'] as const,
  embeddingBatchSize: 50,
} as const;
