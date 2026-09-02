import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import bcrypt from 'bcrypt';
import { NotFoundError, ValidationError, UnauthorizedError } from '../lib/errors.js';

export default async function accountRoutes(fastify: FastifyInstance) {
  fastify.get('/api/account', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: true,
      },
    });
    if (!user) throw new NotFoundError('User not found');
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      createdAt: user.createdAt,
      subscriptions: user.subscriptions,
    };
  });

  fastify.put('/api/account', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { name, email } = request.body as any;

    if (email) {
      const existing = await prisma.user.findFirst({
        where: { email, NOT: { id: userId } },
      });
      if (existing) {
        throw new ValidationError('Email is already taken by another account');
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name !== undefined ? name : undefined,
        email: email !== undefined ? email : undefined,
      },
    });

    return { id: updated.id, name: updated.name, email: updated.email };
  });

  fastify.put('/api/account/password', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { currentPassword, newPassword } = request.body as any;

    if (!currentPassword || !newPassword) {
      throw new ValidationError('Both current and new passwords are required');
    }
    if (newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters long');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) throw new UnauthorizedError('Invalid current password');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true };
  });

  fastify.delete('/api/account', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;

    // Clean up vector store points for user
    try {
      const { QdrantService } = await import('../services/ai/qdrant.js');
      const qdrant = new QdrantService();
      await qdrant.ensureCollection();
      await (qdrant as any).client.delete('memories', {
        filter: {
          must: [{ key: 'userId', match: { value: userId } }],
        },
      });
    } catch (cleanupErr) {
      console.warn('[Account] Qdrant vectors cleanup warning:', cleanupErr);
    }

    await prisma.user.delete({ where: { id: userId } });
    return { success: true };
  });
}
