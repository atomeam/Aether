/**
 * @aether/comparator - Comparator
 */

export class Comparator {
  compare(a: any, b: any): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }
  
  equals(a: any, b: any): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  
  deepEquals(a: any, b: any): boolean {
    return this.equals(a, b);
  }
}

export const comparator = new Comparator();