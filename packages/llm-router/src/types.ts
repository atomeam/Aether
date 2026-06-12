import { z } from 'zod';

// Provider types
export enum Provider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google'
}

export enum Model {
  // OpenAI models
  GPT_4 = 'gpt-4',
  GPT_4_TURBO = 'gpt-4-turbo',
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  // Anthropic models
  CLAUDE_3_OPUS = 'claude-3-opus',
  CLAUDE_3_SONNET = 'claude-3-sonnet',
  CLAUDE_3_HAIKU = 'claude-3-haiku',
  // Google models
  GEMINI_PRO = 'gemini-pro',
  GEMINI_ULTRA = 'gemini-ultra'
}

// Request/Response types
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  messages: Message[];
  model?: Model;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  model: Model;
  provider: Provider;
  tokensUsed: number;
  latency: number;
  cost: number;
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  maxRequestsPerMinute?: number;
  maxTokensPerMinute?: number;
  priority?: number;
}

export interface RoutingStrategy {
  type: 'cost' | 'latency' | 'quality' | 'round-robin' | 'weighted';
  weights?: Record<Provider, number>;
}

export interface CostMetrics {
  inputCostPer1k: number;
  outputCostPer1k: number;
}

export interface ProviderStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  totalCost: number;
  lastError?: string;
  lastErrorTime?: Date;
}

// Zod schemas
export const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string()
});

export const LLMRequestSchema = z.object({
  messages: z.array(MessageSchema),
  model: z.nativeEnum(Model).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  stream: z.boolean().optional()
});

export const LLMResponseSchema = z.object({
  content: z.string(),
  model: z.nativeEnum(Model),
  provider: z.nativeEnum(Provider),
  tokensUsed: z.number(),
  latency: z.number(),
  cost: z.number()
});

export const ProviderConfigSchema = z.object({
  apiKey: z.string(),
  baseUrl: z.string().optional(),
  maxRequestsPerMinute: z.number().positive().optional(),
  maxTokensPerMinute: z.number().positive().optional(),
  priority: z.number().min(0).max(100).optional()
});

export const RoutingStrategySchema = z.object({
  type: z.enum(['cost', 'latency', 'quality', 'round-robin', 'weighted']),
  weights: z.record(z.nativeEnum(Provider), z.number()).optional()
});

export const CostMetricsSchema = z.object({
  inputCostPer1k: z.number().nonnegative(),
  outputCostPer1k: z.number().nonnegative()
});

export const ProviderStatsSchema = z.object({
  totalRequests: z.number(),
  successfulRequests: z.number(),
  failedRequests: z.number(),
  averageLatency: z.number(),
  totalCost: z.number(),
  lastError: z.string().optional(),
  lastErrorTime: z.date().optional()
});
