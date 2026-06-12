/**
 * Local filesystem storage adapter
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { BaseStorage } from '../storage';
import type {
  StorageConfig,
  FileMetadata,
  UploadOptions,
  DownloadOptions,
  PresignedUrlOptions,
  ListOptions,
  ListResult,
  DeleteOptions,
  CopyOptions,
  HealthCheckResult,
} from '../types/index';

export class LocalAdapter extends BaseStorage {
  private basePath: string;

  constructor(config: StorageConfig) {
    super(config);
    this.basePath = config.basePath || './storage';
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await fs.mkdir(this.basePath, { recursive: true });
      this.initialized = true;
    } catch (error) {
      this.handleError(error);
    }
  }

  async upload(key: string, data: Buffer | Uint8Array | string | ReadableStream, options?: UploadOptions): Promise<FileMetadata> {
    if (!this.initialized) {
      throw new Error('Storage not initialized');
    }

    const normalizedKey = this.normalizeKey(key);
    const filePath = join(this.basePath, normalizedKey);
    const buffer = data instanceof Buffer ? data : Buffer.from(data as string);

    try {
      await fs.mkdir(dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, buffer);

      const stats = await fs.stat(filePath);

      return {
        key,
        size: stats.size,
        contentType: options?.contentType || 'application/octet-stream',
        lastModified: stats.mtime,
        metadata: options?.metadata,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async download(key: string, options?: DownloadOptions): Promise<Buffer> {
    if (!this.initialized) {
      throw new Error('Storage not initialized');
    }

    const normalizedKey = this.normalizeKey(key);
    const filePath = join(this.basePath, normalizedKey);

    try {
      let buffer = await fs.readFile(filePath);

      if (options?.range) {
        const [start, end] = options.range.split('-').map(Number);
        buffer = buffer.slice(start, end ? end + 1 : undefined);
      }

      return buffer;
    } catch (error) {
      this.handleError(error);
    }
  }

  async delete(key: string, _options?: DeleteOptions): Promise<void> {
    if (!this.initialized) {
      throw new Error('Storage not initialized');
    }

    const normalizedKey = this.normalizeKey(key);
    const filePath = join(this.basePath, normalizedKey);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      this.handleError(error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    const normalizedKey = this.normalizeKey(key);
    const filePath = join(this.basePath, normalizedKey);

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(key: string, _versionId?: string): Promise<FileMetadata> {
    if (!this.initialized) {
      throw new Error('Storage not initialized');
    }

    const normalizedKey = this.normalizeKey(key);
    const filePath = join(this.basePath, normalizedKey);

    try {
      const stats = await fs.stat(filePath);

      return {
        key,
        size: stats.size,
        contentType: 'application/octet-stream',
        lastModified: stats.mtime,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async list(options?: ListOptions): Promise<ListResult> {
    if (!this.initialized) {
      throw new Error('Storage not initialized');
    }

    const prefix = options?.prefix ? this.normalizeKey(options.prefix) : '';
    const searchPath = join(this.basePath, prefix);
    const delimiter = options?.delimiter || '/';
    const maxKeys = options?.maxKeys || 1000;

    try {
      const files: FileMetadata[] = [];
      const commonPrefixes: Set<string> = new Set();
      let count = 0;

      const walkDir = async (dir: string, currentPrefix: string) => {
        if (count >= maxKeys) return;

        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (count >= maxKeys) break;

          const fullPath = join(dir, entry.name);
          const relativePath = join(currentPrefix, entry.name);

          if (entry.isDirectory()) {
            if (delimiter) {
              commonPrefixes.add(relativePath + delimiter);
            } else {
              await walkDir(fullPath, relativePath);
            }
          } else {
            const stats = await fs.stat(fullPath);
            files.push({
              key: relativePath,
              size: stats.size,
              contentType: 'application/octet-stream',
              lastModified: stats.mtime,
            });
            count++;
          }
        }
      };

      await walkDir(searchPath, prefix);

      return {
        files,
        commonPrefixes: Array.from(commonPrefixes),
        isTruncated: count >= maxKeys,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async copy(sourceKey: string, destinationKey: string, _options?: CopyOptions): Promise<FileMetadata> {
    if (!this.initialized) {
      throw new Error('Storage not initialized');
    }

    const normalizedSourceKey = this.normalizeKey(sourceKey);
    const normalizedDestKey = this.normalizeKey(destinationKey);
    const sourcePath = join(this.basePath, normalizedSourceKey);
    const destPath = join(this.basePath, normalizedDestKey);

    try {
      await fs.mkdir(dirname(destPath), { recursive: true });
      await fs.copyFile(sourcePath, destPath);
      return this.getMetadata(destinationKey);
    } catch (error) {
      this.handleError(error);
    }
  }

  async move(sourceKey: string, destinationKey: string, _options?: CopyOptions): Promise<FileMetadata> {
    if (!this.initialized) {
      throw new Error('Storage not initialized');
    }

    const normalizedSourceKey = this.normalizeKey(sourceKey);
    const normalizedDestKey = this.normalizeKey(destinationKey);
    const sourcePath = join(this.basePath, normalizedSourceKey);
    const destPath = join(this.basePath, normalizedDestKey);

    try {
      await fs.mkdir(dirname(destPath), { recursive: true });
      await fs.rename(sourcePath, destPath);
      return this.getMetadata(destinationKey);
    } catch (error) {
      this.handleError(error);
    }
  }

  async getPresignedUploadUrl(key: string, _options?: PresignedUrlOptions): Promise<string> {
    // Local storage doesn't support presigned URLs
    // Return the public URL instead
    return this.getPublicUrl(key);
  }

  async getPresignedDownloadUrl(key: string, _options?: PresignedUrlOptions): Promise<string> {
    // Local storage doesn't support presigned URLs
    // Return the public URL instead
    return this.getPublicUrl(key);
  }

  async healthCheck(): Promise<HealthCheckResult> {
    if (!this.initialized) {
      return {
        status: 'unhealthy',
        latency: 0,
        error: 'Storage not initialized',
      };
    }

    try {
      const start = Date.now();
      await fs.access(this.basePath);
      const latency = Date.now() - start;

      return {
        status: 'healthy',
        latency,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
