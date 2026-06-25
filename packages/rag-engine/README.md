# @aether/rag-engine

A production-ready Retrieval Augmented Generation (RAG) engine with vector database abstraction, document chunking, embedding generation, similarity search, context window management, and citation tracking.

## Features

- **Vector Database Abstraction**: Pluggable vector store interface with in-memory implementation
- **Document Chunking Strategies**: Fixed-size, semantic, recursive, and sentence-based chunking
- **Embedding Generation**: Support for OpenAI embeddings and mock embeddings for testing
- **Similarity Search**: Cosine similarity, Euclidean distance, and dot product metrics
- **Context Window Management**: Intelligent context management with reserved space
- **Citation Tracking**: Automatic citation generation and formatting
- **TypeScript Types**: Full TypeScript support with Zod schemas
- **Comprehensive Tests**: Full test coverage with Vitest

## Installation

```bash
npm install @aether/rag-engine
```

## Quick Start

```typescript
import { RAGEngine, InMemoryVectorStore, MockEmbedding, ChunkingStrategy } from '@aether/rag-engine';

// Initialize components
const vectorStore = new InMemoryVectorStore({ dimension: 1536 });
const embeddingModel = new MockEmbedding(1536);

// Create RAG engine
const rag = new RAGEngine({
  vectorStore,
  embeddingModel,
  chunkingConfig: {
    strategy: ChunkingStrategy.FIXED_SIZE,
    chunkSize: 500,
    chunkOverlap: 50
  },
  topK: 5,
  minScore: 0.5,
  maxContextLength: 4000
});

// Add documents
await rag.addDocument({
  id: 'doc1',
  content: 'Machine learning is a subset of artificial intelligence...',
  metadata: { source: 'wiki', category: 'ai' },
  createdAt: new Date(),
  updatedAt: new Date()
});

// Query
const result = await rag.query({
  query: 'What is machine learning?',
  topK: 3
});

console.log('Context:', result.context);
console.log('Sources:', result.sources);
console.log('Citations:', rag.getCitationTracker().formatCitations('markdown'));
```

## Document Chunking

### Fixed-Size Chunking

```typescript
import { DocumentChunker, ChunkingStrategy } from '@aether/rag-engine';

const chunker = new DocumentChunker({
  strategy: ChunkingStrategy.FIXED_SIZE,
  chunkSize: 1000,
  chunkOverlap: 200
});

const chunks = chunker.chunk(document);
```

### Semantic Chunking

```typescript
const chunker = new DocumentChunker({
  strategy: ChunkingStrategy.SEMANTIC,
  separator: '\n\n'
});
```

### Recursive Chunking

```typescript
const chunker = new DocumentChunker({
  strategy: ChunkingStrategy.RECURSIVE,
  chunkSize: 1000
});
```

### Sentence Chunking

```typescript
const chunker = new DocumentChunker({
  strategy: ChunkingStrategy.SENTENCE,
  chunkSize: 500
});
```

## Embedding Generation

### OpenAI Embeddings

```typescript
import { OpenAIEmbedding } from '@aether/rag-engine';

const embeddingModel = new OpenAIEmbedding({
  model: 'text-embedding-3-small',
  apiKey: process.env.OPENAI_API_KEY
});

const embedding = await embeddingModel.generate('Your text here');
```

### Mock Embeddings (for testing)

```typescript
import { MockEmbedding } from '@aether/rag-engine';

const embeddingModel = new MockEmbedding(1536);
const embedding = await embeddingModel.generate('Your text here');
```

### Batch Embeddings

```typescript
const embeddings = await embeddingModel.generateBatch([
  'Text 1',
  'Text 2',
  'Text 3'
]);
```

## Vector Similarity

```typescript
import { cosineSimilarity, euclideanDistance, dotProduct } from '@aether/rag-engine';

const similarity = cosineSimilarity(embedding1, embedding2);
const distance = euclideanDistance(embedding1, embedding2);
const dot = dotProduct(embedding1, embedding2);
```

## Context Management

```typescript
import { SimpleContextManager } from '@aether/rag-engine';

const contextManager = new SimpleContextManager(4000, 500, 500);

// Add context
const added = contextManager.addContext('Some context text');
console.log('Added:', added);
console.log('Remaining space:', contextManager.getRemainingSpace());

// Get context
const context = contextManager.getContext();

// Reset
contextManager.reset();
```

## Citation Tracking

```typescript
import { CitationTracker } from '@aether/rag-engine';

const tracker = new CitationTracker();

// Add citations
tracker.addCitation(chunk, 0.95);

// Format citations
const markdown = tracker.formatCitations('markdown');
const html = tracker.formatCitations('html');
const text = tracker.formatCitations('text');

// Get citations by document
const docCitations = tracker.getCitationsByDocument('doc1');
```

