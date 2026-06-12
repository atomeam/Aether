/**
 * Query builder for constructing database queries
 */

import type {
  IQueryBuilder,
  WhereCondition,
  JoinClause,
  OrderByClause,
  PaginationOptions,
  QueryResult,
} from '../types/index';
import type { IDatabase } from '../types/index';

export class QueryBuilder implements IQueryBuilder {
  private database: IDatabase;
  private selectColumns: string[] = ['*'];
  private fromTable?: string;
  private whereConditions: WhereCondition[] = [];
  private joins: JoinClause[] = [];
  private orderByClauses: OrderByClause[] = [];
  private groupByColumns: string[] = [];
  private havingClause?: string;
  private limitValue?: number;
  private offsetValue?: number;
  private params: unknown[] = [];

  constructor(database: IDatabase) {
    this.database = database;
  }

  select(columns: string | string[]): IQueryBuilder {
    this.selectColumns = Array.isArray(columns) ? columns : [columns];
    return this;
  }

  from(table: string): IQueryBuilder {
    this.fromTable = table;
    return this;
  }

  where(conditions: WhereCondition | WhereCondition[]): IQueryBuilder {
    const conditionArray = Array.isArray(conditions) ? conditions : [conditions];
    this.whereConditions.push(...conditionArray);
    return this;
  }

  join(join: JoinClause | JoinClause[]): IQueryBuilder {
    const joinArray = Array.isArray(join) ? join : [join];
    this.joins.push(...joinArray);
    return this;
  }

  orderBy(order: OrderByClause | OrderByClause[]): IQueryBuilder {
    const orderArray = Array.isArray(order) ? order : [order];
    this.orderByClauses.push(...orderArray);
    return this;
  }

  paginate(pagination: PaginationOptions): IQueryBuilder {
    if (pagination.limit) {
      this.limitValue = pagination.limit;
    }
    if (pagination.offset) {
      this.offsetValue = pagination.offset;
    }
    return this;
  }

  groupBy(columns: string | string[]): IQueryBuilder {
    this.groupByColumns = Array.isArray(columns) ? columns : [columns];
    return this;
  }

  having(condition: string): IQueryBuilder {
    this.havingClause = condition;
    return this;
  }

  limit(limit: number): IQueryBuilder {
    this.limitValue = limit;
    return this;
  }

  offset(offset: number): IQueryBuilder {
    this.offsetValue = offset;
    return this;
  }

  async execute<T = unknown>(): Promise<QueryResult<T>> {
    const sql = this.build();
    return this.database.query<T>(sql, this.params);
  }

  build(): string {
    if (!this.fromTable) {
      throw new Error('FROM table is required');
    }

    let sql = `SELECT ${this.selectColumns.join(', ')} FROM ${this.fromTable}`;

    if (this.joins.length > 0) {
      sql += ' ' + this.joins.map(this.buildJoin).join(' ');
    }

    if (this.whereConditions.length > 0) {
      sql += ' WHERE ' + this.buildWhere();
    }

    if (this.groupByColumns.length > 0) {
      sql += ' GROUP BY ' + this.groupByColumns.join(', ');
    }

    if (this.havingClause) {
      sql += ' HAVING ' + this.havingClause;
    }

    if (this.orderByClauses.length > 0) {
      sql += ' ORDER BY ' + this.orderByClauses.map(o => `${o.column} ${o.direction}`).join(', ');
    }

    if (this.limitValue !== undefined) {
      sql += ` LIMIT ${this.limitValue}`;
    }

    if (this.offsetValue !== undefined) {
      sql += ` OFFSET ${this.offsetValue}`;
    }

    return sql;
  }

  getParams(): unknown[] {
    return [...this.params];
  }

  clone(): IQueryBuilder {
    const cloned = new QueryBuilder(this.database);
    cloned.selectColumns = [...this.selectColumns];
    cloned.fromTable = this.fromTable;
    cloned.whereConditions = [...this.whereConditions];
    cloned.joins = [...this.joins];
    cloned.orderByClauses = [...this.orderByClauses];
    cloned.groupByColumns = [...this.groupByColumns];
    cloned.havingClause = this.havingClause;
    cloned.limitValue = this.limitValue;
    cloned.offsetValue = this.offsetValue;
    cloned.params = [...this.params];
    return cloned;
  }

  private buildJoin(join: JoinClause): string {
    const alias = join.alias ? ` AS ${join.alias}` : '';
    return `${join.type} JOIN ${join.table}${alias} ON ${join.on}`;
  }

  private buildWhere(): string {
    return this.whereConditions
      .map((condition, index) => {
        const logical = index > 0 ? ` ${condition.logical} ` : '';
        const paramIndex = this.params.length + 1;
        this.params.push(condition.value);
        return `${logical}${condition.column} ${condition.operator} $${paramIndex}`;
      })
      .join('');
  }
}
