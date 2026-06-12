/**
 * PostgreSQL database adapter
 */

// import pg from 'pg';
import { BaseDatabase } from '../database';
import type {
  DatabaseConfig,
  QueryResult,
  QueryOptions,
  TransactionOptions,
  HealthCheckResult,
  ConnectionInfo,
  ITransaction,
} from '../types/index';
import { PostgresTransaction } from '../transaction/postgres';

// const { Pool } = pg;

export class PostgresAdapter extends BaseDatabase {
  private pool?: pg.Pool;

  constructor(config: DatabaseConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    const poolConfig: pg.PoolConfig = {
      host: this.config.host || 'localhost',
      port: this.config.port || 5432,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
      min: this.config.pool?.min || 0,
      max: this.config.pool?.max || 10,
      idleTimeoutMillis: this.config.pool?.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: this.config.pool?.connectionTimeoutMillis || 2000,
    };

    this.pool = new Pool(poolConfig);

    try {
      await this.pool.connect();
      this.connected = true;
    } catch (error) {
      this.handleError(error);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.pool || !this.connected) {
      return;
    }

    try {
      await this.pool.end();
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
    if (!this.pool || !this.connected) {
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
      const result = await this.pool.query<T>(sql, params);
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
      this.handleError(error);
    }
  }

  async beginTransaction(options?: TransactionOptions): Promise<ITransaction> {
    if (!this.pool || !this.connected) {
      throw new Error('Database not connected');
    }

    const client = await this.pool.connect();
    const transaction = new PostgresTransaction(client, options);

    try {
      await transaction.begin();
      return transaction;
    } catch (error) {
      client.release();
      this.handleError(error);
    }
  }

  getConnectionInfo(): ConnectionInfo[] {
    if (!this.pool) {
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
    if (!this.pool || !this.connected) {
      return {
        status: 'unhealthy',
        latency: 0,
        connectionCount: 0,
        error: 'Database not connected',
      };
    }

    try {
      const start = Date.now();
      await this.pool.query('SELECT 1');
      const latency = Date.now() - start;

      const totalCount = this.pool.totalCount;
      const idleCount = this.pool.idleCount;
      const waitingCount = this.pool.waitingCount;

      return {
        status: 'healthy',
        latency,
        connectionCount: totalCount - idleCount,
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
