/**
 * Snapshot testing
 */

import type { SnapshotConfig, SnapshotResult } from './types.js';
import { SnapshotConfigSchema } from './types.js';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

export class SnapshotManager {
  private config: SnapshotConfig;
  private snapshots: Map<string, string> = new Map();

  constructor(config: SnapshotConfig = {} as SnapshotConfig) {
    this.config = SnapshotConfigSchema.parse(config);
  }

  /**
   * Initialize snapshot manager
   */
  async initialize(): Promise<void> {
    const snapshotDir = this.config.directory;
    try {
      await fs.mkdir(snapshotDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }
  }

  /**
   * Match a snapshot
   */
  async match(
    testName: string,
    received: unknown,
    filePath?: string
  ): Promise<SnapshotResult> {
    await this.initialize();

    const key = this.getSnapshotKey(testName, filePath);
    const snapshotPath = this.getSnapshotPath(testName, filePath);

    // Serialize the received value
    const serialized = this.serialize(received);

    // Check if snapshot exists
    let existingSnapshot: string | null = null;
    try {
      existingSnapshot = await fs.readFile(snapshotPath, 'utf-8');
    } catch (err) {
      // Snapshot doesn't exist
    }

    if (existingSnapshot === null) {
      // New snapshot
      if (this.config.update) {
        await fs.writeFile(snapshotPath, serialized);
        return {
          name: testName,
          passed: true,
          added: true,
          updated: false,
          unmatched: false,
          expected: serialized,
          actual: serialized,
        };
      } else {
        // In non-update mode, fail for new snapshots
        return {
          name: testName,
          passed: false,
          added: true,
          updated: false,
          unmatched: false,
          expected: serialized,
          actual: serialized,
          diff: 'Snapshot does not exist. Run with --update to create it.',
        };
      }
    }

    // Compare with existing snapshot
    if (serialized === existingSnapshot) {
      return {
        name: testName,
        passed: true,
        added: false,
        updated: false,
        unmatched: false,
        expected: existingSnapshot,
        actual: serialized,
      };
    }

    // Snapshot mismatch
    if (this.config.update) {
      await fs.writeFile(snapshotPath, serialized);
      return {
        name: testName,
        passed: true,
        added: false,
        updated: true,
        unmatched: false,
        expected: existingSnapshot,
        actual: serialized,
      };
    }

    // Generate diff
    const diff = this.generateDiff(existingSnapshot, serialized);

    return {
      name: testName,
      passed: false,
      added: false,
      updated: false,
      unmatched: true,
      expected: existingSnapshot,
      actual: serialized,
      diff,
    };
  }

  /**
   * Get snapshot key
   */
  private getSnapshotKey(testName: string, filePath?: string): string {
    if (filePath) {
      return `${filePath}:${testName}`;
    }
    return testName;
  }

  /**
   * Get snapshot file path
   */
  private getSnapshotPath(testName: string, filePath?: string): string {
    const snapshotDir = this.config.directory;
    const extension = this.config.extension;

    if (this.config.inline) {
      // Inline snapshots are stored in the test file itself
      // This is a simplified implementation
      return join(snapshotDir, `${testName}${extension}`);
    }

    if (filePath) {
      const hash = createHash('md5').update(filePath).digest('hex').substring(0, 8);
      return join(snapshotDir, `${hash}${extension}`);
    }

    return join(snapshotDir, `${testName}${extension}`);
  }

  /**
   * Serialize value for snapshot
   */
  private serialize(value: unknown): string {
    if (this.config.serializer) {
      return String(this.config.serializer(value));
    }

    // Default serializer
    return JSON.stringify(value, null, 2);
  }

  /**
   * Generate diff between two strings
   */
  private generateDiff(expected: string, actual: string): string {
    const expectedLines = expected.split('\n');
    const actualLines = actual.split('\n');
    const maxLines = Math.max(expectedLines.length, actualLines.length);

    let diff = '';
    for (let i = 0; i < maxLines; i++) {
      const expectedLine = expectedLines[i] ?? '';
      const actualLine = actualLines[i] ?? '';

      if (expectedLine === actualLine) {
        diff += `  ${expectedLine}\n`;
      } else {
        if (expectedLine) {
          diff += `- ${expectedLine}\n`;
        }
        if (actualLine) {
          diff += `+ ${actualLine}\n`;
        }
      }
    }

    return diff;
  }

  /**
   * Clear all snapshots
   */
  async clear(): Promise<void> {
    this.snapshots.clear();
  }

  /**
   * Remove snapshot file
   */
  async remove(testName: string, filePath?: string): Promise<void> {
    const snapshotPath = this.getSnapshotPath(testName, filePath);
    try {
      await fs.unlink(snapshotPath);
    } catch (err) {
      // File might not exist
    }
  }
}

// Export singleton instance
export const snapshotManager = new SnapshotManager();
