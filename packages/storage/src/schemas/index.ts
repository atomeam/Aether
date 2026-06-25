/**
 * Zod schemas for storage configuration and validation
 */

import { z } from 'zod';

export const StorageTypeSchema = z.enum(['s3', 'local', 'r2']);

export const ContentTypeSchema = z.enum([
  'text/plain',
  'text/html',
  'text/css',
  'text/javascript',
  'application/json',
  'application/xml',
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/wav',
  'application/zip',
  'application/x-tar',
  'application/octet-stream',
]);

export const StorageConfigSchema = z.object({
  type: StorageTypeSchema,
  bucket: z.string().optional(),
  region: z.string().optional(),
  endpoint: z.string().optional(),
  accessKeyId: z.string().optional(),
  secretAccessKey: z.string().optional(),
  basePath: z.string().optional(),
  cdnUrl: z.string().optional(),
  options: z.record(z.unknown()).optional(),
});

export const FileMetadataSchema = z.object({
  key: z.string(),
  size: z.number().int().min(0),
  contentType: ContentTypeSchema,
  lastModified: z.date(),
  etag: z.string().optional(),
  versionId: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

export const UploadOptionsSchema = z.object({
  contentType: ContentTypeSchema.optional(),
  metadata: z.record(z.string()).optional(),
  tags: z.record(z.string()).optional(),
  acl: z
    .enum([
      'private',
      'public-read',
      'public-read-write',
      'authenticated-read',
      'aws-exec-read',
      'bucket-owner-read',
      'bucket-owner-full-control',
    ])
    .optional(),
  cacheControl: z.string().optional(),
  contentEncoding: z.string().optional(),
  contentDisposition: z.string().optional(),
});

export const DownloadOptionsSchema = z.object({
  range: z.string().optional(),
  versionId: z.string().optional(),
});

export const PresignedUrlOptionsSchema = z.object({
  expiresIn: z.number().int().min(1).max(604800).optional().default(3600),
  versionId: z.string().optional(),
});

export const ListOptionsSchema = z.object({
  prefix: z.string().optional(),
  delimiter: z.string().optional(),
  maxKeys: z.number().int().min(1).max(1000).optional(),
  continuationToken: z.string().optional(),
});

export const ListResultSchema = z.object({
  files: z.array(FileMetadataSchema),
  commonPrefixes: z.array(z.string()),
  isTruncated: z.boolean(),
  nextContinuationToken: z.string().optional(),
});

export const DeleteOptionsSchema = z.object({
  versionId: z.string().optional(),
});

export const CopyOptionsSchema = z.object({
  metadata: z.record(z.string()).optional(),
  contentType: ContentTypeSchema.optional(),
  acl: UploadOptionsSchema.shape.acl.optional(),
});

export const HealthCheckResultSchema = z.object({
  status: z.enum(['healthy', 'unhealthy', 'degraded']),
  latency: z.number(),
  error: z.string().optional(),
});

export const CDNConfigSchema = z.object({
  enabled: z.boolean(),
  provider: z.enum(['cloudflare', 'cloudfront', 'fastly', 'custom']),
  domain: z.string(),
  apiKey: z.string().optional(),
  options: z.record(z.unknown()).optional(),
});

export const CDNInvalidationOptionsSchema = z.object({
  paths: z.array(z.string()).min(1),
  version: z.string().optional(),
});

export const CDNInvalidationResultSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
  createdAt: z.date(),
});
