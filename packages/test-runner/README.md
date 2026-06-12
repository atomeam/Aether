# @aether/test-runner

Advanced test runner with parallel execution, coverage reporting, snapshot testing, performance benchmarking, and visual regression testing.

## Features

- **Parallel Test Execution**: Run tests in parallel for faster feedback
- **Test Coverage Reporting**: Detailed coverage metrics with configurable thresholds
- **Snapshot Testing**: Capture and compare snapshots of data structures and UI
- **Performance Benchmarking**: Measure and compare performance with statistical analysis
- **Visual Regression Testing**: Detect visual changes in UI components
- **TypeScript Support**: Full TypeScript types and Zod schemas
- **Comprehensive Testing**: Full test coverage for all features

## Installation

```bash
npm install @aether/test-runner
```

## Quick Start

```typescript
import { TestRunner } from '@aether/test-runner';

const runner = new TestRunner({
  parallel: {
    maxWorkers: 4,
  },
  coverage: {
    enabled: true,
    threshold: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
});

runner.addSuite({
  name: 'My Test Suite',
  tests: [
    {
      name: 'should pass',
      fn: () => {
        expect(true).toBe(true);
      },
    },
  ],
});

await runner.run();
```

## Parallel Execution

Configure parallel test execution to speed up your test suite:

```typescript
import { TestRunner } from '@aether/test-runner';

const runner = new TestRunner({
  parallel: {
    maxWorkers: 4,
    isolation: 'process',
    loadBalancing: 'least-busy',
  },
});
```

### Configuration Options

- `maxWorkers`: Maximum number of parallel workers (default: 4)
- `isolation`: Worker isolation mode - 'none', 'process', or 'thread' (default: 'process')
- `loadBalancing`: Load balancing strategy - 'round-robin', 'least-busy', or 'random' (default: 'least-busy')

## Coverage Reporting

Generate detailed coverage reports with configurable thresholds:

```typescript
import { TestRunner } from '@aether/test-runner';

const runner = new TestRunner({
  coverage: {
    enabled: true,
    threshold: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
    reporters: ['json', 'lcov', 'html', 'text'],
  },
});
```

### Coverage Thresholds

The runner will fail if coverage falls below the configured thresholds:

- `statements`: Minimum statement coverage percentage
- `branches`: Minimum branch coverage percentage
- `functions`: Minimum function coverage percentage
- `lines`: Minimum line coverage percentage

## Snapshot Testing

Capture and compare snapshots of your data:

```typescript
import { snapshotManager } from '@aether/test-runner';

// Create a snapshot
await snapshotManager.match('my-snapshot', {
  data: 'value',
  nested: { key: 'value' },
});

// Update snapshots
snapshotManager['config'].update = true;
await snapshotManager.match('my-snapshot', newData);
```

### Configuration Options

- `update`: Update snapshots instead of failing (default: false)
- `inline`: Store snapshots inline in test files (default: false)
- `directory`: Directory for snapshot files (default: '__snapshots__')
- `extension`: File extension for snapshots (default: '.snap')
- `serializer`: Custom serializer function (optional)

## Performance Benchmarking

Measure and compare performance with statistical analysis:

```typescript
import { benchmarkRunner } from '@aether/test-runner';

// Run a single benchmark
const result = await benchmarkRunner.run('my-benchmark', () => {
  // Code to benchmark
  Math.sqrt(100);
});

console.log(result);
// {
//   name: 'my-benchmark',
//   mean: 0.0012,
//   median: 0.0011,
//   opsPerSecond: 833333.33,
//   ...
// }

// Run multiple benchmarks
const results = await benchmarkRunner.runAll([
  { name: 'benchmark-1', fn: () => operation1() },
  { name: 'benchmark-2', fn: () => operation2() },
]);

// Compare benchmarks
const comparison = benchmarkRunner.compare(results[0], results[1]);
console.log(`${comparison.faster.name} is ${comparison.percentChange.toFixed(2)}% faster`);
```

### Benchmark Configuration

```typescript
const result = await benchmarkRunner.run('my-benchmark', fn, {
  iterations: 1000,      // Number of iterations per sample
  warmup: 100,           // Warmup iterations
  minSamples: 10,        // Minimum number of samples
  maxTime: 5000,         // Maximum time in milliseconds
  async: false,          // Whether the function is async
});
```

### Benchmark Results

Each benchmark result includes:

- `iterations`: Total iterations run
- `mean`: Average execution time
- `median`: Median execution time
- `min`: Minimum execution time
- `max`: Maximum execution time
- `standardDeviation`: Standard deviation
- `percentile95`: 95th percentile
- `percentile99`: 99th percentile
- `opsPerSecond`: Operations per second

## Visual Regression Testing

Detect visual changes in UI components:

```typescript
import { visualRegression } from '@aether/test-runner';

// Compare screenshot against baseline
const result = await visualRegression.compare('my-component', screenshotBuffer);

if (!result.passed) {
  console.log(`Visual regression detected: ${result.diffPercentage}% difference`);
}
```

### Configuration Options

```typescript
visualRegression['config'] = {
  threshold: 0.01,           // Maximum allowed difference (0-1)
  pixelThreshold: 100,       // Maximum number of different pixels
  ignoreAreas: [             // Areas to ignore
    { x: 0, y: 0, width: 100, height: 50 },
  ],
  ignoreColors: false,       // Ignore color differences
  screenshotDirectory: '__screenshots__',
  baselineDirectory: '__baselines__',
  diffDirectory: '__diffs__',
};
```

