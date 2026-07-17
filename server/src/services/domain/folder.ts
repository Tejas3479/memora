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
}
export default FolderService;
