/**
 * Core types and interfaces for the storage abstraction layer
 */

export type StorageType = 's3' | 'local' | 'r2';

// Re-export interfaces from storage.ts
export type { IStorage, ICDN } from './storage';

export type ContentType =
  | 'text/plain'
  | 'text/html'
  | 'text/css'
  | 'text/javascript'
  | 'application/json'
  | 'application/xml'
  | 'application/pdf'
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp'
  | 'image/svg+xml'
  | 'video/mp4'
  | 'video/webm'
  | 'audio/mpeg'
  | 'audio/wav'
  | 'application/zip'
  | 'application/x-tar'
  | 'application/octet-stream';

export interface StorageConfig {
  type: StorageType;
  bucket?: string;
  region?: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  basePath?: string;
  cdnUrl?: string;
  options?: Record<string, unknown>;
}

export interface FileMetadata {
  key: string;
  size: number;
  contentType: ContentType;
  lastModified: Date;
  etag?: string;
  versionId?: string;
  metadata?: Record<string, string>;
}

export interface UploadOptions {
  contentType?: ContentType;
  metadata?: Record<string, string>;
  tags?: Record<string, string>;
  acl?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read' | 'aws-exec-read' | 'bucket-owner-read' | 'bucket-owner-full-control';
  cacheControl?: string;
  contentEncoding?: string;
  contentDisposition?: string;
}

export interface DownloadOptions {
  range?: string;
  versionId?: string;
}

export interface PresignedUrlOptions {
  expiresIn?: number;
  versionId?: string;
}

export interface ListOptions {
  prefix?: string;
  delimiter?: string;
  maxKeys?: number;
  continuationToken?: string;
}

export interface ListResult {
  files: FileMetadata[];
  commonPrefixes: string[];
  isTruncated: boolean;
  nextContinuationToken?: string;
}

export interface DeleteOptions {
  versionId?: string;
}

export interface CopyOptions {
  metadata?: Record<string, string>;
  contentType?: ContentType;
  acl?: UploadOptions['acl'];
}

export interface StorageError extends Error {
  code?: string;
  statusCode?: number;
  region?: string;
  request_id?: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency: number;
  error?: string;
}

export interface CDNConfig {
  enabled: boolean;
  provider: 'cloudflare' | 'cloudfront' | 'fastly' | 'custom';
  domain: string;
  apiKey?: string;
  options?: Record<string, unknown>;
}

export interface CDNInvalidationOptions {
  paths: string[];
  version?: string;
}

export interface CDNInvalidationResult {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
}
