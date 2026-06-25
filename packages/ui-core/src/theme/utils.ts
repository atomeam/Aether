/**
 * Theme utility functions
 */

import type { Theme, ColorMode, ColorShade } from './types';
import { defaultTheme, darkTheme } from './default-theme';
import { ThemeSchema } from './schemas';

/**
 * Get theme by mode
 */
export function getTheme(mode: ColorMode): Theme {
  return mode === 'dark' ? darkTheme : defaultTheme;
}

/**
 * Get color from theme
 */
export function getColor(
  theme: Theme,
  colorName: keyof Theme['colors'],
  shade?: ColorShade
): string {
  const color = theme.colors[colorName];
  
  if (shade && typeof color === 'object' && shade in color) {
    return color[shade];
  }
  
  if (typeof color === 'string') {
    return color;
  }
  
  // Default to shade 500 if it's a scale
  if (typeof color === 'object' && '500' in color) {
    return color[500];
  }
  
  return '#000000';
}

/**
 * Get spacing value
 */
export function getSpacing(theme: Theme, value: number): string {
  const { unit, scale } = theme.spacing;
  
  if (value in scale) {
    return scale[value as keyof typeof scale];
  }
  
  return `${value * parseInt(unit)}px`;
}

/**
 * Get shadow value
 */
export function getShadow(theme: Theme, size: keyof Theme['shadows']['scale']): string {
  return theme.shadows.scale[size];
}

/**
 * Get border radius value
 */
export function getBorderRadius(theme: Theme, size: keyof Theme['borderRadius']['scale']): string {
  return theme.borderRadius.scale[size];
}

/**
 * Validate theme configuration
 */
export function validateTheme(theme: unknown): theme is Theme {
  return ThemeSchema.safeParse(theme).success;
}

/**
 * Merge custom theme with default theme
 */
export function mergeTheme(base: Theme, custom: Partial<Theme>): Theme {
  return {
    ...base,
    ...custom,
    colors: {
      ...base.colors,
      ...custom.colors,
    },
    typography: {
      ...base.typography,
      ...custom.typography,
    },
    spacing: {
      ...base.spacing,
      ...custom.spacing,
    },
    borderRadius: {
      ...base.borderRadius,
      ...custom.borderRadius,
    },
    shadows: {
      ...base.shadows,
      ...custom.shadows,
    },
    breakpoints: {
      ...base.breakpoints,
      ...custom.breakpoints,
    },
    transitions: {
      ...base.transitions,
      ...custom.transitions,
    },
  };
}
