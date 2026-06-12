# @aether/database

A production-ready database abstraction layer for TypeScript with support for PostgreSQL, MySQL, SQLite, and MongoDB.

## Features

- **Multi-database support**: PostgreSQL, MySQL, SQLite, MongoDB
- **Query builder**: Fluent API for building complex queries
- **Migration system**: Schema versioning and management
- **Connection pooling**: Efficient connection management
- **Transaction support**: ACID transactions across all databases
- **TypeScript types**: Full type safety with TypeScript
- **Zod schemas**: Runtime validation for configurations
- **Comprehensive tests**: Full test coverage

## Installation

```bash
npm install @aether/database
```

Install the required database driver for your database:

```bash
# PostgreSQL
npm install pg

# MySQL
npm install mysql2

# SQLite
npm install better-sqlite3

# MongoDB
npm install mongodb
```

## Quick Start

```typescript
import { createDatabase } from '@aether/database';

// Create a database connection
const db = createDatabase({
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  username: 'user',
  password: 'password',
  pool: {
    min: 2,
    max: 10,
  },
});

// Connect
await db.connect();

// Execute a query
const result = await db.query('SELECT * FROM users WHERE id = $1', [1]);
console.log(result.rows);

// Disconnect
await db.disconnect();
```

## Configuration

### PostgreSQL

```typescript
const config = {
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  username: 'user',
  password: 'password',
  ssl: false,
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
};
```

### MySQL

```typescript
const config = {
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'myapp',
  username: 'user',
  password: 'password',
  pool: {
    max: 10,
  },
};
```

### SQLite

```typescript
const config = {
  type: 'sqlite',
  database: './myapp.db',
};
```

### MongoDB

```typescript
const config = {
  type: 'mongodb',
  host: 'localhost',
  port: 27017,
  database: 'myapp',
  username: 'user',
  password: 'password',
  pool: {
    max: 10,
  },
};
```

## Query Builder

The query builder provides a fluent API for constructing queries:

```typescript
import { QueryBuilder } from '@aether/database';

const builder = new QueryBuilder(db);

const result = await builder
  .select(['id', 'name', 'email'])
  .from('users')
  .where({ column: 'active', operator: '=', value: true })
  .orderBy({ column: 'name', direction: 'ASC' })
  .limit(10)
  .execute();

console.log(result.rows);
```

### Query Builder Methods

- `select(columns)` - Select columns to return
- `from(table)` - Set the table to query
- `where(conditions)` - Add WHERE conditions
- `join(clauses)` - Add JOIN clauses
- `orderBy(clauses)` - Add ORDER BY clauses
- `paginate(options)` - Add pagination
- `groupBy(columns)` - Add GROUP BY
- `having(condition)` - Add HAVING clause
- `limit(n)` - Set limit
- `offset(n)` - Set offset
- `execute()` - Execute the query
- `build()` - Build the SQL string
- `getParams()` - Get query parameters
- `clone()` - Clone the builder

## Transactions

Execute multiple operations atomically:

```typescript
const transaction = await db.beginTransaction({
  isolationLevel: 'SERIALIZABLE',
});

try {
  await transaction.query('UPDATE accounts SET balance = balance - 100 WHERE id = $1', [1]);
  await transaction.query('UPDATE accounts SET balance = balance + 100 WHERE id = $2', [2]);
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

## Migrations

Manage database schema changes:

```typescript
import { MigrationRunner } from '@aether/database';

const migrations = new MigrationRunner(db, {
  table: 'migrations',
  directory: './migrations',
});

// Run pending migrations
await migrations.up();

// Rollback last migration
await migrations.down();

// Check migration status
const status = await migrations.status();
console.log(status);

// Create a new migration
const migration = await migrations.create('add_users_table');
```

## Health Checks

Monitor database health:

```typescript
const health = await db.healthCheck();

console.log(health.status); // 'healthy' | 'unhealthy' | 'degraded'
console.log(health.latency); // Query latency in ms
console.log(health.connectionCount); // Active connections
```

## Connection Pooling

View connection pool information:

```typescript
const connections = db.getConnectionInfo();
console.log(connections);
```

## Type Safety

All configurations and operations are fully typed:

```typescript
import type { DatabaseConfig, WhereCondition } from '@aether/database';

const config: DatabaseConfig = {
  type: 'postgresql',
  database: 'myapp',
  // TypeScript will enforce correct structure
};

const condition: WhereCondition = {
  column: 'id',
  operator: '=',
  value: 1,
  logical: 'AND',
};
```

## Zod Validation

Validate configurations at runtime:

```typescript
import { DatabaseConfigSchema } from '@aether/database';

const config = DatabaseConfigSchema.parse({
  type: 'postgresql',
  database: 'myapp',
  // Throws if invalid
});
```

## API Reference

### createDatabase(config)

Creates a database instance based on the configuration.

**Parameters:**
- `config: DatabaseConfig` - Database configuration

**Returns:** `IDatabase`

### IDatabase Interface

- `connect(): Promise<void>` - Connect to the database
- `disconnect(): Promise<void>` - Disconnect from the database
- `isConnected(): boolean` - Check connection status
- `query<T>(sql, params?, options?): Promise<QueryResult<T>>` - Execute a query
- `beginTransaction(options?): Promise<ITransaction>` - Begin a transaction
- `getConnectionInfo(): ConnectionInfo[]` - Get connection information
- `healthCheck(): Promise<HealthCheckResult>` - Perform health check
- `getConfig(): DatabaseConfig` - Get configuration

## License

MIT
