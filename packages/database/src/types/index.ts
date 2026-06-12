/**
 * Core types and interfaces for the database abstraction layer
 */

export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite' | 'mongodb';

// Re-export interfaces from database.ts
export type { IDatabase, DatabaseConfig, QueryResult, QueryOptions, WhereCondition, JoinClause, OrderByClause, PaginationOptions, TransactionOptions, Migration, MigrationOptions, IndexDefinition, ColumnDefinition, TableDefinition, DatabaseError, HealthCheckResult, ConnectionInfo, PoolConfig } from './database';

export type QueryOperator =
  | '='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'LIKE'
  | 'ILIKE'
  | 'IN'
  | 'NOT IN'
  | 'BETWEEN'
  | 'IS NULL'
  | 'IS NOT NULL';

export type LogicalOperator = 'AND' | 'OR' | 'NOT';

export type OrderDirection = 'ASC' | 'DESC';

export interface DatabaseConfig {
  type: DatabaseType;
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  pool?: PoolConfig;
  options?: Record<string, unknown>;
}

export interface PoolConfig {
  min?: number;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export interface ConnectionInfo {
  id: string;
  database: string;
  connectedAt: Date;
  lastUsedAt: Date;
}

export interface QueryResult<T = unknown> {
  rows: T[];
  rowCount: number;
  affectedRows?: number;
  insertId?: string | number;
}

export interface QueryOptions {
  timeout?: number;
  params?: unknown[];
}

export interface WhereCondition {
  column: string;
  operator: QueryOperator;
  value: unknown;
  logical?: LogicalOperator;
}

export interface JoinClause {
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  table: string;
  on: string;
  alias?: string;
}

export interface OrderByClause {
  column: string;
  direction: OrderDirection;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface TransactionOptions {
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
  readOnly?: boolean;
  timeout?: number;
}

export interface Migration {
  id: string;
  name: string;
  up: string;
  down: string;
  appliedAt?: Date;
}

export interface MigrationOptions {
  table?: string;
  directory?: string;
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
  type?: 'BTREE' | 'HASH' | 'FULLTEXT';
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable?: boolean;
  default?: unknown;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  unique?: boolean;
  index?: boolean;
  foreignKey?: {
    table: string;
    column: string;
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
    onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  };
}

export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  indexes?: IndexDefinition[];
}

export interface DatabaseError extends Error {
  code?: string;
  severity?: string;
  detail?: string;
  hint?: string;
  position?: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency: number;
  connectionCount: number;
  error?: string;
}
