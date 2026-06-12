/**
 * Media Manager
 * Core media management operations
 */

import type {
  MediaAsset,
  MediaFolder,
  MediaTransformation,
  MediaUploadOptions,
} from '../types/index.js';
import {
  MediaAssetSchema,
  MediaFolderSchema,
  MediaTransformationSchema,
  MediaUploadOptionsSchema,
} from '../schemas/index.js';

export class MediaManager {
  private assets: Map<string, MediaAsset> = new Map();
  private folders: Map<string, MediaFolder> = new Map();

  /**
   * Upload a media asset
   */
  async upload(
    file: File,
    options?: MediaUploadOptions
  ): Promise<MediaAsset> {
    const validatedOptions = options ? MediaUploadOptionsSchema.parse(options) : undefined;
    
    const asset: MediaAsset = {
      id: this.generateId(),
      name: file.name,
      type: this.detectMediaType(file.type),
      mimeType: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      altText: validatedOptions?.altText,
      description: validatedOptions?.description,
      tags: validatedOptions?.tags || [],
      folderId: validatedOptions?.folderId,
      uploadedBy: 'system', // In production, get from auth context
      uploadedAt: new Date(),
    };

    const validated = MediaAssetSchema.parse(asset);
    this.assets.set(validated.id, validated);
    
    return validated;
  }

  /**
   * Upload from URL
   */
  async uploadFromUrl(
    url: string,
    options?: MediaUploadOptions
  ): Promise<MediaAsset> {
    const validatedOptions = options ? MediaUploadOptionsSchema.parse(options) : undefined;
    
    // In production, fetch the file from URL
    const asset: MediaAsset = {
      id: this.generateId(),
      name: url.split('/').pop() || 'unnamed',
      type: this.detectMediaTypeFromUrl(url),
      mimeType: 'application/octet-stream',
      size: 0, // Would need to fetch to get size
      url,
      altText: validatedOptions?.altText,
      description: validatedOptions?.description,
      tags: validatedOptions?.tags || [],
      folderId: validatedOptions?.folderId,
      uploadedBy: 'system',
      uploadedAt: new Date(),
    };

    const validated = MediaAssetSchema.parse(asset);
    this.assets.set(validated.id, validated);
    
    return validated;
  }

  /**
   * Get a media asset by ID
   */
  getAsset(id: string): MediaAsset | undefined {
    return this.assets.get(id);
  }

  /**
   * Update a media asset
   */
  updateAsset(id: string, updates: Partial<MediaAsset>): MediaAsset | null {
    const existing = this.assets.get(id);
    if (!existing) return null;

    const updated: MediaAsset = {
      ...existing,
      ...updates,
      id: existing.id,
    };

    const validated = MediaAssetSchema.parse(updated);
    this.assets.set(validated.id, validated);
    
    return validated;
  }

  /**
   * Delete a media asset
   */
  deleteAsset(id: string): boolean {
    return this.assets.delete(id);
  }

  /**
   * List all assets
   */
  listAssets(filters?: {
    type?: string;
    folderId?: string;
    tags?: string[];
  }): MediaAsset[] {
    let assets = Array.from(this.assets.values());

    if (filters?.type) {
      assets = assets.filter(a => a.type === filters.type);
    }

    if (filters?.folderId) {
      assets = assets.filter(a => a.folderId === filters.folderId);
    }

    if (filters?.tags && filters.tags.length > 0) {
      assets = assets.filter(a => 
        filters.tags!.some(tag => a.tags.includes(tag))
      );
    }

    return assets;
  }

  /**
   * Search assets by name
   */
  searchAssets(query: string): MediaAsset[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.assets.values()).filter(
      a => 
        a.name.toLowerCase().includes(lowerQuery) ||
        a.altText?.toLowerCase().includes(lowerQuery) ||
        a.description?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Create a folder
   */
  createFolder(name: string, parentId?: string): MediaFolder {
    const parent = parentId ? this.folders.get(parentId) : undefined;
    const path = parent ? `${parent.path}/${name}` : name;

    const folder: MediaFolder = {
      id: this.generateId(),
      name,
      parentId,
      path,
      createdBy: 'system',
      createdAt: new Date(),
    };

    const validated = MediaFolderSchema.parse(folder);
    this.folders.set(validated.id, validated);
    
    return validated;
  }

  /**
   * Get a folder by ID
   */
  getFolder(id: string): MediaFolder | undefined {
    return this.folders.get(id);
  }

  /**
   * List all folders
   */
  listFolders(parentId?: string): MediaFolder[] {
    const folders = Array.from(this.folders.values());
    
    if (parentId) {
      return folders.filter(f => f.parentId === parentId);
    }
    
    return folders.filter(f => !f.parentId);
  }

  /**
   * Delete a folder
   */
  deleteFolder(id: string): boolean {
    // Check if folder has contents
    const hasAssets = Array.from(this.assets.values()).some(a => a.folderId === id);
    const hasSubfolders = Array.from(this.folders.values()).some(f => f.parentId === id);
    
    if (hasAssets || hasSubfolders) {
      return false;
    }
    
    return this.folders.delete(id);
  }

  /**
   * Generate a transformed URL
   */
  getTransformedUrl(assetId: string, transformation: MediaTransformation): string | null {
    const asset = this.assets.get(assetId);
    if (!asset) return null;

    const validated = MediaTransformationSchema.parse(transformation);
    
    // In production, this would generate a URL with transformation parameters
    // For now, return the original URL
    const params = new URLSearchParams();
    
    if (validated.width) params.append('w', validated.width.toString());
    if (validated.height) params.append('h', validated.height.toString());
    if (validated.quality) params.append('q', validated.quality.toString());
    if (validated.format) params.append('f', validated.format);
    if (validated.fit) params.append('fit', validated.fit);
    if (validated.grayscale) params.append('grayscale', 'true');
    if (validated.blur) params.append('blur', validated.blur.toString());
    if (validated.rotate) params.append('rotate', validated.rotate.toString());

    const queryString = params.toString();
    return queryString ? `${asset.url}?${queryString}` : asset.url;
  }

  /**
   * Get assets by tags
   */
  getAssetsByTags(tags: string[]): MediaAsset[] {
    return Array.from(this.assets.values()).filter(asset =>
      tags.some(tag => asset.tags.includes(tag))
    );
  }

  /**
   * Add tags to an asset
   */
  addTagsToAsset(assetId: string, tags: string[]): MediaAsset | null {
    const asset = this.assets.get(assetId);
    if (!asset) return null;

    const updatedTags = [...new Set([...asset.tags, ...tags])];
    return this.updateAsset(assetId, { tags: updatedTags });
  }

  /**
   * Remove tags from an asset
   */
  removeTagsFromAsset(assetId: string, tags: string[]): MediaAsset | null {
    const asset = this.assets.get(assetId);
    if (!asset) return null;

    const updatedTags = asset.tags.filter(tag => !tags.includes(tag));
    return this.updateAsset(assetId, { tags: updatedTags });
  }

  private detectMediaType(mimeType: string): MediaAsset['type'] {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
    return 'other';
  }

  private detectMediaTypeFromUrl(url: string): MediaAsset['type'] {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(extension || '')) {
      return 'image';
    }
    if (['mp4', 'webm', 'mov', 'avi'].includes(extension || '')) {
      return 'video';
    }
    if (['mp3', 'wav', 'ogg', 'flac'].includes(extension || '')) {
      return 'audio';
    }
    if (['pdf', 'doc', 'docx', 'txt'].includes(extension || '')) {
      return 'document';
    }
    
    return 'other';
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
