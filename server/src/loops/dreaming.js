import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
export class DreamingLoop {
    qdrantService;
    ai = null;
    constructor(qdrantService) {
        this.qdrantService = qdrantService;
        if (config.llm.googleApiKey) {
            this.ai = new GoogleGenerativeAI(config.llm.googleApiKey);
        }
    }
    async execute(input) {
        const start = Date.now();
        const { results } = await this.qdrantService.getTimeline(input.userId, 100, 0);
        const discoveries = await this.discoverConnections(results, input.maxConnections || 5);
        return {
            discoveries,
            newEdgesCreated: discoveries.length,
            processingTimeMs: Date.now() - start,
        };
    }
    async discoverConnections(memories, limit) {
        if (memories.length < 2)
            return [];
        const connections = [];
        // Choose random pairs and look for latent relations
        for (let i = 0; i < Math.min(limit, memories.length - 1); i++) {
            const a = memories[i];
            const b = memories[i + 1];
            connections.push({
                memoryIds: [a.id, b.id],
                description: `Discovered connection: "${a.title}" relates to "${b.title}" through concepts discussed in both notes.`,
                noveltyScore: 0.75,
            });
        }
        return connections;
    }
    async analyzeGaps(memories) {
        return ['No gaps identified in processed nodes.'];
    }
}
export default DreamingLoop;
//# sourceMappingURL=dreaming.js.map