/**
 * Media Type Definitions
 * Defines types for media management in the CMS
 */

export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'other';

export interface MediaAsset {
  id?: string;
  name?: string;
  type?: MediaType;
  mimeType?: string;
  size?: number;
  url?: string;
  thumbnailUrl?: string;
  altText?: string;
  description?: string;
  metadata?: MediaMetadata;
  uploadedBy?: string;
  uploadedAt?: Date;
  folderId?: string;
  tags?: string[];
  width?: number;
  height?: number;
  duration?: number;
}

export interface MediaMetadata {
  exif?: Record<string, unknown>;
  colors?: string[];
  faces?: number;
  videoCodec?: string;
  audioCodec?: string;
  fps?: number;
  pageCount?: number;
  author?: string;
  keywords?: string[];
}

export interface MediaFolder {
  id?: string;
  name?: string;
  parentId?: string;
  path?: string;
  createdAt?: Date;
  createdBy?: string;
}

export interface MediaTransformation {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpg' | 'png' | 'webp' | 'gif' | 'avif';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  grayscale?: boolean;
  blur?: number;
  rotate?: number;
}

export interface MediaUploadOptions {
  folderId?: string;
  altText?: string;
  description?: string;
  tags?: string[];
  transformations?: MediaTransformation;
}
