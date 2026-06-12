/**
 * @aether/feature-flags - Feature Flag System
 */

export class FeatureFlags {
  private flags: Map<string, boolean> = new Map();
  
  set(name: string, enabled: boolean): void {
    this.flags.set(name, enabled);
  }
  
  isEnabled(name: string): boolean {
    return this.flags.get(name) || false;
  }
}

export const featureFlags = new FeatureFlags();