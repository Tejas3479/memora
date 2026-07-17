import crypto from 'crypto';

function getEnv(key: string, defaultValue?: string): string {
  const val = process.env[key];
  if (val !== undefined) return val;
  if (defaultValue !== undefined) return defaultValue;
  throw new Error(`Environment variable ${key} is required but missing`);
}

// Generate fallback RSA keys for JWT token signing in development if they are not in the environment.
const devKeys = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

export const config = {
  server: {
    port: parseInt(process.env.PORT || '4000', 10),
    host: process.env.HOST || '0.0.0.0',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  database: {
    url: getEnv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/memora'),
  },
  redis: {
    url: getEnv('REDIS_URL', 'redis://localhost:6379'),
  },
  qdrant: {
    url: getEnv('QDRANT_URL', 'http://localhost:6333'),
    apiKey: process.env.QDRANT_API_KEY,
  },
  jwt: {
    privateKey: process.env.JWT_PRIVATE_KEY || devKeys.privateKey,
    publicKey: process.env.JWT_PUBLIC_KEY || devKeys.publicKey,
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },
  embedding: {
    mode: (process.env.EMBEDDING_MODE || 'local') as 'cloud' | 'local',
    voyageApiKey: process.env.VOYAGE_API_KEY || '',
    dimension: (process.env.EMBEDDING_MODE === 'local') ? 384 : 1024,
  },
  llm: {
    googleApiKey: process.env.GOOGLE_API_KEY || '',
    model: 'gemini-2.5-flash',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  encryption: {
    tokenKey: getEnv('TOKEN_ENCRYPTION_KEY', '0123456789abcdef0123456789abcdef'), // 32 chars hex
  },
  integrations: {
    slack: {
      clientId: process.env.SLACK_CLIENT_ID,
      clientSecret: process.env.SLACK_CLIENT_SECRET,
    },
    notion: {
      clientId: process.env.NOTION_CLIENT_ID,
      clientSecret: process.env.NOTION_CLIENT_SECRET,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
  },
};
export type Config = typeof config;
