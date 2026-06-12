/**
 * @aether/profiling - Memory Profiling
 * 
 * Memory profiling implementation for tracking heap usage,
 * identifying memory leaks, and analyzing memory patterns.
 */

import type {
  MemoryProfile,
  MemorySample,
  MemorySummary,
  MemoryLeak,
} from './types';

// ============================================================================
// Memory Profiler
// ============================================================================

export class MemoryProfiler {
  private samples: MemorySample[] = [];
  private startTime: number = 0;
  private isProfiling: boolean = false;
  private sampleInterval: number = 100; // milliseconds
  private maxSamples: number = 10000;
  private timer?: NodeJS.Timeout;
  private initialMemory?: MemorySample;

  constructor(sampleInterval: number = 100, maxSamples: number = 10000) {
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
    this.initialMemory = this.captureSample();

    this.timer = setInterval(() => {
      this.collectSample();
    }, this.sampleInterval);
  }

  stop(): MemoryProfile {
    if (!this.isProfiling) {
      throw new Error('Memory profiler is not running');
    }

    this.isProfiling = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    const endTime = Date.now();
    const duration = endTime - this.startTime;

    // Capture final sample
    const finalSample = this.captureSample();
    this.samples.push(finalSample);

    const profile: MemoryProfile = {
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

    const sample = this.captureSample();
    this.samples.push(sample);
  }

  private captureSample(): MemorySample {
    const usage = process.memoryUsage();

    return {
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      arrayBuffers: usage.arrayBuffers,
    };
  }

  private calculateSummary(): MemorySummary {
    if (this.samples.length === 0) {
      return {
        initialHeapUsed: 0,
        peakHeapUsed: 0,
        finalHeapUsed: 0,
        averageHeapUsed: 0,
        memoryGrowth: 0,
        memoryGrowthRate: 0,
        potentialLeaks: [],
      };
    }

    const initialHeapUsed = this.initialMemory?.heapUsed || this.samples[0].heapUsed;
    const finalHeapUsed = this.samples[this.samples.length - 1].heapUsed;
    const peakHeapUsed = Math.max(...this.samples.map(s => s.heapUsed));
    const averageHeapUsed =
      this.samples.reduce((sum, s) => sum + s.heapUsed, 0) / this.samples.length;

    const memoryGrowth = finalHeapUsed - initialHeapUsed;
    const duration = this.samples[this.samples.length - 1].timestamp - this.samples[0].timestamp;
    const memoryGrowthRate = duration > 0 ? (memoryGrowth / duration) * 1000 : 0; // bytes per second

    const potentialLeaks = this.detectPotentialLeaks();

    return {
      initialHeapUsed,
      peakHeapUsed,
      finalHeapUsed,
      averageHeapUsed,
      memoryGrowth,
      memoryGrowthRate,
      potentialLeaks,
    };
  }

  private detectPotentialLeaks(): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];

    // Simple leak detection: if memory growth is significant
    const initialHeapUsed = this.initialMemory?.heapUsed || this.samples[0].heapUsed;
    const finalHeapUsed = this.samples[this.samples.length - 1].heapUsed;
    const growthPercentage = ((finalHeapUsed - initialHeapUsed) / initialHeapUsed) * 100;

    if (growthPercentage > 50) {
      // Significant memory growth detected
      leaks.push({
        objectName: 'Unknown',
        retainedSize: finalHeapUsed - initialHeapUsed,
        instanceCount: 1,
        growthRate: growthPercentage,
      });
    }

    // Check for sustained growth pattern
    if (this.samples.length > 10) {
      const firstHalf = this.samples.slice(0, Math.floor(this.samples.length / 2));
      const secondHalf = this.samples.slice(Math.floor(this.samples.length / 2));

      const firstHalfAvg = firstHalf.reduce((sum, s) => sum + s.heapUsed, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, s) => sum + s.heapUsed, 0) / secondHalf.length;

