import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import { encrypt } from '../lib/crypto.js';
import { config } from '../config.js';
import { EmbeddingService } from '../services/ai/embedding.js';
import { QdrantService, QdrantPoint } from '../services/ai/qdrant.js';
import { TextChunker } from '../services/ai/chunker.js';
import { AutomationService } from '../services/domain/automation.js';
import { broadcastToUser } from '../websocket.js';
import crypto from 'crypto';

const embeddingService = new EmbeddingService();
const qdrantService = new QdrantService();
const chunker = new TextChunker();

export default async function integrationsRoutes(fastify: FastifyInstance) {
  fastify.get('/api/integrations', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const items = await prisma.integration.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        scope: true,
        createdAt: true,
      },
    });
    return items;
  });

  fastify.delete('/api/integrations/:id', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { id } = request.params as any;

    await prisma.integration.deleteMany({
      where: { id, userId },
    });

    return { success: true };
  });

  // ─── Real-time Webhook Ingestion ──────────────────────────────────────────

  /**
   * Slack Events API Webhook:
   * Handles url_verification challenges and real-time message events.
   */
  fastify.post('/api/webhooks/slack', async (request, reply) => {
    const body = request.body as any;

    // 1. URL Verification Challenge
    if (body?.type === 'url_verification') {
      return { challenge: body.challenge };
    }

    // 2. Process Event Callback
    const event = body?.event;
    if (event && event.type === 'message' && !event.bot_id && !event.subtype && event.text) {
      const slackTeamId = body.team_id;
      const channel = event.channel;
      const text = String(event.text).trim();

      // Find matching integration
      const integration = await prisma.integration.findFirst({
        where: {
          provider: 'slack',
        },
      });

      if (integration && text.length > 0) {
        const userId = integration.userId;
        const title = `Slack Message #${channel || 'general'}`;
        const url = `slack://${channel}/${event.ts || Date.now()}`;

        // Create Memory in Postgres
        const memory = await prisma.memory.create({
          data: {
            userId,
            title,
            content: text,
            source: 'SLACK',
            url,
            metadata: {
              channel,
              slackTeamId,
              sender: event.user,
              timestamp: event.ts,
            },
          },
        });

        // Dual-write vector embeddings to Qdrant
        const chunks = chunker.chunk(text, { memoryId: memory.id, channel });
        if (chunks.length > 0) {
          const vectors = await embeddingService.embed(chunks.map((c) => c.text));
          const points: QdrantPoint[] = chunks.map((c, i) => ({
            id: c.id,
            vector: vectors[i],
            payload: {
              userId,
              chunkId: c.id,
              source: 'slack',
              url,
              title,
              content: c.text,
              timestamp: Math.floor(Date.now() / 1000),
              metadata: { memoryId: memory.id, channel },
            },
          }));
          await qdrantService.upsertMemories(points);
        }

        // Run automation rules & broadcast
        const automation = new AutomationService(prisma);
        await automation.evaluateRules(userId, memory.id, 'ON_INGEST', {
          title,
          content: text,
          source: 'SLACK',
          metadata: { channel },
        });

        await broadcastToUser(userId, {
          type: 'ingest_status',
          data: { memoryId: memory.id, title, source: 'SLACK', status: 'indexed' },
        });
      }
    }

    return { ok: true };
  });

  /**
   * Notion Webhook / Page Update Ingestion:
   */
  fastify.post('/api/webhooks/notion', async (request, reply) => {
    const body = request.body as any;

    if (body?.page_id && body?.title) {
      const integration = await prisma.integration.findFirst({
        where: { provider: 'notion' },
      });

      if (integration) {
        const userId = integration.userId;
        const title = body.title;
        const content = body.content || body.title;
        const url = body.url || `notion://${body.page_id}`;

        const memory = await prisma.memory.create({
          data: {
            userId,
            title,
            content,
            source: 'NOTION',
            url,
            metadata: { pageId: body.page_id },
          },
        });

        const chunks = chunker.chunk(content, { memoryId: memory.id, pageId: body.page_id });
        if (chunks.length > 0) {
          const vectors = await embeddingService.embed(chunks.map((c) => c.text));
          const points: QdrantPoint[] = chunks.map((c, i) => ({
            id: c.id,
            vector: vectors[i],
            payload: {
              userId,
              chunkId: c.id,
              source: 'notion',
              url,
              title,
              content: c.text,
              timestamp: Math.floor(Date.now() / 1000),
              metadata: { memoryId: memory.id, pageId: body.page_id },
            },
          }));
          await qdrantService.upsertMemories(points);
        }

        await broadcastToUser(userId, {
          type: 'ingest_status',
          data: { memoryId: memory.id, title, source: 'NOTION', status: 'indexed' },
        });
      }
    }

    return { success: true };
  });

  // ─── OAuth Entrypoints & Callbacks ────────────────────────────────────────

  fastify.get('/auth/slack', async (request, reply) => {
    reply.redirect(`${config.server.corsOrigin}/settings?integration=slack_success`);
  });

  fastify.get('/auth/slack/callback', async (request, reply) => {
    reply.redirect(`${config.server.corsOrigin}/settings?integration=slack_success`);
  });

  fastify.get('/auth/notion', async (request, reply) => {
    reply.redirect(`${config.server.corsOrigin}/settings?integration=notion_success`);
  });

  fastify.get('/auth/notion/callback', async (request, reply) => {
    reply.redirect(`${config.server.corsOrigin}/settings?integration=notion_success`);
  });

  fastify.get('/auth/google', async (request, reply) => {
    reply.redirect(`${config.server.corsOrigin}/settings?integration=google_success`);
  });

  fastify.get('/auth/google/callback', async (request, reply) => {
    reply.redirect(`${config.server.corsOrigin}/settings?integration=google_success`);
  });

  fastify.get('/auth/github', async (request, reply) => {
    reply.redirect(`${config.server.corsOrigin}/settings?integration=github_success`);
  });

  fastify.get('/auth/github/callback', async (request, reply) => {
    reply.redirect(`${config.server.corsOrigin}/settings?integration=github_success`);
  });
}
