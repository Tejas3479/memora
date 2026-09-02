import { PrismaClient } from '@prisma/client';

export class FolderService {
  constructor(private prisma: PrismaClient) {}

  public async create(
    userId: string,
    data: { name: string; description?: string; parentId?: string; color?: string; icon?: string },
  ): Promise<any> {
    return this.prisma.folder.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        parentId: data.parentId,
        color: data.color,
        icon: data.icon,
      },
    });
  }

  public async update(folderId: string, userId: string, data: any): Promise<any> {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, userId },
    });
    if (!folder) throw new Error('Folder not found');

    return this.prisma.folder.update({
      where: { id: folderId },
      data: {
        name: data.name ?? folder.name,
        description: data.description ?? folder.description,
        parentId: data.parentId ?? folder.parentId,
        color: data.color ?? folder.color,
        icon: data.icon ?? folder.icon,
      },
    });
  }

  public async delete(folderId: string, userId: string): Promise<void> {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, userId },
    });
    if (!folder) throw new Error('Folder not found');

    await this.prisma.folder.delete({
      where: { id: folderId },
    });

    try {
      const { QdrantService } = await import('../ai/qdrant.js');
      const qdrant = new QdrantService();
      await qdrant.ensureCollection();
      await (qdrant as any).client.setPayload('memories', {
        payload: { folderId: null },
        filter: {
          must: [
            { key: 'folderId', match: { value: folderId } },
          ],
        },
      });
    } catch (err) {
      console.warn('[FolderService] Could not clear folderId in Qdrant on delete:', err);
    }
  }

  public async getTree(userId: string): Promise<any[]> {
    const all = await this.prisma.folder.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    const rootNodes = all.filter((f: any) => !f.parentId);
    const buildNode = (node: any): any => {
      const children = all.filter((f: any) => f.parentId === node.id);
      return {
        ...node,
        children: children.map((c: any) => buildNode(c)),
      };
    };

    return rootNodes.map((r: any) => buildNode(r));
  }

  public async addMemories(folderId: string, userId: string, memoryIds: string[]): Promise<number> {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, userId },
    });
    if (!folder) throw new Error('Folder not found');

    const res = await this.prisma.memory.updateMany({
      where: {
        id: { in: memoryIds },
        userId,
      },
      data: {
        folderId,
      },
    });

    try {
      const { QdrantService } = await import('../ai/qdrant.js');
      const qdrant = new QdrantService();
      await qdrant.ensureCollection();
      for (const memoryId of memoryIds) {
        await (qdrant as any).client.setPayload('memories', {
          payload: { folderId },
          filter: {
            must: [
              {
                key: 'memoryId',
                match: { value: memoryId },
              },
            ],
          },
        });
      }
    } catch (err) {
      console.warn('[FolderService] Could not sync folderId to Qdrant:', err);
    }

    return res.count;
  }

  public async getFolderMemories(folderId: string, userId: string): Promise<any[]> {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, userId },
    });
    if (!folder) throw new Error('Folder not found');

    return this.prisma.memory.findMany({
      where: {
        folderId,
        userId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
export default FolderService;
