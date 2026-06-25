/**
 * @aether/object-utils - Object Utilities
 */

export class ObjectUtils {
  deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
  
  deepMerge<T extends object>(target: T, source: Partial<T>): T {
    const result = { ...target };
    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        result[key] = this.deepMerge(target[key] as any, source[key] as any);
      } else {
        result[key] = source[key] as any;
      }
    }
    return result;
  }
  
  omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
  }
  
  pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    keys.forEach(key => result[key] = obj[key]);
    return result;
  }
}

export const objectUtils = new ObjectUtils();