## Test Lifecycle Hooks

Configure lifecycle hooks for your test suites:

```typescript
runner.addSuite({
  name: 'My Suite',
  config: {
    setup: async () => {
      // Run before all tests in suite
    },
    teardown: async () => {
      // Run after all tests in suite
    },
    beforeEach: async () => {
      // Run before each test
    },
    afterEach: async () => {
      // Run after each test
    },
  },
  tests: [
    { name: 'test-1', fn: () => {} },
  ],
});
```

## Test Configuration

Configure individual tests:

```typescript
{
  name: 'my-test',
  fn: () => {
    // Test implementation
  },
  config: {
    timeout: 5000,      // Test timeout in milliseconds
    retries: 2,         // Number of retries on failure
    skip: false,        // Skip the test
    only: false,        // Run only this test
    tags: ['smoke'],    // Test tags
  },
}
```

## Events

Listen to test runner events:

```typescript
runner.on('start', ({ suites }) => {
  console.log(`Starting ${suites} suites`);
});

runner.on('suite-start', ({ name }) => {
  console.log(`Running suite: ${name}`);
});

runner.on('test-start', ({ name, suite }) => {
  console.log(`Running test: ${suite} > ${name}`);
});

runner.on('test-complete', (result) => {
  console.log(`Test ${result.name}: ${result.status}`);
});

runner.on('suite-complete', (result) => {
  console.log(`Suite ${result.name}: ${result.passed} passed, ${result.failed} failed`);
});

runner.on('coverage', (report) => {
  console.log('Coverage report:', report);
});

runner.on('complete', ({ results, summary }) => {
  console.log('Test run complete:', summary);
});

runner.on('bail', ({ reason }) => {
  console.log('Bailing:', reason);
});
```

## Bail on Failure

Stop execution after a certain number of failures:

```typescript
const runner = new TestRunner({
  bail: true,
  bailCount: 1,  // Stop after first failure
});
```

## API Reference

### TestRunner

Main test runner class.

#### Methods

- `addSuite(suite: TestSuite): void` - Add a test suite
- `addSuites(suites: TestSuite[]): void` - Add multiple test suites
- `run(): Promise<TestSuiteResult[]>` - Run all test suites
- `getResults(): TestSuiteResult[]` - Get all results
- `reset(): void` - Clear all suites and results

### parallelExecutor

Singleton instance for parallel execution.

#### Methods

- `execute(suites: TestSuite[], config?: ParallelConfig): Promise<TestSuiteResult[]>` - Execute suites in parallel
- `getStats(): object` - Get worker pool statistics

### coverageReporter

Singleton instance for coverage reporting.

#### Methods

- `start(): Promise<void>` - Start coverage collection
- `stop(): Promise<void>` - Stop coverage collection
- `generate(config?: CoverageConfig): Promise<CoverageReport>` - Generate coverage report
- `getData(): Map<string, any>` - Get current coverage data

### snapshotManager

Singleton instance for snapshot testing.

#### Methods

- `initialize(): Promise<void>` - Initialize snapshot manager
- `match(testName: string, received: unknown, filePath?: string): Promise<SnapshotResult>` - Match a snapshot
- `clear(): Promise<void>` - Clear all snapshots
- `remove(testName: string, filePath?: string): Promise<void>` - Remove a snapshot

### benchmarkRunner

Singleton instance for benchmarking.

#### Methods

- `run(name: string, fn: () => Promise<void> | void, config?: BenchmarkConfig): Promise<BenchmarkResult>` - Run a benchmark
- `runAll(benchmarks: Array<{name, fn, config}>): Promise<BenchmarkResult[]>` - Run multiple benchmarks
- `compare(result1: BenchmarkResult, result2: BenchmarkResult): object` - Compare two benchmarks
- `getResults(): BenchmarkResult[]` - Get all results
- `clear(): void` - Clear all results
- `generateReport(): string` - Generate text report

### visualRegression

Singleton instance for visual regression testing.

#### Methods

- `initialize(): Promise<void>` - Initialize visual regression testing
- `compare(name: string, currentImage: Buffer, config?: VisualRegressionConfig): Promise<VisualRegressionResult>` - Compare screenshot
- `updateBaseline(name: string, newImage: Buffer): Promise<void>` - Update baseline
- `removeBaseline(name: string): Promise<void>` - Remove baseline
- `getBaselines(): Promise<string[]>` - Get all baseline names

## TypeScript Types

All types are exported for use in your projects:

```typescript
import type {
  TestConfig,
  TestSuiteConfig,
  TestResult,
  TestSuiteResult,
  ParallelConfig,
  CoverageConfig,
  CoverageReport,
  SnapshotConfig,
  SnapshotResult,
  BenchmarkConfig,
  BenchmarkResult,
  VisualRegressionConfig,
  VisualRegressionResult,
} from '@aether/test-runner';
```

## Zod Schemas

Zod schemas are available for runtime validation:

```typescript
import { schemas } from '@aether/test-runner';

const config = schemas.TestRunnerConfig.parse({
  parallel: { maxWorkers: 4 },
  coverage: { enabled: true },
});
```

## License

MIT
