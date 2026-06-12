/**
 * @aether/profiling - I/O Profiling
 * 
 * I/O profiling implementation for tracking file operations,
 * network requests, and identifying I/O bottlenecks.
 */

import type {
  IOProfile,
  IOOperation,
  IOOperationType,
  IOSummary,
  IOTypeStats,
} from './types';

// ============================================================================
// I/O Profiler
// ============================================================================

export class IOProfiler {
  private operations: IOOperation[] = [];
  private startTime: number = 0;
  private isProfiling: boolean = false;
  private maxOperations: number = 10000;

  constructor(maxOperations: number = 10000) {
    this.maxOperations = maxOperations;
  }

  start(): void {
    if (this.isProfiling) {
      return;
    }

    this.isProfiling = true;
    this.startTime = Date.now();
    this.operations = [];
  }

  stop(): IOProfile {
    if (!this.isProfiling) {
      throw new Error('I/O profiler is not running');
    }

    this.isProfiling = false;
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    const profile: IOProfile = {
      id: this.generateId(),
      startTime: this.startTime,
      endTime,
      duration,
      operations: this.operations,
      summary: this.calculateSummary(),
    };

    return profile;
  }

  recordOperation(operation: IOOperation): void {
    if (!this.isProfiling) {
      return;
    }

    if (this.operations.length >= this.maxOperations) {
      return;
    }

    this.operations.push(operation);
  }

  private calculateSummary(): IOSummary {
    if (this.operations.length === 0) {
      return {
        totalOperations: 0,
        totalBytesRead: 0,
        totalBytesWritten: 0,
        totalTransferTime: 0,
        averageOperationTime: 0,
        slowestOperations: [],
        operationsByType: {} as Record<IOOperationType, IOTypeStats>,
      };
    }

    const totalOperations = this.operations.length;
    const totalBytesRead = this.operations
      .filter(op => op.type === 'read' || op.type === 'file')
      .reduce((sum, op) => sum + op.size, 0);
    const totalBytesWritten = this.operations
      .filter(op => op.type === 'write' || op.type === 'file')
      .reduce((sum, op) => sum + op.size, 0);
    const totalTransferTime = this.operations.reduce((sum, op) => sum + op.duration, 0);
    const averageOperationTime = totalTransferTime / totalOperations;

    const slowestOperations = [...this.operations]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const operationsByType = this.calculateTypeStats();

    return {
      totalOperations,
      totalBytesRead,
      totalBytesWritten,
      totalTransferTime,
      averageOperationTime,
      slowestOperations,
      operationsByType,
    };
  }

  private calculateTypeStats(): Record<IOOperationType, IOTypeStats> {
    const stats: Partial<Record<IOOperationType, IOTypeStats>> = {};
    const types: IOOperationType[] = ['read', 'write', 'network', 'file', 'database'];

    for (const type of types) {
      const typeOps = this.operations.filter(op => op.type === type);
      const count = typeOps.length;
      const totalBytes = typeOps.reduce((sum, op) => sum + op.size, 0);
      const totalTime = typeOps.reduce((sum, op) => sum + op.duration, 0);
      const averageTime = count > 0 ? totalTime / count : 0;
      const failureCount = typeOps.filter(op => !op.success).length;
      const failureRate = count > 0 ? failureCount / count : 0;

      stats[type] = {
        count,
        totalBytes,
        totalTime,
        averageTime,
        failureRate,
      };
    }

    return stats as Record<IOOperationType, IOTypeStats>;
  }