      if (secondHalfAvg > firstHalfAvg * 1.2) {
        // 20% increase in second half suggests leak
        leaks.push({
          objectName: 'Sustained Growth Pattern',
          retainedSize: secondHalfAvg - firstHalfAvg,
          instanceCount: 1,
          growthRate: ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100,
        });
      }
    }

    return leaks;
  }

  private generateId(): string {
    return `memory-profile-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  isRunning(): boolean {
    return this.isProfiling;
  }

  getSampleCount(): number {
    return this.samples.length;
  }

  getCurrentMemoryUsage(): MemorySample {
    return this.captureSample();
  }
}

// ============================================================================
// Memory Snapshot
// ============================================================================

export class MemorySnapshot {
  private timestamp: number;
  private usage: NodeJS.MemoryUsage;

  constructor() {
    this.timestamp = Date.now();
    this.usage = process.memoryUsage();
  }

  get heapUsed(): number {
    return this.usage.heapUsed;
  }

  get heapTotal(): number {
    return this.usage.heapTotal;
  }

  get external(): number {
    return this.usage.external;
  }

  get arrayBuffers(): number {
    return this.usage.arrayBuffers;
  }

  get rss(): number {
    return this.usage.rss;
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  toJSON(): Record<string, any> {
    return {
      timestamp: this.timestamp,
      heapUsed: this.usage.heapUsed,
      heapTotal: this.usage.heapTotal,
      external: this.usage.external,
      arrayBuffers: this.usage.arrayBuffers,
      rss: this.usage.rss,
      heapUsedFormatted: this.formatBytes(this.usage.heapUsed),
      heapTotalFormatted: this.formatBytes(this.usage.heapTotal),
      externalFormatted: this.formatBytes(this.usage.external),
      arrayBuffersFormatted: this.formatBytes(this.usage.arrayBuffers),
      rssFormatted: this.formatBytes(this.usage.rss),
    };
  }
}

// ============================================================================
// Memory Leak Detector
// ============================================================================

export class MemoryLeakDetector {
  private snapshots: MemorySnapshot[] = [];
  private maxSnapshots: number = 100;

  takeSnapshot(): MemorySnapshot {
    const snapshot = new MemorySnapshot();
    this.snapshots.push(snapshot);

    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  detectLeaks(threshold: number = 10): MemoryLeak[] {
    if (this.snapshots.length < 2) {
      return [];
    }

    const leaks: MemoryLeak[] = [];
    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];

    const growth = last.heapUsed - first.heapUsed;
    const growthPercentage = (growth / first.heapUsed) * 100;

    if (growthPercentage > threshold) {
      leaks.push({
        objectName: 'General Memory',
        retainedSize: growth,
        instanceCount: 1,
        growthRate: growthPercentage,
      });
    }

    return leaks;
  }

  getTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.snapshots.length < 3) {
      return 'stable';
    }

    const recent = this.snapshots.slice(-3);
    const trend = recent[2].heapUsed - recent[0].heapUsed;

    if (trend > 1000000) {
      // More than 1MB increase
      return 'increasing';
    } else if (trend < -1000000) {
      // More than 1MB decrease
      return 'decreasing';
    }

    return 'stable';
  }

  clear(): void {
    this.snapshots = [];
  }

  getSnapshotCount(): number {
    return this.snapshots.length;
  }
}

// ============================================================================
// Global Memory Profiler Instance
// ============================================================================

export const globalMemoryProfiler = new MemoryProfiler();
export const globalMemoryLeakDetector = new MemoryLeakDetector();

// Convenience functions
export function startMemoryProfiling(): void {
  globalMemoryProfiler.start();
}

export function stopMemoryProfiling(): MemoryProfile {
  return globalMemoryProfiler.stop();
}

export function isMemoryProfiling(): boolean {
  return globalMemoryProfiler.isRunning();
}

export function takeMemorySnapshot(): MemorySnapshot {
  return globalMemoryLeakDetector.takeSnapshot();
}

export function detectMemoryLeaks(threshold?: number): MemoryLeak[] {
  return globalMemoryLeakDetector.detectLeaks(threshold);
}

export function getMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
  return globalMemoryLeakDetector.getTrend();
}

export function getCurrentMemoryUsage(): MemorySnapshot {
  return new MemorySnapshot();
}
