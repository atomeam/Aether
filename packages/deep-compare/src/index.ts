/**
 * @aether/deep-compare - Deep Comparison Utilities
 */

export class DeepCompare {
  equals(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!this.equals(a[i], b[i])) return false;
      }
      return true;
    }
    
    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      for (const key of keysA) {
        if (!keysB.includes(key) || !this.equals(a[key], b[key])) return false;
      }
      return true;
    }
    
    return false;
  }
  
  diff(a: any, b: any): any {
    if (this.equals(a, b)) return undefined;
    
    if (Array.isArray(a) && Array.isArray(b)) {
      const diffs: any[] = [];
      const maxLen = Math.max(a.length, b.length);
      for (let i = 0; i < maxLen; i++) {
        const diff = this.diff(a[i], b[i]);
        if (diff !== undefined) diffs.push({ index: i, diff });
      }
      return diffs.length > 0 ? diffs : undefined;
    }
    
    if (typeof a === 'object' && typeof b === 'object') {
      const diffs: Record<string, any> = {};
      const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
      for (const key of allKeys) {
        const diff = this.diff(a[key], b[key]);
        if (diff !== undefined) diffs[key] = diff;
      }
      return Object.keys(diffs).length > 0 ? diffs : undefined;
    }
    
    return { from: a, to: b };
  }
}

export const deepCompare = new DeepCompare();