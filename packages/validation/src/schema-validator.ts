/**
 * Schema validation implementation
 */

import { Schema, ValidationResult, ValidationError, ValidationContext, SchemaField, ObjectSchemaDefinition, ValidationOptions } from './types';

/**
 * Base schema validator
 */
export abstract class BaseSchema<T> implements Schema<T> {
  constructor(protected options: ValidationOptions = {}) {}

  abstract validate(data: unknown, context?: ValidationContext): ValidationResult<T>;

  parse(data: unknown, context?: ValidationContext): T {
    const result = this.validate(data, context);
    if (!result.success) {
      throw new ValidationErrorException(result.errors || []);
    }
    return result.data as T;
  }

  safeParse(data: unknown, context?: ValidationContext): ValidationResult<T> {
    return this.validate(data, context);
  }
}

/**
 * Validation error exception
 */
export class ValidationErrorException extends Error {
  constructor(public errors: ValidationError[]) {
    super('Validation failed');
    this.name = 'ValidationErrorException';
  }
}

/**
 * String schema validator
 */
export class StringSchema extends BaseSchema<string> {
  private minLength?: number;
  private maxLength?: number;
  private pattern?: RegExp;
  private customValidators: ((value: string) => boolean | string)[] = [];

  minLength(length: number): this {
    this.minLength = length;
    return this;
  }

  maxLength(length: number): this {
    this.maxLength = length;
    return this;
  }

  pattern(regex: RegExp): this {
    this.pattern = regex;
    return this;
  }

  custom(validator: (value: string) => boolean | string): this {
    this.customValidators.push(validator);
    return this;
  }

  validate(data: unknown, context?: ValidationContext): ValidationResult<string> {
    const errors: ValidationError[] = [];
    const path = context?.path || 'value';

    if (typeof data !== 'string') {
      errors.push({
        path,
        message: 'Expected string',
        code: 'invalid_type',
        value: data,
      });
      return { success: false, errors };
    }

    const value = data as string;

    if (this.minLength !== undefined && value.length < this.minLength) {
      errors.push({
        path,
        message: `String must be at least ${this.minLength} characters`,
        code: 'too_small',
        value,
      });
    }

    if (this.maxLength !== undefined && value.length > this.maxLength) {
      errors.push({
        path,
        message: `String must be at most ${this.maxLength} characters`,
        code: 'too_large',
        value,
      });
    }

    if (this.pattern && !this.pattern.test(value)) {
      errors.push({
        path,
        message: 'String does not match required pattern',
        code: 'invalid_string',
        value,
      });
    }

    for (const validator of this.customValidators) {
      const result = validator(value);
      if (result !== true) {
        errors.push({
          path,
          message: typeof result === 'string' ? result : 'Custom validation failed',
          code: 'custom',
          value,
        });
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: value };
  }
}

/**
 * Number schema validator
 */
export class NumberSchema extends BaseSchema<number> {
  private min?: number;
  private max?: number;
  private integer?: boolean;
  private positive?: boolean;
  private customValidators: ((value: number) => boolean | string)[] = [];

  min(value: number): this {
    this.min = value;
    return this;
  }

  max(value: number): this {
    this.max = value;
    return this;
  }

  integer(): this {
    this.integer = true;
    return this;
  }

  positive(): this {
    this.positive = true;
    return this;
  }

  custom(validator: (value: number) => boolean | string): this {
    this.customValidators.push(validator);
    return this;
  }

