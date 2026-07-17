import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { teamAuthMiddleware, requireTeamRole } from '../middleware/teamAuth.js';
import { prisma } from '../prisma.js';
import { teamCreateSchema, teamInviteSchema } from '@memora/shared';

export default async function teamRoutes(fastify: FastifyInstance) {
  fastify.post('/api/teams', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const result = teamCreateSchema.safeParse(request.body);
    if (!result.success) {
      throw new Error(result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '));
    }
    const { name } = result.data;

    const team = await prisma.team.create({
      data: { name },
    });

    await prisma.teamMember.create({
      data: {
        userId,
        teamId: team.id,
        role: 'owner',
      },
    });

    return team;
  });

  fastify.get('/api/teams', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    return prisma.teamMember.findMany({
      where: { userId },
      include: { team: true },
    });
  });

  fastify.get('/api/teams/:teamId', { preHandler: [authMiddleware, teamAuthMiddleware] }, async (request) => {
    const { teamId } = request.params as any;
    return prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  });

  fastify.post('/api/teams/:teamId/invite', { preHandler: [authMiddleware, requireTeamRole(['owner', 'admin'])] }, async (request, reply) => {
    const { teamId } = request.params as any;
    const result = teamInviteSchema.safeParse(request.body);
    if (!result.success) {
      throw new Error(result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '));
    }
    const { email, role = 'member' } = result.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.status(404).send({ error: 'Invited user not registered in Memora.' });
    }

    const member = await prisma.teamMember.create({
      data: {
        userId: user.id,
        teamId,
        role,
      },
    });

    return member;
  });

  fastify.delete('/api/teams/:teamId/members/:userId', { preHandler: [authMiddleware, requireTeamRole(['owner', 'admin'])] }, async (request) => {
    const { teamId, userId } = request.params as any;
    await prisma.teamMember.delete({
      where: {
        userId_teamId: { userId, teamId },
      },
    });
    return { success: true };
  });
}
