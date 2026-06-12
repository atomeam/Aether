/**
 * Validation error handling utilities
 */

import { ValidationError, ValidationResult } from './types';

/**
 * Formatted validation error for user display
 */
export interface FormattedValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

/**
 * Error categorization
 */
export interface ErrorCategory {
  severity: ErrorSeverity;
  category: string;
  fixable: boolean;
}

/**
 * Error code to category mapping
 */
const ERROR_CATEGORIES: Record<string, ErrorCategory> = {
  invalid_type: {
    severity: ErrorSeverity.High,
    category: 'type_error',
    fixable: false,
  },
  too_small: {
    severity: ErrorSeverity.Medium,
    category: 'constraint_error',
    fixable: true,
  },
  too_large: {
    severity: ErrorSeverity.Medium,
    category: 'constraint_error',
    fixable: true,
  },
  invalid_string: {
    severity: ErrorSeverity.Medium,
    category: 'format_error',
    fixable: true,
  },
  not_integer: {
    severity: ErrorSeverity.Medium,
    category: 'format_error',
    fixable: true,
  },
  not_positive: {
    severity: ErrorSeverity.Medium,
    category: 'constraint_error',
    fixable: true,
  },
  custom: {
    severity: ErrorSeverity.Low,
    category: 'custom_error',
    fixable: true,
  },
  unrecognized_keys: {
    severity: ErrorSeverity.Low,
    category: 'schema_error',
    fixable: true,
  },
  invalid_union: {
    severity: ErrorSeverity.High,
    category: 'schema_error',
    fixable: false,
  },
  invalid_literal: {
    severity: ErrorSeverity.High,
    category: 'schema_error',
    fixable: false,
  },
  business_rule_failed: {
    severity: ErrorSeverity.Medium,
    category: 'business_rule',
    fixable: true,
  },
  async_validation_failed: {
    severity: ErrorSeverity.Medium,
    category: 'async_validation',
    fixable: true,
  },
  required: {
    severity: ErrorSeverity.High,
    category: 'required_field',
    fixable: true,
  },
};

/**
 * Error handler class
 */
export class ValidationErrorHandler {
  /**
   * Format validation errors for user display
   */
  static formatErrors(errors: ValidationError[]): FormattedValidationError[] {
    return errors.map(error => ({
      field: error.path,
      message: error.message,
      code: error.code,
    }));
  }

  /**
   * Group errors by field
   */
  static groupByField(errors: ValidationError[]): Map<string, ValidationError[]> {
    const grouped = new Map<string, ValidationError[]>();
    
    for (const error of errors) {
      const field = error.path;
      if (!grouped.has(field)) {
        grouped.set(field, []);
      }
      grouped.get(field)!.push(error);
    }

    return grouped;
  }

  /**
   * Group errors by code
   */
  static groupByCode(errors: ValidationError[]): Map<string, ValidationError[]> {
    const grouped = new Map<string, ValidationError[]>();
    
    for (const error of errors) {
      const code = error.code;
      if (!grouped.has(code)) {
        grouped.set(code, []);
      }
      grouped.get(code)!.push(error);
    }

    return grouped;
  }

  /**
   * Get error category
   */
  static getCategory(error: ValidationError): ErrorCategory {
    return ERROR_CATEGORIES[error.code] || {
      severity: ErrorSeverity.Low,
      category: 'unknown',
      fixable: false,
    };
  }

  /**
   * Filter errors by severity
   */
  static filterBySeverity(errors: ValidationError[], severity: ErrorSeverity): ValidationError[] {
    return errors.filter(error => {
      const category = this.getCategory(error);
      return category.severity === severity;
    });
  }

  /**
   * Get fixable errors
   */
  static getFixableErrors(errors: ValidationError[]): ValidationError[] {
    return errors.filter(error => {
      const category = this.getCategory(error);
      return category.fixable;
    });
  }

  /**
   * Get critical errors
   */
  static getCriticalErrors(errors: ValidationError[]): ValidationError[] {
    return this.filterBySeverity(errors, ErrorSeverity.Critical);
  }

  /**
   * Get high severity errors
   */
  static getHighSeverityErrors(errors: ValidationError[]): ValidationError[] {
    return this.filterBySeverity(errors, ErrorSeverity.High);
  }

  /**
   * Generate a summary of validation errors
   */
  static generateSummary(errors: ValidationError[]): string {
    if (errors.length === 0) {
      return 'No validation errors';
    }

    const grouped = this.groupByCode(errors);
    const summaries: string[] = [];

    for (const [code, codeErrors] of grouped.entries()) {
      const category = this.getCategory(codeErrors[0]);
      summaries.push(
        `${codeErrors.length} ${category.category} error(s) (${code})`
      );
    }

    return summaries.join(', ');
  }

