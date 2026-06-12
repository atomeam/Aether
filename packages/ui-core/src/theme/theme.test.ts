/**
 * Theme system tests
 */

import { describe, it, expect } from 'vitest';
import {
  defaultTheme,
  darkTheme,
  getTheme,
  getColor,
  getSpacing,
  getShadow,
  getBorderRadius,
  validateTheme,
  mergeTheme,
  ThemeSchema,
  ColorModeSchema,
  VariantSchema,
} from './index';

describe('Theme Schema Validation', () => {
  it('validates default theme', () => {
    expect(validateTheme(defaultTheme)).toBe(true);
  });

  it('validates dark theme', () => {
    expect(validateTheme(darkTheme)).toBe(true);
  });

  it('rejects invalid theme', () => {
    const invalid = { mode: 'invalid' };
    expect(validateTheme(invalid)).toBe(false);
  });

  it('validates color mode', () => {
    expect(ColorModeSchema.safeParse('light').success).toBe(true);
    expect(ColorModeSchema.safeParse('dark').success).toBe(true);
    expect(ColorModeSchema.safeParse('invalid').success).toBe(false);
  });

  it('validates variant', () => {
    expect(VariantSchema.safeParse('primary').success).toBe(true);
    expect(VariantSchema.safeParse('secondary').success).toBe(true);
    expect(VariantSchema.safeParse('invalid').success).toBe(false);
  });
});

describe('getTheme', () => {
  it('returns light theme for light mode', () => {
    const theme = getTheme('light');
    expect(theme.mode).toBe('light');
  });

  it('returns dark theme for dark mode', () => {
    const theme = getTheme('dark');
    expect(theme.mode).toBe('dark');
  });
});

describe('getColor', () => {
  it('gets color with shade', () => {
    const color = getColor(defaultTheme, 'primary', 500);
    expect(color).toBe('#2196f3');
  });

  it('gets color without shade defaults to 500', () => {
    const color = getColor(defaultTheme, 'primary');
    expect(color).toBe('#2196f3');
  });

  it('gets background color', () => {
    const color = getColor(defaultTheme, 'background');
    expect(color).toBe('#ffffff');
  });

  it('gets text color', () => {
    const color = getColor(defaultTheme, 'text');
    expect(color).toBe('#212121');
  });
});

describe('getSpacing', () => {
  it('gets spacing from scale', () => {
    const spacing = getSpacing(defaultTheme, 4);
    expect(spacing).toBe('16px');
  });

  it('calculates spacing for non-scale values', () => {
    const spacing = getSpacing(defaultTheme, 15);
    expect(spacing).toBe('60px');
  });
});

describe('getShadow', () => {
  it('gets shadow by size', () => {
    const shadow = getShadow(defaultTheme, 'md');
    expect(shadow).toContain('rgba');
  });

  it('returns none for none shadow', () => {
    const shadow = getShadow(defaultTheme, 'none');
    expect(shadow).toBe('none');
  });
});

describe('getBorderRadius', () => {
  it('gets border radius by size', () => {
    const radius = getBorderRadius(defaultTheme, 'md');
    expect(radius).toBe('4px');
  });

  it('returns 0 for none radius', () => {
    const radius = getBorderRadius(defaultTheme, 'none');
    expect(radius).toBe('0');
  });
});

describe('mergeTheme', () => {
  it('merges custom theme with base', () => {
    const custom = {
      mode: 'dark' as const,
      colors: {
        primary: defaultTheme.colors.primary,
        secondary: defaultTheme.colors.secondary,
        success: defaultTheme.colors.success,
        warning: defaultTheme.colors.warning,
        error: defaultTheme.colors.error,
        neutral: defaultTheme.colors.neutral,
        background: {
          default: '#000000',
          paper: '#111111',
          elevated: '#222222',
        },
        text: {
          primary: '#ffffff',
          secondary: '#cccccc',
          disabled: '#666666',
        },
        border: {
          default: '#333333',
          light: '#222222',
        },
      },
    };
    
    const merged = mergeTheme(defaultTheme, custom);
    expect(merged.mode).toBe('dark');
    expect(merged.colors.background.default).toBe('#000000');
  });

  it('preserves base theme properties', () => {
    const merged = mergeTheme(defaultTheme, {});
    expect(merged.typography).toEqual(defaultTheme.typography);
  });
});

describe('Theme Schema', () => {
  it('parses valid theme', () => {
    const result = ThemeSchema.safeParse(defaultTheme);
    expect(result.success).toBe(true);
  });

  it('rejects theme with invalid color format', () => {
    const invalid = {
      ...defaultTheme,
      colors: {
        ...defaultTheme.colors,
        primary: {
          ...defaultTheme.colors.primary,
          500: 'invalid-color',
        },
      },
    };
    
    const result = ThemeSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
