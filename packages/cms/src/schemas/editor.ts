/**
 * Rich Text Editor Validation Schemas
 * Zod schemas for rich text editor validation
 */

import { z } from 'zod';

export const RichTextMarkSchema = z.union([
  z.object({ type: z.literal('bold') }),
  z.object({ type: z.literal('italic') }),
  z.object({ type: z.literal('underline') }),
  z.object({ type: z.literal('strike') }),
  z.object({ type: z.literal('code') }),
  z.object({
    type: z.literal('link'),
    attrs: z.object({
      href: z.string().url(),
      target: z.string().optional(),
    }),
  }),
]);

export const RichTextTextSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  marks: z.array(RichTextMarkSchema).optional(),
});

export const RichTextHardBreakSchema = z.object({
  type: z.literal('hardBreak'),
});

export const RichTextInlineSchema = z.union([
  RichTextTextSchema,
  RichTextHardBreakSchema,
]);

export const RichTextParagraphSchema = z.object({
  type: z.literal('paragraph'),
  content: z.array(RichTextInlineSchema).optional(),
  attrs: z.record(z.any()).optional(),
});

export const RichTextHeadingSchema = z.object({
  type: z.literal('heading'),
  attrs: z.object({
    level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
  }),
  content: z.array(RichTextInlineSchema).optional(),
});

export const RichTextBlockquoteSchema = z.object({
  type: z.literal('blockquote'),
  content: z.array(z.any()).optional(),
});

export const RichTextCodeBlockSchema = z.object({
  type: z.literal('codeBlock'),
  attrs: z.object({
    language: z.string().optional(),
  }).optional(),
  content: z.array(RichTextInlineSchema).optional(),
});

export const RichTextListItemSchema = z.object({
  type: z.literal('listItem'),
  content: z.array(z.any()).optional(),
});

export const RichTextBulletListSchema = z.object({
  type: z.literal('bulletList'),
  content: z.array(RichTextListItemSchema),
});

export const RichTextOrderedListSchema = z.object({
  type: z.literal('orderedList'),
  attrs: z.object({
    start: z.number().int().positive().optional(),
  }).optional(),
  content: z.array(RichTextListItemSchema),
});

export const RichTextHorizontalRuleSchema = z.object({
  type: z.literal('horizontalRule'),
});

export const RichTextImageSchema = z.object({
  type: z.literal('image'),
  attrs: z.object({
    src: z.string().url(),
    alt: z.string().optional(),
    title: z.string().optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  }),
});

export const RichTextVideoSchema = z.object({
  type: z.literal('video'),
  attrs: z.object({
    src: z.string().url(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    autoplay: z.boolean().optional(),
    controls: z.boolean().optional(),
    loop: z.boolean().optional(),
  }),
});

export const RichTextNodeSchema = z.union([
  RichTextParagraphSchema,
  RichTextHeadingSchema,
  RichTextBlockquoteSchema,
  RichTextCodeBlockSchema,
  RichTextBulletListSchema,
  RichTextOrderedListSchema,
  RichTextHorizontalRuleSchema,
  RichTextImageSchema,
  RichTextVideoSchema,
]);

export const RichTextContentSchema = z.object({
  type: z.literal('doc'),
  content: z.array(RichTextNodeSchema),
});

export const EditorFeatureSchema = z.enum([
  'bold',
  'italic',
  'underline',
  'strike',
  'code',
  'heading',
  'blockquote',
  'code-block',
  'bullet-list',
  'ordered-list',
  'link',
  'image',
  'video',
  'horizontal-rule',
  'table',
  'undo',
  'redo',
]);

export const EditorConfigSchema = z.object({
  features: z.array(EditorFeatureSchema),
  placeholder: z.string().optional(),
  maxLength: z.number().int().positive().optional(),
  autoFocus: z.boolean().optional(),
  readOnly: z.boolean().optional(),
  spellCheck: z.boolean().optional(),
});
