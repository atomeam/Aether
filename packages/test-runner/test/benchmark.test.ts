/**
 * Tests for BenchmarkRunner
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { benchmarkRunner } from '../src/benchmark.js';

describe('BenchmarkRunner', () => {
  beforeEach(() => {
    benchmarkRunner.clear();
  });

  it('should run a simple benchmark', async () => {
    const result = await benchmarkRunner.run('simple-benchmark', () => {
      Math.sqrt(100);
    });

    expect(result).toBeDefined();
    expect(result.name).toBe('simple-benchmark');
    expect(result.iterations).toBeGreaterThan(0);
    expect(result.mean).toBeGreaterThan(0);
    expect(result.opsPerSecond).toBeGreaterThan(0);
  });

  it('should run async benchmark', async () => {
    const result = await benchmarkRunner.run('async-benchmark', async () => {
      await Promise.resolve();
    }, { async: true });

    expect(result).toBeDefined();
    expect(result.name).toBe('async-benchmark');
  });

  it('should calculate statistics correctly', async () => {
    const result = await benchmarkRunner.run('stats-benchmark', () => {
      // Simple operation
    }, { iterations: 100, warmup: 10, minSamples: 5 });

    expect(result.mean).toBeGreaterThan(0);
    expect(result.median).toBeGreaterThan(0);
    expect(result.min).toBeGreaterThan(0);
    expect(result.max).toBeGreaterThanOrEqual(result.min);
    expect(result.standardDeviation).toBeGreaterThanOrEqual(0);
    expect(result.percentile95).toBeGreaterThan(0);
    expect(result.percentile99).toBeGreaterThan(0);
  });

  it('should run multiple benchmarks', async () => {
    const benchmarks = [
      { name: 'benchmark-1', fn: () => Math.sqrt(100) },
      { name: 'benchmark-2', fn: () => Math.pow(2, 10) },
      { name: 'benchmark-3', fn: () => Math.abs(-42) },
    ];

    const results = await benchmarkRunner.runAll(benchmarks);

    expect(results).toHaveLength(3);
    expect(results[0].name).toBe('benchmark-1');
    expect(results[1].name).toBe('benchmark-2');
    expect(results[2].name).toBe('benchmark-3');
  });

  it('should compare two benchmarks', async () => {
    const result1 = await benchmarkRunner.run('fast-operation', () => {
      Math.abs(42);
    });

    const result2 = await benchmarkRunner.run('slow-operation', () => {
      // Simulate slower operation
      let sum = 0;
      for (let i = 0; i < 100; i++) {
        sum += i;
      }
    });

    const comparison = benchmarkRunner.compare(result1, result2);

    expect(comparison).toBeDefined();
    expect(comparison.faster).toBeDefined();
    expect(comparison.slower).toBeDefined();
    expect(comparison.ratio).toBeGreaterThan(0);
    expect(comparison.percentChange).toBeGreaterThanOrEqual(0);
  });

  it('should generate report', async () => {
    await benchmarkRunner.run('benchmark-1', () => Math.sqrt(100));
    await benchmarkRunner.run('benchmark-2', () => Math.pow(2, 10));

    const report = benchmarkRunner.generateReport();

    expect(report).toContain('Benchmark Results');
    expect(report).toContain('benchmark-1');
    expect(report).toContain('benchmark-2');
    expect(report).toContain('Mean');
    expect(report).toContain('Ops/sec');
  });

  it('should handle custom config', async () => {
    const result = await benchmarkRunner.run('custom-benchmark', () => {
      Math.sqrt(100);
    }, {
      iterations: 500,
      warmup: 50,
      minSamples: 20,
      maxTime: 10000,
    });

    expect(result.iterations).toBeGreaterThan(0);
  });

  it('should clear results', async () => {
    await benchmarkRunner.run('benchmark-1', () => Math.sqrt(100));
    expect(benchmarkRunner.getResults()).toHaveLength(1);

    benchmarkRunner.clear();
    expect(benchmarkRunner.getResults()).toHaveLength(0);
  });
});
