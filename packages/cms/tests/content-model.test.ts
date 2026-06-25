/**
 * Content Model Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ContentModel } from '../src/models/content-model.js';
import type { ContentType, Content } from '../src/types/index.js';

describe('ContentModel', () => {
  let model: ContentModel;
  let contentType: ContentType;

  beforeEach(() => {
    model = new ContentModel();
    contentType = {
      id: 'article',
      name: 'Article',
      fields: [
        {
          id: 'title',
          name: 'Title',
          type: 'text',
          required: true,
        },
        {
          id: 'content',
          name: 'Content',
          type: 'rich-text',
          required: true,
        },
        {
          id: 'published',
          name: 'Published',
          type: 'boolean',
          required: false,
          defaultValue: false,
        },
      ],
    };
  });

  describe('Content Types', () => {
    it('should register a content type', () => {
      model.registerContentType(contentType);
      const retrieved = model.getContentType('article');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('article');
    });

    it('should list all content types', () => {
      model.registerContentType(contentType);
      const types = model.listContentTypes();
      expect(types).toHaveLength(1);
      expect(types[0].id).toBe('article');
    });

    it('should return undefined for non-existent content type', () => {
      const retrieved = model.getContentType('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Content CRUD', () => {
    beforeEach(() => {
      model.registerContentType(contentType);
    });

    it('should create content', () => {
      const content = model.createContent({
        typeId: 'article',
        fields: {
          title: 'Test Article',
          content: 'Test content',
          published: false,
        },
        status: 'draft',
        createdBy: 'user1',
        updatedBy: 'user1',
      });

      expect(content.id).toBeDefined();
      expect(content.typeId).toBe('article');
      expect(content.version).toBe(1);
      expect(content.status).toBe('draft');
    });

    it('should get content by ID', () => {
      const created = model.createContent({
        typeId: 'article',
        fields: {
          title: 'Test Article',
          content: 'Test content',
        },
        status: 'draft',
        createdBy: 'user1',
        updatedBy: 'user1',
      });

      const retrieved = model.getContent(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should update content', () => {
      const created = model.createContent({
        typeId: 'article',
        fields: {
          title: 'Test Article',
          content: 'Test content',
        },
        status: 'draft',
        createdBy: 'user1',
        updatedBy: 'user1',
      });

      const updated = model.updateContent(created.id, {
        fields: {
          title: 'Updated Article',
          content: 'Updated content',
        },
      });

      expect(updated).toBeDefined();
      expect(updated?.version).toBe(2);
      expect(updated?.fields.title).toBe('Updated Article');
    });

    it('should return null when updating non-existent content', () => {
      const result = model.updateContent('non-existent', { fields: {} });
      expect(result).toBeNull();
    });

    it('should delete content', () => {
      const created = model.createContent({
        typeId: 'article',
        fields: {
          title: 'Test Article',
          content: 'Test content',
        },
        status: 'draft',
        createdBy: 'user1',
        updatedBy: 'user1',
      });

      const deleted = model.deleteContent(created.id);
      expect(deleted).toBe(true);

      const retrieved = model.getContent(created.id);
      expect(retrieved).toBeUndefined();
    });

    it('should list content by type', () => {
      model.createContent({
        typeId: 'article',
        fields: { title: 'Article 1', content: 'Content 1' },
        status: 'draft',
        createdBy: 'user1',
        updatedBy: 'user1',
      });

      model.createContent({
        typeId: 'article',
        fields: { title: 'Article 2', content: 'Content 2' },
        status: 'draft',
        createdBy: 'user1',
        updatedBy: 'user1',
      });

      const articles = model.listContentByType('article');
      expect(articles).toHaveLength(2);
    });
  });

  describe('Field Validation', () => {
    beforeEach(() => {
      model.registerContentType(contentType);
    });

    it('should validate required fields', () => {
      const result = model.validateFields('article', {
        title: 'Test',
        // Missing required 'content' field
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Field 'Content' is required");
    });

    it('should validate field types', () => {
      const result = model.validateFields('article', {
        title: 'Test',
        content: 'Test content',
        published: 'not-a-boolean', // Invalid type
      });

      expect(result.valid).toBe(false);
    });

    it('should validate min/max for numbers', () => {
      const typeWithValidation: ContentType = {
        id: 'product',
        name: 'Product',
        fields: [
          {
            id: 'price',
            name: 'Price',
            type: 'number',
            required: true,
            validation: { min: 0, max: 1000 },
          },
        ],
      };

      model.registerContentType(typeWithValidation);

      const result = model.validateFields('product', {
        price: 1500, // Exceeds max
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Field \'Price\' must be at most 1000');
    });

    it('should validate pattern for strings', () => {
      const typeWithPattern: ContentType = {
        id: 'user',
        name: 'User',
        fields: [
          {
            id: 'email',
            name: 'Email',
            type: 'email',
            required: true,
            validation: { pattern: '^[^@]+@[^@]+\\.[^@]+$' },
          },
        ],
      };

      model.registerContentType(typeWithPattern);

      const result = model.validateFields('user', {
        email: 'invalid-email',
      });

      expect(result.valid).toBe(false);
    });

    it('should pass validation for valid fields', () => {
      const result = model.validateFields('article', {
        title: 'Test Article',
        content: 'Test content',
        published: true,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Versioning', () => {
    beforeEach(() => {
      model.registerContentType(contentType);
    });

    it('should create a version', () => {
      const content = model.createContent({
        typeId: 'article',
        fields: { title: 'Test', content: 'Content' },
        status: 'draft',
        createdBy: 'user1',
        updatedBy: 'user1',
      });

      const version = model.createVersion({
        contentId: content.id,
        version: content.version,
        fields: content.fields,
        createdBy: 'user1',
      });

      expect(version.id).toBeDefined();
      expect(version.contentId).toBe(content.id);
    });

    it('should get versions for content', () => {
      const content = model.createContent({
        typeId: 'article',
        fields: { title: 'Test', content: 'Content' },
        status: 'draft',
        createdBy: 'user1',
        updatedBy: 'user1',
      });

      model.createVersion({
        contentId: content.id,
        version: 1,
        fields: content.fields,
        createdBy: 'user1',
      });

      const versions = model.getVersions(content.id);
      expect(versions).toHaveLength(1);
    });

    it('should get specific version', () => {
      const content = model.createContent({
        typeId: 'article',
        fields: { title: 'Test', content: 'Content' },
        status: 'draft',
        createdBy: 'user1',
        updatedBy: 'user1',
      });

      model.createVersion({
        contentId: content.id,
        version: 1,
        fields: content.fields,
        createdBy: 'user1',
      });

      const version = model.getVersion(content.id, 1);
      expect(version).toBeDefined();
      expect(version?.version).toBe(1);
    });
  });
});
