/**
 * Performance benchmarking
 */

import type { BenchmarkConfig, BenchmarkResult } from './types.js';
import { BenchmarkConfigSchema } from './types.js';

export class BenchmarkRunner {
  private config: BenchmarkConfig;
  private results: BenchmarkResult[] = [];

  constructor(config: BenchmarkConfig = {} as BenchmarkConfig) {
    this.config = BenchmarkConfigSchema.parse(config);
  }

  /**
   * Run a benchmark
   */
  async run(
    name: string,
    fn: () => Promise<void> | void,
    config?: BenchmarkConfig
  ): Promise<BenchmarkResult> {
    const effectiveConfig = config ? BenchmarkConfigSchema.parse(config) : this.config;

    // Warmup
    for (let i = 0; i < effectiveConfig.warmup; i++) {
      await fn();
    }

    // Collect samples
    const samples: number[] = [];
    const startTime = Date.now();
    let iterations = 0;

    while (Date.now() - startTime < effectiveConfig.maxTime && samples.length < effectiveConfig.minSamples) {
      const iterStart = Date.now();

      for (let i = 0; i < effectiveConfig.iterations; i++) {
        await fn();
        iterations++;
      }

      const iterDuration = Date.now() - iterStart;
      samples.push(iterDuration / effectiveConfig.iterations);
    }

    // Calculate statistics
    const sortedSamples = [...samples].sort((a, b) => a - b);
    const mean = this.calculateMean(samples);
    const median = this.calculateMedian(sortedSamples);
    const min = sortedSamples[0];
    const max = sortedSamples[sortedSamples.length - 1];
    const standardDeviation = this.calculateStandardDeviation(samples, mean);
    const percentile95 = this.calculatePercentile(sortedSamples, 95);
    const percentile99 = this.calculatePercentile(sortedSamples, 99);
    const opsPerSecond = 1000 / mean;

    const result: BenchmarkResult = {
      name,
      iterations,
      totalTime: samples.reduce((sum, s) => sum + s, 0),
      mean,
      median,
      min,
      max,
      standardDeviation,
      percentile95,
      percentile99,
      opsPerSecond,
    };

    this.results.push(result);

    return result;
  }

  /**
   * Run multiple benchmarks
   */
  async runAll(
    benchmarks: Array<{ name: string; fn: () => Promise<void> | void; config?: BenchmarkConfig }>
  ): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    for (const benchmark of benchmarks) {
      const result = await this.run(benchmark.name, benchmark.fn, benchmark.config);
      results.push(result);
    }

    return results;
  }

  /**
   * Compare two benchmarks
   */
  compare(result1: BenchmarkResult, result2: BenchmarkResult): {
    faster: BenchmarkResult;
    slower: BenchmarkResult;
    ratio: number;
    percentChange: number;
  } {
    const faster = result1.mean < result2.mean ? result1 : result2;
    const slower = result1.mean < result2.mean ? result2 : result1;
    const ratio = slower.mean / faster.mean;
    const percentChange = ((slower.mean - faster.mean) / faster.mean) * 100;

    return {
      faster,
      slower,
      ratio,
      percentChange,
    };
  }

  /**
   * Calculate mean
   */
  private calculateMean(samples: number[]): number {
    return samples.reduce((sum, s) => sum + s, 0) / samples.length;
  }

  /**
   * Calculate median
   */
  private calculateMedian(sortedSamples: number[]): number {
    const mid = Math.floor(sortedSamples.length / 2);
    if (sortedSamples.length % 2 === 0) {
      return (sortedSamples[mid - 1] + sortedSamples[mid]) / 2;
    }
    return sortedSamples[mid];
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(samples: number[], mean: number): number {
    const squaredDiffs = samples.map((s) => Math.pow(s - mean, 2));
    const meanSquaredDiff = this.calculateMean(squaredDiffs);
    return Math.sqrt(meanSquaredDiff);
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(sortedSamples: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedSamples.length) - 1;
    return sortedSamples[Math.max(0, index)];
  }

  /**
   * Get all results
   */
  getResults(): BenchmarkResult[] {
    return this.results;
  }

  /**
   * Clear all results
   */
  clear(): void {
    this.results = [];
  }

  /**
   * Generate report
   */
  generateReport(): string {
    if (this.results.length === 0) {
      return 'No benchmark results available.';
    }

    let report = 'Benchmark Results\n==================\n\n';

    for (const result of this.results) {
      report += `${result.name}\n`;
      report += `  Iterations: ${result.iterations}\n`;
      report += `  Mean: ${result.mean.toFixed(4)}ms\n`;
      report += `  Median: ${result.median.toFixed(4)}ms\n`;
      report += `  Min: ${result.min.toFixed(4)}ms\n`;
      report += `  Max: ${result.max.toFixed(4)}ms\n`;
      report += `  Std Dev: ${result.standardDeviation.toFixed(4)}ms\n`;
      report += `  95th percentile: ${result.percentile95.toFixed(4)}ms\n`;
      report += `  99th percentile: ${result.percentile99.toFixed(4)}ms\n`;
      report += `  Ops/sec: ${result.opsPerSecond.toFixed(2)}\n\n`;
    }

    return report;
  }
}

// Export singleton instance
export const benchmarkRunner = new BenchmarkRunner();
