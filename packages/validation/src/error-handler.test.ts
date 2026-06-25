/**
 * Tests for error handlers
 */

import { describe, it, expect } from 'vitest';
import {
  ValidationErrorHandler,
  EnhancedValidationError,
  ErrorSeverity,
} from './error-handler';
import type { ValidationError } from './types';

describe('ValidationErrorHandler', () => {
  const mockErrors: ValidationError[] = [
    {
      path: 'name',
      message: 'Name is required',
      code: 'invalid_type',
      value: undefined,
    },
    {
      path: 'age',
      message: 'Age must be at least 18',
      code: 'too_small',
      value: 15,
    },
    {
      path: 'email',
      message: 'Invalid email format',
      code: 'invalid_string',
      value: 'invalid-email',
    },
  ];

  describe('formatErrors', () => {
    it('formats errors for display', () => {
      const formatted = ValidationErrorHandler.formatErrors(mockErrors);
      
      expect(formatted).toHaveLength(3);
      expect(formatted[0]).toEqual({
        field: 'name',
        message: 'Name is required',
        code: 'invalid_type',
      });
    });
  });

  describe('groupByField', () => {
    it('groups errors by field', () => {
      const errors: ValidationError[] = [
        { path: 'name', message: 'Error 1', code: 'code1' },
        { path: 'name', message: 'Error 2', code: 'code2' },
        { path: 'age', message: 'Error 3', code: 'code3' },
      ];
      
      const grouped = ValidationErrorHandler.groupByField(errors);
      
      expect(grouped.size).toBe(2);
      expect(grouped.get('name')).toHaveLength(2);
      expect(grouped.get('age')).toHaveLength(1);
    });
  });

  describe('groupByCode', () => {
    it('groups errors by code', () => {
      const errors: ValidationError[] = [
        { path: 'name', message: 'Error 1', code: 'code1' },
        { path: 'age', message: 'Error 2', code: 'code1' },
        { path: 'email', message: 'Error 3', code: 'code2' },
      ];
      
      const grouped = ValidationErrorHandler.groupByCode(errors);
      
      expect(grouped.size).toBe(2);
      expect(grouped.get('code1')).toHaveLength(2);
      expect(grouped.get('code2')).toHaveLength(1);
    });
  });

  describe('getCategory', () => {
    it('returns category for known error code', () => {
      const error: ValidationError = {
        path: 'field',
        message: 'Error',
        code: 'invalid_type',
      };
      
      const category = ValidationErrorHandler.getCategory(error);
      
      expect(category.severity).toBe(ErrorSeverity.High);
      expect(category.category).toBe('type_error');
      expect(category.fixable).toBe(false);
    });

    it('returns default category for unknown error code', () => {
      const error: ValidationError = {
        path: 'field',
        message: 'Error',
        code: 'unknown_code',
      };
      
      const category = ValidationErrorHandler.getCategory(error);
      
      expect(category.severity).toBe(ErrorSeverity.Low);
      expect(category.category).toBe('unknown');
      expect(category.fixable).toBe(false);
    });
  });

  describe('filterBySeverity', () => {
    it('filters errors by severity', () => {
      const errors: ValidationError[] = [
        { path: 'field1', message: 'Error 1', code: 'invalid_type' }, // High
        { path: 'field2', message: 'Error 2', code: 'too_small' }, // Medium
        { path: 'field3', message: 'Error 3', code: 'custom' }, // Low
      ];
      
      const highErrors = ValidationErrorHandler.filterBySeverity(errors, ErrorSeverity.High);
      
      expect(highErrors).toHaveLength(1);
      expect(highErrors[0].code).toBe('invalid_type');
    });
  });

  describe('getFixableErrors', () => {
    it('returns only fixable errors', () => {
      const errors: ValidationError[] = [
        { path: 'field1', message: 'Error 1', code: 'invalid_type' }, // Not fixable
        { path: 'field2', message: 'Error 2', code: 'too_small' }, // Fixable
      ];
      
      const fixable = ValidationErrorHandler.getFixableErrors(errors);
      
      expect(fixable).toHaveLength(1);
      expect(fixable[0].code).toBe('too_small');
    });
  });

  describe('getCriticalErrors', () => {
    it('returns critical errors', () => {
      const errors: ValidationError[] = [
        { path: 'field1', message: 'Error 1', code: 'invalid_type' },
        { path: 'field2', message: 'Error 2', code: 'too_small' },
      ];
      
      const critical = ValidationErrorHandler.getCriticalErrors(errors);
      
      expect(critical).toHaveLength(0); // No critical errors in this set
    });
  });

  describe('generateSummary', () => {
    it('generates summary for no errors', () => {
      const summary = ValidationErrorHandler.generateSummary([]);
      expect(summary).toBe('No validation errors');
    });

    it('generates summary for errors', () => {
      const summary = ValidationErrorHandler.generateSummary(mockErrors);
      expect(summary).toContain('type_error');
      expect(summary).toContain('constraint_error');
      expect(summary).toContain('format_error');
    });
  });

  describe('toMessage', () => {
    it('returns success message for valid result', () => {
      const result = { success: true };
      const message = ValidationErrorHandler.toMessage(result);
      expect(message).toBe('Validation passed');
    });

    it('returns error messages for invalid result', () => {
      const result = { success: false, errors: mockErrors };
      const message = ValidationErrorHandler.toMessage(result);
      expect(message).toContain('name: Name is required');
      expect(message).toContain('age: Age must be at least 18');
    });
  });

  describe('createReport', () => {
    it('creates detailed error report', () => {
      const report = ValidationErrorHandler.createReport(mockErrors);
      
      expect(report.total).toBe(3);
      expect(report.bySeverity).toBeDefined();
      expect(report.byCategory).toBeDefined();
      expect(report.fixable).toBeGreaterThan(0);
      expect(report.summary).toBeDefined();
    });
  });

  describe('suggestFixes', () => {
    it('suggests fixes for fixable errors', () => {
      const errors: ValidationError[] = [
        { path: 'age', message: 'Too small', code: 'too_small' },
        { path: 'name', message: 'Required', code: 'required' },
      ];
      
      const fixes = ValidationErrorHandler.suggestFixes(errors);
      
      expect(fixes.length).toBeGreaterThan(0);
      expect(fixes.some(f => f.includes('age'))).toBe(true);
      expect(fixes.some(f => f.includes('name'))).toBe(true);
    });

    it('returns empty array for non-fixable errors', () => {
      const errors: ValidationError[] = [
        { path: 'field', message: 'Error', code: 'invalid_type' },
      ];
      
      const fixes = ValidationErrorHandler.suggestFixes(errors);
      
      expect(fixes).toHaveLength(0);
    });
  });

  describe('mergeResults', () => {
    it('merges multiple validation results', () => {
      const result1 = { success: false, errors: [{ path: 'field1', message: 'Error 1', code: 'code1' }] };
      const result2 = { success: false, errors: [{ path: 'field2', message: 'Error 2', code: 'code2' }] };
      const result3 = { success: true };
      
      const merged = ValidationErrorHandler.mergeResults(result1, result2, result3);
      
      expect(merged.success).toBe(false);
      expect(merged.errors).toHaveLength(2);
    });

    it('returns success if all results are successful', () => {
      const result1 = { success: true };
      const result2 = { success: true };
      
      const merged = ValidationErrorHandler.mergeResults(result1, result2);
      
      expect(merged.success).toBe(true);
    });
  });

  describe('deduplicateErrors', () => {
    it('removes duplicate errors', () => {
      const errors: ValidationError[] = [
        { path: 'field', message: 'Error', code: 'code' },
        { path: 'field', message: 'Error', code: 'code' },
        { path: 'field', message: 'Different error', code: 'code' },
      ];
      
      const deduplicated = ValidationErrorHandler.deduplicateErrors(errors);
      
      expect(deduplicated).toHaveLength(2);
    });
  });
});

