/**
 * @aether/test-runner - Advanced test runner with parallel execution, coverage, snapshots, benchmarks, and visual regression
 * 
 * A comprehensive testing framework that provides:
 * - Parallel test execution for faster feedback
 * - Test coverage reporting with detailed metrics
 * - Snapshot testing for UI and data structures
 * - Performance benchmarking with statistical analysis
 * - Visual regression testing for UI components
 * 
 * @version 1.0.0
 */

export { TestRunner } from './runner.js';
export type { TestRunnerConfig } from './runner.js';
export type { TestSuite, TestCase, TestResult } from './types.js';
export { parallelExecutor } from './parallel.js';
export { coverageReporter } from './coverage.js';
export { snapshotManager } from './snapshot.js';
export { benchmarkRunner } from './benchmark.js';
export { visualRegression } from './visual.js';
export { schemas } from './schemas.js';
export type {
  TestConfig,
  TestSuiteConfig,
  BenchmarkConfig,
  SnapshotConfig,
  VisualRegressionConfig,
  CoverageReport,
  BenchmarkResult,
  SnapshotResult,
  VisualRegressionResult,
} from './types.js';
