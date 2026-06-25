/**
 * MySQL database adapter
 */

// import mysql from 'mysql2/promise';
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
import { MysqlTransaction } from '../transaction/mysql';

export class MysqlAdapter extends BaseDatabase {
  private pool?: mysql.Pool;

  constructor(config: DatabaseConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    const poolConfig: mysql.PoolOptions = {
      host: this.config.host || 'localhost',
      port: this.config.port || 3306,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl ? {} : undefined,
      connectionLimit: this.config.pool?.max || 10,
      waitForConnections: true,
      queueLimit: 0,
    };

    this.pool = mysql.createPool(poolConfig);

    try {
      const connection = await this.pool.getConnection();
      connection.release();
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
      const [rows, fields] = await this.pool.execute(sql, params);
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
      this.handleError(error);
    }
  }

  async beginTransaction(options?: TransactionOptions): Promise<ITransaction> {
    if (!this.pool || !this.connected) {
      throw new Error('Database not connected');
    }

    const connection = await this.pool.getConnection();
    const transaction = new MysqlTransaction(connection, options);

    try {
      await transaction.begin();
      return transaction;
    } catch (error) {
      connection.release();
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

      return {
        status: 'healthy',
        latency,
        connectionCount: this.pool.pool?.connectionLimit || 0,
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