  private generateId(): string {
    return `io-profile-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  isRunning(): boolean {
    return this.isProfiling;
  }

  getOperationCount(): number {
    return this.operations.length;
  }
}

// ============================================================================
// I/O Operation Tracker
// ============================================================================

export class IOOperationTracker {
  private profiler: IOProfiler;

  constructor(profiler: IOProfiler) {
    this.profiler = profiler;
  }

  trackFileRead(path: string, size: number, duration: number, success: boolean = true): void {
    this.profiler.recordOperation({
      id: this.generateId(),
      type: 'read',
      startTime: Date.now() - duration,
      endTime: Date.now(),
      duration,
      size,
      path,
      success,
    });
  }

  trackFileWrite(path: string, size: number, duration: number, success: boolean = true): void {
    this.profiler.recordOperation({
      id: this.generateId(),
      type: 'write',
      startTime: Date.now() - duration,
      endTime: Date.now(),
      duration,
      size,
      path,
      success,
    });
  }

  trackNetworkRequest(
    url: string,
    method: string,
    size: number,
    duration: number,
    status?: number,
    success: boolean = true,
  ): void {
    this.profiler.recordOperation({
      id: this.generateId(),
      type: 'network',
      startTime: Date.now() - duration,
      endTime: Date.now(),
      duration,
      size,
      url,
      method,
      status,
      success,
    });
  }

  trackDatabaseOperation(
    operation: string,
    duration: number,
    success: boolean = true,
  ): void {
    this.profiler.recordOperation({
      id: this.generateId(),
      type: 'database',
      startTime: Date.now() - duration,
      endTime: Date.now(),
      duration,
      size: 0,
      path: operation,
      success,
    });
  }

  private generateId(): string {
    return `io-op-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

// ============================================================================
// File I/O Wrapper
// ============================================================================

import * as fs from 'fs';
import * as fsPromises from 'fs/promises';

export class ProfiledFileSystem {
  private tracker: IOOperationTracker;

  constructor(tracker: IOOperationTracker) {
    this.tracker = tracker;
  }

  async readFile(path: string): Promise<Buffer> {
    const start = Date.now();
    try {
      const data = await fsPromises.readFile(path);
      const duration = Date.now() - start;
      this.tracker.trackFileRead(path, data.length, duration, true);
      return data;
    } catch (error) {
      const duration = Date.now() - start;
      this.tracker.trackFileRead(path, 0, duration, false);
      throw error;
    }
  }

  async writeFile(path: string, data: Buffer | string): Promise<void> {
    const start = Date.now();
    const size = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);
    try {
      await fsPromises.writeFile(path, data);
      const duration = Date.now() - start;
      this.tracker.trackFileWrite(path, size, duration, true);
    } catch (error) {
      const duration = Date.now() - start;
      this.tracker.trackFileWrite(path, size, duration, false);
      throw error;
    }
  }

  readFileSync(path: string): Buffer {
    const start = Date.now();
    try {
      const data = fs.readFileSync(path);
      const duration = Date.now() - start;
      this.tracker.trackFileRead(path, data.length, duration, true);
      return data;
    } catch (error) {
      const duration = Date.now() - start;
      this.tracker.trackFileRead(path, 0, duration, false);
      throw error;
    }
  }

  writeFileSync(path: string, data: Buffer | string): void {
    const start = Date.now();
    const size = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);
    try {
      fs.writeFileSync(path, data);
      const duration = Date.now() - start;
      this.tracker.trackFileWrite(path, size, duration, true);
    } catch (error) {
      const duration = Date.now() - start;
      this.tracker.trackFileWrite(path, size, duration, false);
      throw error;
    }
  }
}

// ============================================================================
// Network I/O Wrapper
// ============================================================================

export class ProfiledNetworkClient {
  private tracker: IOOperationTracker;

  constructor(tracker: IOOperationTracker) {
    this.tracker = tracker;
  }

  async fetch(url: string, options?: RequestInit): Promise<Response> {
    const start = Date.now();
    try {
      const response = await fetch(url, options);
      const duration = Date.now() - start;
      const size = parseInt(response.headers.get('content-length') || '0', 10);
      this.tracker.trackNetworkRequest(
        url,
        options?.method || 'GET',
        size,
        duration,
        response.status,
        response.ok,
      );
      return response;
    } catch (error) {
      const duration = Date.now() - start;
      this.tracker.trackNetworkRequest(url, options?.method || 'GET', 0, duration, undefined, false);
      throw error;
    }
  }
}

// ============================================================================
// Global I/O Profiler Instance
// ============================================================================

export const globalIOProfiler = new IOProfiler();
export const globalIOOperationTracker = new IOOperationTracker(globalIOProfiler);
export const globalProfiledFileSystem = new ProfiledFileSystem(globalIOOperationTracker);
export const globalProfiledNetworkClient = new ProfiledNetworkClient(globalIOOperationTracker);

// Convenience functions
export function startIOProfiling(): void {
  globalIOProfiler.start();
}

export function stopIOProfiling(): IOProfile {
  return globalIOProfiler.stop();
}

export function isIOProfiling(): boolean {
  return globalIOProfiler.isRunning();
}

export function trackFileRead(path: string, size: number, duration: number, success?: boolean): void {
  globalIOOperationTracker.trackFileRead(path, size, duration, success);
}

export function trackFileWrite(path: string, size: number, duration: number, success?: boolean): void {
  globalIOOperationTracker.trackFileWrite(path, size, duration, success);
}

export function trackNetworkRequest(
  url: string,
  method: string,
  size: number,
  duration: number,
  status?: number,
  success?: boolean,
): void {
  globalIOOperationTracker.trackNetworkRequest(url, method, size, duration, status, success);
}

export function trackDatabaseOperation(operation: string, duration: number, success?: boolean): void {
  globalIOOperationTracker.trackDatabaseOperation(operation, duration, success);
}
