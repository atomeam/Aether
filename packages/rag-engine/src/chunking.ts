import {
  Document,
  DocumentChunk,
  ChunkingStrategy,
  ChunkingConfig,
  ChunkingConfigSchema
} from './types';

export class DocumentChunker {
  private config: ChunkingConfig;

  constructor(config: ChunkingConfig) {
    ChunkingConfigSchema.parse(config);
    this.config = config;
  }

  chunk(document: Document): DocumentChunk[] {
    switch (this.config.strategy) {
      case ChunkingStrategy.FIXED_SIZE:
        return this.fixedSizeChunk(document);
      case ChunkingStrategy.SEMANTIC:
        return this.semanticChunk(document);
      case ChunkingStrategy.RECURSIVE:
        return this.recursiveChunk(document);
      case ChunkingStrategy.SENTENCE:
        return this.sentenceChunk(document);
      default:
        throw new Error(`Unknown chunking strategy: ${this.config.strategy}`);
    }
  }

  private fixedSizeChunk(document: Document): DocumentChunk[] {
    const chunkSize = this.config.chunkSize || 1000;
    const overlap = this.config.chunkOverlap || 200;
    const chunks: DocumentChunk[] = [];
    const content = document.content;

    for (let i = 0; i < content.length; i += chunkSize - overlap) {
      const endIndex = Math.min(i + chunkSize, content.length);
      const chunkContent = content.slice(i, endIndex);

      chunks.push({
        id: this.generateChunkId(document.id, chunks.length),
        documentId: document.id,
        content: chunkContent,
        metadata: document.metadata,
        startIndex: i,
        endIndex
      });

      if (endIndex >= content.length) break;
    }

    return chunks;
  }

  private semanticChunk(document: Document): DocumentChunk[] {
    // Simplified semantic chunking based on paragraph boundaries
    const separator = this.config.separator || '\n\n';
    const paragraphs = document.content.split(separator);
    const chunks: DocumentChunk[] = [];
    let currentIndex = 0;

    for (const paragraph of paragraphs) {
      if (paragraph.trim().length === 0) continue;

      chunks.push({
        id: this.generateChunkId(document.id, chunks.length),
        documentId: document.id,
        content: paragraph.trim(),
        metadata: document.metadata,
        startIndex: currentIndex,
        endIndex: currentIndex + paragraph.length
      });

      currentIndex += paragraph.length + separator.length;
    }

    return chunks;
  }

  private recursiveChunk(document: Document): DocumentChunk[] {
    // Recursive chunking tries different separators in order
    const separators = ['\n\n', '\n', '. ', ' ', ''];
    const chunkSize = this.config.chunkSize || 1000;

    for (const separator of separators) {
      const chunks = this.chunkBySeparator(document.content, separator, chunkSize);
      if (chunks.length > 1 || separator === '') {
        return chunks.map((chunk, index) => ({
          id: this.generateChunkId(document.id, index),
          documentId: document.id,
          content: chunk,
          metadata: document.metadata,
          startIndex: 0,
          endIndex: chunk.length
        }));
      }
    }

    return [];
  }

  private chunkBySeparator(
    content: string,
    separator: string,
    chunkSize: number
  ): string[] {
    if (separator === '') {
      // Fallback to fixed-size
      const chunks: string[] = [];
      for (let i = 0; i < content.length; i += chunkSize) {
        chunks.push(content.slice(i, i + chunkSize));
      }
      return chunks;
    }

    const parts = content.split(separator);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const part of parts) {
      if ((currentChunk + part).length <= chunkSize) {
        currentChunk += (currentChunk ? separator : '') + part;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = part;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  private sentenceChunk(document: Document): DocumentChunk[] {
    // Simple sentence-based chunking
    const sentences = document.content.match(/[^.!?]+[.!?]+/g) || [document.content];
    const chunkSize = this.config.chunkSize || 500;
    const chunks: DocumentChunk[] = [];
    let currentChunk = '';
    let currentIndex = 0;

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= chunkSize) {
        currentChunk += sentence;
      } else {
        if (currentChunk) {
          chunks.push({
            id: this.generateChunkId(document.id, chunks.length),
            documentId: document.id,
            content: currentChunk.trim(),
            metadata: document.metadata,
            startIndex: currentIndex,
            endIndex: currentIndex + currentChunk.length
          });
          currentIndex += currentChunk.length;
        }
        currentChunk = sentence;
      }
    }

    if (currentChunk) {
      chunks.push({
        id: this.generateChunkId(document.id, chunks.length),
        documentId: document.id,
        content: currentChunk.trim(),
        metadata: document.metadata,
        startIndex: currentIndex,
        endIndex: currentIndex + currentChunk.length
      });
    }

    return chunks;
  }

  private generateChunkId(documentId: string, index: number): string {
    return `${documentId}_chunk_${index}`;
  }

  updateConfig(config: Partial<ChunkingConfig>): void {
    this.config = { ...this.config, ...config };
    ChunkingConfigSchema.parse(this.config);
  }

  getConfig(): ChunkingConfig {
    return { ...this.config };
  }
}
