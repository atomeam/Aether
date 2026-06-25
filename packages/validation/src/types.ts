/**
 * Core types for @aether/validation
 */

/**
 * Validation result with success/failure information
 */
export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

/**
 * Individual validation error
 */
export interface ValidationError {
  path: string;
  message: string;
  code: string;
  value?: unknown;
}

/**
 * Validation context for passing additional data
 */
export interface ValidationContext {
  /** Current path being validated */
  path: string;
  /** Additional context data */
  data?: Record<string, unknown>;
}

/**
 * Schema definition for validation
 */
export interface Schema<T = unknown> {
  /** Validate data against schema */
  validate(data: unknown, context?: ValidationContext): ValidationResult<T>;
  /** Parse data (throws on error) */
  parse(data: unknown, context?: ValidationContext): T;
  /** Safe parse (returns result) */
  safeParse(data: unknown, context?: ValidationContext): ValidationResult<T>;
}

/**
 * Business rule validator function
 */
export type BusinessRuleValidator<T> = (
  value: T,
  context?: ValidationContext
) => boolean | string | Promise<boolean | string>;

/**
 * Async validator function
 */
export type AsyncValidator<T> = (
  value: T,
  context?: ValidationContext
) => Promise<boolean | string>;

/**
 * Custom validator configuration
 */
export interface CustomValidatorConfig<T> {
  name: string;
  validate: BusinessRuleValidator<T>;
  message?: string;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  /** Stop on first error */
  abortEarly?: boolean;
  /** Strip unknown properties */
  stripUnknown?: boolean;
  /** Custom context data */
  context?: ValidationContext;
}

/**
 * Schema field definition
 */
export interface SchemaField<T = unknown> {
  required?: boolean;
  default?: T;
  validator?: Schema<T>;
  customValidators?: CustomValidatorConfig<T>[];
}

/**
 * Object schema definition
 */
export interface ObjectSchemaDefinition {
  [key: string]: SchemaField;
}
