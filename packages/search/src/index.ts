/**
 * @aether/search - Search
 */

export class Search {
  search(items: any[], query: string, fields: string[]): any[] {
    const lowerQuery = query.toLowerCase();
    return items.filter(item => 
      fields.some(field => 
        String(item[field]).toLowerCase().includes(lowerQuery)
      )
    );
  }
}

export const search = new Search();