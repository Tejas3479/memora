export const searchBodySchema = {
  type: 'object',
  required: ['query'],
  properties: {
    query: { type: 'string', minLength: 1 },
    filters: {
      type: 'object',
      properties: {
        source: { type: 'string' },
        dateFrom: { type: 'string', format: 'date-time' },
        dateTo: { type: 'string', format: 'date-time' },
        tags: { type: 'array', items: { type: 'string' } },
        folderId: { type: 'string' },
      },
    },
    limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
    offset: { type: 'integer', minimum: 0, default: 0 },
  },
} as const;

export const searchResponseSchema = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          content: { type: 'string' },
          title: { type: 'string' },
          url: { type: 'string' },
          source: { type: 'string' },
          timestamp: { type: 'string' },
          score: { type: 'number' },
          chunkId: { type: 'string' },
          metadata: { type: 'object' },
        },
      },
    },
    synthesizedAnswer: {
      type: 'object',
      properties: {
        answer: { type: 'string' },
        sources: { type: 'array' },
        confidence: { type: 'number' },
      },
    },
    total: { type: 'integer' },
    took: { type: 'number' },
  },
} as const;
