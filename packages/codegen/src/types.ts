import { z } from 'zod';

/**
 * Generator types
 */
export enum GeneratorType {
  COMPONENT = 'component',
  API_CLIENT = 'api-client',
  SCHEMA = 'schema',
  TYPE = 'type',
  BOILERPLATE = 'boilerplate',
}

/**
 * Framework types
 */
export enum Framework {
  REACT = 'react',
  VUE = 'vue',
  SVELTE = 'svelte',
  SOLID = 'solid',
  NONE = 'none',
}

/**
 * Language types
 */
export enum Language {
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
}

/**
 * Styling types
 */
export enum Styling {
  CSS = 'css',
  SCSS = 'scss',
  TAILWIND = 'tailwind',
  NONE = 'none',
}

/**
 * Zod schemas for code generation validation
 */

export const GeneratorTypeSchema = z.nativeEnum(GeneratorType);

export const FrameworkSchema = z.nativeEnum(Framework);

export const LanguageSchema = z.nativeEnum(Language);

export const StylingSchema = z.nativeEnum(Styling);

export const ComponentOptionsSchema = z.object({
  name: z.string().min(1).max(100),
  framework: FrameworkSchema,
  language: LanguageSchema,
  styling: StylingSchema,
  path: z.string().optional(),
  props: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean().default(false),
    defaultValue: z.any().optional(),
  })).optional(),
  hooks: z.array(z.string()).optional(),
  state: z.boolean().default(false),
  tests: z.boolean().default(true),
  storybook: z.boolean().default(false),
});

export type ComponentOptions = z.infer<typeof ComponentOptionsSchema>;

export const ApiClientOptionsSchema = z.object({
  name: z.string().min(1).max(100),
  baseUrl: z.string().url().optional(),
  language: LanguageSchema,
  path: z.string().optional(),
  endpoints: z.array(z.object({
    name: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
    path: z.string(),
    responseType: z.string().optional(),
    requestBody: z.string().optional(),
  })).optional(),
  auth: z.enum(['none', 'bearer', 'basic', 'api-key']).default('none'),
  errorHandling: z.boolean().default(true),
  retry: z.boolean().default(false),
  tests: z.boolean().default(true),
});

export type ApiClientOptions = z.infer<typeof ApiClientOptionsSchema>;

export const SchemaOptionsSchema = z.object({
  name: z.string().min(1).max(100),
  language: LanguageSchema,
  path: z.string().optional(),
  schemaType: z.enum(['zod', 'yup', 'joi', 'class-validator']).default('zod'),
  fields: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean().default(false),
    validation: z.any().optional(),
  })).optional(),
  exports: z.boolean().default(true),
  tests: z.boolean().default(true),
});

export type SchemaOptions = z.infer<typeof SchemaOptionsSchema>;

export const TypeOptionsSchema = z.object({
  name: z.string().min(1).max(100),
  language: LanguageSchema,
  path: z.string().optional(),
  properties: z.array(z.object({
    name: z.string(),
    type: z.string(),
    optional: z.boolean().default(false),
    readonly: z.boolean().default(false),
  })).optional(),
  exports: z.array(z.string()).optional(),
  tests: z.boolean().default(true),
});

export type TypeOptions = z.infer<typeof TypeOptionsSchema>;

export const BoilerplateOptionsSchema = z.object({
  name: z.string().min(1).max(100),
  language: LanguageSchema,
  path: z.string().optional(),
  template: z.enum(['class', 'function', 'hook', 'service', 'repository']),
  features: z.array(z.string()).optional(),
  tests: z.boolean().default(true),
});

export type BoilerplateOptions = z.infer<typeof BoilerplateOptionsSchema>;

export const GenerationOptionsSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(GeneratorType.COMPONENT),
    options: ComponentOptionsSchema,
  }),
  z.object({
    type: z.literal(GeneratorType.API_CLIENT),
    options: ApiClientOptionsSchema,
  }),
  z.object({
    type: z.literal(GeneratorType.SCHEMA),
    options: SchemaOptionsSchema,
  }),
  z.object({
    type: z.literal(GeneratorType.TYPE),
    options: TypeOptionsSchema,
  }),
  z.object({
    type: z.literal(GeneratorType.BOILERPLATE),
    options: BoilerplateOptionsSchema,
  }),
]);

export type GenerationOptions = z.infer<typeof GenerationOptionsSchema>;

export const GenerationResultSchema = z.object({
  success: z.boolean(),
  files: z.array(z.object({
    path: z.string(),
    content: z.string(),
  })),
  errors: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
});

export type GenerationResult = z.infer<typeof GenerationResultSchema>;

/**
 * Template context for Handlebars
 */
export interface TemplateContext {
  name: string;
  framework?: Framework;
  language: Language;
  styling?: Styling;
  [key: string]: any;
}

/**
 * Generator configuration
 */
export interface GeneratorConfig {
  outputPath: string;
  format: boolean;
  formatOptions?: any;
  overwrite: boolean;
  dryRun: boolean;
}
