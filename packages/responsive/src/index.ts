/**
 * @aether/responsive - Responsive design utilities
 */

export interface Breakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
}

export interface ResponsiveConfig {
  breakpoints: Breakpoint[];
  defaultBreakpoint: string;
}

export const DEFAULT_BREAKPOINTS: Breakpoint[] = [
  { name: 'xs', minWidth: 0 },
  { name: 'sm', minWidth: 640 },
  { name: 'md', minWidth: 768 },
  { name: 'lg', minWidth: 1024 },
  { name: 'xl', minWidth: 1280 },
  { name: '2xl', minWidth: 1536 },
];

export class ResponsiveHelper {
  private config: ResponsiveConfig;

  constructor(config?: Partial<ResponsiveConfig>) {
    this.config = {
      breakpoints: config?.breakpoints || DEFAULT_BREAKPOINTS,
      defaultBreakpoint: config?.defaultBreakpoint || 'md',
    };
  }

  getCurrentBreakpoint(width: number): string {
    for (let i = this.config.breakpoints.length - 1; i >= 0; i--) {
      const bp = this.config.breakpoints[i];
      if (width >= bp.minWidth) {
        if (!bp.maxWidth || width <= bp.maxWidth) {
          return bp.name;
        }
      }
    }
    return this.config.defaultBreakpoint;
  }

  isBreakpoint(width: number, breakpoint: string): boolean {
    return this.getCurrentBreakpoint(width) === breakpoint;
  }

  isAboveBreakpoint(width: number, breakpoint: string): boolean {
    const bp = this.config.breakpoints.find((b) => b.name === breakpoint);
    if (!bp) return false;
    return width >= bp.minWidth;
  }

  isBelowBreakpoint(width: number, breakpoint: string): boolean {
    const bp = this.config.breakpoints.find((b) => b.name === breakpoint);
    if (!bp) return false;
    return width < bp.minWidth;
  }

  getBreakpointValue(breakpoint: string, values: Record<string, any>, defaultValue?: any): any {
    return values[breakpoint] ?? defaultValue;
  }
}

export const responsiveHelper = new ResponsiveHelper();
