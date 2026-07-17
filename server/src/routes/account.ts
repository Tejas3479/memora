import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import bcrypt from 'bcrypt';

export default async function accountRoutes(fastify: FastifyInstance) {
  fastify.get('/api/account', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: true,
      },
    });
    if (!user) throw new Error('User not found');
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

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name, email },
    });

    return { id: updated.id, name: updated.name, email: updated.email };
  });

  fastify.put('/api/account/password', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { currentPassword, newPassword } = request.body as any;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) throw new Error('Invalid current password');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true };
  });

  fastify.delete('/api/account', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    await prisma.user.delete({ where: { id: userId } });
    return { success: true };
  });
}
