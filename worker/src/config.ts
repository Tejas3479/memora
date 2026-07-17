export const config = {
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/memora',
  },
  qdrant: {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    apiKey: process.env.QDRANT_API_KEY,
  },
  llm: {
    googleApiKey: process.env.GOOGLE_API_KEY || '',
    model: 'gemini-2.5-flash',
  },
  embedding: {
    dimension: process.env.EMBEDDING_MODE === 'local' ? 384 : 1024,
  },
};
export default config;
