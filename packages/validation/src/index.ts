/**
 * @aether/validation - Advanced validation library
 * 
 * Provides schema validation, business rule validation, async validation,
 * custom validators, and comprehensive error handling.
 */

// Types
export type {
  ValidationResult,
  ValidationError,
  ValidationContext,
  Schema,
  BusinessRuleValidator,
  AsyncValidator,
  CustomValidatorConfig,
  ValidationOptions,
  SchemaField,
  ObjectSchemaDefinition,
} from './types';

// Schema validators
export {
  BaseSchema,
  ValidationErrorException,
  StringSchema,
  NumberSchema,
  BooleanSchema,
  ArraySchema,
  ObjectSchema,
  UnionSchema,
  LiteralSchema,
  OptionalSchema,
  NullableSchema,
} from './schema-validator';

// Business rule validators
export {
  BusinessRuleValidatorSchema,
  AsyncValidatorSchema,
  CustomValidatorBuilder,
  CommonBusinessRules,
  CommonAsyncValidators,
} from './business-rule-validator';

// Error handlers
export {
  ValidationErrorHandler,
  EnhancedValidationError,
  FormattedValidationError,
  ErrorSeverity,
  ErrorCategory,
} from './error-handler';

// Zod schemas
export {
  ValidationErrorSchema,
  createValidationResultSchema,
  ValidationContextSchema,
  createCustomValidatorConfigSchema,
  ValidationOptionsSchema,
  createSchemaFieldSchema,
  ObjectSchemaDefinitionSchema,
  ErrorSeveritySchema,
  ErrorCategorySchema,
  FormattedValidationErrorSchema,
  CommonValidationSchemas,
  SchemaValidationResultSchema,
} from './zod-schemas';

export type {
  ValidationError as ZodValidationError,
  ValidationContext as ZodValidationContext,
  ValidationOptions as ZodValidationOptions,
  ErrorSeverity as ZodErrorSeverity,
  ErrorCategory as ZodErrorCategory,
  FormattedValidationError as ZodFormattedValidationError,
} from './zod-schemas';

// Convenience functions
export const string = () => new StringSchema();
export const number = () => new NumberSchema();
export const boolean = () => new BooleanSchema();
export const array = <T>(itemSchema: import('./schema-validator').Schema<T>) => new ArraySchema(itemSchema);
export const object = <T extends Record<string, unknown>>(definition: import('./types').ObjectSchemaDefinition) => new ObjectSchema<T>(definition);
export const union = <T>(schemas: import('./schema-validator').Schema<T>[]) => new UnionSchema(schemas);
export const literal = <T extends string | number | boolean>(value: T) => new LiteralSchema(value);
export const optional = <T>(schema: import('./schema-validator').Schema<T>) => new OptionalSchema(schema);
export const nullable = <T>(schema: import('./schema-validator').Schema<T>) => new NullableSchema(schema);
export const businessRule = <T>() => new BusinessRuleValidatorSchema<T>();
export const asyncValidator = <T>() => new AsyncValidatorSchema<T>();
export const customValidator = <T>() => new CustomValidatorBuilder<T>();
