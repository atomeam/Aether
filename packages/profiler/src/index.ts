/**
 * @aether/profiler - Performance Profiling Tools
 * 
 * Provides performance measurement and profiling capabilities.
 * Measures execution time, memory usage, and resource consumption.
 */

export interface Profile {
  name: string;
  duration: number;
  memoryDelta: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ProfilerStats {
  totalProfiles: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  totalMemoryDelta: number;
  averageMemoryDelta: number;
}

export class Profiler {
  private profiles: Profile[] = [];
  private startTime: number = 0;
  private startMemory: number = 0;

  /**
   * Start profiling
   */
  start(name: string): void {
    this.startTime = Date.now();
    this.startMemory = process.memoryUsage().heapUsed;
  }

  /**
   * Stop profiling and record
   */
  end(name: string, metadata?: Record<string, unknown>): void {
    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;
    const duration = endTime - this.startTime;
    const memoryDelta = endMemory - this.startMemory;

    this.profiles.push({
      name,
      duration,
      memoryDelta,
      timestamp: endTime,
      metadata
    });
  }

  /**
   * Profile a function execution
   */
  async profile<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, unknown>): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      this.end(name, metadata);
      return result;
    } catch (error) {
      this.end(name, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Profile a synchronous function
   */
  profileSync<T>(name: string, fn: () => T, metadata?: Record<string, unknown>): T {
    this.start(name);
    try {
      const result = fn();
      this.end(name, metadata);
      return result;
    } catch (error) {
      this.end(name, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Get all profiles
   */
  getProfiles(): Profile[] {
    return [...this.profiles];
  }

  /**
   * Get profiles by name
   */
  getProfilesByName(name: string): Profile[] {
    return this.profiles.filter(p => p.name === name);
  }

  /**
   * Get statistics
   */
  getStats(): ProfilerStats {
    if (this.profiles.length === 0) {
      return {
        totalProfiles: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        totalMemoryDelta: 0,
        averageMemoryDelta: 0
      };
    }

    const durations = this.profiles.map(p => p.duration);
    const memoryDeltas = this.profiles.map(p => p.memoryDelta);

    return {
      totalProfiles: this.profiles.length,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      totalMemoryDelta: memoryDeltas.reduce((sum, d) => sum + d, 0),
      averageMemoryDelta: memoryDeltas.reduce((sum, d) => sum + d, 0) / memoryDeltas.length
    };
  }

  /**
   * Clear all profiles
   */
  clear(): void {
    this.profiles = [];
  }

  /**
   * Get recent profiles
   */
  getRecentProfiles(limit: number = 50): Profile[] {
    return this.profiles
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get slow profiles (above threshold)
   */
  getSlowProfiles(thresholdMs: number = 1000): Profile[] {
    return this.profiles.filter(p => p.duration > thresholdMs);
  }

  /**
   * Get memory-intensive profiles
   */
  getMemoryIntensiveProfiles(thresholdBytes: number = 1024 * 1024): Profile[] {
    return this.profiles.filter(p => p.memoryDelta > thresholdBytes);
  }
}

// Global profiler instance
const globalProfiler = new Profiler();

/**
 * Profile a function using the global profiler
 */
export async function profile<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, unknown>): Promise<T> {
  return globalProfiler.profile(name, fn, metadata);
}

/**
 * Profile a synchronous function using the global profiler
 */
export function profileSync<T>(name: string, fn: () => T, metadata?: Record<string, unknown>): T {
  return globalProfiler.profileSync(name, fn, metadata);
}

/**
 * Get global profiler stats
 */
export function getProfilerStats(): ProfilerStats {
  return globalProfiler.getStats();
}

/**
 * Get global profiler profiles
 */
export function getProfilerProfiles(): Profile[] {
  return globalProfiler.getProfiles();
}

/**
 * Clear global profiler
 */
export function clearProfiler(): void {
  globalProfiler.clear();
}

/**
 * Get slow operations from global profiler
 */
export function getSlowOperations(thresholdMs: number = 1000): Profile[] {
  return globalProfiler.getSlowProfiles(thresholdMs);
}

/**
 * Get memory-intensive operations from global profiler
 */
export function getMemoryIntensiveOperations(thresholdBytes: number = 1024 * 1024): Profile[] {
  return globalProfiler.getMemoryIntensiveProfiles(thresholdBytes);
}