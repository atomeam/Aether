/**
 * Business rule validation implementation
 */

import { ValidationResult, ValidationError, ValidationContext, BusinessRuleValidator, AsyncValidator, CustomValidatorConfig } from './types';
import { BaseSchema } from './schema-validator';

/**
 * Business rule validator for complex validation logic
 */
export class BusinessRuleValidatorSchema<T> extends BaseSchema<T> {
  private rules: BusinessRuleValidator<T>[] = [];

  addRule(rule: BusinessRuleValidator<T>): this {
    this.rules.push(rule);
    return this;
  }

  validate(data: unknown, context?: ValidationContext): ValidationResult<T> {
    const errors: ValidationError[] = [];
    const path = context?.path || 'value';

    // First, validate that data is of the expected type
    if (data === undefined || data === null) {
      errors.push({
        path,
        message: 'Value is required for business rule validation',
        code: 'invalid_type',
        value: data,
      });
      return { success: false, errors };
    }

    const value = data as T;

    // Apply each business rule
    for (const rule of this.rules) {
      const result = rule(value, context);
      
      if (result !== true) {
        errors.push({
          path,
          message: typeof result === 'string' ? result : 'Business rule validation failed',
          code: 'business_rule_failed',
          value,
        });
        
        if (this.options.abortEarly) {
          return { success: false, errors };
        }
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: value };
  }
}

/**
 * Async validator for asynchronous validation logic
 */
export class AsyncValidatorSchema<T> extends BaseSchema<T> {
  private validators: AsyncValidator<T>[] = [];

  addValidator(validator: AsyncValidator<T>): this {
    this.validators.push(validator);
    return this;
  }

  async validateAsync(data: unknown, context?: ValidationContext): Promise<ValidationResult<T>> {
    const errors: ValidationError[] = [];
    const path = context?.path || 'value';

    if (data === undefined || data === null) {
      errors.push({
        path,
        message: 'Value is required for async validation',
        code: 'invalid_type',
        value: data,
      });
      return { success: false, errors };
    }

    const value = data as T;

    // Apply each async validator
    for (const validator of this.validators) {
      const result = await validator(value, context);
      
      if (result !== true) {
        errors.push({
          path,
          message: typeof result === 'string' ? result : 'Async validation failed',
          code: 'async_validation_failed',
          value,
        });
        
        if (this.options.abortEarly) {
          return { success: false, errors };
        }
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: value };
  }

  // Override validate to handle async validators
  validate(data: unknown, context?: ValidationContext): ValidationResult<T> {
    // For sync validation, we return a pending result
    // The caller should use validateAsync for async validators
    return {
      success: false,
      errors: [{
        path: context?.path || 'value',
        message: 'Use validateAsync for async validators',
        code: 'use_async_method',
        value: data,
      }],
    };
  }

  async parseAsync(data: unknown, context?: ValidationContext): Promise<T> {
    const result = await this.validateAsync(data, context);
    if (!result.success) {
      throw new Error('Async validation failed');
    }
    return result.data as T;
  }

  async safeParseAsync(data: unknown, context?: ValidationContext): Promise<ValidationResult<T>> {
    return this.validateAsync(data, context);
  }
}

/**
 * Custom validator builder
 */
export class CustomValidatorBuilder<T> {
  private validators: CustomValidatorConfig<T>[] = [];

  add(config: CustomValidatorConfig<T>): this {
    this.validators.push(config);
    return this;
  }

  addValidator(
    name: string,
    validator: BusinessRuleValidator<T>,
    message?: string
  ): this {
    this.validators.push({ name, validate: validator, message });
    return this;
  }

  build(): BusinessRuleValidatorSchema<T> {
    const schema = new BusinessRuleValidatorSchema<T>();
    
    for (const config of this.validators) {
      schema.addRule((value, context) => {
        const result = config.validate(value, context);
        if (result !== true) {
          return config.message || typeof result === 'string' ? result : `Validation failed: ${config.name}`;
        }
        return true;
      });
    }

    return schema;
  }
}

/**
 * Common business rule validators
 */
export const CommonBusinessRules = {
  /**
   * Email validation
   */
  email: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  /**
   * URL validation
   */
  url: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * UUID validation
   */
  uuid: (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },

  /**
   * Credit card validation (Luhn algorithm)
   */
  creditCard: (value: string): boolean => {
    const sanitized = value.replace(/\s/g, '');
    if (!/^\d+$/.test(sanitized) || sanitized.length < 13 || sanitized.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = sanitized.length - 1; i >= 0; i--) {
      const digit = parseInt(sanitized[i], 10);

      if (isEven) {
        const doubled = digit * 2;
        sum += doubled > 9 ? doubled - 9 : doubled;
      } else {
        sum += digit;
      }

      isEven = !isEven;
    }

    return sum % 10 === 0;
  },

  /**
   * Phone number validation (basic)
   */
  phoneNumber: (value: string): boolean => {
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    return phoneRegex.test(value);
  },

  /**
   * Date validation (ISO format)
   */
  isoDate: (value: string): boolean => {
    return !isNaN(Date.parse(value));
  },

  /**
   * Password strength validation
   */
  strongPassword: (value: string): boolean => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(value);
  },

  /**
   * Username validation (alphanumeric with underscores)
   */
  username: (value: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(value);
  },

  /**
   * Hex color validation
   */
  hexColor: (value: string): boolean => {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(value);
  },

  /**
   * IP address validation (IPv4)
   */
  ipv4: (value: string): boolean => {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(value);
  },

  /**
   * IP address validation (IPv6)
   */
  ipv6: (value: string): boolean => {
    const ipv6Regex = /^(?:[A-Fa-f0-9]{1,4}:){7}[A-Fa-f0-9]{1,4}$/;
    return ipv6Regex.test(value);
  },
};

/**
 * Async validator examples
 */
export const CommonAsyncValidators = {
  /**
   * Check if value exists in database (mock)
   */
  existsInDatabase: <T>(checkFn: (value: T) => Promise<boolean>): AsyncValidator<T> => {
    return async (value: T) => {
      const exists = await checkFn(value);
      return exists || 'Value does not exist in database';
    };
  },

  /**
   * Check if value is unique (mock)
   */
  isUnique: <T>(checkFn: (value: T) => Promise<boolean>): AsyncValidator<T> => {
    return async (value: T) => {
      const isUnique = await checkFn(value);
      return isUnique || 'Value must be unique';
    };
  },

  /**
   * Validate against external API (mock)
   */
  externalValidation: <T>(validateFn: (value: T) => Promise<boolean | string>): AsyncValidator<T> => {
    return async (value: T) => {
      return await validateFn(value);
    };
  },
};
