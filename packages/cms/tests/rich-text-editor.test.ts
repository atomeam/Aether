/**
 * Rich Text Editor Tests
 */

import { describe, it, expect } from 'vitest';
import { RichTextEditor } from '../src/editor/rich-text-editor.js';
import type { RichTextContent } from '../src/types/index.js';

describe('RichTextEditor', () => {
  let editor: RichTextEditor;

  beforeEach(() => {
    editor = new RichTextEditor({
      features: ['bold', 'italic', 'link', 'heading', 'image'],
    });
  });

  describe('Content Creation', () => {
    it('should create empty content', () => {
      const content = editor.createEmpty();
      expect(content.type).toBe('doc');
      expect(content.content).toHaveLength(1);
      expect(content.content[0].type).toBe('paragraph');
    });
  });

  describe('HTML Conversion', () => {
    it('should convert HTML to rich text', () => {
      const html = '<p>Hello world</p>';
      const content = editor.fromHtml(html);
      expect(content.type).toBe('doc');
      expect(content.content[0].type).toBe('paragraph');
    });

    it('should convert rich text to HTML', () => {
      const content: RichTextContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello world' }],
          },
        ],
      };

      const html = editor.toHtml(content);
      expect(html).toContain('<p>');
      expect(html).toContain('Hello world');
    });

    it('should convert heading to HTML', () => {
      const content: RichTextContent = {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Heading' }],
          },
        ],
      };

      const html = editor.toHtml(content);
      expect(html).toContain('<h2>');
      expect(html).toContain('Heading');
    });

    it('should convert bold text to HTML', () => {
      const content: RichTextContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Bold',
                marks: [{ type: 'bold' }],
              },
            ],
          },
        ],
      };

      const html = editor.toHtml(content);
      expect(html).toContain('<strong>');
    });

    it('should convert link to HTML', () => {
      const content: RichTextContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Link',
                marks: [
                  { type: 'link', attrs: { href: 'https://example.com' } },
                ],
              },
            ],
          },
        ],
      };

      const html = editor.toHtml(content);
      expect(html).toContain('<a');
      expect(html).toContain('href="https://example.com"');
    });
  });

  describe('Plain Text Conversion', () => {
    it('should convert to plain text', () => {
      const content: RichTextContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello world' }],
          },
        ],
      };

      const text = editor.toPlainText(content);
      expect(text).toBe('Hello world');
    });

    it('should handle multiple paragraphs', () => {
      const content: RichTextContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'First' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Second' }],
          },
        ],
      };

      const text = editor.toPlainText(content);
      expect(text).toContain('First');
      expect(text).toContain('Second');
    });
  });

  describe('Word Count', () => {
    it('should count words correctly', () => {
      const content: RichTextContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello world this is a test' }],
          },
        ],
      };

      const count = editor.getWordCount(content);
      expect(count).toBe(6);
    });

    it('should handle empty content', () => {
      const content = editor.createEmpty();
      const count = editor.getWordCount(content);
      expect(count).toBe(0);
    });
  });

  describe('Character Count', () => {
    it('should count characters correctly', () => {
      const content: RichTextContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello' }],
          },
        ],
      };

      const count = editor.getCharacterCount(content);
      expect(count).toBe(5);
    });
  });

  describe('Link Extraction', () => {
    it('should extract links from content', () => {
      const content: RichTextContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Example',
                marks: [
                  { type: 'link', attrs: { href: 'https://example.com' } },
                ],
              },
            ],
          },
        ],
      };

      const links = editor.extractLinks(content);
      expect(links).toHaveLength(1);
      expect(links[0].href).toBe('https://example.com');
      expect(links[0].text).toBe('Example');
    });

    it('should return empty array when no links', () => {
      const content: RichTextContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'No links here' }],
          },
        ],
      };

      const links = editor.extractLinks(content);
      expect(links).toHaveLength(0);
    });
  });

  describe('Image Extraction', () => {
    it('should extract images from content', () => {
      const content: RichTextContent = {
        type: 'doc',
        content: [
          {
            type: 'image',
            attrs: {
              src: 'https://example.com/image.jpg',
              alt: 'Example image',
            },
          },
        ],
      };

      const images = editor.extractImages(content);
      expect(images).toHaveLength(1);
      expect(images[0].src).toBe('https://example.com/image.jpg');
      expect(images[0].alt).toBe('Example image');
    });
  });

  describe('Validation', () => {
    it('should validate content within max length', () => {
      const content: RichTextContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Short' }],
          },
        ],
      };

      const editorWithLimit = new RichTextEditor({
        features: ['bold'],
        maxLength: 100,
      });

      const result = editorWithLimit.validate(content);
      expect(result.valid).toBe(true);
    });

    it('should reject content exceeding max length', () => {
      const content: RichTextContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'a'.repeat(200) }],
          },
        ],
      };

      const editorWithLimit = new RichTextEditor({
        features: ['bold'],
        maxLength: 100,
      });

      const result = editorWithLimit.validate(content);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content exceeds maximum length');
    });

    it('should detect unsupported features', () => {
      const content: RichTextContent = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Video',
                marks: [{ type: 'bold' }],
              },
            ],
          },
          {
            type: 'video',
            attrs: { src: 'https://example.com/video.mp4' },
          },
        ],
      };

      const result = editor.validate(content);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Unsupported features used: video');
    });
  });
});
