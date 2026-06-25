/**
 * @aether/profiling - Zod Schemas
 * 
 * Validation schemas for all profiling data structures.
 */

import { z } from 'zod';

// ============================================================================
// CPU Profiling Schemas
// ============================================================================

export const StackFrameSchema = z.object({
  functionName: z.string().min(1).max(500),
  fileName: z.string().min(1).max(500),
  lineNumber: z.number().int().min(0),
  columnNumber: z.number().int().min(0).optional(),
});

export const CPUSampleSchema = z.object({
  timestamp: z.number(),
  stackTrace: z.array(StackFrameSchema),
  cpuTime: z.number().min(0),
});

export const FunctionStatsSchema = z.object({
  functionName: z.string().min(1).max(500),
  fileName: z.string().min(1).max(500),
  totalCpuTime: z.number().min(0),
  averageCpuTime: z.number().min(0),
  sampleCount: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
});

export const CPUSummarySchema = z.object({
  totalSamples: z.number().int().min(0),
  totalCpuTime: z.number().min(0),
  averageCpuTime: z.number().min(0),
  peakCpuTime: z.number().min(0),
  topFunctions: z.array(FunctionStatsSchema),
});

export const CPUProfileSchema = z.object({
  id: z.string().min(1).max(100),
  startTime: z.number(),
  endTime: z.number(),
  duration: z.number().min(0),
  samples: z.array(CPUSampleSchema),
  summary: CPUSummarySchema,
});

// ============================================================================
// Memory Profiling Schemas
// ============================================================================

export const MemorySampleSchema = z.object({
  timestamp: z.number(),
  heapUsed: z.number().min(0),
  heapTotal: z.number().min(0),
  external: z.number().min(0),
  arrayBuffers: z.number().min(0),
});

export const MemoryLeakSchema = z.object({
  objectName: z.string().min(1).max(500),
  retainedSize: z.number().min(0),
  instanceCount: z.number().int().min(0),
  growthRate: z.number(),
});

export const MemorySummarySchema = z.object({
  initialHeapUsed: z.number().min(0),
  peakHeapUsed: z.number().min(0),
  finalHeapUsed: z.number().min(0),
  averageHeapUsed: z.number().min(0),
  memoryGrowth: z.number(),
  memoryGrowthRate: z.number(),
  potentialLeaks: z.array(MemoryLeakSchema),
});

export const MemoryProfileSchema = z.object({
  id: z.string().min(1).max(100),
  startTime: z.number(),
  endTime: z.number(),
  duration: z.number().min(0),
  samples: z.array(MemorySampleSchema),
  summary: MemorySummarySchema,
});

// ============================================================================
// I/O Profiling Schemas
// ============================================================================

export const IOOperationTypeSchema = z.enum(['read', 'write', 'network', 'file', 'database']);

export const IOOperationSchema = z.object({
  id: z.string().min(1).max(100),
  type: IOOperationTypeSchema,
  startTime: z.number(),
  endTime: z.number(),
  duration: z.number().min(0),
  size: z.number().min(0),
  path: z.string().max(1000).optional(),
  url: z.string().url().optional(),
  method: z.string().max(10).optional(),
  status: z.number().int().optional(),
  success: z.boolean(),
});

export const IOTypeStatsSchema = z.object({
  count: z.number().int().min(0),
  totalBytes: z.number().min(0),
  totalTime: z.number().min(0),
  averageTime: z.number().min(0),
  failureRate: z.number().min(0).max(1),
});

export const IOSummarySchema = z.object({
  totalOperations: z.number().int().min(0),
  totalBytesRead: z.number().min(0),
  totalBytesWritten: z.number().min(0),
  totalTransferTime: z.number().min(0),
  averageOperationTime: z.number().min(0),
  slowestOperations: z.array(IOOperationSchema),
  operationsByType: z.record(IOOperationTypeSchema, IOTypeStatsSchema),
});

export const IOProfileSchema = z.object({
  id: z.string().min(1).max(100),
  startTime: z.number(),
  endTime: z.number(),
  duration: z.number().min(0),
  operations: z.array(IOOperationSchema),
  summary: IOSummarySchema,
});

// ============================================================================
// Hot Path Analysis Schemas
// ============================================================================

export const HotPathSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().min(1).max(100),
    functionName: z.string().min(1).max(500),
    fileName: z.string().min(1).max(500),
    totalTime: z.number().min(0),
    selfTime: z.number().min(0),
    callCount: z.number().int().min(0),
    percentage: z.number().min(0).max(100),
    children: z.array(HotPathSchema),
  })
);

