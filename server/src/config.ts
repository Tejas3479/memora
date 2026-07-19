import crypto from 'crypto';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().optional().default('4000'),
  HOST: z.string().optional().default('0.0.0.0'),
  CORS_ORIGIN: z.string().optional().default('http://localhost:3000'),
  DATABASE_URL: z.string().optional().default('postgresql://postgres:password@localhost:5432/memora'),
  REDIS_URL: z.string().optional().default('redis://localhost:6379'),
  QDRANT_URL: z.string().optional().default('http://localhost:6333'),
  QDRANT_API_KEY: z.string().optional(),
  JWT_PRIVATE_KEY: z.string().optional(),
  JWT_PUBLIC_KEY: z.string().optional(),
  EMBEDDING_MODE: z.enum(['local', 'cloud']).optional().default('local'),
  VOYAGE_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  TOKEN_ENCRYPTION_KEY: z.string().optional().default('0123456789abcdef0123456789abcdef'),
  SLACK_CLIENT_ID: z.string().optional(),
  SLACK_CLIENT_SECRET: z.string().optional(),
  NOTION_CLIENT_ID: z.string().optional(),
  NOTION_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
});

let env: z.infer<typeof envSchema>;
try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment configuration validation failed:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

// Generate fallback RSA keys for JWT token signing in development if they are not in the environment.
const devKeys = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

export const config = {
  server: {
    port: parseInt(env.PORT, 10),
    host: env.HOST,
    corsOrigin: env.CORS_ORIGIN,
  },
  database: {
    url: env.DATABASE_URL,
  },
  redis: {
    url: env.REDIS_URL,
  },
  qdrant: {
    url: env.QDRANT_URL,
    apiKey: env.QDRANT_API_KEY,
  },
  jwt: {
    privateKey: env.JWT_PRIVATE_KEY || devKeys.privateKey,
    publicKey: env.JWT_PUBLIC_KEY || devKeys.publicKey,
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },
  embedding: {
    mode: env.EMBEDDING_MODE,
    voyageApiKey: env.VOYAGE_API_KEY || '',
    dimension: env.EMBEDDING_MODE === 'local' ? 384 : 1024,
  },
  llm: {
    googleApiKey: env.GOOGLE_API_KEY || '',
    model: 'gemini-2.5-flash',
  },
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY || '',
    webhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
  },
  encryption: {
    tokenKey: env.TOKEN_ENCRYPTION_KEY,
  },
  integrations: {
    slack: {
      clientId: env.SLACK_CLIENT_ID,
      clientSecret: env.SLACK_CLIENT_SECRET,
    },
    notion: {
      clientId: env.NOTION_CLIENT_ID,
      clientSecret: env.NOTION_CLIENT_SECRET,
    },
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
};
export type Config = typeof config;
