import { CHUNK_CONFIG } from '@memora/shared';
import crypto from 'crypto';

export interface ChunkResult {
  id: string;
  text: string;
  metadata: Record<string, any>;
  index: number;
}

export class TextChunker {
  private chunkSize: number;
  private chunkOverlap: number;
  private separators: string[];

  constructor(
    opts?: { chunkSize?: number; chunkOverlap?: number; separators?: string[] }
  ) {
    this.chunkSize = opts?.chunkSize ?? CHUNK_CONFIG.chunkSize;
    this.chunkOverlap = opts?.chunkOverlap ?? CHUNK_CONFIG.chunkOverlap;
    this.separators = opts?.separators ?? (CHUNK_CONFIG.separators as unknown as string[]);
  }

  public chunk(text: string, metadata: Record<string, any>): ChunkResult[] {
    if (!text || text.trim() === '') {
      throw new Error('Cannot chunk empty text');
    }

    const rawChunks = this.splitText(text, this.separators);
    const results: ChunkResult[] = [];
    
    let currentChunk: string[] = [];
    let currentLength = 0;
    let index = 0;

    for (const part of rawChunks) {
      const partLen = part.length;
      if (currentLength + partLen > this.chunkSize) {
        if (currentChunk.length > 0) {
          results.push({
            id: crypto.randomUUID(),
            text: currentChunk.join(''),
            metadata: { ...metadata },
            index: index++,
          });
          
          // Apply overlap
          const overlapCount = this.getOverlapCount(currentChunk);
          currentChunk = currentChunk.slice(currentChunk.length - overlapCount);
          currentLength = currentChunk.join('').length;
        }
      }
      currentChunk.push(part);
      currentLength += partLen;
    }

    if (currentChunk.length > 0) {
      results.push({
        id: crypto.randomUUID(),
        text: currentChunk.join(''),
        metadata: { ...metadata },
        index: index++,
      });
    }

    return results;
  }

  private splitText(text: string, separators: string[]): string[] {
    const finalChunks: string[] = [];
    let currentPieces = [text];
    
    for (const separator of separators) {
      const nextPieces: string[] = [];
      for (const piece of currentPieces) {
        if (piece.length <= this.chunkSize) {
          nextPieces.push(piece);
          continue;
        }
        
        const split = piece.split(separator);
        for (let i = 0; i < split.length; i++) {
          let s = split[i];
          if (i < split.length - 1) {
            s += separator;
          }
          if (s) nextPieces.push(s);
        }
      }
      currentPieces = nextPieces;
    }
    
    return currentPieces;
  }

  private getOverlapCount(chunks: string[]): number {
    let size = 0;
    let count = 0;
    for (let i = chunks.length - 1; i >= 0; i--) {
      size += chunks[i].length;
      if (size > this.chunkOverlap) {
        break;
      }
      count++;
    }
    return Math.max(1, count);
  }
}
