/**
 * Core storage interface that all adapters must implement
 */

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
  CDNConfig,
  CDNInvalidationOptions,
  CDNInvalidationResult,
} from './index.ts';

export interface IStorage {
  /**
   * Initialize the storage adapter
   */
  initialize(): Promise<void>;

  /**
   * Upload a file
   */
  upload(key: string, data: Buffer | Uint8Array | string | ReadableStream, options?: UploadOptions): Promise<FileMetadata>;

  /**
   * Download a file
   */
  download(key: string, options?: DownloadOptions): Promise<Buffer>;

  /**
   * Delete a file
   */
  delete(key: string, options?: DeleteOptions): Promise<void>;

  /**
   * Check if a file exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get file metadata
   */
  getMetadata(key: string, versionId?: string): Promise<FileMetadata>;

  /**
   * List files
   */
  list(options?: ListOptions): Promise<ListResult>;

  /**
   * Copy a file
   */
  copy(sourceKey: string, destinationKey: string, options?: CopyOptions): Promise<FileMetadata>;

  /**
   * Move a file
   */
  move(sourceKey: string, destinationKey: string, options?: CopyOptions): Promise<FileMetadata>;

  /**
   * Generate a presigned URL for upload
   */
  getPresignedUploadUrl(key: string, options?: PresignedUrlOptions): Promise<string>;

  /**
   * Generate a presigned URL for download
   */
  getPresignedDownloadUrl(key: string, options?: PresignedUrlOptions): Promise<string>;

  /**
   * Get the public URL for a file
   */
  getPublicUrl(key: string): string;

  /**
   * Perform a health check
   */
  healthCheck(): Promise<HealthCheckResult>;

  /**
   * Get the storage configuration
   */
  getConfig(): StorageConfig;
}

export interface ICDN {
  /**
   * Invalidate CDN cache
   */
  invalidate(options: CDNInvalidationOptions): Promise<CDNInvalidationResult>;

  /**
   * Get invalidation status
   */
  getInvalidationStatus(id: string): Promise<CDNInvalidationResult>;

  /**
   * Check if CDN is enabled
   */
  isEnabled(): boolean;

  /**
   * Get CDN configuration
   */
  getConfig(): CDNConfig;
}
