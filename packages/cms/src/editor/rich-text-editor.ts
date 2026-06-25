/**
 * Rich Text Editor
 * Utilities for working with rich text content
 */

import type {
  RichTextContent,
  RichTextNode,
  RichTextInline,
  EditorConfig,
} from '../types/index.js';
import { RichTextContentSchema, EditorConfigSchema } from '../schemas/index.js';

export class RichTextEditor {
  private config: EditorConfig;

  constructor(config: EditorConfig) {
    this.config = EditorConfigSchema.parse(config);
  }

  /**
   * Create empty rich text content
   */
  createEmpty(): RichTextContent {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [],
        },
      ],
    };
  }

  /**
   * Parse HTML to rich text content
   */
  fromHtml(html: string): RichTextContent {
    // Simplified HTML parsing - in production, use a proper library like turndown
    const content: RichTextNode[] = [];
    
    // Split by paragraphs
    const paragraphs = html.split(/<\/?p>/).filter(p => p.trim());
    
    for (const paragraph of paragraphs) {
      if (paragraph.trim()) {
        content.push({
          type: 'paragraph',
          content: [{ type: 'text', text: paragraph.trim() }],
        });
      }
    }

    return {
      type: 'doc',
      content: content.length > 0 ? content : [{ type: 'paragraph', content: [] }],
    };
  }

  /**
   * Convert rich text content to HTML
   */
  toHtml(content: RichTextContent): string {
    const validated = RichTextContentSchema.parse(content);
    
    return validated.content
      .map(node => this.nodeToHtml(node))
      .join('\n');
  }

  /**
   * Convert rich text content to plain text
   */
  toPlainText(content: RichTextContent): string {
    const validated = RichTextContentSchema.parse(content);
    
    return validated.content
      .map(node => this.nodeToText(node))
      .join('\n');
  }

  /**
   * Get word count from rich text content
   */
  getWordCount(content: RichTextContent): number {
    const text = this.toPlainText(content);
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Get character count from rich text content
   */
  getCharacterCount(content: RichTextContent): number {
    return this.toPlainText(content).length;
  }

  /**
   * Extract all links from rich text content
   */
  extractLinks(content: RichTextContent): Array<{ href: string; text: string }> {
    const validated = RichTextContentSchema.parse(content);
    const links: Array<{ href: string; text: string }> = [];

    const extractFromNode = (node: RichTextNode) => {
      if (node.type === 'paragraph' || node.type === 'heading') {
        node.content?.forEach(inline => {
          if (inline.type === 'text' && inline.marks) {
            const linkMark = inline.marks.find(m => m.type === 'link');
            if (linkMark && 'attrs' in linkMark) {
              links.push({
                href: linkMark.attrs.href,
                text: inline.text,
              });
            }
          }
        });
      }
    };

    validated.content.forEach(extractFromNode);
    return links;
  }

  /**
   * Extract all images from rich text content
   */
  extractImages(content: RichTextContent): Array<{ src: string; alt?: string }> {
    const validated = RichTextContentSchema.parse(content);
    const images: Array<{ src: string; alt?: string }> = [];

    const extractFromNode = (node: RichTextNode) => {
      if (node.type === 'image') {
        images.push({
          src: node.attrs.src,
          alt: node.attrs.alt,
        });
      }
    };

    validated.content.forEach(extractFromNode);
    return images;
  }

  /**
   * Validate rich text content against config
   */
  validate(content: RichTextContent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const validated = RichTextContentSchema.parse(content);

    // Check max length
    if (this.config.maxLength) {
      const charCount = this.getCharacterCount(validated);
      if (charCount > this.config.maxLength) {
        errors.push(`Content exceeds maximum length of ${this.config.maxLength} characters`);
      }
    }

    // Check for unsupported features
    const usedFeatures = this.detectFeatures(validated);
    const supportedFeatures = this.config.features ?? [];
    const unsupported = usedFeatures.filter(f => !(supportedFeatures as string[]).includes(f));
    
    if (unsupported.length > 0) {
      errors.push(`Unsupported features used: ${unsupported.join(', ')}`);
    }

    return { valid: errors.length === 0, errors };
  }

  private nodeToHtml(node: RichTextNode): string {
    switch (node.type) {
      case 'paragraph':
        return `<p>${this.inlinesToHtml(node.content || [])}</p>`;
      case 'heading':
        return `<h${node.attrs.level}>${this.inlinesToHtml(node.content || [])}</h${node.attrs.level}>`;
      case 'blockquote':
        return `<blockquote>${node.content?.map(n => this.nodeToHtml(n)).join('') || ''}</blockquote>`;
      case 'codeBlock':
        return `<pre><code>${this.inlinesToHtml(node.content || [])}</code></pre>`;
      case 'bulletList':
        return `<ul>${node.content?.map(n => this.nodeToHtml(n)).join('') || ''}</ul>`;
      case 'orderedList':
        return `<ol>${node.content?.map(n => this.nodeToHtml(n)).join('') || ''}</ol>`;
      case 'listItem':
        return `<li>${node.content?.map(n => this.nodeToHtml(n)).join('') || ''}</li>`;
      case 'horizontalRule':
        return '<hr />';
      case 'image':
        return `<img src="${node.attrs.src}" alt="${node.attrs.alt || ''}" />`;
      case 'video':
        return `<video src="${node.attrs.src}" ${node.attrs.controls ? 'controls' : ''} ${node.attrs.autoplay ? 'autoplay' : ''} ${node.attrs.loop ? 'loop' : ''}></video>`;
      default:
        return '';
    }
  }

  private inlinesToHtml(inlines: RichTextInline[]): string {
    return inlines
      .map(inline => {
        if (inline.type === 'text') {
          let html = inline.text;
          if (inline.marks) {
            for (const mark of inline.marks) {
              if (mark.type === 'bold') html = `<strong>${html}</strong>`;
              if (mark.type === 'italic') html = `<em>${html}</em>`;
              if (mark.type === 'underline') html = `<u>${html}</u>`;
              if (mark.type === 'strike') html = `<s>${html}</s>`;
              if (mark.type === 'code') html = `<code>${html}</code>`;
              if (mark.type === 'link' && 'attrs' in mark) {
                html = `<a href="${mark.attrs.href}" target="${mark.attrs.target || '_self'}">${html}</a>`;
              }
            }
          }
          return html;
        }
        if (inline.type === 'hardBreak') return '<br />';
        return '';
      })
      .join('');
  }

  private nodeToText(node: RichTextNode): string {
    switch (node.type) {
      case 'paragraph':
      case 'heading':
        return this.inlinesToText(node.content || []);
      case 'blockquote':
      case 'codeBlock':
      case 'bulletList':
      case 'orderedList':
        return node.content?.map(n => this.nodeToText(n)).join(' ') || '';
      case 'listItem':
        return node.content?.map(n => this.nodeToText(n)).join(' ') || '';
      case 'horizontalRule':
        return '---';
      case 'image':
        return '[Image]';
      case 'video':
        return '[Video]';
      default:
        return '';
    }
  }

  private inlinesToText(inlines: RichTextInline[]): string {
    return inlines
      .map(inline => {
        if (inline.type === 'text') return inline.text;
        if (inline.type === 'hardBreak') return '\n';
        return '';
      })
      .join('');
  }

  private detectFeatures(content: RichTextContent): string[] {
    const features: Set<string> = new Set();

    const detectInNode = (node: RichTextNode) => {
      if (node.type === 'heading') features.add('heading');
      if (node.type === 'blockquote') features.add('blockquote');
      if (node.type === 'codeBlock') features.add('code-block');
      if (node.type === 'bulletList') features.add('bullet-list');
      if (node.type === 'orderedList') features.add('ordered-list');
      if (node.type === 'horizontalRule') features.add('horizontal-rule');
      if (node.type === 'image') features.add('image');
      if (node.type === 'video') features.add('video');

      if (node.type === 'paragraph' || node.type === 'heading') {
        node.content?.forEach(inline => {
          if (inline.type === 'text' && inline.marks) {
            inline.marks.forEach(mark => {
              if (mark.type === 'bold') features.add('bold');
              if (mark.type === 'italic') features.add('italic');
              if (mark.type === 'underline') features.add('underline');
              if (mark.type === 'strike') features.add('strike');
              if (mark.type === 'code') features.add('code');
              if (mark.type === 'link') features.add('link');
            });
          }
        });
      }
    };

    content.content.forEach(detectInNode);
    return Array.from(features);
  }
}
