/**
 * Tests for CoverageReporter
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CoverageReporter } from '../src/coverage.js';
import type { CoverageConfig } from '../src/types.js';

describe('CoverageReporter', () => {
  let reporter: CoverageReporter;

  beforeEach(() => {
    reporter = new CoverageReporter({ enabled: true });
  });

  it('should generate coverage report', async () => {
    const report = await reporter.generate();

    expect(report).toBeDefined();
    expect(report.statements).toBeDefined();
    expect(report.branches).toBeDefined();
    expect(report.functions).toBeDefined();
    expect(report.lines).toBeDefined();
  });

  it('should return empty report when disabled', async () => {
    const disabledReporter = new CoverageReporter({ enabled: false });
    const report = await disabledReporter.generate();

    expect(report.statements.total).toBe(0);
    expect(report.branches.total).toBe(0);
    expect(report.functions.total).toBe(0);
    expect(report.lines.total).toBe(0);
  });

  it('should enforce coverage thresholds', async () => {
    const config: CoverageConfig = {
      enabled: true,
      threshold: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    };

    const strictReporter = new CoverageReporter(config);

    // This should fail because simulated coverage is below 90%
    await expect(strictReporter.generate()).rejects.toThrow('Coverage thresholds not met');
  });

  it('should pass with appropriate thresholds', async () => {
    const config: CoverageConfig = {
      enabled: true,
      threshold: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    };

    const lenientReporter = new CoverageReporter(config);
    const report = await lenientReporter.generate();

    expect(report.statements.percentage).toBeGreaterThanOrEqual(80);
  });

  it('should include file-level coverage', async () => {
    const report = await reporter.generate();

    expect(Object.keys(report.files).length).toBeGreaterThan(0);
    expect(report.files['src/index.ts']).toBeDefined();
  });
});
