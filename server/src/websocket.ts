import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { Redis } from 'ioredis';
import { JwtPayload } from '@memora/shared';
import { WebSocket } from 'ws';

const userConnections = new Map<string, any[]>();
const redisSubscriber = new Redis(config.redis.url);
const redisPublisher = new Redis(config.redis.url);

export function registerWebSocket(fastify: FastifyInstance): void {
  // Listen to redis channel for pub/sub push events
  redisSubscriber.psubscribe('proactive:*', 'ingest:*', (err: any) => {
    if (err) console.error('[WS Redis PubSub] Subscription error:', err);
  });

  redisSubscriber.on('pmessage', (pattern: any, channel: any, message: any) => {
    const userId = channel.split(':')[1];
    const connections = userConnections.get(userId);
    if (connections && connections.length > 0) {
      for (const socket of connections) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(message);
        }
      }
    }
  });

  fastify.get('/ws', { websocket: true }, (connection: any, req: any) => {
    const url = new URL(req.url || '', 'http://localhost');
    const token = url.searchParams.get('token');

    if (!token) {
      connection.socket.close(4001, 'Unauthorized: Token is missing');
      return;
    }

    try {
      const decoded = jwt.verify(token, config.jwt.publicKey, {
        algorithms: ['RS256'],
      }) as JwtPayload;
      
      const userId = decoded.userId;
      
      const list = userConnections.get(userId) || [];
      list.push(connection.socket);
      userConnections.set(userId, list);

      fastify.log.info(`[WS] Connected user: ${userId}`);

      connection.socket.on('close', () => {
        const active = userConnections.get(userId) || [];
        const filtered = active.filter((s) => s !== connection.socket);
        if (filtered.length > 0) {
          userConnections.set(userId, filtered);
        } else {
          userConnections.delete(userId);
        }
        fastify.log.info(`[WS] Disconnected user: ${userId}`);
      });
    } catch (err) {
      connection.socket.close(4002, 'Unauthorized: Invalid token signature');
    }
  });
}

export async function broadcastToUser(userId: string, event: { type: string; data: any }): Promise<void> {
  const channel = `ingest:${userId}`;
  await redisPublisher.publish(channel, JSON.stringify(event));
}
