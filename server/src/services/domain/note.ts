import { PrismaClient } from '@prisma/client';
import { QdrantService, QdrantPoint } from '../ai/qdrant.js';
import { EmbeddingService } from '../ai/embedding.js';
import { NoteEnhancer, EnhancedNote } from '../ai/noteEnhancer.js';
import { TextChunker } from '../ai/chunker.js';

export class NoteService {
  private chunker: TextChunker;

  constructor(
    private prisma: PrismaClient,
    private qdrantService: QdrantService,
    private embeddingService: EmbeddingService,
    private noteEnhancer: NoteEnhancer,
  ) {
    this.chunker = new TextChunker();
  }

  public async create(
    userId: string,
    content: string,
    title: string,
    metadata: Record<string, any> = {},
  ): Promise<{ memoryId: string; enhanced: EnhancedNote }> {
    // Enhance note
    const enhanced = await this.noteEnhancer.enhance(content, {
      meetingTitle: title,
    });

    const timestamp = Math.floor(Date.now() / 1000);

    const mergedMetadata = {
      ...metadata,
      enhanced: true,
      actionItems: enhanced.actionItems,
      keyDecisions: enhanced.keyDecisions,
      participants: enhanced.participants,
      topics: enhanced.topics,
      summary: enhanced.summary,
    };

    // 1. Dual-write to PostgreSQL canonical Memory table
    const noteUrl = `memora://notes/${crypto.randomUUID()}`;
    const memory = await this.prisma.memory.create({
      data: {
        userId,
        title,
        content: enhanced.cleanedContent,
        source: 'NOTE',
        url: noteUrl,
        metadata: mergedMetadata,
      },
    });
    const memoryId = memory.id;

    // 2. Chunk and embed the cleaned version of the content
    const chunks = this.chunker.chunk(enhanced.cleanedContent, {
      title,
      url: noteUrl,
      source: 'NOTE',
      timestamp,
      userId,
    });

    if (chunks.length > 0) {
      const textPieces = chunks.map((c) => c.text);
      const vectors = await this.embeddingService.embed(textPieces);

      const qPoints: QdrantPoint[] = chunks.map((chunk, i) => ({
        id: chunk.id,
        vector: vectors[i],
        payload: {
          userId,
          chunkId: chunk.id,
          memoryId,
          source: 'NOTE',
          url: chunk.metadata.url,
          title: chunk.metadata.title,
          content: chunk.text,
          timestamp,
          metadata: mergedMetadata,
        },
      }));

      await this.qdrantService.upsertMemories(qPoints);
    }

    return {
      memoryId,
      enhanced,
    };
  }

  public async update(memoryId: string, userId: string, content: string, title?: string): Promise<void> {
    const memory = await this.prisma.memory.findFirst({
      where: { id: memoryId, userId },
    });
    if (!memory) throw new Error('Note not found');

    const noteTitle = title || memory.title;
    const enhanced = await this.noteEnhancer.enhance(content, { meetingTitle: noteTitle });
    const mergedMetadata = {
      ...((memory.metadata as Record<string, any>) || {}),
      enhanced: true,
      actionItems: enhanced.actionItems,
      keyDecisions: enhanced.keyDecisions,
      participants: enhanced.participants,
      topics: enhanced.topics,
      summary: enhanced.summary,
    };

    await this.prisma.memory.update({
      where: { id: memoryId },
      data: {
        title: noteTitle,
        content: enhanced.cleanedContent,
        metadata: mergedMetadata,
      },
    });

    // Delete old chunks in Qdrant for this memoryId
    try {
      await this.qdrantService.ensureCollection();
      await (this.qdrantService as any).client.delete('memories', {
        filter: {
          must: [{ key: 'memoryId', match: { value: memoryId } }],
        },
      });
    } catch (e) {
      console.warn('[NoteService] Failed to delete old Qdrant chunks on note update:', e);
    }

    // Re-chunk and upsert
    const timestamp = Math.floor(Date.now() / 1000);
    const chunks = this.chunker.chunk(enhanced.cleanedContent, {
      title: noteTitle,
      url: memory.url,
      source: 'NOTE',
      timestamp,
      userId,
    });

    if (chunks.length > 0) {
      const textPieces = chunks.map((c) => c.text);
      const vectors = await this.embeddingService.embed(textPieces);

      const qPoints: QdrantPoint[] = chunks.map((chunk, i) => ({
        id: chunk.id,
        vector: vectors[i],
        payload: {
          userId,
          chunkId: chunk.id,
          memoryId,
          source: 'NOTE',
          url: chunk.metadata.url,
          title: chunk.metadata.title,
          content: chunk.text,
          timestamp,
          metadata: mergedMetadata,
        },
      }));

      await this.qdrantService.upsertMemories(qPoints);
    }
  }

  public async getEnhanced(memoryId: string, userId?: string): Promise<EnhancedNote> {
    const where: any = { id: memoryId };
    if (userId) where.userId = userId;

    const memory = await this.prisma.memory.findFirst({ where });
    if (!memory) {
      return {
        cleanedContent: '',
        actionItems: [],
        keyDecisions: [],
        participants: [],
        topics: [],
        summary: '',
      };
    }

    const meta = (memory.metadata as Record<string, any>) || {};
    return {
      cleanedContent: memory.content,
      actionItems: meta.actionItems || [],
      keyDecisions: meta.keyDecisions || [],
      participants: meta.participants || [],
      topics: meta.topics || [],
      summary: meta.summary || '',
    };
  }
}
export default NoteService;
