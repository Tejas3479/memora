import { PrismaClient } from '@prisma/client';
import { Person, PersonCreateRequest, PersonWithMentions } from '@memora/shared';

export class PeopleService {
  constructor(private prisma: PrismaClient) {}

  public extractMentions(content: string): string[] {
    const mentions: string[] = [];
    
    // Extract emails: test@example.com
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = content.match(emailRegex) || [];
    mentions.push(...emails);

    // Extract slack style mentions: @Username or @Name
    const userRegex = /@\w+/g;
    const users = content.match(userRegex) || [];
    mentions.push(...users.map((u) => u.slice(1)));

    return Array.from(new Set(mentions));
  }

  public async upsertPerson(userId: string, data: PersonCreateRequest): Promise<any> {
    const existing = await this.prisma.person.findFirst({
      where: {
        userId,
        name: data.name,
      },
    });

    if (existing) {
      return this.prisma.person.update({
        where: { id: existing.id },
        data: {
          email: data.email ?? existing.email,
          company: data.company ?? existing.company,
          role: data.role ?? existing.role,
          notes: data.notes ?? existing.notes,
          lastSeen: new Date(),
        },
      });
    }

    return this.prisma.person.create({
      data: {
        userId,
        name: data.name,
        email: data.email,
        company: data.company,
        role: data.role,
        notes: data.notes,
        firstSeen: new Date(),
        lastSeen: new Date(),
      },
    });
  }

  public async linkMemory(personId: string, memoryId: string, context?: string): Promise<void> {
    await this.prisma.personMention.create({
      data: {
        personId,
        memoryId,
        context,
      },
    });

    // Increment memory count for the person
    await this.prisma.person.update({
      where: { id: personId },
      data: {
        memoryCount: { increment: 1 },
        lastSeen: new Date(),
      },
    });
  }

  public async getPersonWithMentions(personId: string): Promise<any> {
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
      include: {
        mentions: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });
    return person;
  }

  public async searchPeople(userId: string, query: string): Promise<any[]> {
    return this.prisma.person.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    });
  }
}
export default PeopleService;
