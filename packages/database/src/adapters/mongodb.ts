/**
 * MongoDB database adapter
 */

// import { MongoClient, Db, Collection } from 'mongodb';
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
import { MongoTransaction } from '../transaction/mongodb';

export class MongoAdapter extends BaseDatabase {
  private client?: MongoClient;
  private db?: Db;

  constructor(config: DatabaseConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    const connectionString = this.buildConnectionString();

    try {
      this.client = new MongoClient(connectionString, {
        maxPoolSize: this.config.pool?.max || 10,
        minPoolSize: this.config.pool?.min || 0,
        serverSelectionTimeoutMS: this.config.pool?.connectionTimeoutMillis || 2000,
      });

      await this.client.connect();
      this.db = this.client.db(this.config.database);
      this.connected = true;
    } catch (error) {
      this.handleError(error);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.client || !this.connected) {
      return;
    }

    try {
      await this.client.close();
      this.connected = false;
    } catch (error) {
      this.handleError(error);
    }
  }

  async query<T = unknown>(sql: string, options?: QueryOptions): Promise<QueryResult<T>>;
  async query<T = unknown>(sql: string, params: unknown[], options?: QueryOptions): Promise<QueryResult<T>>;
  async query<T = unknown>(
    collection: string,
    filter?: Record<string, unknown>,
    options?: QueryOptions,
  ): Promise<QueryResult<T>>;
  async query<T = unknown>(
    collectionOrSql: string,
    filterOrParams?: Record<string, unknown> | unknown[],
    options?: QueryOptions,
  ): Promise<QueryResult<T>> {
    if (!this.db || !this.connected) {
      throw new Error('Database not connected');
    }

    const collection = this.db.collection<T>(collectionOrSql);
    const filter = Array.isArray(filterOrParams) ? {} : (filterOrParams || {});

    try {
      const start = Date.now();
      const result = await collection.find(filter).toArray();
      const duration = Date.now() - start;

      if (options?.timeout && duration > options.timeout) {
        throw new Error(`Query timeout after ${duration}ms`);
      }

      return {
        rows: result,
        rowCount: result.length,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async beginTransaction(options?: TransactionOptions): Promise<ITransaction> {
    if (!this.client || !this.connected) {
      throw new Error('Database not connected');
    }

    const session = this.client.startSession();
    const transaction = new MongoTransaction(session, this.db, options);

    try {
      await transaction.begin();
      return transaction;
    } catch (error) {
      session.endSession();
      this.handleError(error);
    }
  }

  getConnectionInfo(): ConnectionInfo[] {
    if (!this.client) {
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
    if (!this.client || !this.connected) {
      return {
        status: 'unhealthy',
        latency: 0,
        connectionCount: 0,
        error: 'Database not connected',
      };
    }

    try {
      const start = Date.now();
      await this.db.admin().ping();
      const latency = Date.now() - start;

      return {
        status: 'healthy',
        latency,
        connectionCount: 0,
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

  private buildConnectionString(): string {
    const protocol = this.config.ssl ? 'mongodb+srv' : 'mongodb';
    const auth =
      this.config.username && this.config.password
        ? `${encodeURIComponent(this.config.username)}:${encodeURIComponent(this.config.password)}@`
        : '';
    const host = this.config.host || 'localhost';
    const port = this.config.port || 27017;

    return `${protocol}://${auth}${host}:${port}`;
  }

  getCollection<T = unknown>(name: string): Collection<T> {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db.collection<T>(name);
  }
}
