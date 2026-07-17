import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../prisma.js';
import { ForbiddenError, UnauthorizedError } from '../lib/errors.js';

export function requireTeamRole(allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new UnauthorizedError('User authentication required');
    }

    const userId = request.user.userId;
    // Extract teamId from params or request body
    const { teamId } = (request.params as any) || (request.body as any) || {};

    if (!teamId) {
      throw new ForbiddenError('Team ID context is missing');
    }

    const member = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: { userId, teamId },
      },
    });

    if (!member) {
      throw new ForbiddenError('You are not a member of this team');
    }

    if (!allowedRoles.includes(member.role)) {
      throw new ForbiddenError('Insufficient team permissions');
    }
  };
}

export const teamAuthMiddleware = requireTeamRole(['owner', 'admin', 'member']);
