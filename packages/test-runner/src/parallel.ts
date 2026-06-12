/**
 * Parallel test execution
 */

import type { TestSuite, TestSuiteResult, ParallelConfig } from './types.js';
import { ParallelConfigSchema } from './types.js';

export class ParallelExecutor {
  private config: ParallelConfig;

  constructor(config: ParallelConfig = {} as ParallelConfig) {
    this.config = ParallelConfigSchema.parse(config);
  }

  /**
   * Execute test suites in parallel
   */
  async execute(suites: TestSuite[], config?: ParallelConfig): Promise<TestSuiteResult[]> {
    const effectiveConfig = config ? ParallelConfigSchema.parse(config) : this.config;
    const maxWorkers = effectiveConfig.maxWorkers;

    // Split suites into chunks
    const chunks = this.chunkSuites(suites, maxWorkers);

    // Execute chunks in parallel
    const results: TestSuiteResult[] = [];
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map((suite) => this.executeSuite(suite, effectiveConfig))
      );
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Execute a single suite (simulated - in real implementation would use worker threads)
   */
  private async executeSuite(suite: TestSuite, config: ParallelConfig): Promise<TestSuiteResult> {
    // This is a simplified implementation
    // In a real implementation, this would spawn a worker process/thread
    const startTime = Date.now();
    const testResults = [];

    for (const test of suite.tests) {
      const testStartTime = Date.now();
      let status: 'passed' | 'failed' | 'skipped' = 'passed';
      let error: any = undefined;

      if (test.config?.skip) {
        status = 'skipped';
      } else {
        try {
          await test.fn();
        } catch (err) {
          status = 'failed';
          error = {
            message: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
          };
        }
      }

      testResults.push({
        name: test.name,
        status,
        duration: Date.now() - testStartTime,
        error,
        retries: 0,
      });
    }

    return {
      name: suite.name,
      tests: testResults,
      duration: Date.now() - startTime,
      passed: testResults.filter((t) => t.status === 'passed').length,
      failed: testResults.filter((t) => t.status === 'failed').length,
      skipped: testResults.filter((t) => t.status === 'skipped').length,
    };
  }

  /**
   * Split suites into chunks for parallel execution
   */
  private chunkSuites(suites: TestSuite[], chunkSize: number): TestSuite[][] {
    const chunks: TestSuite[][] = [];
    for (let i = 0; i < suites.length; i += chunkSize) {
      chunks.push(suites.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Get worker pool statistics
   */
  getStats() {
    return {
      maxWorkers: this.config.maxWorkers,
      isolation: this.config.isolation,
      loadBalancing: this.config.loadBalancing,
    };
  }
}

// Export singleton instance
export const parallelExecutor = new ParallelExecutor();