  validate(data: unknown, context?: ValidationContext): ValidationResult<number> {
    const errors: ValidationError[] = [];
    const path = context?.path || 'value';

    if (typeof data !== 'number' || isNaN(data)) {
      errors.push({
        path,
        message: 'Expected number',
        code: 'invalid_type',
        value: data,
      });
      return { success: false, errors };
    }

    const value = data as number;

    if (this.integer && !Number.isInteger(value)) {
      errors.push({
        path,
        message: 'Expected integer',
        code: 'not_integer',
        value,
      });
    }

    if (this.positive && value <= 0) {
      errors.push({
        path,
        message: 'Expected positive number',
        code: 'not_positive',
        value,
      });
    }

    if (this.min !== undefined && value < this.min) {
      errors.push({
        path,
        message: `Number must be at least ${this.min}`,
        code: 'too_small',
        value,
      });
    }

    if (this.max !== undefined && value > this.max) {
      errors.push({
        path,
        message: `Number must be at most ${this.max}`,
        code: 'too_large',
        value,
      });
    }

    for (const validator of this.customValidators) {
      const result = validator(value);
      if (result !== true) {
        errors.push({
          path,
          message: typeof result === 'string' ? result : 'Custom validation failed',
          code: 'custom',
          value,
        });
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: value };
  }
}

/**
 * Boolean schema validator
 */
export class BooleanSchema extends BaseSchema<boolean> {
  validate(data: unknown, context?: ValidationContext): ValidationResult<boolean> {
    const path = context?.path || 'value';

    if (typeof data !== 'boolean') {
      return {
        success: false,
        errors: [{
          path,
          message: 'Expected boolean',
          code: 'invalid_type',
          value: data,
        }],
      };
    }

    return { success: true, data: data as boolean };
  }
}

/**
 * Array schema validator
 */
export class ArraySchema<T> extends BaseSchema<T[]> {
  constructor(private itemSchema: Schema<T>, options?: ValidationOptions) {
    super(options);
  }

  private minLength?: number;
  private maxLength?: number;
  private unique?: boolean;

  minLength(length: number): this {
    this.minLength = length;
    return this;
  }

  maxLength(length: number): this {
    this.maxLength = length;
    return this;
  }

  unique(): this {
    this.unique = true;
    return this;
  }

  validate(data: unknown, context?: ValidationContext): ValidationResult<T[]> {
    const errors: ValidationError[] = [];
    const path = context?.path || 'value';

    if (!Array.isArray(data)) {
      errors.push({
        path,
        message: 'Expected array',
        code: 'invalid_type',
        value: data,
      });
      return { success: false, errors };
    }

    const value = data as unknown[];

    if (this.minLength !== undefined && value.length < this.minLength) {
      errors.push({
        path,
        message: `Array must have at least ${this.minLength} items`,
        code: 'too_small',
        value,
      });
    }

    if (this.maxLength !== undefined && value.length > this.maxLength) {
      errors.push({
        path,
        message: `Array must have at most ${this.maxLength} items`,
        code: 'too_large',
        value,
      });
    }

    if (this.unique) {
      const seen = new Set();
      for (const item of value) {
        const key = JSON.stringify(item);
        if (seen.has(key)) {
          errors.push({
            path,
            message: 'Array must have unique items',
            code: 'not_unique',
            value,
          });
          break;
        }
        seen.add(key);
      }
    }

    if (this.options.abortEarly && errors.length > 0) {
      return { success: false, errors };
    }

    const validatedItems: T[] = [];
    for (let i = 0; i < value.length; i++) {
      const itemPath = `${path}[${i}]`;
      const result = this.itemSchema.validate(value[i], { ...context, path: itemPath });
      
      if (!result.success) {
        errors.push(...(result.errors || []));
        if (this.options.abortEarly) {
          return { success: false, errors };
        }
      } else {
        validatedItems.push(result.data as T);
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: validatedItems };
  }
}

/**
 * Object schema validator
 */
export class ObjectSchema<T extends Record<string, unknown>> extends BaseSchema<T> {
  constructor(private definition: ObjectSchemaDefinition, options?: ValidationOptions) {
    super(options);
  }

  private strict?: boolean;

  strict(): this {
    this.strict = true;
    return this;
  }

