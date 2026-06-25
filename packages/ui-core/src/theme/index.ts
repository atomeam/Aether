/**
 * Theme system exports
 */

// Types
export type {
  ColorMode,
  ColorShade,
  ColorScale,
  Colors,
  FontSize,
  FontWeight,
  Typography,
  SpacingScale,
  Spacing,
  RadiusScale,
  BorderRadius,
  ShadowScale,
  Shadows,
  Breakpoint,
  Breakpoints,
  TransitionDuration,
  TransitionEasing,
  Transitions,
  Theme,
  ThemeContextValue,
  Variant,
  Size,
  ComponentVariants,
} from './types';

// Schemas
export {
  ColorModeSchema,
  ColorShadeSchema,
  ColorScaleSchema,
  ColorsSchema,
  FontSizeSchema,
  FontWeightSchema,
  TypographySchema,
  SpacingScaleSchema,
  SpacingSchema,
  RadiusScaleSchema,
  BorderRadiusSchema,
  ShadowScaleSchema,
  ShadowsSchema,
  BreakpointSchema,
  BreakpointsSchema,
  TransitionDurationSchema,
  TransitionEasingSchema,
  TransitionsSchema,
  ThemeSchema,
  VariantSchema,
  SizeSchema,
  ComponentVariantsSchema,
  type ThemeInput,
  type ComponentVariantsInput,
} from './schemas';

// Default themes
export { defaultTheme, darkTheme } from './default-theme';

// Utilities
export {
  getTheme,
  getColor,
  getSpacing,
  getShadow,
  getBorderRadius,
  validateTheme,
  mergeTheme,
} from './utils';
