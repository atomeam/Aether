/**
 * @aether/profiling - CPU Profiling
 * 
 * CPU profiling implementation for tracking function execution
 * times, call stacks, and identifying CPU-intensive operations.
 */

import type {
  CPUProfile,
  CPUSample,
  StackFrame,
  CPUSummary,
  FunctionStats,
} from './types';

// ============================================================================
// CPU Profiler
// ============================================================================

export class CPUProfiler {
  private samples: CPUSample[] = [];
  private startTime: number = 0;
  private isProfiling: boolean = false;
  private sampleInterval: number = 10; // milliseconds
  private maxSamples: number = 10000;
  private timer?: NodeJS.Timeout;

  constructor(sampleInterval: number = 10, maxSamples: number = 10000) {
    this.sampleInterval = sampleInterval;
    this.maxSamples = maxSamples;
  }

  start(): void {
    if (this.isProfiling) {
      return;
    }

    this.isProfiling = true;
    this.startTime = Date.now();
    this.samples = [];

    this.timer = setInterval(() => {
      this.collectSample();
    }, this.sampleInterval);
  }

  stop(): CPUProfile {
    if (!this.isProfiling) {
      throw new Error('Profiler is not running');
    }

    this.isProfiling = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    const endTime = Date.now();
    const duration = endTime - this.startTime;

    const profile: CPUProfile = {
      id: this.generateId(),
      startTime: this.startTime,
      endTime,
      duration,
      samples: this.samples,
      summary: this.calculateSummary(),
    };

    return profile;
  }

  private collectSample(): void {
    if (this.samples.length >= this.maxSamples) {
      return;
    }

    const sample: CPUSample = {
      timestamp: Date.now(),
      stackTrace: this.captureStackTrace(),
      cpuTime: this.estimateCpuTime(),
    };

    this.samples.push(sample);
  }

  private captureStackTrace(): StackFrame[] {
    const stack: StackFrame[] = [];
    const error = new Error();

    if (error.stack) {
      const lines = error.stack.split('\n').slice(2); // Skip Error and captureStackTrace

      for (const line of lines) {
        const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
        if (match) {
          stack.push({
            functionName: match[1],
            fileName: match[2],
            lineNumber: parseInt(match[3], 10),
            columnNumber: parseInt(match[4], 10),
          });
        }
      }
    }

    return stack;
  }

  private estimateCpuTime(): number {
    // Simplified CPU time estimation
    // In a real implementation, this would use process.cpuUsage()
    return this.sampleInterval;
  }

  private calculateSummary(): CPUSummary {
    if (this.samples.length === 0) {
      return {
        totalSamples: 0,
        totalCpuTime: 0,
        averageCpuTime: 0,
        peakCpuTime: 0,
        topFunctions: [],
      };
    }

    const totalSamples = this.samples.length;
    const totalCpuTime = this.samples.reduce((sum, sample) => sum + sample.cpuTime, 0);
    const averageCpuTime = totalCpuTime / totalSamples;
    const peakCpuTime = Math.max(...this.samples.map(s => s.cpuTime));

    const functionStats = this.calculateFunctionStats();
    const topFunctions = functionStats
      .sort((a, b) => b.totalCpuTime - a.totalCpuTime)
      .slice(0, 10);

    return {
      totalSamples,
      totalCpuTime,
      averageCpuTime,
      peakCpuTime,
      topFunctions,
    };
  }

  private calculateFunctionStats(): FunctionStats[] {
    const stats = new Map<string, FunctionStats>();

    for (const sample of this.samples) {
      for (const frame of sample.stackTrace) {
        const key = `${frame.functionName}:${frame.fileName}`;
        const existing = stats.get(key);

        if (existing) {
          existing.totalCpuTime += sample.cpuTime;
          existing.sampleCount += 1;
        } else {
          stats.set(key, {
            functionName: frame.functionName,
            fileName: frame.fileName,
            totalCpuTime: sample.cpuTime,
            averageCpuTime: sample.cpuTime,
            sampleCount: 1,
            percentage: 0,
          });
        }
      }
    }

    const totalCpuTime = this.samples.reduce((sum, s) => sum + s.cpuTime, 0);

    for (const stat of stats.values()) {
      stat.averageCpuTime = stat.totalCpuTime / stat.sampleCount;
      stat.percentage = (stat.totalCpuTime / totalCpuTime) * 100;
    }

    return Array.from(stats.values());
  }

  private generateId(): string {
    return `cpu-profile-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  isRunning(): boolean {
    return this.isProfiling;
  }

  getSampleCount(): number {
    return this.samples.length;
  }
}

// ============================================================================
// Manual CPU Profiling (for specific functions)
// ============================================================================

export class FunctionProfiler {
  private timings: Map<string, number[]> = new Map();

  profile<T>(functionName: string, fn: () => T): T {
    const start = process.hrtime.bigint();
    try {
      return fn();
    } finally {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // Convert to milliseconds

      const timings = this.timings.get(functionName) || [];
      timings.push(duration);
      this.timings.set(functionName, timings);
    }
  }

  async profileAsync<T>(functionName: string, fn: () => Promise<T>): Promise<T> {
    const start = process.hrtime.bigint();
    try {
      return await fn();
    } finally {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // Convert to milliseconds

      const timings = this.timings.get(functionName) || [];
      timings.push(duration);
      this.timings.set(functionName, timings);
    }
  }

  getStats(functionName: string): { count: number; average: number; min: number; max: number; total: number } | null {
    const timings = this.timings.get(functionName);
    if (!timings || timings.length === 0) {
      return null;
    }

    const total = timings.reduce((sum, t) => sum + t, 0);
    const average = total / timings.length;
    const min = Math.min(...timings);
    const max = Math.max(...timings);

    return {
      count: timings.length,
      average,
      min,
      max,
      total,
    };
  }

  getAllStats(): Map<string, ReturnType<FunctionProfiler['getStats']>> {
    const stats = new Map();
    for (const [name] of this.timings) {
      stats.set(name, this.getStats(name));
    }
    return stats;
  }

  clear(): void {
    this.timings.clear();
  }
}

// ============================================================================
// Decorator for function profiling
// ============================================================================

export function profile(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const profiler = new FunctionProfiler();

  descriptor.value = function (...args: any[]) {
    return profiler.profile(propertyKey, () => originalMethod.apply(this, args));
  };

  // Attach profiler to the method for stats retrieval
  (descriptor.value as any).__profiler = profiler;
}

export function profileAsync(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const profiler = new FunctionProfiler();

  descriptor.value = async function (...args: any[]) {
    return profiler.profileAsync(propertyKey, () => originalMethod.apply(this, args));
  };

  // Attach profiler to the method for stats retrieval
  (descriptor.value as any).__profiler = profiler;
}

// ============================================================================
// Global CPU Profiler Instance
// ============================================================================

export const globalCPUProfiler = new CPUProfiler();

// Convenience functions
export function startCPUProfiling(): void {
  globalCPUProfiler.start();
}

export function stopCPUProfiling(): CPUProfile {
  return globalCPUProfiler.stop();
}

export function isCPUProfiling(): boolean {
  return globalCPUProfiler.isRunning();
}
