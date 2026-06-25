/**
 * SQLite transaction implementation
 */

import type { ITransaction, QueryResult, QueryOptions, TransactionOptions } from '../types/index';
// import Database from 'better-sqlite3';

export class SqliteTransaction implements ITransaction {
  private db: Database.Database;
  private active: boolean = false;
  private options?: TransactionOptions;

  constructor(db: Database.Database, options?: TransactionOptions) {
    this.db = db;
    this.options = options;
  }

  async begin(): Promise<void> {
    let sql = 'BEGIN TRANSACTION';

    if (this.options?.readOnly) {
      sql = 'BEGIN DEFERRED TRANSACTION';
    }

    this.db.exec(sql);
    this.active = true;
  }

  async commit(): Promise<void> {
    if (!this.active) {
      throw new Error('Transaction is not active');
    }

    try {
      this.db.exec('COMMIT');
      this.active = false;
    } catch (error) {
      this.active = false;
      throw error;
    }
  }

  async rollback(): Promise<void> {
    if (!this.active) {
      throw new Error('Transaction is not active');
    }

    try {
      this.db.exec('ROLLBACK');
      this.active = false;
    } catch (error) {
      this.active = false;
      throw error;
    }
  }

  async query<T = unknown>(sql: string, options?: QueryOptions): Promise<QueryResult<T>>;
  async query<T = unknown>(sql: string, params: unknown[], options?: QueryOptions): Promise<QueryResult<T>>;
  async query<T = unknown>(
    sql: string,
    paramsOrOptions?: unknown[] | QueryOptions,
    options?: QueryOptions,
  ): Promise<QueryResult<T>> {
    if (!this.active) {
      throw new Error('Transaction is not active');
    }

    let params: unknown[] = [];
    let queryOptions: QueryOptions = {};

    if (Array.isArray(paramsOrOptions)) {
      params = paramsOrOptions;
      queryOptions = options || {};
    } else {
      queryOptions = paramsOrOptions || {};
    }

    try {
      const start = Date.now();
      const stmt = this.db.prepare(sql);
      const result = stmt.all(...params) as T[];
      const duration = Date.now() - start;

      if (queryOptions.timeout && duration > queryOptions.timeout) {
        throw new Error(`Query timeout after ${duration}ms`);
      }

      return {
        rows: result,
        rowCount: result.length,
        affectedRows: stmt.run(...params).changes,
      };
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  isActive(): boolean {
    return this.active;
  }
}
