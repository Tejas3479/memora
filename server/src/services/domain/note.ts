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

    const memoryId = crypto.randomUUID();
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

    // Chunk and embed the cleaned version of the content
    const chunks = this.chunker.chunk(enhanced.cleanedContent, {
      title,
      url: `memora://notes/${memoryId}`,
      source: 'note',
      timestamp,
      userId,
    });

    const textPieces = chunks.map((c) => c.text);
    const vectors = await this.embeddingService.embed(textPieces);

    const qPoints: QdrantPoint[] = chunks.map((chunk, i) => ({
      id: chunk.id,
      vector: vectors[i],
      payload: {
        userId,
        chunkId: chunk.id,
        source: 'note',
        url: chunk.metadata.url,
        title: chunk.metadata.title,
        content: chunk.text,
        timestamp,
        metadata: mergedMetadata,
      },
    }));

    await this.qdrantService.upsertMemories(qPoints);

    return {
      memoryId,
      enhanced,
    };
  }

  public async update(memoryId: string, userId: string, content: string): Promise<void> {
    // Fetch and re-index the note. In production, we'd delete old chunks first.
    // For MVP, we simply re-index
    await this.create(userId, content, 'Updated Note', { originalNoteId: memoryId });
  }

  public async getEnhanced(memoryId: string): Promise<EnhancedNote> {
    // Placeholder fetching from DB or metadata
    return {
      cleanedContent: 'Enhanced note content details',
      actionItems: [],
      keyDecisions: [],
      participants: [],
      topics: [],
      summary: 'Enhanced note representation summary.',
    };
  }
}
export default NoteService;