  /**
   * Convert validation result to human-readable message
   */
  static toMessage(result: ValidationResult): string {
    if (result.success) {
      return 'Validation passed';
    }

    if (!result.errors || result.errors.length === 0) {
      return 'Validation failed with unknown error';
    }

    const formatted = this.formatErrors(result.errors);
    const messages = formatted.map(e => `${e.field}: ${e.message}`);
    return messages.join('\n');
  }

  /**
   * Create a detailed error report
   */
  static createReport(errors: ValidationError[]): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCategory: Record<string, number>;
    fixable: number;
    critical: number;
    summary: string;
  } {
    const bySeverity: Record<ErrorSeverity, number> = {
      [ErrorSeverity.Low]: 0,
      [ErrorSeverity.Medium]: 0,
      [ErrorSeverity.High]: 0,
      [ErrorSeverity.Critical]: 0,
    };

    const byCategory: Record<string, number> = {};
    let fixable = 0;
    let critical = 0;

    for (const error of errors) {
      const category = this.getCategory(error);
      
      bySeverity[category.severity]++;
      byCategory[category.category] = (byCategory[category.category] || 0) + 1;
      
      if (category.fixable) fixable++;
      if (category.severity === ErrorSeverity.Critical) critical++;
    }

    return {
      total: errors.length,
      bySeverity,
      byCategory,
      fixable,
      critical,
      summary: this.generateSummary(errors),
    };
  }

  /**
   * Suggest fixes for validation errors
   */
  static suggestFixes(errors: ValidationError[]): string[] {
    const fixes: string[] = [];

    for (const error of errors) {
      const category = this.getCategory(error);
      
      if (!category.fixable) continue;

      switch (error.code) {
        case 'too_small':
          fixes.push(`Increase the value at ${error.path}`);
          break;
        case 'too_large':
          fixes.push(`Decrease the value at ${error.path}`);
          break;
        case 'invalid_string':
          fixes.push(`Check the format of ${error.path}`);
          break;
        case 'not_integer':
          fixes.push(`Use an integer value for ${error.path}`);
          break;
        case 'not_positive':
          fixes.push(`Use a positive value for ${error.path}`);
          break;
        case 'unrecognized_keys':
          fixes.push(`Remove unrecognized field: ${error.path}`);
          break;
        case 'business_rule_failed':
          fixes.push(`Fix business rule violation at ${error.path}`);
          break;
        case 'required':
          fixes.push(`Provide a value for required field: ${error.path}`);
          break;
        default:
          fixes.push(`Review ${error.path}: ${error.message}`);
      }
    }

    return fixes;
  }

  /**
   * Merge multiple validation results
   */
  static mergeResults(...results: ValidationResult[]): ValidationResult {
    const allErrors: ValidationError[] = [];

    for (const result of results) {
      if (!result.success && result.errors) {
        allErrors.push(...result.errors);
      }
    }

    if (allErrors.length === 0) {
      return { success: true };
    }

    return { success: false, errors: allErrors };
  }

  /**
   * Deduplicate errors
   */
  static deduplicateErrors(errors: ValidationError[]): ValidationError[] {
    const seen = new Set<string>();
    const unique: ValidationError[] = [];

    for (const error of errors) {
      const key = `${error.path}:${error.code}:${error.message}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(error);
      }
    }

    return unique;
  }
}

/**
 * Validation error exception with enhanced handling
 */
export class EnhancedValidationError extends Error {
  constructor(
    public errors: ValidationError[],
    public context?: Record<string, unknown>
  ) {
    super(ValidationErrorHandler.toMessage({ success: false, errors }));
    this.name = 'EnhancedValidationError';
  }

  /**
   * Get formatted errors
   */
  getFormattedErrors(): FormattedValidationError[] {
    return ValidationErrorHandler.formatErrors(this.errors);
  }

  /**
   * Get error report
   */
  getReport() {
    return ValidationErrorHandler.createReport(this.errors);
  }

  /**
   * Get suggested fixes
   */
  getSuggestedFixes(): string[] {
    return ValidationErrorHandler.suggestFixes(this.errors);
  }

  /**
   * Check if error is critical
   */
  isCritical(): boolean {
    return ValidationErrorHandler.getCriticalErrors(this.errors).length > 0;
  }

  /**
   * Check if error is fixable
   */
  isFixable(): boolean {
    return ValidationErrorHandler.getFixableErrors(this.errors).length === this.errors.length;
  }
}
