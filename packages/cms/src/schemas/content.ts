/**
 * Content Validation Schemas
 * Zod schemas for content validation
 */

import { z } from 'zod';

export const FieldTypeSchema = z.enum([
  'text',
  'textarea',
  'rich-text',
  'number',
  'boolean',
  'date',
  'datetime',
  'email',
  'url',
  'slug',
  'media',
  'media-array',
  'json',
  'enum',
  'multi-enum',
  'reference',
  'reference-array',
  'component',
  'component-array',
]);

export const FieldValidationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
});

export const FieldOptionsSchema = z.object({
  enumValues: z.array(z.string()).optional(),
  referenceTo: z.array(z.string()).optional(),
  componentId: z.string().optional(),
  richTextFeatures: z.array(z.enum([
    'bold',
    'italic',
    'underline',
    'strike',
    'code',
    'heading',
    'list',
    'link',
    'image',
    'video',
    'table',
    'blockquote',
    'code-block',
    'horizontal-rule',
  ])).optional(),
});

export const FieldDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: FieldTypeSchema,
  required: z.boolean(),
  localized: z.boolean().optional(),
  validation: FieldValidationSchema.optional(),
  defaultValue: z.any().optional(),
  options: FieldOptionsSchema.optional(),
});

export const ContentTypePermissionsSchema = z.object({
  read: z.array(z.string()).optional(),
  create: z.array(z.string()).optional(),
  update: z.array(z.string()).optional(),
  delete: z.array(z.string()).optional(),
  publish: z.array(z.string()).optional(),
});

export const ContentTypeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(FieldDefinitionSchema),
  displayField: z.string().optional(),
  singleton: z.boolean().optional(),
  draftMode: z.boolean().optional(),
  versioning: z.boolean().optional(),
  scheduling: z.boolean().optional(),
  permissions: ContentTypePermissionsSchema.optional(),
});

export const ContentStatusSchema = z.enum(['draft', 'published', 'archived', 'scheduled']);

export const ContentSchema = z.object({
  id: z.string().min(1),
  typeId: z.string().min(1),
  fields: z.record(z.any()),
  status: ContentStatusSchema,
  locale: z.string().optional(),
  version: z.number().int().min(1),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  publishedAt: z.coerce.date().optional(),
  publishedBy: z.string().optional(),
  createdBy: z.string().min(1),
  updatedBy: z.string().min(1),
  scheduledAt: z.coerce.date().optional(),
});

export const ContentVersionSchema = z.object({
  id: z.string().min(1),
  contentId: z.string().min(1),
  version: z.number().int().min(1),
  fields: z.record(z.any()),
  createdBy: z.string().min(1),
  createdAt: z.coerce.date(),
  comment: z.string().optional(),
});

export const ComponentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  fields: z.array(FieldDefinitionSchema),
});

export const ComponentInstanceSchema = z.object({
  componentId: z.string().min(1),
  fields: z.record(z.any()),
});