## Advanced Usage

### Custom Vector Store

```typescript
import { VectorStore, DocumentChunk, VectorSearchResult } from '@aether/rag-engine';

class CustomVectorStore implements VectorStore {
  async addDocument(chunk: DocumentChunk): Promise<void> {
    // Your implementation
  }

  async addDocuments(chunks: DocumentChunk[]): Promise<void> {
    // Your implementation
  }

  async search(query: number[], topK: number): Promise<VectorSearchResult[]> {
    // Your implementation
  }

  async delete(id: string): Promise<void> {
    // Your implementation
  }

  async clear(): Promise<void> {
    // Your implementation
  }
}

const customStore = new CustomVectorStore();
const rag = new RAGEngine({
  vectorStore: customStore,
  embeddingModel,
  chunkingConfig: { strategy: ChunkingStrategy.FIXED_SIZE }
});
```

### Filtering Results

```typescript
const result = await rag.query({
  query: 'machine learning',
  topK: 10,
  filters: { category: 'ai' }
});

// Filter results manually
const filtered = result.sources.filter(s => s.score > 0.8);
```

### Updating Configuration

```typescript
rag.updateConfig({
  topK: 10,
  minScore: 0.7,
  maxContextLength: 6000
});
```

## API Reference

### RAGEngine

#### Constructor

```typescript
constructor(config: RAGConfig)
```

#### Methods

- `addDocument(document: Document): Promise<void>` - Add a single document
- `addDocuments(documents: Document[]): Promise<void>` - Add multiple documents
- `query(query: RAGQuery): Promise<RAGResult>` - Query the RAG system
- `deleteDocument(documentId: string): Promise<void>` - Delete a document
- `clear(): Promise<void>` - Clear all data
- `getContextManager(): SimpleContextManager` - Get the context manager
- `getCitationTracker(): CitationTracker` - Get the citation tracker
- `getStats(): Stats` - Get system statistics
- `updateConfig(config: Partial<RAGConfig>): void` - Update configuration
- `getConfig(): RAGConfig` - Get current configuration

### DocumentChunker

#### Methods

- `chunk(document: Document): DocumentChunk[]` - Chunk a document
- `updateConfig(config: Partial<ChunkingConfig>): void` - Update chunking config
- `getConfig(): ChunkingConfig` - Get current config

### InMemoryVectorStore

#### Methods

- `addDocument(chunk: DocumentChunk): Promise<void>` - Add a document
- `addDocuments(chunks: DocumentChunk[]): Promise<void>` - Add multiple documents
- `search(query: number[], topK: number): Promise<VectorSearchResult[]>` - Search
- `delete(id: string): Promise<void>` - Delete a document
- `clear(): Promise<void>` - Clear all documents
- `size(): number` - Get document count
- `getDocument(id: string): DocumentChunk | undefined` - Get a document
- `getAllDocuments(): DocumentChunk[]` - Get all documents

### SimpleContextManager

#### Methods

- `addContext(text: string): boolean` - Add context
- `removeContext(id: string): void` - Remove context
- `getContext(): string` - Get current context
- `getRemainingSpace(): number` - Get remaining space
- `reset(): void` - Reset context
- `getCurrentLength(): number` - Get current length
- `getMaxLength(): number` - Get max length
- `setReservedForSystem(length: number): void` - Set reserved system space
- `setReservedForQuery(length: number): void` - Set reserved query space

### CitationTracker

#### Methods

- `addCitation(chunk: DocumentChunk, score: number): Citation` - Add a citation
- `addCitationsFromSearch(results: VectorSearchResult[]): Citation[]` - Add from search
- `getCitation(id: string): Citation | undefined` - Get a citation
- `getAllCitations(): Citation[]` - Get all citations
- `getCitationsByDocument(documentId: string): Citation[]` - Get by document
- `getCitationsByChunk(chunkId: string): Citation[]` - Get by chunk
- `formatCitations(format: 'markdown' | 'html' | 'text'): string` - Format citations
- `clear(): void` - Clear all citations

## Types

```typescript
interface Document {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

interface RAGConfig {
  vectorStore: VectorStore;
  embeddingModel: EmbeddingModel;
  chunkingConfig: ChunkingConfig;
  topK?: number;
  minScore?: number;
  maxContextLength?: number;
}

interface RAGResult {
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
```

## Testing

```bash
npm test
npm run test:coverage
npm run test:ui
```

## License

MIT
