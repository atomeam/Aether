/**
 * @aether/pagination - Pagination
 */

export class Pagination {
  paginate(items: any[], page: number, pageSize: number): any[] {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }
  
  totalPages(totalItems: number, pageSize: number): number {
    return Math.ceil(totalItems / pageSize);
  }
}

export const pagination = new Pagination();