/**
 * Core database interface that all adapters must implement
 */

import type {
  DatabaseConfig,
  QueryResult,
  QueryOptions,
  WhereCondition,
  JoinClause,
  OrderByClause,
  PaginationOptions,
  TransactionOptions,
  HealthCheckResult,
  ConnectionInfo,
} from './index';

export interface IDatabase {
  /**
   * Connect to the database
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the database
   */
  disconnect(): Promise<void>;

  /**
   * Check if the database is connected
   */
  isConnected(): boolean;

  /**
   * Execute a raw query
   */
  query<T = unknown>(sql: string, options?: QueryOptions): Promise<QueryResult<T>>;

  /**
   * Execute a parameterized query
   */
  query<T = unknown>(sql: string, params: unknown[], options?: QueryOptions): Promise<QueryResult<T>>;

  /**
   * Begin a transaction
   */
  beginTransaction(options?: TransactionOptions): Promise<ITransaction>;

  /**
   * Get connection pool information
   */
  getConnectionInfo(): ConnectionInfo[];

  /**
   * Perform a health check
   */
  healthCheck(): Promise<HealthCheckResult>;

  /**
   * Get the database configuration
   */
  getConfig(): DatabaseConfig;
}

export interface ITransaction {
  /**
   * Commit the transaction
   */
  commit(): Promise<void>;

  /**
   * Rollback the transaction
   */
  rollback(): Promise<void>;

  /**
   * Execute a query within the transaction
   */
  query<T = unknown>(sql: string, options?: QueryOptions): Promise<QueryResult<T>>;

  /**
   * Execute a parameterized query within the transaction
   */
  query<T = unknown>(sql: string, params: unknown[], options?: QueryOptions): Promise<QueryResult<T>>;

  /**
   * Check if the transaction is active
   */
  isActive(): boolean;
}

export interface IQueryBuilder {
  /**
   * Select columns
   */
  select(columns: string | string[]): IQueryBuilder;

  /**
   * Set the table
   */
  from(table: string): IQueryBuilder;

  /**
   * Add a where condition
   */
  where(conditions: WhereCondition | WhereCondition[]): IQueryBuilder;

  /**
   * Add a join
   */
  join(join: JoinClause | JoinClause[]): IQueryBuilder;

  /**
   * Add order by
   */
  orderBy(order: OrderByClause | OrderByClause[]): IQueryBuilder;

  /**
   * Add pagination
   */
  paginate(pagination: PaginationOptions): IQueryBuilder;

  /**
   * Add a group by clause
   */
  groupBy(columns: string | string[]): IQueryBuilder;

  /**
   * Add a having clause
   */
  having(condition: string): IQueryBuilder;

  /**
   * Set a limit
   */
  limit(limit: number): IQueryBuilder;

  /**
   * Set an offset
   */
  offset(offset: number): IQueryBuilder;

  /**
   * Build and execute the query
   */
  execute<T = unknown>(): Promise<QueryResult<T>>;

  /**
   * Build the query as a string
   */
  build(): string;

  /**
   * Get the query parameters
   */
  getParams(): unknown[];

  /**
   * Clone the query builder
   */
  clone(): IQueryBuilder;
}

export interface IMigrationRunner {
  /**
   * Run pending migrations
   */
  up(): Promise<void>;

  /**
   * Rollback the last migration
   */
  down(): Promise<void>;

  /**
   * Get the status of all migrations
   */
  status(): Promise<MigrationStatus[]>;

  /**
   * Create a new migration file
   */
  create(name: string): Promise<string>;

  /**
   * Get the list of applied migrations
   */
  getApplied(): Promise<string[]>;

  /**
   * Get the list of pending migrations
   */
  getPending(): Promise<string[]>;
}

export interface MigrationStatus {
  id: string;
  name: string;
  applied: boolean;
  appliedAt?: Date;
}

export interface IConnectionPool {
  /**
   * Get a connection from the pool
   */
  getConnection(): Promise<unknown>;

  /**
   * Release a connection back to the pool
   */
  releaseConnection(connection: unknown): Promise<void>;

  /**
   * Get pool statistics
   */
  getStats(): PoolStats;

  /**
   * Close all connections in the pool
   */
  close(): Promise<void>;

  /**
   * Resize the pool
   */
  resize(min: number, max: number): Promise<void>;
}

export interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
}
