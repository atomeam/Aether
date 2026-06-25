/**
 * @aether/aggregation - Data Aggregation
 */

export class Aggregation {
  sum(items: any[], field: string): number {
    return items.reduce((acc, item) => acc + (item[field] || 0), 0);
  }
  
  average(items: any[], field: string): number {
    const sum = this.sum(items, field);
    return items.length ? sum / items.length : 0;
  }
  
  count(items: any[]): number {
    return items.length;
  }
}

export const aggregation = new Aggregation();