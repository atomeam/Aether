/**
 * Form component types and schemas
 */

import type { Size, Variant } from '../theme';
import { z } from 'zod';

// Form specific types
export type FormSize = Size;
export type FormVariant = 'default' | 'compact' | 'spacious';

export interface FormFieldProps {
  name: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

export interface FormLabelProps {
  htmlFor?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  children: React.ReactNode;
  className?: string;
}

export interface FormHelperTextProps {
  error?: boolean;
  children: React.ReactNode;
  className?: string;
}

export interface FormErrorProps {
  children: React.ReactNode;
  className?: string;
}

export interface FormProps {
  variant?: FormVariant;
  size?: FormSize;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  onReset?: (event: React.FormEvent<HTMLFormElement>) => void;
  className?: string;
  id?: string;
  'data-testid'?: string;
  children: React.ReactNode;
}

// Zod schemas for form components
export const FormFieldPropsSchema = z.object({
  name: z.string(),
  label: z.string().optional(),
  required: z.boolean().optional(),
  disabled: z.boolean().optional(),
  error: z.string().optional(),
  helperText: z.string().optional(),
  className: z.string().optional(),
});

export const FormLabelPropsSchema = z.object({
  htmlFor: z.string().optional(),
  required: z.boolean().optional(),
  disabled: z.boolean().optional(),
  error: z.boolean().optional(),
  className: z.string().optional(),
});

export const FormHelperTextPropsSchema = z.object({
  error: z.boolean().optional(),
  className: z.string().optional(),
});

export const FormErrorPropsSchema = z.object({
  className: z.string().optional(),
});

export const FormPropsSchema = z.object({
  variant: z.enum(['default', 'compact', 'spacious']).optional(),
  size: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).optional(),
  onSubmit: z.function().optional(),
  onReset: z.function().optional(),
  className: z.string().optional(),
  id: z.string().optional(),
  'data-testid': z.string().optional(),
});

// Type inference
export type FormFieldPropsInput = z.infer<typeof FormFieldPropsSchema>;
export type FormLabelPropsInput = z.infer<typeof FormLabelPropsSchema>;
export type FormHelperTextPropsInput = z.infer<typeof FormHelperTextPropsSchema>;
export type FormErrorPropsInput = z.infer<typeof FormErrorPropsSchema>;
export type FormPropsInput = z.infer<typeof FormPropsSchema>;

// Form state types
export interface FormState {
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
  touched: Record<string, boolean>;
  errors: Record<string, string>;
}

// Form validation result
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Form style configuration
export interface FormStyles {
  base: string;
  variants: Record<FormVariant, string>;
  sizes: Record<FormSize, string>;
  field: {
    base: string;
    label: string;
    error: string;
    helperText: string;
  };
}
