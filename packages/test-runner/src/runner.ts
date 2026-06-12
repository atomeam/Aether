/**
 * Main test runner implementation
 */

import { EventEmitter } from 'events';
import type {
  TestSuite,
  TestCase,
  TestRunnerConfig,
  TestSuiteResult,
  TestResult,
  TestStatus,
} from './types.js';
import { TestRunnerConfigSchema } from './types.js';
import { parallelExecutor } from './parallel.js';
import { coverageReporter } from './coverage.js';
import { snapshotManager } from './snapshot.js';
import { benchmarkRunner } from './benchmark.js';
import { visualRegression } from './visual.js';

export class TestRunner extends EventEmitter {
  private config: TestRunnerConfig;
  private suites: TestSuite[] = [];
  private results: TestSuiteResult[] = [];

  constructor(config: TestRunnerConfig = {} as TestRunnerConfig) {
    super();
    this.config = TestRunnerConfigSchema.parse(config);
  }

  /**
   * Add a test suite to the runner
   */
  addSuite(suite: TestSuite): void {
    this.suites.push(suite);
  }

  /**
   * Add multiple test suites
   */
  addSuites(suites: TestSuite[]): void {
    this.suites.push(...suites);
  }

  /**
   * Run all test suites
   */
  async run(): Promise<TestSuiteResult[]> {
    this.emit('start', { suites: this.suites.length });

    const startTime = Date.now();

    if (this.config.parallel) {
      await this.runParallel();
    } else {
      await this.runSequential();
    }

    const duration = Date.now() - startTime;

    // Generate coverage report if enabled
    if (this.config.coverage?.enabled) {
      const coverage = await coverageReporter.generate(this.config.coverage);
      this.emit('coverage', coverage);
    }

    const summary = {
      totalSuites: this.suites.length,
      totalTests: this.results.reduce((sum, r) => sum + r.tests.length, 0),
      totalPassed: this.results.reduce((sum, r) => sum + r.passed, 0),
      totalFailed: this.results.reduce((sum, r) => sum + r.failed, 0),
      totalSkipped: this.results.reduce((sum, r) => sum + r.skipped, 0),
      duration,
    };

    this.emit('complete', { results: this.results, summary });

    return this.results;
  }

  /**
   * Run tests sequentially
   */
  private async runSequential(): Promise<void> {
    for (const suite of this.suites) {
      const result = await this.runSuite(suite);
      this.results.push(result);

      if (this.config.bail && result.failed > 0) {
        if (this.results.reduce((sum, r) => sum + r.failed, 0) >= (this.config.bailCount || 1)) {
          this.emit('bail', { reason: 'Too many failures' });
          break;
        }
      }
    }
  }

  /**
   * Run tests in parallel
   */
  private async runParallel(): Promise<void> {
    const results = await parallelExecutor.execute(this.suites, this.config.parallel!);
    this.results.push(...results);
  }

  /**
   * Run a single test suite
   */
  private async runSuite(suite: TestSuite): Promise<TestSuiteResult> {
    this.emit('suite-start', { name: suite.name });

    const startTime = Date.now();
    const testResults: TestResult[] = [];

    // Run setup if provided
    if (suite.config?.setup) {
      await suite.config.setup();
    }

    // Run each test
    for (const test of suite.tests) {
      const result = await this.runTest(test, suite);
      testResults.push(result);
    }

    // Run teardown if provided
    if (suite.config?.teardown) {
      await suite.config.teardown();
    }

    const duration = Date.now() - startTime;

    const suiteResult: TestSuiteResult = {
      name: suite.name,
      tests: testResults,
      duration,
      passed: testResults.filter((t) => t.status === 'passed').length,
      failed: testResults.filter((t) => t.status === 'failed').length,
      skipped: testResults.filter((t) => t.status === 'skipped').length,
    };

    this.emit('suite-complete', suiteResult);

    return suiteResult;
  }

  /**
   * Run a single test
   */
  private async runTest(test: TestCase, suite: TestSuite): Promise<TestResult> {
    const config = test.config;
    const startTime = Date.now();
    let status: TestStatus = 'passed';
    let error: TestResult['error'] = undefined;
    let retries = 0;

    // Skip if marked
    if (config?.skip) {
      return {
        name: test.name,
        status: 'skipped',
        duration: 0,
        retries: 0,
      };
    }

    // Run beforeEach if provided
    if (suite.config?.beforeEach) {
      await suite.config.beforeEach();
    }

    // Run with retries
    for (let i = 0; i <= (config?.retries || 0); i++) {
      try {
        status = 'running';
        this.emit('test-start', { name: test.name, suite: suite.name });

        const timeout = config?.timeout || suite.config?.timeout || 5000;
        await this.runWithTimeout(test.fn, timeout);

        status = 'passed';
        break;
      } catch (err) {
        retries = i;
        status = 'failed';
        error = {
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        };

        if (i < (config?.retries || 0)) {
          // Retry
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    }

    // Run afterEach if provided
    if (suite.config?.afterEach) {
      await suite.config.afterEach();
    }

    const duration = Date.now() - startTime;

    const result: TestResult = {
      name: test.name,
      status,
      duration,
      error,
      retries,
    };

    this.emit('test-complete', result);

    return result;
  }

  /**
   * Run a function with timeout
   */
  private async runWithTimeout(fn: () => Promise<void> | void, timeout: number): Promise<void> {
    return Promise.race([
      Promise.resolve(fn()),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error(`Test timed out after ${timeout}ms`)), timeout)
      ),
    ]);
  }

  /**
   * Get all results
   */
  getResults(): TestSuiteResult[] {
    return this.results;
  }

  /**
   * Clear all suites and results
   */
  reset(): void {
    this.suites = [];
    this.results = [];
  }
}

export type { TestRunnerConfig };
