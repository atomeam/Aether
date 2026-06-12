/**
 * Tests for VisualRegression
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { visualRegression } from '../src/visual.js';
import { promises as fs } from 'fs';
import { join } from 'path';

describe('VisualRegression', () => {
  const testDirs = {
    screenshot: '__test_screenshots__',
    baseline: '__test_baselines__',
    diff: '__test_diffs__',
  };

  beforeEach(async () => {
    visualRegression['config'] = {
      ...visualRegression['config'],
      screenshotDirectory: testDirs.screenshot,
      baselineDirectory: testDirs.baseline,
      diffDirectory: testDirs.diff,
    };

    for (const dir of Object.values(testDirs)) {
      await fs.mkdir(dir, { recursive: true });
    }
  });

  afterEach(async () => {
    for (const dir of Object.values(testDirs)) {
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  });

  it('should create baseline when none exists', async () => {
    const image = Buffer.from('test-image');

    const result = await visualRegression.compare('test-1', image);

    expect(result.passed).toBe(true);
    expect(result.diffPixels).toBe(0);
    expect(result.diffPercentage).toBe(0);
  });

  it('should compare against existing baseline', async () => {
    const image = Buffer.from('test-image');

    // Create baseline
    await visualRegression.compare('test-1', image);

    // Compare with same image
    const result = await visualRegression.compare('test-1', image);

    expect(result.passed).toBe(true);
  });

  it('should detect differences', async () => {
    const image1 = Buffer.from('test-image-1');
    const image2 = Buffer.from('test-image-2');

    // Create baseline
    await visualRegression.compare('test-1', image1);

    // Compare with different image
    const result = await visualRegression.compare('test-1', image2);

    expect(result).toBeDefined();
    expect(result.diffPixels).toBeGreaterThanOrEqual(0);
    expect(result.diffPercentage).toBeGreaterThanOrEqual(0);
  });

  it('should update baseline', async () => {
    const image1 = Buffer.from('test-image-1');
    const image2 = Buffer.from('test-image-2');

    // Create baseline
    await visualRegression.compare('test-1', image1);

    // Update baseline
    await visualRegression.updateBaseline('test-1', image2);

    // Verify update
    const result = await visualRegression.compare('test-1', image2);
    expect(result.passed).toBe(true);
  });

  it('should remove baseline', async () => {
    const image = Buffer.from('test-image');

    // Create baseline
    await visualRegression.compare('test-1', image);

    // Remove baseline
    await visualRegression.removeBaseline('test-1');

    // Verify removal
    const baselines = await visualRegression.getBaselines();
    expect(baselines).not.toContain('test-1');
  });

  it('should get all baselines', async () => {
    const image = Buffer.from('test-image');

    await visualRegression.compare('test-1', image);
    await visualRegression.compare('test-2', image);
    await visualRegression.compare('test-3', image);

    const baselines = await visualRegression.getBaselines();

    expect(baselines).toHaveLength(3);
    expect(baselines).toContain('test-1');
    expect(baselines).toContain('test-2');
    expect(baselines).toContain('test-3');
  });

  it('should respect threshold', async () => {
    visualRegression['config'].threshold = 0.5; // 50% threshold

    const image1 = Buffer.from('test-image-1');
    const image2 = Buffer.from('test-image-2');

    // Create baseline
    await visualRegression.compare('test-1', image1);

    // Compare with different image
    const result = await visualRegression.compare('test-1', image2);

    expect(result.threshold).toBe(0.5);
  });
});
