/**
 * @aether/profiling - TypeScript Types
 * 
 * Core type definitions for application profiling including
 * CPU, memory, I/O profiling, hot path analysis, and bottleneck detection.
 */

// ============================================================================
// CPU Profiling Types
// ============================================================================

export interface CPUProfile {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  samples: CPUSample[];
  summary: CPUSummary;
}

export interface CPUSample {
  timestamp: number;
  stackTrace: StackFrame[];
  cpuTime: number;
}

export interface StackFrame {
  functionName: string;
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
}

export interface CPUSummary {
  totalSamples: number;
  totalCpuTime: number;
  averageCpuTime: number;
  peakCpuTime: number;
  topFunctions: FunctionStats[];
}

export interface FunctionStats {
  functionName: string;
  fileName: string;
  totalCpuTime: number;
  averageCpuTime: number;
  sampleCount: number;
  percentage: number;
}

// ============================================================================
// Memory Profiling Types
// ============================================================================

export interface MemoryProfile {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  samples: MemorySample[];
  summary: MemorySummary;
}

export interface MemorySample {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
}

export interface MemorySummary {
  initialHeapUsed: number;
  peakHeapUsed: number;
  finalHeapUsed: number;
  averageHeapUsed: number;
  memoryGrowth: number;
  memoryGrowthRate: number;
  potentialLeaks: MemoryLeak[];
}

export interface MemoryLeak {
  objectName: string;
  retainedSize: number;
  instanceCount: number;
  growthRate: number;
}

// ============================================================================
// I/O Profiling Types
// ============================================================================

export interface IOProfile {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  operations: IOOperation[];
  summary: IOSummary;
}

export type IOOperationType = 'read' | 'write' | 'network' | 'file' | 'database';

export interface IOOperation {
  id: string;
  type: IOOperationType;
  startTime: number;
  endTime: number;
  duration: number;
  size: number;
  path?: string;
  url?: string;
  method?: string;
  status?: number;
  success: boolean;
}

export interface IOSummary {
  totalOperations: number;
  totalBytesRead: number;
  totalBytesWritten: number;
  totalTransferTime: number;
  averageOperationTime: number;
  slowestOperations: IOOperation[];
  operationsByType: Record<IOOperationType, IOTypeStats>;
}

export interface IOTypeStats {
  count: number;
  totalBytes: number;
  totalTime: number;
  averageTime: number;
  failureRate: number;
}

// ============================================================================
// Hot Path Analysis Types
// ============================================================================

export interface HotPath {
  id: string;
  functionName: string;
  fileName: string;
  totalTime: number;
  selfTime: number;
  callCount: number;
  percentage: number;
  children: HotPath[];
}

export interface HotPathAnalysis {
  profileId: string;
  hotPaths: HotPath[];
  criticalPath: HotPath;
  recommendations: OptimizationRecommendation[];
}

export interface OptimizationRecommendation {
  type: 'cpu' | 'memory' | 'io' | 'algorithm';
  priority: 'low' | 'medium' | 'high' | 'critical';
  functionName: string;
  fileName: string;
  description: string;
  suggestedAction: string;
  estimatedImpact: number;
}

// ============================================================================
// Bottleneck Detection Types
// ============================================================================

export interface Bottleneck {
  id: string;
  type: 'cpu' | 'memory' | 'io' | 'lock' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  impact: number;
  metrics: BottleneckMetrics;
  timestamp: number;
}

export interface BottleneckMetrics {
  cpuUsage?: number;
  memoryUsage?: number;
  ioWaitTime?: number;
  latency?: number;
  throughput?: number;
  errorRate?: number;
}

export interface BottleneckReport {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  bottlenecks: Bottleneck[];
  summary: BottleneckSummary;
}

export interface BottleneckSummary {
  totalBottlenecks: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

// ============================================================================
// Profiling Session Types
// ============================================================================

export interface ProfilingSession {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  status: 'running' | 'stopped' | 'analyzed';
  config: ProfilingConfig;
  results?: ProfilingResults;
}

export interface ProfilingConfig {
  cpuProfiling: boolean;
  memoryProfiling: boolean;
  ioProfiling: boolean;
  hotPathAnalysis: boolean;
  bottleneckDetection: boolean;
  sampleInterval?: number;
  maxSamples?: number;
}

export interface ProfilingResults {
  cpuProfile?: CPUProfile;
  memoryProfile?: MemoryProfile;
  ioProfile?: IOProfile;
  hotPathAnalysis?: HotPathAnalysis;
  bottleneckReport?: BottleneckReport;
}

// ============================================================================
// Profiler Interface
// ============================================================================

export interface Profiler {
  startSession(name: string, config: ProfilingConfig): ProfilingSession;
  stopSession(sessionId: string): ProfilingResults;
  getSession(sessionId: string): ProfilingSession | null;
  listSessions(): ProfilingSession[];
  deleteSession(sessionId: string): void;
}
