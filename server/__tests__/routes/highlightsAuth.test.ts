import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import authRoutes from '../../src/routes/auth.js';
import highlightsRoutes from '../../src/routes/highlights.js';
import { prisma } from '../../src/prisma.js';
import bcrypt from 'bcrypt';

vi.mock('../../src/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    memory: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    highlight: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Auth & Highlights Extended Integration', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
    await app.register(cookie);
    await app.register(authRoutes);
    await app.register(highlightsRoutes);
  });

  it('should return refreshToken in JSON payload on login', async () => {
    const hash = await bcrypt.hash('Password123!', 10);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-test-123',
      email: 'ext@memora.ai',
      passwordHash: hash,
      name: 'Extension User',
      plan: 'FREE',
    } as any);

    const res = await app.inject({
      method: 'POST',
      url: 'http://localhost:4000/auth/login',
      payload: {
        email: 'ext@memora.ai',
        password: 'Password123!',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.user.email).toBe('ext@memora.ai');
  });

  it('should auto-resolve memoryId when saving highlight on known URL', async () => {
    vi.mocked(prisma.memory.findFirst).mockResolvedValue({
      id: 'mem-canonical-999',
    } as any);

    vi.mocked(prisma.highlight.create).mockImplementation(async (args: any) => ({
      id: 'hl-1',
      ...args.data,
    }));

    // Generate token
    const tokenRes = await app.inject({
      method: 'POST',
      url: 'http://localhost:4000/auth/login',
      payload: {
        email: 'ext@memora.ai',
        password: 'Password123!',
      },
    });
    const { accessToken } = JSON.parse(tokenRes.body);

    const res = await app.inject({
      method: 'POST',
      url: 'http://localhost:4000/api/highlights',
      headers: {
        Authorization: 'Bearer ' + accessToken,
      },
      payload: {
        url: 'https://news.ycombinator.com/item?id=123',
        text: 'Important discussion point',
        color: 'yellow',
      },
    });

    expect(res.statusCode).toBe(200);
    expect(prisma.highlight.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          memoryId: 'mem-canonical-999',
        }),
      }),
    );
  });
});
