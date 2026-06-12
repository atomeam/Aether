/**
 * @aether/transformation - Data Transformation Utilities
 */

export class Transformation {
  deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj) as any;
    if (obj instanceof Array) return obj.map(item => this.deepClone(item)) as any;
    if (obj instanceof Map) return new Map(Array.from(obj.entries()).map(([k, v]) => [this.deepClone(k), this.deepClone(v)])) as any;
    if (obj instanceof Set) return new Set(Array.from(obj.values()).map(v => this.deepClone(v))) as any;
    
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        const sourceValue = source[key as keyof T];
        if (this.isObject(sourceValue)) {
          if (!(key in target)) {
            Object.assign(output, { [key]: sourceValue });
          } else {
            const targetValue = target[key as keyof T];
            if (targetValue !== undefined && sourceValue !== undefined) {
              output[key as keyof T] = this.deepMerge(targetValue as any, sourceValue as any);
            }
          }
        } else {
          Object.assign(output, { [key]: sourceValue });
        }
      });
    }
    
    return output;
  }
  
  deepFreeze<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    
    Object.freeze(obj);
    
    Object.getOwnPropertyNames(obj).forEach(prop => {
      const value = (obj as any)[prop];
      if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
        this.deepFreeze(value);
      }
    });
    
    return obj;
  }
  
  flatten(obj: any, prefix: string = ''): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(result, this.flatten(obj[key], newKey));
        } else {
          result[newKey] = obj[key];
        }
      }
    }
    
    return result;
  }
  
  unflatten(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const keys = key.split('.');
        let current = result;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = obj[key];
      }
    }
    
    return result;
  }
  
  pick<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  }
  
  omit<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result as Omit<T, K>;
  }
  
  groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {} as Record<string, T[]>);
  }
  
  partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
    const truthy: T[] = [];
    const falsy: T[] = [];
    
    for (const item of array) {
      if (predicate(item)) {
        truthy.push(item);
      } else {
        falsy.push(item);
      }
    }
    
    return [truthy, falsy];
  }
  
  chunk<T>(array: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }
  
  compact<T>(array: (T | null | undefined)[]): T[] {
    return array.filter((item): item is T => item !== null && item !== undefined);
  }
  
  private isObject(obj: any): boolean {
    return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
  }
}

export const transformation = new Transformation();