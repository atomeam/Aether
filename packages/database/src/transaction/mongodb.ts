/**
 * MongoDB transaction implementation
 */

import type { ITransaction, QueryResult, QueryOptions, TransactionOptions } from '../types/index';
// import type { ClientSession, Db } from 'mongodb';

export class MongoTransaction implements ITransaction {
  private session: ClientSession;
  private db: Db;
  private active: boolean = false;
  private options?: TransactionOptions;

  constructor(session: ClientSession, db: Db, options?: TransactionOptions) {
    this.session = session;
    this.db = db;
    this.options = options;
  }

  async begin(): Promise<void> {
    const transactionOptions: any = {
      readConcern: this.options?.readOnly ? 'snapshot' : 'local',
    };

    if (this.options?.isolationLevel) {
      transactionOptions.readConcern = this.mapIsolationLevel(this.options.isolationLevel);
    }

    this.session.startTransaction(transactionOptions);
    this.active = true;
  }

  async commit(): Promise<void> {
    if (!this.active) {
      throw new Error('Transaction is not active');
    }

    try {
      await this.session.commitTransaction();
      this.active = false;
    } finally {
      this.session.endSession();
    }
  }

  async rollback(): Promise<void> {
    if (!this.active) {
      throw new Error('Transaction is not active');
    }

    try {
      await this.session.abortTransaction();
      this.active = false;
    } finally {
      this.session.endSession();
    }
  }

  async query<T = unknown>(collection: string, filter?: Record<string, unknown>, options?: QueryOptions): Promise<QueryResult<T>>;
  async query<T = unknown>(sql: string, params: unknown[], options?: QueryOptions): Promise<QueryResult<T>>;
  async query<T = unknown>(
    collection: string,
    filterOrParams?: Record<string, unknown> | unknown[],
    options?: QueryOptions,
  ): Promise<QueryResult<T>> {
    if (!this.active) {
      throw new Error('Transaction is not active');
    }

    const filter = Array.isArray(filterOrParams) ? {} : (filterOrParams || {});
    const collectionObj = this.db.collection<T>(collection);

    try {
      const start = Date.now();
      const result = await collectionObj.find(filter, { session: this.session }).toArray();
      const duration = Date.now() - start;

      if (options?.timeout && duration > options.timeout) {
        throw new Error(`Query timeout after ${duration}ms`);
      }

      return {
        rows: result,
        rowCount: result.length,
      };
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  isActive(): boolean {
    return this.active;
  }

  private mapIsolationLevel(level: string): string {
    const mapping: Record<string, string> = {
      'READ UNCOMMITTED': 'local',
      'READ COMMITTED': 'local',
      'REPEATABLE READ': 'snapshot',
      'SERIALIZABLE': 'snapshot',
    };
    return mapping[level] || 'local';
  }
}
