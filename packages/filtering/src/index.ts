/**
 * @aether/filtering - Filtering
 */

export class Filtering {
  filter(items: any[], field: string, value: any): any[] {
    return items.filter(item => item[field] === value);
  }
  
  filterBy(items: any[], predicate: (item: any) => boolean): any[] {
    return items.filter(predicate);
  }
}

export const filtering = new Filtering();