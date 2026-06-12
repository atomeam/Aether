/**
 * @aether/validator - Validator
 */

export class Validator {
  required(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
  }
  
  email(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  
  url(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }
  
  minLength(value: string, min: number): boolean {
    return value.length >= min;
  }
  
  maxLength(value: string, max: number): boolean {
    return value.length <= max;
  }
  
  exactLength(value: string, length: number): boolean {
    return value.length === length;
  }
  
  pattern(value: string, regex: RegExp): boolean {
    return regex.test(value);
  }
  
  range(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  }
  
  min(value: number, min: number): boolean {
    return value >= min;
  }
  
  max(value: number, max: number): boolean {
    return value <= max;
  }
  
  positive(value: number): boolean {
    return value > 0;
  }
  
  negative(value: number): boolean {
    return value < 0;
  }
  
  integer(value: number): boolean {
    return Number.isInteger(value);
  }
  
  float(value: number): boolean {
    return !Number.isInteger(value) && !isNaN(value);
  }
  
  alpha(value: string): boolean {
    return /^[a-zA-Z]+$/.test(value);
  }
  
  alphanumeric(value: string): boolean {
    return /^[a-zA-Z0-9]+$/.test(value);
  }
  
  numeric(value: string): boolean {
    return /^[0-9]+$/.test(value);
  }
  
  hex(value: string): boolean {
    return /^[0-9a-fA-F]+$/.test(value);
  }
  
  uuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }
  
  json(value: string): boolean {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }
  
  equals(value: any, expected: any): boolean {
    return value === expected;
  }
  
  oneOf(value: any, options: any[]): boolean {
    return options.includes(value);
  }
  
  array(value: any): boolean {
    return Array.isArray(value);
  }
  
  object(value: any): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
  
  date(value: any): boolean {
    return value instanceof Date && !isNaN(value.getTime());
  }
  
  boolean(value: any): boolean {
    return typeof value === 'boolean';
  }
  
  string(value: any): boolean {
    return typeof value === 'string';
  }
  
  number(value: any): boolean {
    return typeof value === 'number' && !isNaN(value);
  }
  
  function(value: any): boolean {
    return typeof value === 'function';
  }
  
  symbol(value: any): boolean {
    return typeof value === 'symbol';
  }
  
  bigint(value: any): boolean {
    return typeof value === 'bigint';
  }
}

export const validator = new Validator();