/**
 * @aether/debounce - Debounce
 */

export class Debounce {
  private timers: Map<string, any> = new Map();
  
  debounce(key: string, fn: Function, delay: number): void {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }
    this.timers.set(key, setTimeout(() => {
      fn();
      this.timers.delete(key);
    }, delay));
  }
}

export const debounce = new Debounce();