import { z } from 'zod';

// Prompt template types
export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  description?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptVariable {
  name: string;
  value: string;
  type?: 'string' | 'number' | 'boolean' | 'array';
}

export interface CompiledPrompt {
  text: string;
  variables: Record<string, string>;
  templateId: string;
}

// A/B testing types
export interface PromptVariant {
  id: string;
  templateId: string;
  name: string;
  prompt: string;
  weight: number;
  metrics: VariantMetrics;
}

export interface VariantMetrics {
  impressions: number;
  successes: number;
  failures: number;
  averageLatency: number;
  averageQuality: number;
  totalCost: number;
}

export interface ABTest {
  id: string;
  name: string;
  description?: string;
  variants: PromptVariant[];
  status: 'active' | 'paused' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  winner?: string;
}

export interface TestResult {
  variantId: string;
  success: boolean;
  latency: number;
  quality: number;
  cost: number;
  timestamp: Date;
}

// Few-shot examples
export interface FewShotExample {
  input: string;
  output: string;
  metadata?: Record<string, any>;
}

export interface FewShotConfig {
  examples: FewShotExample[];
  maxExamples?: number;
  selectionStrategy?: 'random' | 'similarity' | 'recent';
}

// Chain-of-thought
export interface ChainOfThoughtPrompt {
  basePrompt: string;
  reasoningSteps: string[];
  finalAnswerFormat?: string;
}

export interface CoTConfig {
  enableReasoning: boolean;
  maxSteps?: number;
  stepDelimiter?: string;
  showReasoning?: boolean;
}

// Performance metrics
export interface PerformanceMetrics {
  totalTests: number;
  successRate: number;
  averageLatency: number;
  averageQuality: number;
  totalCost: number;
  bestVariant?: string;
  worstVariant?: string;
}

// Zod schemas
export const PromptVariableSchema = z.object({
  name: z.string(),
  value: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'array']).optional()
});

export const PromptTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  template: z.string(),
  variables: z.array(z.string()),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const CompiledPromptSchema = z.object({
  text: z.string(),
  variables: z.record(z.string()),
  templateId: z.string()
});

export const VariantMetricsSchema = z.object({
  impressions: z.number(),
  successes: z.number(),
  failures: z.number(),
  averageLatency: z.number(),
  averageQuality: z.number(),
  totalCost: z.number()
});

export const PromptVariantSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  name: z.string(),
  prompt: z.string(),
  weight: z.number().min(0).max(1),
  metrics: VariantMetricsSchema
});

export const ABTestSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  variants: z.array(PromptVariantSchema),
  status: z.enum(['active', 'paused', 'completed']),
  createdAt: z.date(),
  updatedAt: z.date(),
  winner: z.string().optional()
});

export const TestResultSchema = z.object({
  variantId: z.string(),
  success: z.boolean(),
  latency: z.number(),
  quality: z.number().min(0).max(1),
  cost: z.number(),
  timestamp: z.date()
});

export const FewShotExampleSchema = z.object({
  input: z.string(),
  output: z.string(),
  metadata: z.record(z.any()).optional()
});

export const FewShotConfigSchema = z.object({
  examples: z.array(FewShotExampleSchema),
  maxExamples: z.number().positive().optional(),
  selectionStrategy: z.enum(['random', 'similarity', 'recent']).optional()
});

export const ChainOfThoughtPromptSchema = z.object({
  basePrompt: z.string(),
  reasoningSteps: z.array(z.string()),
  finalAnswerFormat: z.string().optional()
});

export const CoTConfigSchema = z.object({
  enableReasoning: z.boolean(),
  maxSteps: z.number().positive().optional(),
  stepDelimiter: z.string().optional(),
  showReasoning: z.boolean().optional()
});

export const PerformanceMetricsSchema = z.object({
  totalTests: z.number(),
  successRate: z.number().min(0).max(1),
  averageLatency: z.number(),
  averageQuality: z.number().min(0).max(1),
  totalCost: z.number(),
  bestVariant: z.string().optional(),
  worstVariant: z.string().optional()
});
