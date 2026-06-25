/**
 * Zod schemas for database configuration and validation
 */

import { z } from 'zod';

export const DatabaseTypeSchema = z.enum(['postgresql', 'mysql', 'sqlite', 'mongodb']);

export const QueryOperatorSchema = z.enum([
  '=',
  '!=',
  '>',
  '>=',
  '<',
  '<=',
  'LIKE',
  'ILIKE',
  'IN',
  'NOT IN',
  'BETWEEN',
  'IS NULL',
  'IS NOT NULL',
]);

export const LogicalOperatorSchema = z.enum(['AND', 'OR', 'NOT']);

export const OrderDirectionSchema = z.enum(['ASC', 'DESC']);

export const PoolConfigSchema = z.object({
  min: z.number().int().min(0).optional().default(0),
  max: z.number().int().min(1).optional().default(10),
  idleTimeoutMillis: z.number().int().min(0).optional().default(30000),
  connectionTimeoutMillis: z.number().int().min(0).optional().default(2000),
});

export const DatabaseConfigSchema = z.object({
  type: DatabaseTypeSchema,
  host: z.string().optional(),
  port: z.number().int().min(1).max(65535).optional(),
  database: z.string().min(1),
  username: z.string().optional(),
  password: z.string().optional(),
  ssl: z.boolean().optional().default(false),
  pool: PoolConfigSchema.optional(),
  options: z.record(z.unknown()).optional(),
});

export const WhereConditionSchema = z.object({
  column: z.string(),
  operator: QueryOperatorSchema,
  value: z.unknown(),
  logical: LogicalOperatorSchema.optional().default('AND'),
});

export const JoinClauseSchema = z.object({
  type: z.enum(['INNER', 'LEFT', 'RIGHT', 'FULL']),
  table: z.string(),
  on: z.string(),
  alias: z.string().optional(),
});

export const OrderByClauseSchema = z.object({
  column: z.string(),
  direction: OrderDirectionSchema,
});

export const PaginationOptionsSchema = z.object({
  limit: z.number().int().min(1).optional(),
  offset: z.number().int().min(0).optional(),
  cursor: z.string().optional(),
});

export const TransactionOptionsSchema = z.object({
  isolationLevel: z.enum(['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE']).optional(),
  readOnly: z.boolean().optional().default(false),
  timeout: z.number().int().min(0).optional(),
});

export const ColumnDefinitionSchema = z.object({
  name: z.string(),
  type: z.string(),
  nullable: z.boolean().optional().default(false),
  default: z.unknown().optional(),
  primaryKey: z.boolean().optional().default(false),
  autoIncrement: z.boolean().optional().default(false),
  unique: z.boolean().optional().default(false),
  index: z.boolean().optional().default(false),
  foreignKey: z
    .object({
      table: z.string(),
      column: z.string(),
      onDelete: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).optional(),
      onUpdate: z.enum(['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION']).optional(),
    })
    .optional(),
});

export const IndexDefinitionSchema = z.object({
  name: z.string(),
  columns: z.array(z.string()),
  unique: z.boolean().optional().default(false),
  type: z.enum(['BTREE', 'HASH', 'FULLTEXT']).optional().default('BTREE'),
});

export const TableDefinitionSchema = z.object({
  name: z.string(),
  columns: z.array(ColumnDefinitionSchema),
  indexes: z.array(IndexDefinitionSchema).optional(),
});

export const QueryOptionsSchema = z.object({
  timeout: z.number().int().min(0).optional(),
  params: z.array(z.unknown()).optional(),
});

export const MigrationOptionsSchema = z.object({
  table: z.string().optional().default('migrations'),
  directory: z.string().optional(),
});

export const HealthCheckResultSchema = z.object({
  status: z.enum(['healthy', 'unhealthy', 'degraded']),
  latency: z.number(),
  connectionCount: z.number().int().min(0),
  error: z.string().optional(),
});

// Type exports
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export type PoolConfig = z.infer<typeof PoolConfigSchema>;
export type WhereCondition = z.infer<typeof WhereConditionSchema>;
export type JoinClause = z.infer<typeof JoinClauseSchema>;
export type OrderByClause = z.infer<typeof OrderByClauseSchema>;
export type PaginationOptions = z.infer<typeof PaginationOptionsSchema>;
export type TransactionOptions = z.infer<typeof TransactionOptionsSchema>;
export type ColumnDefinition = z.infer<typeof ColumnDefinitionSchema>;
export type IndexDefinition = z.infer<typeof IndexDefinitionSchema>;
export type TableDefinition = z.infer<typeof TableDefinitionSchema>;
export type QueryOptions = z.infer<typeof QueryOptionsSchema>;
export type MigrationOptions = z.infer<typeof MigrationOptionsSchema>;
export type HealthCheckResult = z.infer<typeof HealthCheckResultSchema>;
