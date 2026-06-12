/**
 * Content Type Definitions
 * Defines the core types for content modeling in the CMS
 */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'rich-text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'email'
  | 'url'
  | 'slug'
  | 'media'
  | 'media-array'
  | 'json'
  | 'enum'
  | 'multi-enum'
  | 'reference'
  | 'reference-array'
  | 'component'
  | 'component-array';

export interface FieldDefinition {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  localized?: boolean;
  validation?: FieldValidation;
  defaultValue?: unknown;
  options?: FieldOptions;
}

export interface FieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  custom?: (value: unknown) => boolean | string;
}

export interface FieldOptions {
  enumValues?: string[];
  referenceTo?: string[];
  componentId?: string;
  richTextFeatures?: RichTextFeature[];
}

export type RichTextFeature =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'code'
  | 'heading'
  | 'list'
  | 'link'
  | 'image'
  | 'video'
  | 'table'
  | 'blockquote'
  | 'code-block'
  | 'horizontal-rule';

export interface ContentType {
  id: string;
  name: string;
  description?: string;
  fields: FieldDefinition[];
  displayField?: string;
  singleton?: boolean;
  draftMode?: boolean;
  versioning?: boolean;
  scheduling?: boolean;
  permissions?: ContentTypePermissions;
}

export interface ContentTypePermissions {
  read?: string[];
  create?: string[];
  update?: string[];
  delete?: string[];
  publish?: string[];
}

export interface Content {
  id: string;
  typeId: string;
  fields: Record<string, unknown>;
  status: ContentStatus;
  locale?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  publishedBy?: string;
  createdBy: string;
  updatedBy: string;
  scheduledAt?: Date;
}

export type ContentStatus = 'draft' | 'published' | 'archived' | 'scheduled';

export interface ContentVersion {
  id: string;
  contentId: string;
  version: number;
  fields: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  comment?: string;
}

export interface Component {
  id: string;
  name: string;
  fields: FieldDefinition[];
}

export interface ComponentInstance {
  componentId: string;
  fields: Record<string, unknown>;
}
