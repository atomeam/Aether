/**
 * @aether/database - Database abstraction layer
 *
 * A unified interface for PostgreSQL, MySQL, SQLite, and MongoDB
 */

// Types
export type * from './types/index';

// Schemas
export * from './schemas';

// Core classes
export { BaseDatabase } from './database';

// Adapters
export { PostgresAdapter } from './adapters/postgresql';
export { MysqlAdapter } from './adapters/mysql';
export { SqliteAdapter } from './adapters/sqlite';
export { MongoAdapter } from './adapters/mongodb';

// Query builder
export { QueryBuilder } from './query-builder';

// Migrations
export { MigrationRunner } from './migrations';

// Transactions
export { PostgresTransaction } from './transaction/postgres';
export { MysqlTransaction } from './transaction/mysql';
export { SqliteTransaction } from './transaction/sqlite';
export { MongoTransaction } from './transaction/mongodb';

// Factory function
import { PostgresAdapter } from './adapters/postgresql';
import { MysqlAdapter } from './adapters/mysql';
import { SqliteAdapter } from './adapters/sqlite';
import { MongoAdapter } from './adapters/mongodb';
import type { DatabaseConfig, IDatabase } from './types/index';

export function createDatabase(config: DatabaseConfig): IDatabase {
  switch (config.type) {
    case 'postgresql':
      return new PostgresAdapter(config);
    case 'mysql':
      return new MysqlAdapter(config);
    case 'sqlite':
      return new SqliteAdapter(config);
    case 'mongodb':
      return new MongoAdapter(config);
    default:
      throw new Error(`Unsupported database type: ${config.type}`);
  }
}
