/**
 * Select component types and schemas
 */

import type { Size, Variant } from '../theme';
import { z } from 'zod';

// Select specific types
export type SelectSize = Size;
export type SelectVariant = 'default' | 'filled' | 'outlined';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

export interface SelectProps {
  variant?: SelectVariant;
  size?: SelectSize;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  label?: string;
  id?: string;
  name?: string;
  options: SelectOption[] | SelectGroup[];
  searchable?: boolean;
  clearable?: boolean;
  multiple?: boolean;
  onChange?: (value: string | string[]) => void;
  onFocus?: (event: React.FocusEvent<HTMLSelectElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLSelectElement>) => void;
  className?: string;
  'data-testid'?: string;
}

// Zod schema for select option validation
export const SelectOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
  disabled: z.boolean().optional(),
  group: z.string().optional(),
});

export const SelectGroupSchema = z.object({
  label: z.string(),
  options: z.array(SelectOptionSchema),
});

// Zod schema for select props validation
export const SelectPropsSchema = z.object({
  variant: z.enum(['default', 'filled', 'outlined']).optional(),
  size: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).optional(),
  value: z.string().optional(),
  defaultValue: z.string().optional(),
  placeholder: z.string().optional(),
  disabled: z.boolean().optional(),
  required: z.boolean().optional(),
  error: z.boolean().optional(),
  helperText: z.string().optional(),
  label: z.string().optional(),
  id: z.string().optional(),
  name: z.string().optional(),
  options: z.union([z.array(SelectOptionSchema), z.array(SelectGroupSchema)]),
  searchable: z.boolean().optional(),
  clearable: z.boolean().optional(),
  multiple: z.boolean().optional(),
  className: z.string().optional(),
  'data-testid': z.string().optional(),
});

// Type inference
export type SelectOptionInput = z.infer<typeof SelectOptionSchema>;
export type SelectGroupInput = z.infer<typeof SelectGroupSchema>;
export type SelectPropsInput = z.infer<typeof SelectPropsSchema>;

// Select state types
export interface SelectState {
  isOpen: boolean;
  isFocused: boolean;
  selectedValue: string | string[];
  searchQuery: string;
}

// Select style configuration
export interface SelectStyles {
  base: string;
  variants: Record<SelectVariant, string>;
  sizes: Record<SelectSize, string>;
  states: {
    focused: string;
    error: string;
    disabled: string;
    open: string;
  };
}