describe('EnhancedValidationError', () => {
  const mockErrors: ValidationError[] = [
    {
      path: 'name',
      message: 'Name is required',
      code: 'invalid_type',
    },
  ];

  it('creates enhanced error', () => {
    const error = new EnhancedValidationError(mockErrors);
    
    expect(error.name).toBe('EnhancedValidationError');
    expect(error.errors).toEqual(mockErrors);
  });

  it('gets formatted errors', () => {
    const error = new EnhancedValidationError(mockErrors);
    const formatted = error.getFormattedErrors();
    
    expect(formatted).toHaveLength(1);
    expect(formatted[0].field).toBe('name');
  });

  it('gets error report', () => {
    const error = new EnhancedValidationError(mockErrors);
    const report = error.getReport();
    
    expect(report.total).toBe(1);
    expect(report.summary).toBeDefined();
  });

  it('gets suggested fixes', () => {
    const error = new EnhancedValidationError(mockErrors);
    const fixes = error.getSuggestedFixes();
    
    expect(Array.isArray(fixes)).toBe(true);
  });

  it('checks if critical', () => {
    const error = new EnhancedValidationError(mockErrors);
    expect(error.isCritical()).toBe(true); // invalid_type is high severity
  });

  it('checks if fixable', () => {
    const error = new EnhancedValidationError(mockErrors);
    expect(error.isFixable()).toBe(false); // invalid_type is not fixable
  });

  it('stores context', () => {
    const context = { userId: '123' };
    const error = new EnhancedValidationError(mockErrors, context);
    
    expect(error.context).toEqual(context);
  });
});
