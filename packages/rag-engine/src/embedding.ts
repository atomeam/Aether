import { EmbeddingModel, EmbeddingConfig, EmbeddingConfigSchema } from './types';

export class OpenAIEmbedding implements EmbeddingModel {
  private config: EmbeddingConfig;
  public readonly name: string;
  public readonly dimension: number;

  constructor(config: EmbeddingConfig) {
    EmbeddingConfigSchema.parse(config);
    this.config = config;
    this.name = config.model;
    this.dimension = this.getDimension(config.model);
  }

  async generate(text: string): Promise<number[]> {
    const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1';

    const response = await fetch(`${baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        input: text
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  async generateBatch(texts: string[]): Promise<number[][]> {
    const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1';

    const response = await fetch(`${baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        input: texts
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.map((item: any) => item.embedding);
  }

  private getDimension(model: string): number {
    const dimensions: Record<string, number> = {
      'text-embedding-ada-002': 1536,
      'text-embedding-3-small': 1536,
      'text-embedding-3-large': 3072
    };
    return dimensions[model] || 1536;
  }
}

export class MockEmbedding implements EmbeddingModel {
  public readonly name: string;
  public readonly dimension: number;

  constructor(dimension: number = 1536) {
    this.name = 'mock-embedding';
    this.dimension = dimension;
  }

  async generate(text: string): Promise<number[]> {
    // Generate a deterministic mock embedding based on text hash
    const hash = this.hashString(text);
    const embedding = new Array(this.dimension).fill(0);

    for (let i = 0; i < this.dimension; i++) {
      embedding[i] = ((hash * (i + 1)) % 1000) / 1000;
    }

    return embedding;
  }

  async generateBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((text) => this.generate(text)));
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

export function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }

  return sum;
}
