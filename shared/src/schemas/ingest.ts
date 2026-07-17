export const ingestBodySchema = {
  type: 'object',
  required: ['content', 'url', 'source', 'title', 'timestamp'],
  properties: {
    content: { type: 'string', minLength: 10 },
    url: { type: 'string', format: 'uri' },
    source: {
      type: 'string',
      enum: [
        'WEB',
        'SLACK',
        'NOTION',
        'GITHUB',
        'GOOGLE_DRIVE',
        'DOCUMENT',
        'SCREENSHOT',
        'AUDIO',
        'IMAGE',
        'NOTE',
        'CALENDAR',
        'EMAIL',
      ],
    },
    title: { type: 'string', minLength: 1 },
    timestamp: { type: 'string', format: 'date-time' },
    metadata: { type: 'object', additionalProperties: true },
    tags: { type: 'array', items: { type: 'string' } },
    folderId: { type: 'string' },
  },
  additionalProperties: false,
} as const;

export const ingestResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    memoryId: { type: 'string' },
    chunksCreated: { type: 'integer' },
    status: { type: 'string' },
  },
} as const;
