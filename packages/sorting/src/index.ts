/**
 * @aether/sorting - Sorting
 */

export class Sorting {
  sortBy(items: any[], field: string, order: 'asc' | 'desc' = 'asc'): any[] {
    return [...items].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return order === 'asc' ? comparison : -comparison;
    });
  }
}

export const sorting = new Sorting();