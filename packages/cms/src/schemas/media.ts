/**
 * Media Validation Schemas
 * Zod schemas for media validation
 */

import { z } from 'zod';

export const MediaTypeSchema = z.enum(['image', 'video', 'audio', 'document', 'other']);

export const MediaMetadataSchema = z.object({
  exif: z.record(z.any()).optional(),
  colors: z.array(z.string()).optional(),
  faces: z.number().optional(),
  videoCodec: z.string().optional(),
  audioCodec: z.string().optional(),
  fps: z.number().optional(),
  pageCount: z.number().optional(),
  author: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

export const MediaAssetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: MediaTypeSchema,
  mimeType: z.string().min(1),
  size: z.number().int().min(0),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  altText: z.string().optional(),
  description: z.string().optional(),
  metadata: MediaMetadataSchema.optional(),
  uploadedBy: z.string().min(1),
  uploadedAt: z.coerce.date(),
  folderId: z.string().optional(),
  tags: z.array(z.string()),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration: z.number().positive().optional(),
});

export const MediaFolderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  parentId: z.string().optional(),
  path: z.string().min(1),
  createdAt: z.coerce.date(),
  createdBy: z.string().min(1),
});

export const MediaTransformationSchema = z.object({
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  quality: z.number().int().min(1).max(100).optional(),
  format: z.enum(['jpg', 'png', 'webp', 'gif', 'avif']).optional(),
  fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).optional(),
  grayscale: z.boolean().optional(),
  blur: z.number().min(0).max(100).optional(),
  rotate: z.number().optional(),
});

export const MediaUploadOptionsSchema = z.object({
  folderId: z.string().optional(),
  altText: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  transformations: MediaTransformationSchema.optional(),
});
