/**
 * MySQL transaction implementation
 */

import type { ITransaction, QueryResult, QueryOptions, TransactionOptions } from '../types/index';
// import type { PoolConnection } from 'mysql2/promise';

export class MysqlTransaction implements ITransaction {
  private connection: PoolConnection;
  private active: boolean = false;
  private options?: TransactionOptions;

  constructor(connection: PoolConnection, options?: TransactionOptions) {
    this.connection = connection;
    this.options = options;
  }

  async begin(): Promise<void> {
    let sql = 'START TRANSACTION';

    if (this.options?.isolationLevel) {
      sql += ` ${this.options.isolationLevel}`;
    }

    if (this.options?.readOnly) {
      sql += ' READ ONLY';
    }

    await this.connection.execute(sql);
    this.active = true;
  }

  async commit(): Promise<void> {
    if (!this.active) {
      throw new Error('Transaction is not active');
    }

    try {
      await this.connection.execute('COMMIT');
      this.active = false;
    } finally {
      this.connection.release();
    }
  }

  async rollback(): Promise<void> {
    if (!this.active) {
      throw new Error('Transaction is not active');
    }

    try {
      await this.connection.execute('ROLLBACK');
      this.active = false;
    } finally {
      this.connection.release();
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
      const [rows, fields] = await this.connection.execute(sql, params);
      const duration = Date.now() - start;

      if (queryOptions.timeout && duration > queryOptions.timeout) {
        throw new Error(`Query timeout after ${duration}ms`);
      }

      const result = rows as T[];
      return {
        rows: Array.isArray(result) ? result : [result],
        rowCount: Array.isArray(result) ? result.length : 1,
        affectedRows: (fields as any)?.affectedRows || 0,
        insertId: (fields as any)?.insertId,
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
