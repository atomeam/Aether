/**
 * Content Model
 * Core content management operations
 */

import type {
  ContentType,
  Content,
  ContentVersion,
  FieldDefinition,
} from '../types/index.js';
import {
  ContentTypeSchema,
  ContentSchema,
  ContentVersionSchema,
} from '../schemas/index.js';

export class ContentModel {
  private contentTypes: Map<string, ContentType> = new Map();
  private content: Map<string, Content> = new Map();
  private versions: Map<string, ContentVersion[]> = new Map();

  /**
   * Register a new content type
   */
  registerContentType(contentType: ContentType): void {
    const validated = ContentTypeSchema.parse(contentType);
    this.contentTypes.set(validated.id, validated);
  }

  /**
   * Get a content type by ID
   */
  getContentType(id: string): ContentType | undefined {
    return this.contentTypes.get(id);
  }

  /**
   * List all content types
   */
  listContentTypes(): ContentType[] {
    return Array.from(this.contentTypes.values());
  }

  /**
   * Create a new content item
   */
  createContent(content: Omit<Content, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Content {
    const id = this.generateId();
    const now = new Date();
    
    const newContent: Content = {
      ...content,
      id,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    const validated = ContentSchema.parse(newContent);
    this.content.set(validated.id, validated);
    
    return validated;
  }

  /**
   * Get a content item by ID
   */
  getContent(id: string): Content | undefined {
    return this.content.get(id);
  }

  /**
   * Update a content item
   */
  updateContent(id: string, updates: Partial<Content>): Content | null {
    const existing = this.content.get(id);
    if (!existing) return null;

    const updated: Content = {
      ...existing,
      ...updates,
      id: existing.id,
      version: existing.version + 1,
      updatedAt: new Date(),
    };

    const validated = ContentSchema.parse(updated);
    this.content.set(validated.id, validated);
    
    return validated;
  }

  /**
   * Delete a content item
   */
  deleteContent(id: string): boolean {
    return this.content.delete(id);
  }

  /**
   * List content by type
   */
  listContentByType(typeId: string): Content[] {
    return Array.from(this.content.values()).filter(c => c.typeId === typeId);
  }

  /**
   * Create a content version
   */
  createVersion(version: Omit<ContentVersion, 'id' | 'createdAt'>): ContentVersion {
    const id = this.generateId();
    const now = new Date();
    
    const newVersion: ContentVersion = {
      ...version,
      id,
      createdAt: now,
    };

    const validated = ContentVersionSchema.parse(newVersion);
    
    const versions = this.versions.get(validated.contentId) || [];
    versions.push(validated);
    this.versions.set(validated.contentId, versions);
    
    return validated;
  }

  /**
   * Get versions for a content item
   */
  getVersions(contentId: string): ContentVersion[] {
    return this.versions.get(contentId) || [];
  }

  /**
   * Get a specific version
   */
  getVersion(contentId: string, version: number): ContentVersion | undefined {
    const versions = this.versions.get(contentId) || [];
    return versions.find(v => v.version === version);
  }

  /**
   * Validate content fields against content type
   */
  validateFields(typeId: string, fields: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const contentType = this.contentTypes.get(typeId);
    if (!contentType) {
      return { valid: false, errors: [`Content type ${typeId} not found`] };
    }

    const errors: string[] = [];

    for (const field of contentType.fields) {
      const value = fields[field.id];

      // Check required fields
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push(`Field '${field.name}' is required`);
        continue;
      }

      // Skip validation if field is not required and empty
      if (!field.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type validation
      if (!this.validateFieldType(field.type, value)) {
        errors.push(`Field '${field.name}' has invalid type`);
        continue;
      }

      // Custom validation
      if (field.validation) {
        if (field.validation.min !== undefined && typeof value === 'number' && value < field.validation.min) {
          errors.push(`Field '${field.name}' must be at least ${field.validation.min}`);
        }
        if (field.validation.max !== undefined && typeof value === 'number' && value > field.validation.max) {
          errors.push(`Field '${field.name}' must be at most ${field.validation.max}`);
        }
        if (field.validation.pattern && typeof value === 'string' && !new RegExp(field.validation.pattern).test(value)) {
          errors.push(`Field '${field.name}' does not match required pattern`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private validateFieldType(type: string, value: unknown): boolean {
    switch (type) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'url':
      case 'slug':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
      case 'datetime':
        return value instanceof Date || typeof value === 'string';
      case 'media':
        return typeof value === 'string' || typeof value === 'object';
      case 'media-array':
        return Array.isArray(value);
      case 'json':
        return typeof value === 'object';
      case 'enum':
        return typeof value === 'string';
      case 'multi-enum':
        return Array.isArray(value);
      case 'reference':
        return typeof value === 'string';
      case 'reference-array':
        return Array.isArray(value);
      default:
        return true;
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
