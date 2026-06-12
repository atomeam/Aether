import { describe, it, expect, beforeEach } from 'vitest';
import { RAGEngine } from './rag-engine';
import { InMemoryVectorStore } from './vector-store';
import { MockEmbedding } from './embedding';
import { Document, ChunkingStrategy } from './types';

describe('RAGEngine', () => {
  let rag: RAGEngine;
  let vectorStore: InMemoryVectorStore;
  let embeddingModel: MockEmbedding;

  beforeEach(() => {
    vectorStore = new InMemoryVectorStore({ dimension: 1536 });
    embeddingModel = new MockEmbedding(1536);

    rag = new RAGEngine({
      vectorStore,
      embeddingModel,
      chunkingConfig: {
        strategy: ChunkingStrategy.FIXED_SIZE,
        chunkSize: 500,
        chunkOverlap: 50
      },
      topK: 3,
      minScore: 0.5,
      maxContextLength: 2000
    });
  });

  describe('constructor', () => {
    it('should initialize with config', () => {
      expect(rag).toBeDefined();
      const stats = rag.getStats();
      expect(stats.documentCount).toBe(0);
      expect(stats.chunkCount).toBe(0);
    });
  });

  describe('addDocument', () => {
    it('should add a document', async () => {
      const document: Document = {
        id: 'doc1',
        content: 'This is a test document with some content.',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await rag.addDocument(document);

      const stats = rag.getStats();
      expect(stats.documentCount).toBe(1);
      expect(stats.chunkCount).toBeGreaterThan(0);
    });

    it('should add multiple documents', async () => {
      const documents: Document[] = [
        {
          id: 'doc1',
          content: 'First document content.',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'doc2',
          content: 'Second document content.',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await rag.addDocuments(documents);

      const stats = rag.getStats();
      expect(stats.documentCount).toBe(2);
    });
  });

  describe('query', () => {
    it('should query the vector store', async () => {
      const document: Document = {
        id: 'doc1',
        content: 'This is a test document about machine learning.',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await rag.addDocument(document);

      const result = await rag.query({
        query: 'machine learning'
      });

      expect(result).toBeDefined();
      expect(result.query).toBe('machine learning');
      expect(result.context).toBeDefined();
      expect(result.sources).toBeDefined();
      expect(result.citations).toBeDefined();
    });

    it('should respect topK parameter', async () => {
      const document: Document = {
        id: 'doc1',
        content: 'Test content for querying.',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await rag.addDocument(document);

      const result = await rag.query({
        query: 'test',
        topK: 2
      });

      expect(result.sources.length).toBeLessThanOrEqual(2);
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document', async () => {
      const document: Document = {
        id: 'doc1',
        content: 'Test content.',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await rag.addDocument(document);
      expect(rag.getStats().documentCount).toBe(1);

      await rag.deleteDocument('doc1');
      expect(rag.getStats().documentCount).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all data', async () => {
      const document: Document = {
        id: 'doc1',
        content: 'Test content.',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await rag.addDocument(document);
      await rag.clear();

      const stats = rag.getStats();
      expect(stats.documentCount).toBe(0);
      expect(stats.chunkCount).toBe(0);
    });
  });

  describe('stats', () => {
    it('should return correct stats', async () => {
      const document: Document = {
        id: 'doc1',
        content: 'Test content for stats.',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await rag.addDocument(document);

      const stats = rag.getStats();
      expect(stats).toHaveProperty('documentCount');
      expect(stats).toHaveProperty('chunkCount');
      expect(stats).toHaveProperty('contextLength');
      expect(stats).toHaveProperty('contextRemaining');
    });
  });
});
