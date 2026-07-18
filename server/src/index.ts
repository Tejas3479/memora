import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import multipart from '@fastify/multipart';
import { Redis } from 'ioredis';
import { config } from './config.js';
import { errorHandler } from './lib/errors.js';
import { registerWebSocket } from './websocket.js';
import { QdrantService } from './services/ai/qdrant.js';
import { setupRecurringJobs } from './jobs/index.js';

const redisClient = new Redis(config.redis.url);

// Route Imports
import authRoutes from './routes/auth.js';
import ingestRoutes from './routes/ingest.js';
import searchRoutes from './routes/search.js';
import timelineRoutes from './routes/timeline.js';
import tabRoutes from './routes/tabs.js';
import transcribeRoutes from './routes/transcribe.js';
import settingsRoutes from './routes/settings.js';
import billingRoutes from './routes/billing.js';
import integrationsRoutes from './routes/integrations.js';
import proactiveRoutes from './routes/proactive.js';
import feedbackRoutes from './routes/feedback.js';
import exportRoutes from './routes/export.js';
import accountRoutes from './routes/account.js';
import commentsRoutes from './routes/comments.js';
import automationsRoutes from './routes/automations.js';
import graphRoutes from './routes/graph.js';
import peopleRoutes from './routes/people.js';
import foldersRoutes from './routes/folders.js';
import teamRoutes from './routes/team.js';
import browserRoutes from './routes/browser.js';
import sidebarRoutes from './routes/sidebar.js';
import summarizeRoutes from './routes/summarize.js';
import highlightsRoutes from './routes/highlights.js';

const app = Fastify({
  logger: process.env.NODE_ENV === 'development' ? {
    transport: {
      target: 'pino-pretty',
    },
  } : true,
});

// Register Plugins
await app.register(cors, {
  origin: config.server.corsOrigin,
  credentials: true,
});

await app.register(cookie);
await app.register(multipart);

await app.register(rateLimit, {
  global: true,
  max: 100,
  timeWindow: 15 * 60 * 1000,
  redis: redisClient,
});

await app.register(websocket);

// Register WebSockets
registerWebSocket(app);

// Error Handler
app.setErrorHandler(errorHandler);

// Health route
app.get('/health', async () => {
  return { status: 'OK', timestamp: new Date().toISOString() };
});

// Register API Routes
await app.register(authRoutes);
await app.register(ingestRoutes);
await app.register(searchRoutes);
await app.register(timelineRoutes);
await app.register(tabRoutes);
await app.register(settingsRoutes);
await app.register(billingRoutes);
await app.register(integrationsRoutes);
await app.register(proactiveRoutes);
await app.register(feedbackRoutes);
await app.register(transcribeRoutes);
await app.register(exportRoutes);
await app.register(accountRoutes);
await app.register(commentsRoutes);
await app.register(automationsRoutes);
await app.register(graphRoutes);
await app.register(peopleRoutes);
await app.register(foldersRoutes);
await app.register(teamRoutes);
await app.register(browserRoutes);
await app.register(sidebarRoutes);
await app.register(summarizeRoutes);
await app.register(highlightsRoutes);

// Bootstrap Lifecycle
const start = async () => {
  try {
    // 1. Ensure vector database collection is set up
    const qdrant = new QdrantService();
    await qdrant.ensureCollection();

    // 2. Setup background recurring task triggers
    await setupRecurringJobs();

    // 3. Bind port
    await app.listen({ port: config.server.port, host: config.server.host });
    console.log(`[Server] Memora API Backend successfully listening on port ${config.server.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

// Graceful Shut-Down handlers
const signals = ['SIGINT', 'SIGTERM'];
for (const signal of signals) {
  process.on(signal, async () => {
    app.log.info(`[Shutdown] Received ${signal}. Starting graceful shutdown...`);
    await app.close();
    await redisClient.quit();
    process.exit(0);
  });
}

if (process.env.NODE_ENV !== 'test') {
  start();
}

export default app;
export { app };