  validate(data: unknown, context?: ValidationContext): ValidationResult<T> {
    const errors: ValidationError[] = [];
    const path = context?.path || 'value';

    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      errors.push({
        path,
        message: 'Expected object',
        code: 'invalid_type',
        value: data,
      });
      return { success: false, errors };
    }

    const value = data as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    // Check for unknown properties in strict mode
    if (this.strict) {
      for (const key of Object.keys(value)) {
        if (!(key in this.definition)) {
          errors.push({
            path: `${path}.${key}`,
            message: `Unrecognized key '${key}'`,
            code: 'unrecognized_keys',
            value: key,
          });
        }
      }
    }

    // Validate each field
    for (const [key, field] of Object.entries(this.definition)) {
      const fieldPath = `${path}.${key}`;
      const fieldValue = value[key];

      // Check required
      if (field.required && fieldValue === undefined) {
        errors.push({
          path: fieldPath,
          message: `Field '${key}' is required`,
          code: 'invalid_type',
          value: undefined,
        });
        continue;
      }

      // Use default if missing
      if (fieldValue === undefined && field.default !== undefined) {
        result[key] = field.default;
        continue;
      }

      // Skip validation if not required and undefined
      if (!field.required && fieldValue === undefined) {
        continue;
      }

      // Validate with schema if provided
      if (field.validator) {
        const fieldResult = field.validator.validate(fieldValue, { ...context, path: fieldPath });
        
        if (!fieldResult.success) {
          errors.push(...(fieldResult.errors || []));
          if (this.options.abortEarly) {
            return { success: false, errors };
          }
        } else {
          result[key] = fieldResult.data;
        }
      } else {
        result[key] = fieldValue;
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: result as T };
  }
}

/**
 * Union schema validator (one of multiple schemas)
 */
export class UnionSchema<T> extends BaseSchema<T> {
  constructor(private schemas: Schema<T>[], options?: ValidationOptions) {
    super(options);
  }

  validate(data: unknown, context?: ValidationContext): ValidationResult<T> {
    const errors: ValidationError[] = [];
    const path = context?.path || 'value';

    for (const schema of this.schemas) {
      const result = schema.validate(data, context);
      if (result.success) {
        return result;
      }
      errors.push(...(result.errors || []));
    }

    return {
      success: false,
      errors: [{
        path,
        message: 'Data does not match any of the allowed schemas',
        code: 'invalid_union',
        value: data,
      }],
    };
  }
}

/**
 * Literal schema validator (exact value match)
 */
export class LiteralSchema<T extends string | number | boolean> extends BaseSchema<T> {
  constructor(private literalValue: T, options?: ValidationOptions) {
    super(options);
  }

  validate(data: unknown, context?: ValidationContext): ValidationResult<T> {
    const path = context?.path || 'value';

    if (data !== this.literalValue) {
      return {
        success: false,
        errors: [{
          path,
          message: `Expected literal value ${JSON.stringify(this.literalValue)}`,
          code: 'invalid_literal',
          value: data,
        }],
      };
    }

    return { success: true, data: this.literalValue };
  }
}

/**
 * Optional schema wrapper
 */
export class OptionalSchema<T> extends BaseSchema<T | undefined> {
  constructor(private baseSchema: Schema<T>, options?: ValidationOptions) {
    super(options);
  }

  validate(data: unknown, context?: ValidationContext): ValidationResult<T | undefined> {
    if (data === undefined || data === null) {
      return { success: true, data: undefined };
    }
    return this.baseSchema.validate(data, context);
  }
}

/**
 * Nullable schema wrapper
 */
export class NullableSchema<T> extends BaseSchema<T | null> {
  constructor(private baseSchema: Schema<T>, options?: ValidationOptions) {
    super(options);
  }

  validate(data: unknown, context?: ValidationContext): ValidationResult<T | null> {
    if (data === null) {
      return { success: true, data: null };
    }
    return this.baseSchema.validate(data, context);
  }
}
