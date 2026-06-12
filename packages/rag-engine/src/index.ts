// Types
export {
  Document,
  DocumentChunk,
  VectorStoreConfig,
  VectorSearchResult,
  VectorStore,
  ChunkingStrategy,
  ChunkingConfig,
  EmbeddingModel,
  EmbeddingConfig,
  RAGConfig,
  RAGQuery,
  RAGResult,
  Citation,
  ContextWindow,
  ContextManager
} from './types';

export {
  DocumentSchema,
  DocumentChunkSchema,
  VectorStoreConfigSchema,
  VectorSearchResultSchema,
  ChunkingConfigSchema,
  EmbeddingConfigSchema,
  RAGConfigSchema,
  RAGQuerySchema,
  RAGResultSchema,
  ContextWindowSchema
} from './types';

// Chunking
export { DocumentChunker } from './chunking';

// Embedding
export {
  OpenAIEmbedding,
  MockEmbedding,
  cosineSimilarity,
  euclideanDistance,
  dotProduct
} from './embedding';

// Vector Store
export { InMemoryVectorStore } from './vector-store';

// Context Manager
export { SimpleContextManager } from './context-manager';

// Citation
export { CitationTracker } from './citation';

// RAG Engine
export { RAGEngine } from './rag-engine';
