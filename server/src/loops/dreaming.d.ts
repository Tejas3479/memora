import { DreamingInput, DreamingOutput } from '@memora/shared';
import { QdrantService } from '../services/ai/qdrant.js';
export declare class DreamingLoop {
    private qdrantService;
    private ai;
    constructor(qdrantService: QdrantService);
    execute(input: DreamingInput): Promise<DreamingOutput>;
    discoverConnections(memories: any[], limit: number): Promise<Array<{
        memoryIds: string[];
        description: string;
        noveltyScore: number;
    }>>;
    analyzeGaps(memories: any[]): Promise<string[]>;
}
export default DreamingLoop;
//# sourceMappingURL=dreaming.d.ts.map