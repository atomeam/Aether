/**
 * @aether/type-guards - Type Guards
 */

export class TypeGuards {
  isString(value: unknown): value is string {
    return typeof value === 'string';
  }
  
  isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value);
  }
  
  isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
  }
  
  isNull(value: unknown): value is null {
    return value === null;
  }
  
  isUndefined(value: unknown): value is undefined {
    return value === undefined;
  }
  
  isNil(value: unknown): value is null | undefined {
    return value === null || value === undefined;
  }
  
  isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
  }
  
  isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
  
  isFunction(value: unknown): value is Function {
    return typeof value === 'function';
  }
  
  isDate(value: unknown): value is Date {
    return value instanceof Date && !isNaN(value.getTime());
  }
  
  isPromise(value: unknown): value is Promise<unknown> {
    return value instanceof Promise;
  }
  
  isError(value: unknown): value is Error {
    return value instanceof Error;
  }
  
  isEmpty(value: unknown): boolean {
    if (this.isNil(value)) return true;
    if (this.isString(value) || this.isArray(value)) return value.length === 0;
    if (this.isObject(value)) return Object.keys(value).length === 0;
    return false;
  }
}

export const typeGuards = new TypeGuards();