/**
 * PostgreSQL transaction implementation
 */

import type { ITransaction, QueryResult, QueryOptions, TransactionOptions } from '../types/index';
// import type { PoolClient } from 'pg';

export class PostgresTransaction implements ITransaction {
  private client: PoolClient;
  private active: boolean = false;
  private options?: TransactionOptions;

  constructor(client: PoolClient, options?: TransactionOptions) {
    this.client = client;
    this.options = options;
  }

  async begin(): Promise<void> {
    let sql = 'BEGIN';

    if (this.options?.isolationLevel) {
      sql += ` ISOLATION LEVEL ${this.options.isolationLevel}`;
    }

    if (this.options?.readOnly) {
      sql += ' READ ONLY';
    }

    await this.client.query(sql);
    this.active = true;
  }

  async commit(): Promise<void> {
    if (!this.active) {
      throw new Error('Transaction is not active');
    }

    try {
      await this.client.query('COMMIT');
      this.active = false;
    } finally {
      this.client.release();
    }
  }

  async rollback(): Promise<void> {
    if (!this.active) {
      throw new Error('Transaction is not active');
    }

    try {
      await this.client.query('ROLLBACK');
      this.active = false;
    } finally {
      this.client.release();
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
      const result = await this.client.query<T>(sql, params);
      const duration = Date.now() - start;

      if (queryOptions.timeout && duration > queryOptions.timeout) {
        throw new Error(`Query timeout after ${duration}ms`);
      }

      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        affectedRows: result.rowCount || 0,
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
