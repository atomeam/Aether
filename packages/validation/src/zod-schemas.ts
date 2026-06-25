/**
 * Zod schemas for @aether/validation
 * 
 * Provides Zod schemas that mirror the validation types for interoperability
 */

import { z } from 'zod';

/**
 * Zod schema for ValidationError
 */
export const ValidationErrorSchema = z.object({
  path: z.string(),
  message: z.string(),
  code: z.string(),
  value: z.unknown().optional(),
});

/**
 * Zod schema for ValidationResult
 */
export const createValidationResultSchema = <T>(dataSchema: z.ZodType<T>) => 
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    errors: z.array(ValidationErrorSchema).optional(),
  });

/**
 * Zod schema for ValidationContext
 */
export const ValidationContextSchema = z.object({
  path: z.string(),
  data: z.record(z.unknown()).optional(),
});

/**
 * Zod schema for CustomValidatorConfig
 */
export const createCustomValidatorConfigSchema = <T>(valueSchema: z.ZodType<T>) =>
  z.object({
    name: z.string(),
    validate: z.function().args(valueSchema).returns(z.union([z.boolean(), z.string()])),
    message: z.string().optional(),
  });

/**
 * Zod schema for ValidationOptions
 */
export const ValidationOptionsSchema = z.object({
  abortEarly: z.boolean().optional(),
  stripUnknown: z.boolean().optional(),
  context: ValidationContextSchema.optional(),
});

/**
 * Zod schema for SchemaField
 */
export const createSchemaFieldSchema = <T>(dataSchema: z.ZodType<T>) =>
  z.object({
    required: z.boolean().optional(),
    default: dataSchema.optional(),
    validator: z.any().optional(), // Schema is recursive, using any for simplicity
    customValidators: z.array(z.any()).optional(),
  });

/**
 * Zod schema for ObjectSchemaDefinition
 */
export const ObjectSchemaDefinitionSchema = z.record(z.any());

/**
 * Zod schema for ErrorSeverity
 */
export const ErrorSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);

/**
 * Zod schema for ErrorCategory
 */
export const ErrorCategorySchema = z.object({
  severity: ErrorSeveritySchema,
  category: z.string(),
  fixable: z.boolean(),
});

/**
 * Zod schema for FormattedValidationError
 */
export const FormattedValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string(),
});

/**
 * Common validation schemas using Zod
 */
export const CommonValidationSchemas = {
  /**
   * Email schema
   */
  email: z.string().email('Invalid email address'),

  /**
   * URL schema
   */
  url: z.string().url('Invalid URL'),

  /**
   * UUID schema
   */
  uuid: z.string().uuid('Invalid UUID'),

  /**
   * Credit card schema (basic format)
   */
  creditCard: z.string().regex(/^\d{13,19}$/, 'Invalid credit card number'),

  /**
   * Phone number schema (basic)
   */
  phoneNumber: z.string().regex(/^\+?[\d\s-()]{10,}$/, 'Invalid phone number'),

  /**
   * ISO date schema
   */
  isoDate: z.string().datetime('Invalid ISO date format'),

  /**
   * Strong password schema
   */
  strongPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/\d/, 'Password must contain a number')
    .regex(/[@$!%*?&]/, 'Password must contain a special character'),

  /**
   * Username schema
   */
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),

  /**
   * Hex color schema
   */
  hexColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color'),

  /**
   * IPv4 schema
   */
  ipv4: z.string().regex(
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    'Invalid IPv4 address'
  ),

  /**
   * IPv6 schema
   */
  ipv6: z.string().regex(
    /^(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}$/,
    'Invalid IPv6 address'
  ),
};

/**
 * Create a schema validation result Zod schema
 */
export const SchemaValidationResultSchema = createValidationResultSchema(z.unknown());

/**
 * Type inference helpers
 */
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type ValidationContext = z.infer<typeof ValidationContextSchema>;
export type ValidationOptions = z.infer<typeof ValidationOptionsSchema>;
export type ErrorSeverity = z.infer<typeof ErrorSeveritySchema>;
export type ErrorCategory = z.infer<typeof ErrorCategorySchema>;
export type FormattedValidationError = z.infer<typeof FormattedValidationErrorSchema>;
