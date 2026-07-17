import { SearchResult, HybridSearchParams } from '@memora/shared';
export interface QdrantPoint {
    id: string;
    vector: number[];
    payload: {
        userId: string;
        chunkId: string;
        source: string;
        url: string;
        title: string;
        content: string;
        timestamp: number;
        metadata: Record<string, any>;
        folderId?: string;
        teamId?: string;
    };
}
export declare class QdrantService {
    private client;
    constructor();
    ensureCollection(): Promise<void>;
    upsertMemories(points: QdrantPoint[]): Promise<void>;
    hybridSearch(params: HybridSearchParams): Promise<SearchResult[]>;
    getTimeline(userId: string, limit: number, offset: number, source?: string): Promise<{
        results: SearchResult[];
        total: number;
    }>;
    deleteMemory(userId: string, pointId: string): Promise<void>;
    getMemory(pointId: string): Promise<SearchResult | null>;
}
export default QdrantService;
//# sourceMappingURL=qdrant.d.ts.map