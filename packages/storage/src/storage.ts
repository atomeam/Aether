/**
 * Base storage class with common functionality
 */

import type {
  IStorage,
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
} from './types/index';
import { StorageConfigSchema } from './schemas/index';

export abstract class BaseStorage implements IStorage {
  protected config: StorageConfig;
  protected initialized: boolean = false;

  constructor(config: StorageConfig) {
    this.config = StorageConfigSchema.parse(config);
  }

  abstract initialize(): Promise<void>;
  abstract upload(key: string, data: Buffer | Uint8Array | string | ReadableStream, options?: UploadOptions): Promise<FileMetadata>;
  abstract download(key: string, options?: DownloadOptions): Promise<Buffer>;
  abstract delete(key: string, options?: DeleteOptions): Promise<void>;
  abstract exists(key: string): Promise<boolean>;
  abstract getMetadata(key: string, versionId?: string): Promise<FileMetadata>;
  abstract list(options?: ListOptions): Promise<ListResult>;
  abstract copy(sourceKey: string, destinationKey: string, options?: CopyOptions): Promise<FileMetadata>;
  abstract move(sourceKey: string, destinationKey: string, options?: CopyOptions): Promise<FileMetadata>;
  abstract getPresignedUploadUrl(key: string, options?: PresignedUrlOptions): Promise<string>;
  abstract getPresignedDownloadUrl(key: string, options?: PresignedUrlOptions): Promise<string>;
  abstract healthCheck(): Promise<HealthCheckResult>;

  getConfig(): StorageConfig {
    return { ...this.config };
  }

  getPublicUrl(key: string): string {
    if (this.config.cdnUrl) {
      return `${this.config.cdnUrl}/${this.normalizeKey(key)}`;
    }

    if (this.config.type === 'local') {
      return `/${this.normalizeKey(key)}`;
    }

    if (this.config.type === 's3' || this.config.type === 'r2') {
      const region = this.config.region || 'us-east-1';
      const bucket = this.config.bucket || '';
      return `https://${bucket}.s3.${region}.amazonaws.com/${this.normalizeKey(key)}`;
    }

    return `/${this.normalizeKey(key)}`;
  }

  protected normalizeKey(key: string): string {
    let normalized = key;
    if (this.config.basePath) {
      normalized = `${this.config.basePath}/${normalized}`;
    }
    return normalized.replace(/^\/+/, '').replace(/\/+/g, '/');
  }

  protected handleError(error: unknown): never {
    if (error instanceof Error) {
      const storageError = error as Error & { code?: string; statusCode?: number };
      throw {
        ...error,
        code: storageError.code,
        statusCode: storageError.statusCode,
      };
    }
    throw new Error(String(error));
  }
}
