/**
 * Tests for TestRunner
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TestRunner } from '../src/runner.js';
import type { TestSuite, TestCase } from '../src/types.js';

describe('TestRunner', () => {
  let runner: TestRunner;

  beforeEach(() => {
    runner = new TestRunner();
  });

  describe('basic execution', () => {
    it('should run a simple passing test', async () => {
      const testSuite: TestSuite = {
        name: 'Test Suite',
        tests: [
          {
            name: 'passing test',
            fn: () => {
              expect(true).toBe(true);
            },
          },
        ],
      };

      runner.addSuite(testSuite);
      const results = await runner.run();

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(1);
      expect(results[0].failed).toBe(0);
    });

    it('should run a failing test', async () => {
      const testSuite: TestSuite = {
        name: 'Test Suite',
        tests: [
          {
            name: 'failing test',
            fn: () => {
              throw new Error('Test failed');
            },
          },
        ],
      };

      runner.addSuite(testSuite);
      const results = await runner.run();

      expect(results).toHaveLength(1);
      expect(results[0].passed).toBe(0);
      expect(results[0].failed).toBe(1);
      expect(results[0].tests[0].error?.message).toBe('Test failed');
    });

    it('should skip a test marked with skip', async () => {
      const testSuite: TestSuite = {
        name: 'Test Suite',
        tests: [
          {
            name: 'skipped test',
            fn: () => {
              throw new Error('Should not run');
            },
            config: { skip: true },
          },
        ],
      };

      runner.addSuite(testSuite);
      const results = await runner.run();

      expect(results).toHaveLength(1);
      expect(results[0].skipped).toBe(1);
      expect(results[0].tests[0].status).toBe('skipped');
    });
  });

  describe('timeouts', () => {
    it('should timeout a long-running test', async () => {
      const testSuite: TestSuite = {
        name: 'Test Suite',
        tests: [
          {
            name: 'slow test',
            fn: () => new Promise((resolve) => setTimeout(resolve, 10000)),
            config: { timeout: 100 },
          },
        ],
      };

      runner.addSuite(testSuite);
      const results = await runner.run();

      expect(results[0].tests[0].status).toBe('failed');
      expect(results[0].tests[0].error?.message).toContain('timed out');
    });
  });

  describe('retries', () => {
    it('should retry a failing test', async () => {
      let attempts = 0;
      const testSuite: TestSuite = {
        name: 'Test Suite',
        tests: [
          {
            name: 'flaky test',
            fn: () => {
              attempts++;
              if (attempts < 2) {
                throw new Error('Failed on first attempt');
              }
            },
            config: { retries: 2 },
          },
        ],
      };

      runner.addSuite(testSuite);
      const results = await runner.run();

      expect(results[0].passed).toBe(1);
      expect(results[0].tests[0].retries).toBe(1);
    });
  });

  describe('multiple suites', () => {
    it('should run multiple test suites', async () => {
      const suite1: TestSuite = {
        name: 'Suite 1',
        tests: [
          { name: 'test 1', fn: () => {} },
          { name: 'test 2', fn: () => {} },
        ],
      };

      const suite2: TestSuite = {
        name: 'Suite 2',
        tests: [
          { name: 'test 3', fn: () => {} },
        ],
      };

      runner.addSuites([suite1, suite2]);
      const results = await runner.run();

      expect(results).toHaveLength(2);
      expect(results[0].tests).toHaveLength(2);
      expect(results[1].tests).toHaveLength(1);
    });
  });

  describe('lifecycle hooks', () => {
    it('should run setup and teardown', async () => {
      let setupRun = false;
      let teardownRun = false;

      const testSuite: TestSuite = {
        name: 'Test Suite',
        config: {
          setup: async () => {
            setupRun = true;
          },
          teardown: async () => {
            teardownRun = true;
          },
        },
        tests: [
          { name: 'test', fn: () => {} },
        ],
      };

      runner.addSuite(testSuite);
      await runner.run();

      expect(setupRun).toBe(true);
      expect(teardownRun).toBe(true);
    });

    it('should run beforeEach and afterEach', async () => {
      let beforeEachCount = 0;
      let afterEachCount = 0;

      const testSuite: TestSuite = {
        name: 'Test Suite',
        config: {
          beforeEach: async () => {
            beforeEachCount++;
          },
          afterEach: async () => {
            afterEachCount++;
          },
        },
        tests: [
          { name: 'test 1', fn: () => {} },
          { name: 'test 2', fn: () => {} },
        ],
      };

      runner.addSuite(testSuite);
      await runner.run();

      expect(beforeEachCount).toBe(2);
      expect(afterEachCount).toBe(2);
    });
  });

  describe('events', () => {
    it('should emit start event', async () => {
      let emitted = false;
      runner.on('start', () => {
        emitted = true;
      });

      runner.addSuite({
        name: 'Suite',
        tests: [{ name: 'test', fn: () => {} }],
      });

      await runner.run();
      expect(emitted).toBe(true);
    });

    it('should emit complete event', async () => {
      let emitted = false;
      runner.on('complete', () => {
        emitted = true;
      });

      runner.addSuite({
        name: 'Suite',
        tests: [{ name: 'test', fn: () => {} }],
      });

      await runner.run();
      expect(emitted).toBe(true);
    });
  });

  describe('bail on failure', () => {
    it('should stop execution after failure when bail is enabled', async () => {
      const runnerWithBail = new TestRunner({ bail: true, bailCount: 1 });

      const suite1: TestSuite = {
        name: 'Suite 1',
        tests: [
          { name: 'failing test', fn: () => { throw new Error('Failed'); } },
          { name: 'should not run', fn: () => {} },
        ],
      };

      const suite2: TestSuite = {
        name: 'Suite 2',
        tests: [
          { name: 'should not run', fn: () => {} },
        ],
      };

      runnerWithBail.addSuites([suite1, suite2]);
      const results = await runnerWithBail.run();

      expect(results[0].tests).toHaveLength(1);
      expect(results).toHaveLength(1);
    });
  });

  describe('reset', () => {
    it('should clear suites and results', async () => {
      runner.addSuite({
        name: 'Suite',
        tests: [{ name: 'test', fn: () => {} }],
      });

      await runner.run();
      expect(runner.getResults()).toHaveLength(1);

      runner.reset();
      expect(runner.getResults()).toHaveLength(0);
    });
  });
});
