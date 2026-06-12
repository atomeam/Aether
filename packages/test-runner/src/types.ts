/**
 * Type definitions for the test runner
 */

import { z } from 'zod';

// =============================================================================
// TEST CONFIGURATION
// =============================================================================

export const TestConfigSchema = z.object({
  name: z.string().min(1),
  timeout: z.number().int().positive().default(5000),
  retries: z.number().int().nonnegative().default(0),
  skip: z.boolean().default(false),
  only: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

export type TestConfig = z.infer<typeof TestConfigSchema>;

export const TestSuiteConfigSchema = z.object({
  name: z.string().min(1),
  parallel: z.boolean().default(true),
  timeout: z.number().int().positive().default(30000),
  retries: z.number().int().nonnegative().default(0),
  setup: z.function().optional(),
  teardown: z.function().optional(),
  beforeEach: z.function().optional(),
  afterEach: z.function().optional(),
});

export type TestSuiteConfig = z.infer<typeof TestSuiteConfigSchema>;

// =============================================================================
// TEST RESULTS
// =============================================================================

export const TestStatusSchema = z.enum([
  'pending',
  'running',
  'passed',
  'failed',
  'skipped',
  'timed-out',
]);

export type TestStatus = z.infer<typeof TestStatusSchema>;

export const TestResultSchema = z.object({
  name: z.string(),
  status: TestStatusSchema,
  duration: z.number().nonnegative(),
  error: z.object({
    message: z.string(),
    stack: z.string().optional(),
    expected: z.unknown().optional(),
    actual: z.unknown().optional(),
  }).optional(),
  coverage: z.number().min(0).max(1).optional(),
  retries: z.number().int().nonnegative().default(0),
});

export type TestResult = z.infer<typeof TestResultSchema>;

export const TestSuiteResultSchema = z.object({
  name: z.string(),
  tests: z.array(TestResultSchema),
  duration: z.number().nonnegative(),
  passed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
});

export type TestSuiteResult = z.infer<typeof TestSuiteResultSchema>;

// =============================================================================
// PARALLEL EXECUTION
// =============================================================================

export const ParallelConfigSchema = z.object({
  maxWorkers: z.number().int().positive().default(4),
  workerTimeout: z.number().int().positive().default(60000),
  isolation: z.enum(['none', 'process', 'thread']).default('process'),
  loadBalancing: z.enum(['round-robin', 'least-busy', 'random']).default('least-busy'),
});

export type ParallelConfig = z.infer<typeof ParallelConfigSchema>;

// =============================================================================
// COVERAGE
// =============================================================================

export const CoverageConfigSchema = z.object({
  enabled: z.boolean().default(true),
  threshold: z.object({
    statements: z.number().min(0).max(100).default(80),
    branches: z.number().min(0).max(100).default(80),
    functions: z.number().min(0).max(100).default(80),
    lines: z.number().min(0).max(100).default(80),
  }),
  reporters: z.array(z.enum(['json', 'lcov', 'html', 'text'])).default(['json', 'text']),
  include: z.array(z.string()).default(['src/**/*.{js,ts}']),
  exclude: z.array(z.string()).default(['**/*.test.{js,ts}', '**/*.spec.{js,ts}']),
});

export type CoverageConfig = z.infer<typeof CoverageConfigSchema>;

export const CoverageReportSchema = z.object({
  statements: z.object({
    total: z.number().int().nonnegative(),
    covered: z.number().int().nonnegative(),
    percentage: z.number().min(0).max(100),
  }),
  branches: z.object({
    total: z.number().int().nonnegative(),
    covered: z.number().int().nonnegative(),
    percentage: z.number().min(0).max(100),
  }),
  functions: z.object({
    total: z.number().int().nonnegative(),
    covered: z.number().int().nonnegative(),
    percentage: z.number().min(0).max(100),
  }),
  lines: z.object({
    total: z.number().int().nonnegative(),
    covered: z.number().int().nonnegative(),
    percentage: z.number().min(0).max(100),
  }),
  files: z.record(z.object({
    statements: z.object({
      total: z.number().int().nonnegative(),
      covered: z.number().int().nonnegative(),
      percentage: z.number().min(0).max(100),
    }),
    branches: z.object({
      total: z.number().int().nonnegative(),
      covered: z.number().int().nonnegative(),
      percentage: z.number().min(0).max(100),
    }),
    functions: z.object({
      total: z.number().int().nonnegative(),
      covered: z.number().int().nonnegative(),
      percentage: z.number().min(0).max(100),
    }),
    lines: z.object({
      total: z.number().int().nonnegative(),
      covered: z.number().int().nonnegative(),
      percentage: z.number().min(0).max(100),
    }),
  })),
});

export type CoverageReport = z.infer<typeof CoverageReportSchema>;

// =============================================================================
// SNAPSHOTS
// =============================================================================

export const SnapshotConfigSchema = z.object({
  update: z.boolean().default(false),
  inline: z.boolean().default(false),
  directory: z.string().default('__snapshots__'),
  extension: z.string().default('.snap'),
  serializer: z.function().optional(),
});

export type SnapshotConfig = z.infer<typeof SnapshotConfigSchema>;

export const SnapshotResultSchema = z.object({
  name: z.string(),
  passed: z.boolean(),
  added: z.boolean(),
  updated: z.boolean(),
  unmatched: z.boolean(),
  expected: z.string(),
  actual: z.string(),
  diff: z.string().optional(),
});

export type SnapshotResult = z.infer<typeof SnapshotResultSchema>;

// =============================================================================
// BENCHMARKS
// =============================================================================

export const BenchmarkConfigSchema = z.object({
  iterations: z.number().int().positive().default(1000),
  warmup: z.number().int().nonnegative().default(100),
  minSamples: z.number().int().positive().default(10),
  maxTime: z.number().int().positive().default(5000),
  async: z.boolean().default(false),
});

export type BenchmarkConfig = z.infer<typeof BenchmarkConfigSchema>;

export const BenchmarkResultSchema = z.object({
  name: z.string(),
  iterations: z.number().int().positive(),
  totalTime: z.number().nonnegative(),
  mean: z.number().nonnegative(),
  median: z.number().nonnegative(),
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
  standardDeviation: z.number().nonnegative(),
  percentile95: z.number().nonnegative(),
  percentile99: z.number().nonnegative(),
  opsPerSecond: z.number().nonnegative(),
});

export type BenchmarkResult = z.infer<typeof BenchmarkResultSchema>;

// =============================================================================
// VISUAL REGRESSION
// =============================================================================

export const VisualRegressionConfigSchema = z.object({
  threshold: z.number().min(0).max(1).default(0.01),
  pixelThreshold: z.number().int().nonnegative().default(100),
  ignoreAreas: z.array(z.object({
    x: z.number().int().nonnegative(),
    y: z.number().int().nonnegative(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  })).default([]),
  ignoreColors: z.boolean().default(false),
  screenshotDirectory: z.string().default('__screenshots__'),
  baselineDirectory: z.string().default('__baselines__'),
  diffDirectory: z.string().default('__diffs__'),
});

export type VisualRegressionConfig = z.infer<typeof VisualRegressionConfigSchema>;

export const VisualRegressionResultSchema = z.object({
  name: z.string(),
  passed: z.boolean(),
  diffPixels: z.number().int().nonnegative(),
  diffPercentage: z.number().min(0).max(100),
  baselinePath: z.string(),
  currentPath: z.string(),
  diffPath: z.string().optional(),
  threshold: z.number().min(0).max(1),
});

export type VisualRegressionResult = z.infer<typeof VisualRegressionResultSchema>;

// =============================================================================
// TEST RUNNER CONFIG
// =============================================================================

export const TestRunnerConfigSchema = z.object({
  parallel: ParallelConfigSchema.optional(),
  coverage: CoverageConfigSchema.optional(),
  snapshot: SnapshotConfigSchema.optional(),
  benchmark: BenchmarkConfigSchema.optional(),
  visualRegression: VisualRegressionConfigSchema.optional(),
  reporters: z.array(z.enum(['json', 'junit', 'html', 'console'])).default(['console']),
  bail: z.boolean().default(false),
  bailCount: z.number().int().positive().default(1),
  verbose: z.boolean().default(false),
});

export type TestRunnerConfig = z.infer<typeof TestRunnerConfigSchema>;

// =============================================================================
// TEST CASE AND SUITE
// =============================================================================

export interface TestCase {
  name: string;
  fn: () => Promise<void> | void;
  config?: TestConfig;
}

export interface TestSuite {
  name: string;
  config?: TestSuiteConfig;
  tests: TestCase[];
  suites?: TestSuite[];
}

// =============================================================================
// EXPORT SCHEMAS
// =============================================================================

export const schemas = {
  TestConfig: TestConfigSchema,
  TestSuiteConfig: TestSuiteConfigSchema,
  TestResult: TestResultSchema,
  TestSuiteResult: TestSuiteResultSchema,
  ParallelConfig: ParallelConfigSchema,
  CoverageConfig: CoverageConfigSchema,
  CoverageReport: CoverageReportSchema,
  SnapshotConfig: SnapshotConfigSchema,
  SnapshotResult: SnapshotResultSchema,
  BenchmarkConfig: BenchmarkConfigSchema,
  BenchmarkResult: BenchmarkResultSchema,
  VisualRegressionConfig: VisualRegressionConfigSchema,
  VisualRegressionResult: VisualRegressionResultSchema,
  TestRunnerConfig: TestRunnerConfigSchema,
};
