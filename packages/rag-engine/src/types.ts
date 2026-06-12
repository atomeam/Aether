import { z } from 'zod';

// Document types
export interface Document {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
  startIndex: number;
  endIndex: number;
}

// Vector database types
export interface VectorStoreConfig {
  dimension: number;
  metric?: 'cosine' | 'euclidean' | 'dotproduct';
}

export interface VectorSearchResult {
  id: string;
  score: number;
  document: DocumentChunk;
}

export interface VectorStore {
  addDocument(chunk: DocumentChunk): Promise<void>;
  addDocuments(chunks: DocumentChunk[]): Promise<void>;
  search(query: number[], topK: number): Promise<VectorSearchResult[]>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

// Chunking strategies
export enum ChunkingStrategy {
  FIXED_SIZE = 'fixed-size',
  SEMANTIC = 'semantic',
  RECURSIVE = 'recursive',
  SENTENCE = 'sentence'
}

export interface ChunkingConfig {
  strategy: ChunkingStrategy;
  chunkSize?: number;
  chunkOverlap?: number;
  separator?: string;
}

// Embedding types
export interface EmbeddingModel {
  name: string;
  dimension: number;
  generate(text: string): Promise<number[]>;
  generateBatch(texts: string[]): Promise<number[][]>;
}

export interface EmbeddingConfig {
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

// RAG types
export interface RAGConfig {
  vectorStore: VectorStore;
  embeddingModel: EmbeddingModel;
  chunkingConfig: ChunkingConfig;
  topK?: number;
  minScore?: number;
  maxContextLength?: number;
}

export interface RAGQuery {
  query: string;
  topK?: number;
  filters?: Record<string, any>;
}

export interface RAGResult {
  query: string;
  context: string;
  sources: Array<{
    documentId: string;
    chunkId: string;
    content: string;
    score: number;
  }>;
  citations: Citation[];
}

export interface Citation {
  id: string;
  documentId: string;
  chunkId: string;
  text: string;
  startIndex: number;
  endIndex: number;
  score: number;
}

// Context window management
export interface ContextWindow {
  maxLength: number;
  currentLength: number;
  reservedForSystem: number;
  reservedForQuery: number;
}

export interface ContextManager {
  addContext(text: string): boolean;
  removeContext(id: string): void;
  getContext(): string;
  getRemainingSpace(): number;
  reset(): void;
}

// Zod schemas
export const DocumentSchema = z.object({
  id: z.string(),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
  embedding: z.array(z.number()).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const DocumentChunkSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
  embedding: z.array(z.number()).optional(),
  startIndex: z.number(),
  endIndex: z.number()
});

export const VectorStoreConfigSchema = z.object({
  dimension: z.number().positive(),
  metric: z.enum(['cosine', 'euclidean', 'dotproduct']).optional()
});

export const VectorSearchResultSchema = z.object({
  id: z.string(),
  score: z.number().min(0).max(1),
  document: DocumentChunkSchema
});

export const ChunkingConfigSchema = z.object({
  strategy: z.nativeEnum(ChunkingStrategy),
  chunkSize: z.number().positive().optional(),
  chunkOverlap: z.number().min(0).optional(),
  separator: z.string().optional()
});

export const EmbeddingConfigSchema = z.object({
  model: z.string(),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional()
});

export const RAGConfigSchema = z.object({
  vectorStore: z.any(), // VectorStore interface
  embeddingModel: z.any(), // EmbeddingModel interface
  chunkingConfig: ChunkingConfigSchema,
  topK: z.number().positive().optional(),
  minScore: z.number().min(0).max(1).optional(),
  maxContextLength: z.number().positive().optional()
});

export const RAGQuerySchema = z.object({
  query: z.string(),
  topK: z.number().positive().optional(),
  filters: z.record(z.any()).optional()
});

export const RAGResultSchema = z.object({
  query: z.string(),
  context: z.string(),
  sources: z.array(
    z.object({
      documentId: z.string(),
      chunkId: z.string(),
      content: z.string(),
      score: z.number().min(0).max(1)
    })
  ),
  citations: z.array(
    z.object({
      id: z.string(),
      documentId: z.string(),
      chunkId: z.string(),
      text: z.string(),
      startIndex: z.number(),
      endIndex: z.number(),
      score: z.number().min(0).max(1)
    })
  )
});

export const ContextWindowSchema = z.object({
  maxLength: z.number().positive(),
  currentLength: z.number().min(0),
  reservedForSystem: z.number().min(0),
  reservedForQuery: z.number().min(0)
});
