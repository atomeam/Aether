import {
  RAGConfig,
  RAGQuery,
  RAGResult,
  Document,
  DocumentChunk,
  RAGConfigSchema,
  RAGQuerySchema,
  RAGResultSchema
} from './types';
import { DocumentChunker } from './chunking';
import { InMemoryVectorStore } from './vector-store';
import { SimpleContextManager } from './context-manager';
import { CitationTracker } from './citation';

export class RAGEngine {
  private config: RAGConfig;
  private chunker: DocumentChunker;
  private contextManager: SimpleContextManager;
  private citationTracker: CitationTracker;

  constructor(config: RAGConfig) {
    RAGConfigSchema.parse(config);
    this.config = config;

    this.chunker = new DocumentChunker(config.chunkingConfig);
    this.contextManager = new SimpleContextManager(
      config.maxContextLength || 4000,
      500,
      500
    );
    this.citationTracker = new CitationTracker();
  }

  async addDocument(document: Document): Promise<void> {
    // Chunk the document
    const chunks = this.chunker.chunk(document);

    // Generate embeddings for each chunk
    for (const chunk of chunks) {
      chunk.embedding = await this.config.embeddingModel.generate(chunk.content);
    }

    // Add to vector store
    await this.config.vectorStore.addDocuments(chunks);
  }

  async addDocuments(documents: Document[]): Promise<void> {
    for (const document of documents) {
      await this.addDocument(document);
    }
  }

  async query(query: RAGQuery): Promise<RAGResult> {
    RAGQuerySchema.parse(query);

    // Generate embedding for query
    const queryEmbedding = await this.config.embeddingModel.generate(query.query);

    // Search vector store
    const topK = query.topK || this.config.topK || 5;
    const searchResults = await this.config.vectorStore.search(queryEmbedding, topK);

    // Filter by minimum score
    const minScore = this.config.minScore || 0;
    const filteredResults = searchResults.filter((r) => r.score >= minScore);

    // Build context
    this.contextManager.reset();
    const sources: Array<{
      documentId: string;
      chunkId: string;
      content: string;
      score: number;
    }> = [];

    for (const result of filteredResults) {
      const added = this.contextManager.addContext(result.document.content);
      if (added) {
        sources.push({
          documentId: result.document.documentId,
          chunkId: result.document.id,
          content: result.document.content,
          score: result.score
        });
      }
    }

    // Track citations
    this.citationTracker.clear();
    const citations = this.citationTracker.addCitationsFromSearch(filteredResults);

    const result: RAGResult = {
      query: query.query,
      context: this.contextManager.getContext(),
      sources,
      citations
    };

    RAGResultSchema.parse(result);
    return result;
  }

  async deleteDocument(documentId: string): Promise<void> {
    const vectorStore = this.config.vectorStore as any;
    const allDocs = vectorStore.getAllDocuments();

    for (const doc of allDocs) {
      if (doc.documentId === documentId) {
        await vectorStore.delete(doc.id);
      }
    }
  }

  async clear(): Promise<void> {
    await this.config.vectorStore.clear();
    this.contextManager.reset();
    this.citationTracker.clear();
  }

  getContextManager(): SimpleContextManager {
    return this.contextManager;
  }

  getCitationTracker(): CitationTracker {
    return this.citationTracker;
  }

  getStats(): {
    documentCount: number;
    chunkCount: number;
    contextLength: number;
    contextRemaining: number;
  } {
    const vectorStore = this.config.vectorStore as any;
    const allDocs = vectorStore.getAllDocuments();

    const documentIds = new Set(allDocs.map((d: DocumentChunk) => d.documentId));

    return {
      documentCount: documentIds.size,
      chunkCount: allDocs.length,
      contextLength: this.contextManager.getCurrentLength(),
      contextRemaining: this.contextManager.getRemainingSpace()
    };
  }

  updateConfig(config: Partial<RAGConfig>): void {
    this.config = { ...this.config, ...config };
    RAGConfigSchema.parse(this.config);

    if (config.chunkingConfig) {
      this.chunker.updateConfig(config.chunkingConfig);
    }

    if (config.maxContextLength) {
      this.contextManager = new SimpleContextManager(
        config.maxContextLength,
        this.contextManager['window'].reservedForSystem,
        this.contextManager['window'].reservedForQuery
      );
    }
  }

  getConfig(): RAGConfig {
    return { ...this.config };
  }
}
