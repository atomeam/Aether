/**
 * @aether/number-utils - Number Utilities
 */

export class NumberUtils {
  clamp(num: number, min: number, max: number): number {
    return Math.min(Math.max(num, min), max);
  }
  
  random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
  
  randomInt(min: number, max: number): number {
    return Math.floor(this.random(min, max + 1));
  }
  
  round(num: number, precision: number = 0): number {
    const factor = Math.pow(10, precision);
    return Math.round(num * factor) / factor;
  }
  
  format(num: number, decimals: number = 2): string {
    return num.toFixed(decimals);
  }
}

export const numberUtils = new NumberUtils();