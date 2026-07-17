import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../../config.js';
import { QDRANT_COLLECTION } from '@memora/shared';
export class QdrantService {
    client;
    constructor() {
        this.client = new QdrantClient({
            url: config.qdrant.url,
            apiKey: config.qdrant.apiKey,
        });
    }
    async ensureCollection() {
        try {
            const collections = await this.client.getCollections();
            const exists = collections.collections.some((c) => c.name === QDRANT_COLLECTION);
            if (!exists) {
                await this.client.createCollection(QDRANT_COLLECTION, {
                    vectors: {
                        size: config.embedding.dimension,
                        distance: 'Cosine',
                    },
                    hnsw_config: {
                        m: 16,
                        ef_construct: 200,
                    },
                    quantization_config: {
                        scalar: {
                            type: 'int8',
                            quantile: 0.99,
                            always_ram: true,
                        },
                    },
                });
                // Setup indexes
                await this.client.createPayloadIndex(QDRANT_COLLECTION, {
                    field_name: 'userId',
                    field_schema: 'keyword',
                });
                await this.client.createPayloadIndex(QDRANT_COLLECTION, {
                    field_name: 'source',
                    field_schema: 'keyword',
                });
                await this.client.createPayloadIndex(QDRANT_COLLECTION, {
                    field_name: 'timestamp',
                    field_schema: 'integer',
                });
                await this.client.createPayloadIndex(QDRANT_COLLECTION, {
                    field_name: 'folderId',
                    field_schema: 'keyword',
                });
            }
        }
        catch (err) {
            console.error('[QdrantService] ensureCollection failed:', err);
        }
    }
    async upsertMemories(points) {
        await this.client.upsert(QDRANT_COLLECTION, {
            wait: true,
            points: points.map((p) => ({
                id: p.id,
                vector: p.vector,
                payload: p.payload,
            })),
        });
    }
    async hybridSearch(params) {
        const filterConditions = [
            {
                key: 'userId',
                match: { value: params.userId },
            },
        ];
        if (params.filters) {
            if (params.filters.source) {
                filterConditions.push({
                    key: 'source',
                    match: { value: params.filters.source },
                });
            }
            if (params.filters.folderId) {
                filterConditions.push({
                    key: 'folderId',
                    match: { value: params.filters.folderId },
                });
            }
            if (params.filters.dateFrom || params.filters.dateTo) {
                const range = {};
                if (params.filters.dateFrom) {
                    range.gte = Math.floor(new Date(params.filters.dateFrom).getTime() / 1000);
                }
                if (params.filters.dateTo) {
                    range.lte = Math.floor(new Date(params.filters.dateTo).getTime() / 1000);
                }
                filterConditions.push({
                    key: 'timestamp',
                    range,
                });
            }
        }
        // Dense search parameters
        const response = await this.client.search(QDRANT_COLLECTION, {
            vector: params.vector,
            filter: {
                must: filterConditions,
            },
            limit: params.limit || 10,
            with_payload: true,
        });
        return response.map((point) => {
            const payload = point.payload;
            return {
                id: point.id,
                content: payload.content || '',
                title: payload.title || '',
                url: payload.url || '',
                source: payload.source || 'web',
                timestamp: payload.timestamp || 0,
                score: point.score,
                chunkId: payload.chunkId || '',
                metadata: payload.metadata || {},
            };
        });
    }
    async getTimeline(userId, limit, offset, source) {
        const filterConditions = [
            {
                key: 'userId',
                match: { value: userId },
            },
        ];
        if (source) {
            filterConditions.push({
                key: 'source',
                match: { value: source },
            });
        }
        const response = await this.client.scroll(QDRANT_COLLECTION, {
            filter: {
                must: filterConditions,
            },
            limit,
            offset,
            with_payload: true,
        });
        const results = response.points.map((point) => {
            const payload = point.payload;
            return {
                id: point.id,
                content: payload.content || '',
                title: payload.title || '',
                url: payload.url || '',
                source: payload.source || 'web',
                timestamp: payload.timestamp || 0,
                score: 1.0,
                chunkId: payload.chunkId || '',
                metadata: payload.metadata || {},
            };
        });
        return {
            results,
            total: results.length, // Scroll limit output
        };
    }
    async deleteMemory(userId, pointId) {
        await this.client.delete(QDRANT_COLLECTION, {
            filter: {
                must: [
                    { key: 'userId', match: { value: userId } },
                    { id: [pointId] },
                ],
            },
        });
    }
    async getMemory(pointId) {
        const res = await this.client.retrieve(QDRANT_COLLECTION, {
            ids: [pointId],
        });
        if (res.length === 0)
            return null;
        const point = res[0];
        const payload = point.payload;
        return {
            id: point.id,
            content: payload.content || '',
            title: payload.title || '',
            url: payload.url || '',
            source: payload.source || 'web',
            timestamp: payload.timestamp || 0,
            score: 1.0,
            chunkId: payload.chunkId || '',
            metadata: payload.metadata || {},
        };
    }
}
export default QdrantService;
//# sourceMappingURL=qdrant.js.map