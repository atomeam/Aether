/**
 * Zod validation schemas for theme system
 */

import { z } from 'zod';

// Color mode schema
export const ColorModeSchema = z.enum(['light', 'dark']);

// Color shade schema
export const ColorShadeSchema = z.union([
  z.literal(50),
  z.literal(100),
  z.literal(200),
  z.literal(300),
  z.literal(400),
  z.literal(500),
  z.literal(600),
  z.literal(700),
  z.literal(800),
  z.literal(900),
]);

// Color scale schema
export const ColorScaleSchema = z.object({
  50: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  100: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  200: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  300: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  400: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  500: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  600: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  700: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  800: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  900: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

// Colors schema
export const ColorsSchema = z.object({
  primary: ColorScaleSchema,
  secondary: ColorScaleSchema,
  success: ColorScaleSchema,
  warning: ColorScaleSchema,
  error: ColorScaleSchema,
  neutral: ColorScaleSchema,
  background: z.object({
    default: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    paper: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    elevated: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }),
  text: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    disabled: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }),
  border: z.object({
    default: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    light: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }),
});

// Typography schemas
export const FontSizeSchema = z.enum(['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl']);
export const FontWeightSchema = z.enum(['light', 'normal', 'medium', 'semibold', 'bold']);

export const TypographySchema = z.object({
  fontFamily: z.object({
    sans: z.array(z.string()).min(1),
    mono: z.array(z.string()).min(1),
  }),
  fontSize: z.record(FontSizeSchema, z.string()),
  fontWeight: z.record(FontWeightSchema, z.number()),
  lineHeight: z.object({
    tight: z.number(),
    normal: z.number(),
    relaxed: z.number(),
  }),
  letterSpacing: z.object({
    tight: z.string(),
    normal: z.string(),
    wide: z.string(),
  }),
});

// Spacing schemas
export const SpacingScaleSchema = z.union([
  z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4),
  z.literal(5), z.literal(6), z.literal(7), z.literal(8), z.literal(9),
  z.literal(10), z.literal(12), z.literal(16), z.literal(20), z.literal(24),
]);

export const SpacingSchema = z.object({
  unit: z.string(),
  scale: z.record(SpacingScaleSchema, z.string()),
});

// Border radius schemas
export const RadiusScaleSchema = z.enum(['none', 'sm', 'md', 'lg', 'xl', 'full']);

export const BorderRadiusSchema = z.object({
  scale: z.record(RadiusScaleSchema, z.string()),
});

// Shadow schemas
export const ShadowScaleSchema = z.enum(['none', 'sm', 'md', 'lg', 'xl', '2xl']);

export const ShadowsSchema = z.object({
  scale: z.record(ShadowScaleSchema, z.string()),
});

// Breakpoint schemas
export const BreakpointSchema = z.enum(['xs', 'sm', 'md', 'lg', 'xl', '2xl']);

export const BreakpointsSchema = z.object({
  scale: z.record(BreakpointSchema, z.string()),
});

// Transition schemas
export const TransitionDurationSchema = z.enum(['fast', 'normal', 'slow']);
export const TransitionEasingSchema = z.enum(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out']);

export const TransitionsSchema = z.object({
  duration: z.record(TransitionDurationSchema, z.string()),
  easing: z.record(TransitionEasingSchema, z.string()),
});

// Main theme schema
export const ThemeSchema = z.object({
  mode: ColorModeSchema,
  colors: ColorsSchema,
  typography: TypographySchema,
  spacing: SpacingSchema,
  borderRadius: BorderRadiusSchema,
  shadows: ShadowsSchema,
  breakpoints: BreakpointsSchema,
  transitions: TransitionsSchema,
});

// Component variant schemas
export const VariantSchema = z.enum(['primary', 'secondary', 'success', 'warning', 'error', 'ghost']);
export const SizeSchema = z.enum(['xs', 'sm', 'md', 'lg', 'xl']);

export const ComponentVariantsSchema = z.object({
  variant: VariantSchema.optional(),
  size: SizeSchema.optional(),
  disabled: z.boolean().optional(),
  loading: z.boolean().optional(),
});

// Type inference
export type ThemeInput = z.infer<typeof ThemeSchema>;
export type ComponentVariantsInput = z.infer<typeof ComponentVariantsSchema>;
