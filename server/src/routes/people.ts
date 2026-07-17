import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../prisma.js';
import { PeopleService } from '../services/domain/people.js';

export default async function peopleRoutes(fastify: FastifyInstance) {
  fastify.get('/api/people', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { query = '' } = request.query as any;

    const people = new PeopleService(prisma);
    return people.searchPeople(userId, query);
  });

  fastify.post('/api/people', { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { name, email, company, role, notes } = request.body as any;

    const people = new PeopleService(prisma);
    return people.upsertPerson(userId, { name, email, company, role, notes });
  });

  fastify.get('/api/people/:id', { preHandler: authMiddleware }, async (request) => {
    const { id } = request.params as any;
    const people = new PeopleService(prisma);
    return people.getPersonWithMentions(id);
  });

  fastify.put('/api/people/:id', { preHandler: authMiddleware }, async (request) => {
    const { id } = request.params as any;
    const body = request.body as any;

    return prisma.person.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        company: body.company,
        role: body.role,
        notes: body.notes,
      },
    });
  });

  fastify.delete('/api/people/:id', { preHandler: authMiddleware }, async (request) => {
    const { id } = request.params as any;
    await prisma.person.delete({ where: { id } });
    return { success: true };
  });

  fastify.get('/api/people/:id/memories', { preHandler: authMiddleware }, async (request) => {
    const { id } = request.params as any;
    const mentions = await prisma.personMention.findMany({
      where: { personId: id },
      select: { memoryId: true },
    });
    return mentions.map((m: any) => m.memoryId);
  });
}
