import { PrismaClient } from '@prisma/client';

export interface GraphNode {
  id: string;
  type: 'MEMORY' | 'FOLDER' | 'PERSON' | 'CONCEPT';
  label: string;
  properties?: Record<string, any>;
  createdAt?: Date;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  sourceId?: string; // backwards compatibility
  targetId?: string; // backwards compatibility
  type: 'IN_FOLDER' | 'MENTIONS' | 'PARENT_OF' | 'RELATES_TO';
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class GraphBuilderService {
  constructor(private prisma: PrismaClient) {}

  public async buildGraph(userId: string, query?: string): Promise<{ graph: GraphData; stats: { nodeCount: number; edgeCount: number } }> {
    const memoryWhere: any = { userId };
    const personWhere: any = { userId };
    const folderWhere: any = { userId };

    if (query && query.trim()) {
      const q = query.trim();
      memoryWhere.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
      ];
      personWhere.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { company: { contains: q, mode: 'insensitive' } },
      ];
      folderWhere.name = { contains: q, mode: 'insensitive' };
    }

    const [memories, folders, people] = await Promise.all([
      this.prisma.memory.findMany({
        where: memoryWhere,
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
          folder: true,
          mentions: {
            include: { person: true },
          },
        },
      }),
      this.prisma.folder.findMany({
        where: folderWhere,
        orderBy: { name: 'asc' },
      }),
      this.prisma.person.findMany({
        where: personWhere,
        orderBy: { name: 'asc' },
      }),
    ]);

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeIds = new Set<string>();

    // 1. Add Folder Nodes
    for (const folder of folders) {
      if (!nodeIds.has(folder.id)) {
        nodeIds.add(folder.id);
        nodes.push({
          id: folder.id,
          type: 'FOLDER',
          label: folder.name,
          properties: {
            color: folder.color,
            icon: folder.icon,
            parentId: folder.parentId,
          },
          createdAt: folder.createdAt,
        });
      }

      if (folder.parentId && folders.some((f) => f.id === folder.parentId)) {
        edges.push({
          id: `e-folder-${folder.id}-${folder.parentId}`,
          source: folder.id,
          target: folder.parentId,
          sourceId: folder.id,
          targetId: folder.parentId,
          type: 'PARENT_OF',
        });
      }
    }

    // 2. Add People Nodes
    for (const person of people) {
      if (!nodeIds.has(person.id)) {
        nodeIds.add(person.id);
        nodes.push({
          id: person.id,
          type: 'PERSON',
          label: person.name,
          properties: {
            role: person.role,
            company: person.company,
            email: person.email,
          },
          createdAt: person.firstSeen,
        });
      }
    }

    // 3. Add Memory Nodes & Relations
    for (const mem of memories) {
      if (!nodeIds.has(mem.id)) {
        nodeIds.add(mem.id);
        nodes.push({
          id: mem.id,
          type: 'MEMORY',
          label: mem.title || 'Untitled Memory',
          properties: {
            source: mem.source,
            url: mem.url,
            folderId: mem.folderId,
          },
          createdAt: mem.createdAt,
        });
      }

      // Memory to Folder Edge
      if (mem.folderId && nodeIds.has(mem.folderId)) {
        edges.push({
          id: `e-mem-folder-${mem.id}-${mem.folderId}`,
          source: mem.id,
          target: mem.folderId,
          sourceId: mem.id,
          targetId: mem.folderId,
          type: 'IN_FOLDER',
        });
      }

      // Memory to Mentioned Person Edges
      if (mem.mentions && Array.isArray(mem.mentions)) {
        for (const mention of mem.mentions) {
          if (nodeIds.has(mention.personId)) {
            edges.push({
              id: `e-mem-person-${mem.id}-${mention.personId}`,
              source: mem.id,
              target: mention.personId,
              sourceId: mem.id,
              targetId: mention.personId,
              type: 'MENTIONS',
            });
          }
        }
      }
    }

    return {
      graph: {
        nodes,
        edges,
      },
      stats: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
      },
    };
  }

  public async getNodeDetails(userId: string, nodeId: string): Promise<any> {
    // Check if it's a Memory
    const memory = await this.prisma.memory.findFirst({
      where: { id: nodeId, userId },
      include: {
        folder: true,
        mentions: { include: { person: true } },
        comments: { take: 5 },
        highlights: true,
      },
    });

    if (memory) {
      return {
        node: {
          id: memory.id,
          type: 'MEMORY',
          label: memory.title,
          properties: {
            source: memory.source,
            url: memory.url,
            createdAt: memory.createdAt,
            highlightsCount: memory.highlights.length,
            commentsCount: memory.comments.length,
          },
        },
        connections: [
          ...(memory.folder ? [{ id: memory.folder.id, type: 'FOLDER', label: memory.folder.name }] : []),
          ...memory.mentions.map((m) => ({ id: m.person.id, type: 'PERSON', label: m.person.name })),
        ],
      };
    }

    // Check if it's a Person
    const person = await this.prisma.person.findFirst({
      where: { id: nodeId, userId },
      include: {
        mentions: {
          include: { memory: { select: { id: true, title: true, source: true } } },
          take: 10,
        },
      },
    });

    if (person) {
      return {
        node: {
          id: person.id,
          type: 'PERSON',
          label: person.name,
          properties: {
            role: person.role,
            company: person.company,
            email: person.email,
            memoryCount: person.memoryCount,
          },
        },
        connections: person.mentions
          .filter((m) => m.memory)
          .map((m) => ({ id: m.memory.id, type: 'MEMORY', label: m.memory.title })),
      };
    }

    // Check if it's a Folder
    const folder = await this.prisma.folder.findFirst({
      where: { id: nodeId, userId },
      include: {
        memories: { select: { id: true, title: true }, take: 10 },
      },
    });

    if (folder) {
      return {
        node: {
          id: folder.id,
          type: 'FOLDER',
          label: folder.name,
          properties: {
            color: folder.color,
            icon: folder.icon,
          },
        },
        connections: folder.memories.map((m) => ({ id: m.id, type: 'MEMORY', label: m.title })),
      };
    }

    return {
      node: { id: nodeId, type: 'CONCEPT', label: 'Node details', properties: {} },
      connections: [],
    };
  }
}
