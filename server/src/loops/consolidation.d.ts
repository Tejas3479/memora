import { ConsolidationInput, ConsolidationOutput } from '@memora/shared';
import { QdrantService } from '../services/ai/qdrant.js';
export declare class ConsolidationLoop {
    private qdrantService;
    private ai;
    constructor(qdrantService: QdrantService);
    execute(input: ConsolidationInput): Promise<ConsolidationOutput>;
    findDuplicates(memories: any[]): Promise<string[][]>;
    createSummary(memories: any[]): Promise<string>;
}
export default ConsolidationLoop;
//# sourceMappingURL=consolidation.d.ts.map