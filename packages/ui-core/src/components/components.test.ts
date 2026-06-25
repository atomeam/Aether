/**
 * Component schema validation tests
 */

import { describe, it, expect } from 'vitest';
import { ButtonPropsSchema } from './button';
import { InputPropsSchema, InputPropsSchema as InputSchema } from './input';
import { SelectPropsSchema, SelectPropsSchema as SelectSchema, SelectOptionSchema, SelectGroupSchema } from './select';
import { FormPropsSchema, FormPropsSchema as FormSchema, FormFieldPropsSchema, FormLabelPropsSchema } from './form';

describe('Button Props Schema', () => {
  it('validates valid button props', () => {
    const valid = {
      variant: 'primary' as const,
      size: 'md' as const,
      type: 'button' as const,
      disabled: false,
      loading: false,
    };
    
    const result = ButtonPropsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('validates button with all props', () => {
    const valid = {
      variant: 'secondary' as const,
      size: 'lg' as const,
      type: 'submit' as const,
      disabled: false,
      loading: false,
      fullWidth: true,
      iconPosition: 'left' as const,
      className: 'custom-class',
      id: 'test-button',
      'data-testid': 'button-test',
    };
    
    const result = ButtonPropsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects invalid variant', () => {
    const invalid = {
      variant: 'invalid-variant',
    };
    
    const result = ButtonPropsSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid size', () => {
    const invalid = {
      size: 'invalid-size',
    };
    
    const result = ButtonPropsSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('Input Props Schema', () => {
  it('validates valid input props', () => {
    const valid = {
      variant: 'default' as const,
      size: 'md' as const,
      type: 'text' as const,
      placeholder: 'Enter text',
      required: true,
    };
    
    const result = InputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('validates input with all props', () => {
    const valid = {
      variant: 'outlined' as const,
      size: 'lg' as const,
      type: 'email' as const,
      value: 'test@example.com',
      placeholder: 'Email',
      disabled: false,
      required: true,
      error: false,
      helperText: 'Enter your email',
      label: 'Email',
      id: 'email-input',
      name: 'email',
      autoComplete: 'email',
      maxLength: 100,
      minLength: 5,
      pattern: '^[^@]+@[^@]+\\.[^@]+$',
      className: 'custom-input',
      'data-testid': 'input-test',
    };
    
    const result = InputSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects invalid variant', () => {
    const invalid = {
      variant: 'invalid-variant',
    };
    
    const result = InputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid type', () => {
    const invalid = {
      type: 'invalid-type',
    };
    
    const result = InputSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('Select Props Schema', () => {
  it('validates valid select props with options', () => {
    const valid = {
      variant: 'default' as const,
      size: 'md' as const,
      placeholder: 'Select option',
      options: [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' },
      ],
    };
    
    const result = SelectSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('validates select with grouped options', () => {
    const valid = {
      variant: 'outlined' as const,
      size: 'lg' as const,
      options: [
        {
          label: 'Group 1',
          options: [
            { value: '1', label: 'Option 1' },
            { value: '2', label: 'Option 2' },
          ],
        },
      ],
    };
    
    const result = SelectSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('validates select option', () => {
    const valid = {
      value: 'test',
      label: 'Test Option',
      disabled: false,
      group: 'group1',
    };
    
    const result = SelectOptionSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('validates select group', () => {
    const valid = {
      label: 'Group 1',
      options: [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2' },
      ],
    };
    
    const result = SelectGroupSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects invalid option', () => {
    const invalid = {
      value: 123, // Should be string
      label: 'Test',
    };
    
    const result = SelectOptionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('Form Props Schema', () => {
  it('validates valid form props', () => {
    const valid = {
      variant: 'default' as const,
      size: 'md' as const,
      id: 'test-form',
      'data-testid': 'form-test',
    };
    
    const result = FormSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('validates form field props', () => {
    const valid = {
      name: 'test-field',
      label: 'Test Field',
      required: true,
      disabled: false,
      error: 'Error message',
      helperText: 'Helper text',
      className: 'custom-field',
    };
    
    const result = FormFieldPropsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('validates form label props', () => {
    const valid = {
      htmlFor: 'test-input',
      required: true,
      disabled: false,
      error: false,
      className: 'custom-label',
    };
    
    const result = FormLabelPropsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects invalid form variant', () => {
    const invalid = {
      variant: 'invalid-variant',
    };
    
    const result = FormSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('requires name for form field', () => {
    const invalid = {
      label: 'Test',
    };
    
    const result = FormFieldPropsSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
