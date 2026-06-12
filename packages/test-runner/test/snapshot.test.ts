/**
 * Tests for SnapshotManager
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { snapshotManager } from '../src/snapshot.js';
import { promises as fs } from 'fs';
import { join } from 'path';

describe('SnapshotManager', () => {
  const testDir = '__test_snapshots__';

  beforeEach(async () => {
    snapshotManager['config'].directory = testDir;
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  it('should create new snapshot when none exists', async () => {
    snapshotManager['config'].update = true;

    const result = await snapshotManager.match('test-snapshot', { foo: 'bar' });

    expect(result.passed).toBe(true);
    expect(result.added).toBe(true);
  });

  it('should match existing snapshot', async () => {
    snapshotManager['config'].update = true;

    // Create initial snapshot
    await snapshotManager.match('test-snapshot', { foo: 'bar' });

    // Reset update flag
    snapshotManager['config'].update = false;

    // Match against existing snapshot
    const result = await snapshotManager.match('test-snapshot', { foo: 'bar' });

    expect(result.passed).toBe(true);
    expect(result.added).toBe(false);
    expect(result.updated).toBe(false);
  });

  it('should detect snapshot mismatch', async () => {
    snapshotManager['config'].update = true;

    // Create initial snapshot
    await snapshotManager.match('test-snapshot', { foo: 'bar' });

    // Reset update flag
    snapshotManager['config'].update = false;

    // Try to match with different value
    const result = await snapshotManager.match('test-snapshot', { foo: 'baz' });

    expect(result.passed).toBe(false);
    expect(result.unmatched).toBe(true);
    expect(result.diff).toBeDefined();
  });

  it('should update snapshot when update flag is set', async () => {
    snapshotManager['config'].update = true;

    // Create initial snapshot
    await snapshotManager.match('test-snapshot', { foo: 'bar' });

    // Update with new value
    const result = await snapshotManager.match('test-snapshot', { foo: 'baz' });

    expect(result.passed).toBe(true);
    expect(result.updated).toBe(true);
  });

  it('should serialize complex objects', async () => {
    snapshotManager['config'].update = true;

    const complexObject = {
      string: 'test',
      number: 42,
      boolean: true,
      array: [1, 2, 3],
      nested: { a: 1, b: 2 },
    };

    const result = await snapshotManager.match('complex-snapshot', complexObject);

    expect(result.passed).toBe(true);
    expect(result.actual).toContain('test');
    expect(result.actual).toContain('42');
  });

  it('should remove snapshot', async () => {
    snapshotManager['config'].update = true;

    // Create snapshot
    await snapshotManager.match('test-snapshot', { foo: 'bar' });

    // Remove snapshot
    await snapshotManager.remove('test-snapshot');

    // Verify it's gone
    const result = await snapshotManager.match('test-snapshot', { foo: 'bar' });
    expect(result.added).toBe(true);
  });
});
