/**
 * SQLite database adapter
 */

// import Database from 'better-sqlite3';
import { BaseDatabase } from '../database';
import type {
  DatabaseConfig,
  QueryResult,
  QueryOptions,
  TransactionOptions,
  HealthCheckResult,
  ConnectionInfo,
} from '../types/index';
import type { ITransaction } from '../types/index';
import { SqliteTransaction } from '../transaction/sqlite';

export class SqliteAdapter extends BaseDatabase {
  private db?: Database.Database;

  constructor(config: DatabaseConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      this.db = new Database(this.config.database, {
        verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
      });

      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');

      this.connected = true;
    } catch (error) {
      this.handleError(error);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.db || !this.connected) {
      return;
    }

    try {
      this.db.close();
      this.connected = false;
    } catch (error) {
      this.handleError(error);
    }
  }

  async query<T = unknown>(sql: string, options?: QueryOptions): Promise<QueryResult<T>>;
  async query<T = unknown>(sql: string, params: unknown[], options?: QueryOptions): Promise<QueryResult<T>>;
  async query<T = unknown>(
    sql: string,
    paramsOrOptions?: unknown[] | QueryOptions,
    options?: QueryOptions,
  ): Promise<QueryResult<T>> {
    if (!this.db || !this.connected) {
      throw new Error('Database not connected');
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
      this.handleError(error);
    }
  }

  async beginTransaction(options?: TransactionOptions): Promise<ITransaction> {
    if (!this.db || !this.connected) {
      throw new Error('Database not connected');
    }

    const transaction = new SqliteTransaction(this.db, options);

    try {
      await transaction.begin();
      return transaction;
    } catch (error) {
      this.handleError(error);
    }
  }

  getConnectionInfo(): ConnectionInfo[] {
    if (!this.db) {
      return [];
    }

    return [
      {
        id: this.connectionId,
        database: this.config.database,
        connectedAt: new Date(),
        lastUsedAt: new Date(),
      },
    ];
  }

  async healthCheck(): Promise<HealthCheckResult> {
    if (!this.db || !this.connected) {
      return {
        status: 'unhealthy',
        latency: 0,
        connectionCount: 0,
        error: 'Database not connected',
      };
    }

    try {
      const start = Date.now();
      this.db.prepare('SELECT 1').get();
      const latency = Date.now() - start;

      return {
        status: 'healthy',
        latency,
        connectionCount: 1,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: 0,
        connectionCount: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
