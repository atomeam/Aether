import {
  VectorStore,
  VectorStoreConfig,
  DocumentChunk,
  VectorSearchResult,
  VectorStoreConfigSchema
} from './types';
import { cosineSimilarity, euclideanDistance, dotProduct } from './embedding';

export class InMemoryVectorStore implements VectorStore {
  private config: VectorStoreConfig;
  private documents: Map<string, DocumentChunk> = new Map();

  constructor(config: VectorStoreConfig) {
    VectorStoreConfigSchema.parse(config);
    this.config = config;
  }

  async addDocument(chunk: DocumentChunk): Promise<void> {
    if (!chunk.embedding) {
      throw new Error('Document chunk must have an embedding');
    }

    if (chunk.embedding.length !== this.config.dimension) {
      throw new Error(
        `Embedding dimension mismatch: expected ${this.config.dimension}, got ${chunk.embedding.length}`
      );
    }

    this.documents.set(chunk.id, chunk);
  }

  async addDocuments(chunks: DocumentChunk[]): Promise<void> {
    for (const chunk of chunks) {
      await this.addDocument(chunk);
    }
  }

  async search(query: number[], topK: number): Promise<VectorSearchResult[]> {
    if (query.length !== this.config.dimension) {
      throw new Error(
        `Query dimension mismatch: expected ${this.config.dimension}, got ${query.length}`
      );
    }

    const results: Array<{ id: string; score: number; document: DocumentChunk }> = [];

    for (const [id, document] of this.documents.entries()) {
      if (!document.embedding) continue;

      let score: number;
      switch (this.config.metric) {
        case 'cosine':
          score = cosineSimilarity(query, document.embedding);
          break;
        case 'euclidean':
          score = 1 / (1 + euclideanDistance(query, document.embedding));
          break;
        case 'dotproduct':
          score = dotProduct(query, document.embedding);
          break;
        default:
          score = cosineSimilarity(query, document.embedding);
      }

      results.push({ id, score, document });
    }

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);

    // Return top K
    return results.slice(0, topK);
  }

  async delete(id: string): Promise<void> {
    this.documents.delete(id);
  }

  async clear(): Promise<void> {
    this.documents.clear();
  }

  size(): number {
    return this.documents.size;
  }

  getDocument(id: string): DocumentChunk | undefined {
    return this.documents.get(id);
  }

  getAllDocuments(): DocumentChunk[] {
    return Array.from(this.documents.values());
  }
}
