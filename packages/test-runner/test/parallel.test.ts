/**
 * Tests for ParallelExecutor
 */

import { describe, it, expect } from 'vitest';
import { ParallelExecutor } from '../src/parallel.js';
import type { TestSuite } from '../src/types.js';

describe('ParallelExecutor', () => {
  it('should execute suites in parallel', async () => {
    const executor = new ParallelExecutor({ maxWorkers: 2 });

    const suites: TestSuite[] = [
      {
        name: 'Suite 1',
        tests: [
          { name: 'test 1', fn: () => new Promise(resolve => setTimeout(resolve, 100)) },
          { name: 'test 2', fn: () => {} },
        ],
      },
      {
        name: 'Suite 2',
        tests: [
          { name: 'test 3', fn: () => new Promise(resolve => setTimeout(resolve, 100)) },
          { name: 'test 4', fn: () => {} },
        ],
      },
    ];

    const results = await executor.execute(suites);

    expect(results).toHaveLength(2);
    expect(results[0].name).toBe('Suite 1');
    expect(results[1].name).toBe('Suite 2');
    expect(results[0].passed).toBe(2);
    expect(results[1].passed).toBe(2);
  });

  it('should handle failing tests', async () => {
    const executor = new ParallelExecutor();

    const suite: TestSuite = {
      name: 'Suite',
      tests: [
        { name: 'passing test', fn: () => {} },
        { name: 'failing test', fn: () => { throw new Error('Failed'); } },
      ],
    };

    const results = await executor.execute([suite]);

    expect(results[0].passed).toBe(1);
    expect(results[0].failed).toBe(1);
  });

  it('should handle skipped tests', async () => {
    const executor = new ParallelExecutor();

    const suite: TestSuite = {
      name: 'Suite',
      tests: [
        { name: 'skipped test', fn: () => {}, config: { skip: true } },
      ],
    };

    const results = await executor.execute([suite]);

    expect(results[0].skipped).toBe(1);
  });

  it('should return stats', () => {
    const executor = new ParallelExecutor({
      maxWorkers: 4,
      isolation: 'process',
      loadBalancing: 'least-busy',
    });

    const stats = executor.getStats();

    expect(stats.maxWorkers).toBe(4);
    expect(stats.isolation).toBe('process');
    expect(stats.loadBalancing).toBe('least-busy');
  });
});
