/**
 * Button component types and schemas
 */

import type { Variant, Size } from '../theme';
import { z } from 'zod';

// Button specific types
export type ButtonVariant = Variant | 'link';
export type ButtonSize = Size;
export type ButtonType = 'button' | 'submit' | 'reset';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: ButtonType;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  id?: string;
  'data-testid'?: string;
}

// Zod schema for button props validation
export const ButtonPropsSchema = z.object({
  variant: z.enum(['primary', 'secondary', 'success', 'warning', 'error', 'ghost', 'link']).optional(),
  size: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).optional(),
  type: z.enum(['button', 'submit', 'reset']).optional(),
  disabled: z.boolean().optional(),
  loading: z.boolean().optional(),
  fullWidth: z.boolean().optional(),
  iconPosition: z.enum(['left', 'right']).optional(),
  className: z.string().optional(),
  id: z.string().optional(),
  'data-testid': z.string().optional(),
});

// Type inference
export type ButtonPropsInput = z.infer<typeof ButtonPropsSchema>;

// Button state types
export interface ButtonState {
  isHovered: boolean;
  isFocused: boolean;
  isPressed: boolean;
}

// Button style configuration
export interface ButtonStyles {
  base: string;
  variants: Record<ButtonVariant, string>;
  sizes: Record<ButtonSize, string>;
  states: {
    disabled: string;
    loading: string;
  };
}