export const OptimizationRecommendationSchema = z.object({
  type: z.enum(['cpu', 'memory', 'io', 'algorithm']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  functionName: z.string().min(1).max(500),
  fileName: z.string().min(1).max(500),
  description: z.string().min(1).max(1000),
  suggestedAction: z.string().min(1).max(1000),
  estimatedImpact: z.number().min(0).max(100),
});

export const HotPathAnalysisSchema = z.object({
  profileId: z.string().min(1).max(100),
  hotPaths: z.array(HotPathSchema),
  criticalPath: HotPathSchema,
  recommendations: z.array(OptimizationRecommendationSchema),
});

// ============================================================================
// Bottleneck Detection Schemas
// ============================================================================

export const BottleneckTypeSchema = z.enum(['cpu', 'memory', 'io', 'lock', 'network']);

export const BottleneckSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);

export const BottleneckMetricsSchema = z.object({
  cpuUsage: z.number().min(0).max(100).optional(),
  memoryUsage: z.number().min(0).max(100).optional(),
  ioWaitTime: z.number().min(0).optional(),
  latency: z.number().min(0).optional(),
  throughput: z.number().min(0).optional(),
  errorRate: z.number().min(0).max(1).optional(),
});

export const BottleneckSchema = z.object({
  id: z.string().min(1).max(100),
  type: BottleneckTypeSchema,
  severity: BottleneckSeveritySchema,
  location: z.string().min(1).max(500),
  description: z.string().min(1).max(1000),
  impact: z.number().min(0).max(100),
  metrics: BottleneckMetricsSchema,
  timestamp: z.number(),
});

export const BottleneckSummarySchema = z.object({
  totalBottlenecks: z.number().int().min(0),
  criticalCount: z.number().int().min(0),
  highCount: z.number().int().min(0),
  mediumCount: z.number().int().min(0),
  lowCount: z.number().int().min(0),
  overallHealth: z.enum(['excellent', 'good', 'fair', 'poor', 'critical']),
});

export const BottleneckReportSchema = z.object({
  id: z.string().min(1).max(100),
  startTime: z.number(),
  endTime: z.number(),
  duration: z.number().min(0),
  bottlenecks: z.array(BottleneckSchema),
  summary: BottleneckSummarySchema,
});

// ============================================================================
// Profiling Session Schemas
// ============================================================================

export const ProfilingConfigSchema = z.object({
  cpuProfiling: z.boolean(),
  memoryProfiling: z.boolean(),
  ioProfiling: z.boolean(),
  hotPathAnalysis: z.boolean(),
  bottleneckDetection: z.boolean(),
  sampleInterval: z.number().int().positive().optional(),
  maxSamples: z.number().int().positive().optional(),
});

export const ProfilingResultsSchema = z.object({
  cpuProfile: CPUProfileSchema.optional(),
  memoryProfile: MemoryProfileSchema.optional(),
  ioProfile: IOProfileSchema.optional(),
  hotPathAnalysis: HotPathAnalysisSchema.optional(),
  bottleneckReport: BottleneckReportSchema.optional(),
});

export const ProfilingSessionSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  startTime: z.number(),
  endTime: z.number().optional(),
  status: z.enum(['running', 'stopped', 'analyzed']),
  config: ProfilingConfigSchema,
  results: ProfilingResultsSchema.optional(),
});

// ============================================================================
// Parse Functions
// ============================================================================

export function parseCPUProfile(data: unknown): z.infer<typeof CPUProfileSchema> {
  return CPUProfileSchema.parse(data);
}

export function safeParseCPUProfile(data: unknown) {
  return CPUProfileSchema.safeParse(data);
}

export function parseMemoryProfile(data: unknown): z.infer<typeof MemoryProfileSchema> {
  return MemoryProfileSchema.parse(data);
}

export function safeParseMemoryProfile(data: unknown) {
  return MemoryProfileSchema.safeParse(data);
}

export function parseIOProfile(data: unknown): z.infer<typeof IOProfileSchema> {
  return IOProfileSchema.parse(data);
}

export function safeParseIOProfile(data: unknown) {
  return IOProfileSchema.safeParse(data);
}

export function parseHotPathAnalysis(data: unknown): z.infer<typeof HotPathAnalysisSchema> {
  return HotPathAnalysisSchema.parse(data);
}

export function safeParseHotPathAnalysis(data: unknown) {
  return HotPathAnalysisSchema.safeParse(data);
}

export function parseBottleneckReport(data: unknown): z.infer<typeof BottleneckReportSchema> {
  return BottleneckReportSchema.parse(data);
}

export function safeParseBottleneckReport(data: unknown) {
  return BottleneckReportSchema.safeParse(data);
}

export function parseProfilingSession(data: unknown): z.infer<typeof ProfilingSessionSchema> {
  return ProfilingSessionSchema.parse(data);
}

export function safeParseProfilingSession(data: unknown) {
  return ProfilingSessionSchema.safeParse(data);
}

export function parseProfilingConfig(data: unknown): z.infer<typeof ProfilingConfigSchema> {
  return ProfilingConfigSchema.parse(data);
}

export function safeParseProfilingConfig(data: unknown) {
  return ProfilingConfigSchema.safeParse(data);
}
