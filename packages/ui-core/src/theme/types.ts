/**
 * Theme system types for @aether/ui-core
 */

import type { z } from 'zod';

// Color palette types
export type ColorMode = 'light' | 'dark';
export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface Colors {
  primary: ColorScale;
  secondary: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  neutral: ColorScale;
  background: {
    default: string;
    paper: string;
    elevated: string;
  };
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  border: {
    default: string;
    light: string;
  };
}

// Typography types
export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
export type FontWeight = 'light' | 'normal' | 'medium' | 'semibold' | 'bold';

export interface Typography {
  fontFamily: {
    sans: string[];
    mono: string[];
  };
  fontSize: Record<FontSize, string>;
  fontWeight: Record<FontWeight, number>;
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

// Spacing types
export type SpacingScale = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 12 | 16 | 20 | 24;

export interface Spacing {
  unit: string;
  scale: Record<SpacingScale, string>;
}

// Border radius types
export type RadiusScale = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface BorderRadius {
  scale: Record<RadiusScale, string>;
}

// Shadow types
export type ShadowScale = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface Shadows {
  scale: Record<ShadowScale, string>;
}

// Breakpoint types
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface Breakpoints {
  scale: Record<Breakpoint, string>;
}

// Transition types
export type TransitionDuration = 'fast' | 'normal' | 'slow';
export type TransitionEasing = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';

export interface Transitions {
  duration: Record<TransitionDuration, string>;
  easing: Record<TransitionEasing, string>;
}

// Main theme interface
export interface Theme {
  mode: ColorMode;
  colors: Colors;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
  breakpoints: Breakpoints;
  transitions: Transitions;
}

// Theme context type
export interface ThemeContextValue {
  theme: Theme;
  setMode: (mode: ColorMode) => void;
  mode: ColorMode;
}

// Component variant types
export type Variant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ComponentVariants {
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
}
