/**
 * Input component types and schemas
 */

import type { Size, Variant } from '../theme';
import { z } from 'zod';

// Input specific types
export type InputSize = Size;
export type InputVariant = 'default' | 'filled' | 'outlined';
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';

export interface InputProps {
  variant?: InputVariant;
  size?: InputSize;
  type?: InputType;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  error?: boolean;
  helperText?: string;
  label?: string;
  id?: string;
  name?: string;
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
  'data-testid'?: string;
}

// Zod schema for input props validation
export const InputPropsSchema = z.object({
  variant: z.enum(['default', 'filled', 'outlined']).optional(),
  size: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).optional(),
  type: z.enum(['text', 'email', 'password', 'number', 'tel', 'url', 'search']).optional(),
  value: z.string().optional(),
  defaultValue: z.string().optional(),
  placeholder: z.string().optional(),
  disabled: z.boolean().optional(),
  required: z.boolean().optional(),
  readOnly: z.boolean().optional(),
  error: z.boolean().optional(),
  helperText: z.string().optional(),
  label: z.string().optional(),
  id: z.string().optional(),
  name: z.string().optional(),
  autoComplete: z.string().optional(),
  maxLength: z.number().optional(),
  minLength: z.number().optional(),
  pattern: z.string().optional(),
  className: z.string().optional(),
  'data-testid': z.string().optional(),
});

// Type inference
export type InputPropsInput = z.infer<typeof InputPropsSchema>;

// Input state types
export interface InputState {
  isFocused: boolean;
  isFilled: boolean;
  hasError: boolean;
}

// Input validation result
export interface InputValidationResult {
  isValid: boolean;
  error?: string;
}

// Input style configuration
export interface InputStyles {
  base: string;
  variants: Record<InputVariant, string>;
  sizes: Record<InputSize, string>;
  states: {
    focused: string;
    error: string;
    disabled: string;
  };
}
